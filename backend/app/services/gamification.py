from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from ..db.models import (
    Player,
    Programme,
    YouthGroup,
    XPTransaction,
    GroupPenalty,
    ConductIncident,
)

from .xp import (
    award_xp,
    player_xp,
    programme_xp,
)


# ============================================================
# CONSTANTS
# ============================================================

JACKPOT_TARGET_XP = 1_500_000
MAX_GROUP_PENALTY_PERCENT = 10

TIER_1_PENALTY_XP = 300
TIER_2_PENALTY_XP = 1_500

SKILL_MILESTONE_XP = {
    1: 15_000,
    2: 40_000,
    3: 75_000,
}

SKILL_MILESTONE_REWARDS = {
    1: 5_00,   # £5
    2: 10_00,  # £10
    3: 20_00,  # £20
}


@dataclass(frozen=True)
class XPResult:
    player_xp: int
    programme_xp: int
    transaction_id: int


# ============================================================
# PROGRAMME
# ============================================================

def get_active_programme(db: Session) -> Programme:
    programme = (
        db.query(Programme)
        .filter(Programme.active.is_(True))
        .first()
    )

    if programme is None:
        raise ValueError("No active programme configured.")

    return programme


# ============================================================
# BALANCES
# ============================================================

def get_player_xp(
    db: Session,
    player_id: int,
) -> int:
    """Compatibility wrapper around the canonical XP service."""

    return player_xp(
        db,
        player_id,
    )


def get_programme_xp(
    db: Session,
    programme_id: int,
) -> int:
    """Compatibility wrapper around the canonical XP service."""

    return programme_xp(
        db,
        programme_id,
    )


# ============================================================
# IDEMPOTENCY
# ============================================================

def make_idempotency_key(
    source_type: str,
    source_id: str | int,
    player_id: int,
) -> str:
    return (
        f"{source_type}:"
        f"{source_id}:"
        f"player:{player_id}"
    )


def transaction_exists(
    db: Session,
    reference_type: str,
    reference_id: int,
    player_id: int,
) -> Optional[XPTransaction]:

    return (
        db.query(XPTransaction)
        .filter(
            XPTransaction.player_id == player_id,
            XPTransaction.reference_type == reference_type,
            XPTransaction.reference_id == reference_id,
        )
        .first()
    )


# ============================================================
# INDIVIDUAL PENALTIES
# ============================================================

def award_individual_penalty(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    amount: int,
    reason: str,
    incident_id: int | None = None,
    created_by: int | None = None,
) -> XPResult:

    """
    Individual penalty.

    IMPORTANT:
    group_xp is deliberately ZERO.

    Therefore this can never reduce the jackpot.
    """

    amount = abs(int(amount))

    return award_xp(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=-amount,
        group_amount=0,
        transaction_type="penalty",
        reason=reason,
        reference_type="conduct_incident",
        reference_id=incident_id,
        created_by=created_by,
    )


# ============================================================
# EXCEPTIONAL GROUP PENALTY
# ============================================================

def award_exceptional_group_penalty(
    db: Session,
    *,
    programme_id: int,
    group_id: int | None,
    amount: int,
    reason: str,
    collective_complicity: bool,
    severe_shared_impact: bool,
    passive_group_endorsement: bool,
    approved_by: int,
) -> GroupPenalty:

    if not (
        collective_complicity
        or severe_shared_impact
        or passive_group_endorsement
    ):
        raise ValueError(
            "Exceptional group penalty requires at least "
            "one collective criterion."
        )

    programme_xp = get_programme_xp(
        db,
        programme_id,
    )

    maximum_penalty = int(
        JACKPOT_TARGET_XP
        * MAX_GROUP_PENALTY_PERCENT
        / 100
    )

    amount = abs(int(amount))

    if amount > maximum_penalty:
        raise ValueError(
            f"Group penalty cannot exceed "
            f"{maximum_penalty:,} XP."
        )

    if amount > max(
        programme_xp,
        maximum_penalty,
    ):
        amount = min(
            amount,
            maximum_penalty,
        )

    penalty = GroupPenalty(
        programme_id=programme_id,
        group_id=group_id,
        reason=reason,
        collective_complicity=collective_complicity,
        severe_shared_impact=severe_shared_impact,
        passive_group_endorsement=passive_group_endorsement,
        amount=amount,
        approved_by=approved_by,
        restorative_completed=False,
    )

    db.add(penalty)
    db.flush()

    # The group penalty is represented by a negative XP transaction.
    # We attach it to one participating player only for ledger/audit
    # purposes; group_amount is what affects the collective pool.

    participant = (
        db.query(Player)
        .filter(
            Player.group_id == group_id,
            Player.active.is_(True),
        )
        .first()
    )

    if participant is not None:
        award_xp(
            db,
            programme_id=programme_id,
            player_id=participant.id,
            amount=-amount,
            group_amount=-amount,
            transaction_type="group_penalty",
            reason=reason,
            reference_type="group_penalty",
            reference_id=penalty.id,
            created_by=approved_by,
        )

    return penalty


