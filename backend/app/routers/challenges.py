from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..auth import require_roles
from ..database import get_db
from ..models import Challenge, Group, Player
from ..services.challenge_engine import (
    ChallengeError,
    ChallengeEndedError,
    ChallengeInactiveError,
    ChallengeNotFoundError,
    ChallengeNotStartedError,
    DuplicateChallengeAttemptError,
    InvalidChallengeScoreError,
    award_challenge_xp,
    challenge_summary,
    get_challenge,
)
from ..services.xp import player_xp


router = APIRouter(
    prefix="/api/challenges",
    tags=["challenges"],
)


UTC = timezone.utc


def utc_now() -> datetime:
    return datetime.now(UTC)


# ============================================================
# REQUEST MODELS
# ============================================================


class ChallengeAttemptRequest(BaseModel):
    """
    Public/player submission.

    The server decides whether the attempt is valid and how much XP
    it deserves.

    Never accept XP values from the client.
    """

    score: float = Field(
        ge=0,
        description="The verified game score.",
    )

    """
    Client-generated attempt identifier.

    This is not trusted as proof of performance. It exists to make a
    submission traceable and to support future idempotency.
    """

    attempt_id: str | None = Field(
        default=None,
        max_length=100,
    )

    """
    Optional client metadata.

    Do not put personal information here.

    Examples:

        {
            "game_version": "circle-v2",
            "duration_ms": 12000,
            "rounds": 5
        }
    """

    metadata: dict | None = None


class ChallengeCreateRequest(BaseModel):
    phase_id: int | None = None

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    start_at: datetime | None = None
    end_at: datetime | None = None

    participation_xp: int = Field(
        default=300,
        ge=0,
    )

    elite_xp: int = Field(
        default=1500,
        ge=0,
    )

    winner_xp: int = Field(
        default=3000,
        ge=0,
    )

    group_xp: int = Field(
        default=5000,
        ge=0,
    )

    active: bool = True


class ChallengeUpdateRequest(BaseModel):
    phase_id: int | None = None

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None

    start_at: datetime | None = None
    end_at: datetime | None = None

    participation_xp: int = Field(
        default=300,
        ge=0,
    )

    elite_xp: int = Field(
        default=1500,
        ge=0,
    )

    winner_xp: int = Field(
        default=3000,
        ge=0,
    )

    group_xp: int = Field(
        default=5000,
        ge=0,
    )

    active: bool = True


# ============================================================
# SERIALISATION
# ============================================================


def serialise_challenge(
    challenge: Challenge,
) -> dict:
    return {
        "id": challenge.id,
        "phase_id": challenge.phase_id,
        "title": challenge.title,
        "description": challenge.description,
        "start_at": challenge.start_at,
        "end_at": challenge.end_at,
        "participation_xp": challenge.participation_xp,
        "elite_xp": challenge.elite_xp,
        "winner_xp": challenge.winner_xp,
        "group_xp": challenge.group_xp,
        "active": challenge.active,
    }


# ============================================================
# PLAYER ENDPOINTS
# ============================================================


