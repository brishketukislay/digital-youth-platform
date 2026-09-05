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
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    start_date: date | None = None
    end_date: date | None = None

    target_xp: int = Field(
        default=1_500_000,
        ge=0,
    )

    weekly_target_xp: int | None = Field(
        default=None,
        ge=0,
    )

    max_group_penalty_percent: float = Field(
        default=10.0,
        ge=0,
        le=100,
    )

    active_theme_id: int | None = None
    active_map_id: int | None = None
    active_phase_id: int | None = None

    active: bool = True
    
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
    data: StaffAwardXPRequest,
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

# ============================================================
# POINT ECONOMY CONFIGURATION
# ============================================================

class PointRuleRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    code: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    individual_xp: int = Field(
        default=0,
        ge=0,
        le=1_000_000,
    )

    group_xp: int = Field(
        default=0,
        ge=0,
        le=1_000_000,
    )

    weekly_cap: int | None = Field(
        default=None,
        ge=0,
        le=10_000_000,
    )

    enabled: bool = True


@router.get("/point-rules")
def get_point_rules(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    rules = (
        db.query(PointRule)
        .filter(
            PointRule.programme_id == programme.id
        )
        .order_by(
            PointRule.name.asc()
        )
        .all()
    )

    return [
        {
            "id": rule.id,
            "name": rule.name,
            "code": rule.code,
            "description": rule.description,
            "individual_xp": rule.individual_xp,
            "group_xp": rule.group_xp,
            "weekly_cap": rule.weekly_cap,
            "enabled": rule.enabled,
        }
        for rule in rules
    ]


@router.post("/point-rules")
def create_point_rule(
    data: PointRuleRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    code = data.code.strip().lower()

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Point rule code is required.",
        )

    existing = (
        db.query(PointRule)
        .filter(
            PointRule.programme_id == programme.id,
            PointRule.code == code,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A point rule with this code already exists.",
        )

    if (
        data.individual_xp == 0
        and data.group_xp == 0
    ):
        raise HTTPException(
            status_code=400,
            detail="A point rule must award some XP.",
        )

    rule = PointRule(
        programme_id=programme.id,
        name=data.name.strip(),
        code=code,
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        individual_xp=data.individual_xp,
        group_xp=data.group_xp,
        weekly_cap=data.weekly_cap,
        enabled=data.enabled,
    )

    db.add(rule)

    audit(
        db,
        user.id,
        "point_rule.created",
        (
            f"code={code};"
            f"individual_xp={data.individual_xp};"
            f"group_xp={data.group_xp}"
        ),
    )

    db.commit()
    db.refresh(rule)

    return {
        "id": rule.id,
        "success": True,
    }


@router.put("/point-rules/{rule_id}")
def update_point_rule(
    rule_id: int,
    data: PointRuleRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    rule = (
        db.query(PointRule)
        .filter(
            PointRule.id == rule_id,
            PointRule.programme_id == programme.id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Point rule not found.",
        )

    code = data.code.strip().lower()

    duplicate = (
        db.query(PointRule)
        .filter(
            PointRule.programme_id == programme.id,
            PointRule.code == code,
            PointRule.id != rule.id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="A point rule with this code already exists.",
        )

    if (
        data.individual_xp == 0
        and data.group_xp == 0
    ):
        raise HTTPException(
            status_code=400,
            detail="A point rule must award some XP.",
        )

    old_values = (
        f"name={rule.name};"
        f"code={rule.code};"
        f"individual_xp={rule.individual_xp};"
        f"group_xp={rule.group_xp};"
        f"weekly_cap={rule.weekly_cap};"
        f"enabled={rule.enabled}"
    )

    rule.name = data.name.strip()
    rule.code = code
    rule.description = (
        data.description.strip()
        if data.description
        else None
    )
    rule.individual_xp = data.individual_xp
    rule.group_xp = data.group_xp
    rule.weekly_cap = data.weekly_cap
    rule.enabled = data.enabled

    audit(
        db,
        user.id,
        "point_rule.updated",
        (
            f"id={rule.id};"
            f"old=[{old_values}];"
            f"new=["
            f"name={rule.name};"
            f"code={rule.code};"
            f"individual_xp={rule.individual_xp};"
            f"group_xp={rule.group_xp};"
            f"weekly_cap={rule.weekly_cap};"
            f"enabled={rule.enabled}"
            f"]"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": rule.id,
    }


@router.delete("/point-rules/{rule_id}")
def delete_point_rule(
    rule_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    rule = (
        db.query(PointRule)
        .filter(
            PointRule.id == rule_id,
            PointRule.programme_id == programme.id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Point rule not found.",
        )

    # Do not physically delete rules which may have been
    # used historically. Disable them instead.
    rule.enabled = False

    audit(
        db,
        user.id,
        "point_rule.disabled",
        (
            f"id={rule.id};"
            f"code={rule.code}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": rule.id,
        "enabled": False,
    }


# ============================================================
# REWARD CONFIGURATION
# ============================================================

@router.put("/rewards/{reward_id}")
def update_reward(
    reward_id: int,
    data: RewardRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    reward = db.get(
        Reward,
        reward_id,
    )

    if not reward:
        raise HTTPException(
            status_code=404,
            detail="Reward not found.",
        )

    old_values = (
        f"name={reward.name};"
        f"xp_threshold={reward.xp_threshold};"
        f"reward_type={reward.reward_type};"
        f"value={reward.value};"
        f"active={reward.active}"
    )

    reward.name = data.name.strip()
    reward.description = (
        data.description.strip()
        if data.description
        else None
    )
    reward.xp_threshold = data.xp_threshold
    reward.reward_type = data.reward_type
    reward.value = data.value
    reward.active = data.active

    audit(
        db,
        user.id,
        "reward.updated",
        (
            f"id={reward.id};"
            f"old=[{old_values}];"
            f"new=["
            f"name={reward.name};"
            f"xp_threshold={reward.xp_threshold};"
            f"reward_type={reward.reward_type};"
            f"value={reward.value};"
            f"active={reward.active}"
            f"]"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": reward.id,
    }


@router.delete("/rewards/{reward_id}")
def disable_reward(
    reward_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    reward = db.get(
        Reward,
        reward_id,
    )

    if not reward:
        raise HTTPException(
            status_code=404,
            detail="Reward not found.",
        )

    reward.active = False

    audit(
        db,
        user.id,
        "reward.disabled",
        (
            f"id={reward.id};"
            f"name={reward.name}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": reward.id,
        "active": False,
    }
