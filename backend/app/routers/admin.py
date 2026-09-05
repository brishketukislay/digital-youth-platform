from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from ..db.database import get_db

from ..db.models import (
    User,
    Player,
    YouthGroup,
    Programme,
    Theme,
    GameMap,
    MapLocation,
    Phase,
    PointRule,
    Reward,
    AuditLog,
)

from ..auth import (
    require_roles,
    hash_password,
)

from ..services.xp import (
    award_xp,
    player_xp,
    group_xp,
)
from pydantic import BaseModel, Field

from ..services.gamification import (
    award_positive_xp,
    award_individual_penalty,
    get_programme_xp,
)


router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
)


# ============================================================
# HELPERS
# ============================================================

def get_programme(
    db: Session,
) -> Programme:

    programme = (
        db.query(Programme)
        .filter(
            Programme.active == True
        )
        .first()
    )

    if not programme:
        raise HTTPException(
            status_code=404,
            detail="No active programme configured",
        )

    return programme


def audit(
    db: Session,
    user_id: int,
    action: str,
    details: str,
):

    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            details=details,
        )
    )


# ============================================================
# OVERVIEW
# ============================================================

@router.get("/overview")
def overview(
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    players = (
        db.query(Player)
        .filter(Player.active == True)
        .all()
    )

    return {
        "players": len(players),
        "staff": db.query(User)
        .filter(
            User.role.in_(
                [
                    "admin",
                    "youth_worker",
                ]
            )
        )
        .count(),
        "group_xp": group_xp(
            db,
            programme.id,
        ),
        "target_xp": programme.target_xp,
        "programme": programme.name,
    }


# ============================================================
# PROGRAMME CONFIGURATION
# ============================================================

class ProgrammeRequest(BaseModel):

    name: str
    description: str | None = None

    start_date: date | None = None
    end_date: date | None = None

    target_xp: int = 1500000

class StaffAwardXPRequest(BaseModel):
    player_id: int
    amount: int = Field(
        ...,
        ge=-50_000,
        le=50_000,
    )
    reason: str = Field(
        ...,
        min_length=3,
        max_length=500,
    )
@router.post("/xp/award")
def award_player_xp(
    data: AwardXPRequest,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):

    if data.amount == 0:
        raise HTTPException(
            status_code=400,
            detail="XP amount cannot be zero",
        )

    if abs(data.amount) > 50000:
        raise HTTPException(
            status_code=400,
            detail="Single manual adjustment cannot exceed 50,000 XP",
        )

    player = db.get(
        Player,
        data.player_id,
    )

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
        )

    group_amount = (
        data.amount
        if data.amount > 0
        else 0
    )

    award_xp(
        db,
        player.id,
        data.amount,
        group_amount,
        "manual",
        data.reason,
        user.id,
    )

    audit(
        db,
        user.id,
        "xp.adjusted",
        f"player={player.gamertag};amount={data.amount};reason={data.reason}",
    )

    db.commit()

    return {
        "success": True,
        "xp": player_xp(
            db,
            player.id,
        ),
    }


# ============================================================
# REWARDS
# ============================================================

@router.get("/rewards")
def rewards(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    return [
        {
            "id": reward.id,
            "name": reward.name,
            "description": reward.description,
            "xp_threshold": reward.xp_threshold,
            "reward_type": reward.reward_type,
            "value": reward.value,
            "active": reward.active,
        }
        for reward in db.query(Reward)
        .order_by(Reward.xp_threshold)
        .all()
    ]


class RewardRequest(BaseModel):

    name: str
    description: str | None = None

    xp_threshold: int | None = None

    reward_type: str = "individual"

    value: float = 0

    active: bool = True


@router.post("/rewards")
def create_reward(
    data: RewardRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    reward = Reward(
        **data.model_dump()
    )

    db.add(reward)

    audit(
        db,
        user.id,
        "reward.created",
        data.name,
    )

    db.commit()
    db.refresh(reward)

    return {
        "id": reward.id,
    }


# ============================================================
# PHASES
# ============================================================

class PhaseRequest(BaseModel):

    name: str
    description: str | None = None

    colour: str = "#18775B"
    icon: str = "star"

    start_date: date | None = None
    end_date: date | None = None

    active: bool = True


@router.get("/phases")
def phases(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    return [
        {
            "id": phase.id,
            "name": phase.name,
            "description": phase.description,
            "colour": phase.colour,
            "icon": phase.icon,
            "start_date": phase.start_date,
            "end_date": phase.end_date,
            "active": phase.active,
        }
        for phase in db.query(Phase)
        .filter(
            Phase.programme_id == programme.id
        )
        .order_by(
            Phase.sort_order
        )
        .all()
    ]


@router.post("/phases")
def create_phase(
    data: PhaseRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    current_count = (
        db.query(Phase)
        .filter(
            Phase.programme_id
            == programme.id
        )
        .count()
    )

    phase = Phase(
        programme_id=programme.id,
        name=data.name,
        description=data.description,
        colour=data.colour,
        icon=data.icon,
        start_date=data.start_date,
        end_date=data.end_date,
        active=data.active,
        sort_order=current_count,
    )

    db.add(phase)

    audit(
        db,
        user.id,
        "phase.created",
        data.name,
    )

    db.commit()
    db.refresh(phase)

    return {
        "id": phase.id,
    }