# ============================================================
# CONDUCT RULES
# ============================================================

def apply_tier_1_penalty(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    reason: str,
    incident_id: int | None = None,
    created_by: int | None = None,
) -> XPResult:

    return award_individual_penalty(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=TIER_1_PENALTY_XP,
        reason=reason,
        incident_id=incident_id,
        created_by=created_by,
    )


def apply_tier_2_penalty(
    db: Session,
    *,
    programme_id: int,
    player_id: int,
    reason: str,
    incident_id: int | None = None,
    created_by: int | None = None,
) -> XPResult:

    return award_individual_penalty(
        db,
        programme_id=programme_id,
        player_id=player_id,
        amount=TIER_2_PENALTY_XP,
        reason=reason,
        incident_id=incident_id,
        created_by=created_by,
    )


# ============================================================
# WEEKLY HIGH RISER
# ============================================================

def get_high_risers(
    db: Session,
    programme_id: int,
    days: int = 7,
    limit: int = 10,
):

    since = datetime.utcnow() - timedelta(
        days=days,
    )

    rows = (
        db.query(
            Player.id,
            Player.gamertag,
            Player.avatar,
            func.coalesce(
                func.sum(XPTransaction.amount),
                0,
            ).label("xp"),
        )
        .join(
            XPTransaction,
            XPTransaction.player_id == Player.id,
        )
        .join(
            YouthGroup,
            YouthGroup.id == Player.group_id,
        )
        .filter(
            YouthGroup.programme_id == programme_id,
            Player.active.is_(True),
            Player.public_visible.is_(True),
            XPTransaction.created_at >= since,
        )
        .group_by(
            Player.id,
            Player.gamertag,
            Player.avatar,
        )
        .order_by(
            func.sum(XPTransaction.amount).desc()
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "rank": index + 1,
            "player_id": row.id,
            "gamertag": row.gamertag,
            "avatar": row.avatar,
            "xp": int(row.xp or 0),
        }
        for index, row in enumerate(rows)
    ]


# ============================================================
# PROGRAMME PACE
# ============================================================

def calculate_programme_pace(
    db: Session,
    programme_id: int,
) -> dict:

    programme = db.get(
        Programme,
        programme_id,
    )

    if programme is None:
        raise ValueError("Programme not found.")

    current = get_programme_xp(
        db,
        programme_id,
    )

    target = int(
        programme.target_xp
        or JACKPOT_TARGET_XP
    )

    if programme.start_date:
        start = datetime.combine(
            programme.start_date,
            datetime.min.time(),
        )
    else:
        start = datetime.utcnow()

    if programme.end_date:
        end = datetime.combine(
            programme.end_date,
            datetime.min.time(),
        )
    else:
        end = start + timedelta(
            weeks=24,
        )

    total_seconds = max(
        1,
        (end - start).total_seconds(),
    )

    elapsed_seconds = max(
        0,
        (datetime.utcnow() - start).total_seconds(),
    )

    elapsed_ratio = min(
        1,
        elapsed_seconds / total_seconds,
    )

    expected = int(
        target * elapsed_ratio
    )

    delta = current - expected

    return {
        "current_xp": current,
        "target_xp": target,
        "expected_xp": expected,
        "ahead_or_behind_xp": delta,
        "percentage": round(
            (current / target) * 100,
            2,
        )
        if target
        else 0,
        "status": (
            "ahead"
            if delta > 0
            else "behind"
            if delta < 0
            else "on_target"
        ),
        "remaining_xp": max(
            0,
            target - current,
        ),
    }