@router.get("")
def list_available_challenges(
    user=Depends(
        require_roles(
            "player",
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Return challenges that are currently relevant.

    Players receive only configuration necessary to participate.
    Staff can use the same endpoint during the current implementation;
    a richer staff reporting endpoint exists below.
    """

    now = utc_now()

    challenges = (
        db.query(Challenge)
        .filter(
            Challenge.active == True,
        )
        .order_by(
            Challenge.start_at.asc(),
            Challenge.id.asc(),
        )
        .all()
    )

    result = []

    for challenge in challenges:
        if challenge.start_at is not None:
            start_at = challenge.start_at

            if start_at.tzinfo is None:
                start_at = start_at.replace(
                    tzinfo=UTC,
                )

            if start_at > now:
                state = "scheduled"
            else:
                state = "live"
        else:
            state = "live"

        if challenge.end_at is not None:
            end_at = challenge.end_at

            if end_at.tzinfo is None:
                end_at = end_at.replace(
                    tzinfo=UTC,
                )

            if now > end_at:
                state = "ended"

        result.append(
            {
                **serialise_challenge(
                    challenge
                ),
                "state": state,
            }
        )

    return result


@router.get("/{challenge_id}")
def get_available_challenge(
    challenge_id: int,
    user=Depends(
        require_roles(
            "player",
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    try:
        challenge = get_challenge(
            db,
            challenge_id,
        )
    except ChallengeNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return serialise_challenge(
        challenge
    )


@router.post(
    "/{challenge_id}/attempt",
    status_code=status.HTTP_201_CREATED,
)
def submit_challenge_attempt(
    challenge_id: int,
    data: ChallengeAttemptRequest,
    user=Depends(
        require_roles("player")
    ),
    db: Session = Depends(get_db),
):
    """
    Submit a minigame result.

    The current phase-1 authentication model maps a player account to
    Player. We resolve the player from user.id rather than accepting a
    player_id from the request.

    This prevents a player from submitting an attempt on somebody
    else's account.
    """

    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    player = (
        db.query(Player)
        .filter(
            Player.user_id == user.id,
            Player.active == True,
        )
        .first()
    )

    if not player:
        raise HTTPException(
            status_code=403,
            detail="Active player profile not found",
        )

    attempt_reference = (
        data.attempt_id
        or secrets.token_urlsafe(16)
    )

    # --------------------------------------------------------
    # Determine cohort
    # --------------------------------------------------------
    #
    # The current schema associates players with Groups. A future
    # ChallengeAttempt table will store the actual submitted score.
    #
    # For now we use existing challenge transactions as the source
    # of previous scores where possible.
    #
    # The current transaction model does not contain a score column,
    # so winner/elite scoring is intentionally conservative here.
    #
    # A proper ChallengeAttempt table is the next schema change and
    # will make this calculation authoritative.
    # --------------------------------------------------------

    cohort_scores = [data.score]

    try:
        result = award_challenge_xp(
            db=db,
            challenge=challenge,
            player=player,
            score=data.score,
            cohort_scores=cohort_scores,
            attempt_reference=attempt_reference,
            created_by=user.id,
        )

        db.commit()

    except (
        ChallengeInactiveError,
        ChallengeNotStartedError,
        ChallengeEndedError,
        InvalidChallengeScoreError,
        DuplicateChallengeAttemptError,
    ) as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except ChallengeError as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return {
        "success": True,
        "challenge": {
            "id": challenge.id,
            "title": challenge.title,
        },
        "attempt": {
            "id": result.attempt_id,
            "score": result.score,
        },
        "achievement": {
            "participation": True,
            "elite": result.elite,
            "winner": result.winner,
        },
        "xp": {
            "individual": result.individual_xp,
            "group": result.group_xp,
            "participation": result.participation_xp,
            "elite": result.elite_xp,
            "winner": result.winner_xp,
        },
        "player_total_xp": player_xp(
            db,
            player.id,
        ),
    }


# ============================================================
# STAFF ENDPOINTS
# ============================================================


@router.get(
    "/staff/list",
)
def staff_list_challenges(
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    """
    Staff view.

    This intentionally returns inactive and historical challenges as
    well as live challenges so administrators can manage the complete
    challenge catalogue.
    """

    challenges = (
        db.query(Challenge)
        .order_by(
            Challenge.start_at.desc(),
            Challenge.id.desc(),
        )
        .all()
    )

    return [
        {
            **serialise_challenge(
                challenge
            ),
            "summary": challenge_summary(
                db,
                challenge,
            ),
        }
        for challenge in challenges
    ]


@router.post(
    "/staff",
    status_code=status.HTTP_201_CREATED,
)
def create_challenge(
    data: ChallengeCreateRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    if (
        data.start_at is not None
        and data.end_at is not None
        and data.end_at <= data.start_at
    ):
        raise HTTPException(
            status_code=400,
            detail="Challenge end time must be after its start time.",
        )

    challenge = Challenge(
        phase_id=data.phase_id,
        title=data.title.strip(),
        description=data.description,
        start_at=data.start_at,
        end_at=data.end_at,
        participation_xp=data.participation_xp,
        elite_xp=data.elite_xp,
        winner_xp=data.winner_xp,
        group_xp=data.group_xp,
        active=data.active,
    )

    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return serialise_challenge(
        challenge
    )


@router.put(
    "/staff/{challenge_id}",
)
def update_challenge(
    challenge_id: int,
    data: ChallengeUpdateRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    if (
        data.start_at is not None
        and data.end_at is not None
        and data.end_at <= data.start_at
    ):
        raise HTTPException(
            status_code=400,
            detail="Challenge end time must be after its start time.",
        )

    challenge.phase_id = data.phase_id
    challenge.title = data.title.strip()
    challenge.description = data.description
    challenge.start_at = data.start_at
    challenge.end_at = data.end_at
    challenge.participation_xp = data.participation_xp
    challenge.elite_xp = data.elite_xp
    challenge.winner_xp = data.winner_xp
    challenge.group_xp = data.group_xp
    challenge.active = data.active

    db.commit()
    db.refresh(challenge)

    return serialise_challenge(
        challenge
    )


@router.post(
    "/staff/{challenge_id}/enable",
)
def enable_challenge(
    challenge_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    challenge.active = True

    db.commit()

    return {
        "success": True,
        "id": challenge.id,
        "active": True,
    }


@router.post(
    "/staff/{challenge_id}/disable",
)
def disable_challenge(
    challenge_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    challenge = db.get(
        Challenge,
        challenge_id,
    )

    if not challenge:
        raise HTTPException(
            status_code=404,
            detail="Challenge not found",
        )

    challenge.active = False

    db.commit()

    return {
        "success": True,
        "id": challenge.id,
        "active": False,
    }
