from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from pydantic import BaseModel, Field
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
    ProgrammeMilestone,
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

    current_xp = group_xp(
        db,
        programme.id,
    )

    target_xp = programme.target_xp or 0

    progress_percent = (
        (current_xp / target_xp) * 100
        if target_xp > 0
        else 0
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
        "group_xp": current_xp,
        "target_xp": target_xp,
        "progress_percent": round(
            progress_percent,
            2,
        ),
        "weekly_target_xp": (
            programme.weekly_target_xp
            or 0
        ),
        "programme": programme.name,
    }


# ============================================================
# PROGRAMME CONFIGURATION
# ============================================================

class ProgrammeRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    start_date: date | None = None
    end_date: date | None = None

    target_xp: int = Field(
        default=1_500_000,
        ge=1,
        le=100_000_000,
    )

    weekly_target_xp: int | None = Field(
        default=None,
        ge=0,
        le=10_000_000,
    )

    max_group_penalty_percent: float = Field(
        default=10.0,
        ge=0,
        le=100,
    )


@router.get("/programme")
def get_programme_configuration(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    return {
        "id": programme.id,
        "name": programme.name,
        "description": programme.description,
        "start_date": programme.start_date,
        "end_date": programme.end_date,
        "target_xp": programme.target_xp,
        "weekly_target_xp": (
            programme.weekly_target_xp
        ),
        "max_group_penalty_percent": (
            programme.max_group_penalty_percent
        ),
        "active_theme_id": (
            programme.active_theme_id
        ),
        "active_map_id": (
            programme.active_map_id
        ),
        "active_phase_id": (
            programme.active_phase_id
        ),
    }


@router.put("/programme")
def update_programme_configuration(
    data: ProgrammeRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    if (
        data.end_date is not None
        and data.start_date is not None
        and data.end_date < data.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date.",
        )

    old_values = (
        f"name={programme.name};"
        f"target_xp={programme.target_xp};"
        f"weekly_target_xp="
        f"{programme.weekly_target_xp};"
        f"max_group_penalty_percent="
        f"{programme.max_group_penalty_percent}"
    )

    programme.name = data.name.strip()
    programme.description = (
        data.description.strip()
        if data.description
        else None
    )
    programme.start_date = data.start_date
    programme.end_date = data.end_date
    programme.target_xp = data.target_xp
    programme.weekly_target_xp = (
        data.weekly_target_xp
    )
    programme.max_group_penalty_percent = (
        data.max_group_penalty_percent
    )

    audit(
        db,
        user.id,
        "programme.updated",
        (
            f"old=[{old_values}];"
            f"new=["
            f"name={programme.name};"
            f"target_xp={programme.target_xp};"
            f"weekly_target_xp="
            f"{programme.weekly_target_xp};"
            f"max_group_penalty_percent="
            f"{programme.max_group_penalty_percent}"
            f"]"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": programme.id,
    }


# ============================================================
# STAFF XP AWARDS
# ============================================================

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
    player = (
        db.query(Player)
        .filter(
            Player.id == data.player_id,
            Player.active == True,
        )
        .first()
    )

    if not player:
        raise HTTPException(
            status_code=404,
            detail="Player not found.",
        )

    try:
        transaction = award_xp(
            db,
            programme_id=get_programme(db).id,
            player_id=player.id,
            group_id=player.group_id,
            amount=data.amount,
            group_amount=0,
            transaction_type=(
                "admin_adjustment"
            ),
            reason=data.reason,
            created_by=user.id,
        )

        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    audit(
        db,
        user.id,
        "xp.admin_adjustment",
        (
            f"player_id={player.id};"
            f"amount={data.amount};"
            f"reason={data.reason}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "transaction_id": transaction.id,
    }


# ============================================================
# POINT ECONOMY
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

    awards_per_week: float = Field(
        default=0,
        ge=0,
        le=100_000,
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
            PointRule.programme_id
            == programme.id
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
            "individual_xp": (
                rule.individual_xp
            ),
            "group_xp": rule.group_xp,
            "weekly_cap": rule.weekly_cap,
            "awards_per_week": (
                rule.awards_per_week
            ),
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

    existing = (
        db.query(PointRule)
        .filter(
            PointRule.programme_id
            == programme.id,
            PointRule.code == code,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "A point rule with this code "
                "already exists."
            ),
        )

    if (
        data.individual_xp == 0
        and data.group_xp == 0
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A point rule must award "
                "some XP."
            ),
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
        awards_per_week=(
            data.awards_per_week
        ),
        enabled=data.enabled,
    )

    db.add(rule)

    db.flush()

    audit(
        db,
        user.id,
        "point_rule.created",
        (
            f"id={rule.id};"
            f"code={code};"
            f"individual_xp="
            f"{data.individual_xp};"
            f"group_xp="
            f"{data.group_xp}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": rule.id,
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
            PointRule.programme_id
            == programme.id,
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
            PointRule.programme_id
            == programme.id,
            PointRule.code == code,
            PointRule.id != rule.id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=(
                "A point rule with this code "
                "already exists."
            ),
        )

    if (
        data.individual_xp == 0
        and data.group_xp == 0
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A point rule must award "
                "some XP."
            ),
        )

    old_values = (
        f"name={rule.name};"
        f"code={rule.code};"
        f"individual_xp="
        f"{rule.individual_xp};"
        f"group_xp={rule.group_xp};"
        f"weekly_cap="
        f"{rule.weekly_cap};"
        f"awards_per_week="
        f"{rule.awards_per_week};"
        f"enabled={rule.enabled}"
    )

    rule.name = data.name.strip()
    rule.code = code
    rule.description = (
        data.description.strip()
        if data.description
        else None
    )
    rule.individual_xp = (
        data.individual_xp
    )
    rule.group_xp = data.group_xp
    rule.weekly_cap = data.weekly_cap
    rule.awards_per_week = (
        data.awards_per_week
    )
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
            f"individual_xp="
            f"{rule.individual_xp};"
            f"group_xp={rule.group_xp};"
            f"weekly_cap="
            f"{rule.weekly_cap};"
            f"awards_per_week="
            f"{rule.awards_per_week};"
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
def disable_point_rule(
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
            PointRule.programme_id
            == programme.id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Point rule not found.",
        )

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
# REWARDS
# ============================================================

class RewardRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    xp_threshold: int | None = Field(
        default=None,
        ge=0,
        le=1_000_000,
    )

    reward_type: str = Field(
        default="physical",
        min_length=2,
        max_length=100,
    )

    value: float = Field(
        default=0,
        ge=0,
        le=1_000_000,
    )

    active: bool = True


def reward_response(reward: Reward):
    return {
        "id": reward.id,
        "programme_id": reward.programme_id,
        "name": reward.name,
        "description": reward.description,
        "xp_threshold": reward.xp_threshold,
        "reward_type": reward.reward_type,
        "value": reward.value,
        "currency": reward.currency,
        "badge_id": reward.badge_id,
        "mystery": reward.mystery,
        "active": reward.active,
    }


@router.get("/rewards")
def get_rewards(
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    rewards = (
        db.query(Reward)
        .filter(
            Reward.programme_id == programme.id
        )
        .order_by(
            Reward.xp_threshold.asc(),
            Reward.id.asc(),
        )
        .all()
    )

    return [
        reward_response(reward)
        for reward in rewards
    ]


@router.post("/rewards")
def create_reward(
    data: RewardRequest,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    reward = Reward(
        programme_id=programme.id,
        name=data.name.strip(),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        xp_threshold=data.xp_threshold,
        reward_type=data.reward_type.strip(),
        value=data.value,
        currency="GBP",
        active=data.active,
    )

    db.add(reward)
    db.flush()

    audit(
        db,
        user.id,
        "reward.created",
        (
            f"id={reward.id};"
            f"programme_id={programme.id};"
            f"name={reward.name};"
            f"xp_threshold={reward.xp_threshold};"
            f"reward_type={reward.reward_type};"
            f"value={reward.value};"
            f"active={reward.active}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": reward.id,
    }


@router.put("/rewards/{reward_id}")
def update_reward(
    reward_id: int,
    data: RewardRequest,
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    reward = (
        db.query(Reward)
        .filter(
            Reward.id == reward_id,
            Reward.programme_id == programme.id,
        )
        .first()
    )

    if not reward:
        raise HTTPException(
            status_code=404,
            detail="Reward not found.",
        )

    reward.name = data.name.strip()

    reward.description = (
        data.description.strip()
        if data.description
        else None
    )

    reward.xp_threshold = data.xp_threshold
    reward.reward_type = data.reward_type.strip()
    reward.value = data.value
    reward.active = data.active

    audit(
        db,
        user.id,
        "reward.updated",
        (
            f"id={reward.id};"
            f"programme_id={programme.id};"
            f"name={reward.name};"
            f"xp_threshold={reward.xp_threshold};"
            f"reward_type={reward.reward_type};"
            f"value={reward.value};"
            f"active={reward.active}"
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
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    reward = (
        db.query(Reward)
        .filter(
            Reward.id == reward_id,
            Reward.programme_id == programme.id,
        )
        .first()
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
            f"programme_id={programme.id};"
            f"name={reward.name}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": reward.id,
    }


# JACKPOT / PROGRAMME MILESTONES
# ============================================================

class ProgrammeMilestoneRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    xp_threshold: int = Field(
        ...,
        ge=1,
        le=100_000_000,
    )

    reward_description: str | None = Field(
        default=None,
        max_length=500,
    )

    reward_value: float = Field(
        default=0,
        ge=0,
        le=1_000_000,
    )

    reward_type: str = Field(
        default="group",
        min_length=2,
        max_length=50,
    )

    sort_order: int = Field(
        default=0,
        ge=0,
        le=1000,
    )

    active: bool = True


def milestone_response(
    milestone: ProgrammeMilestone,
    current_xp: int,
):
    threshold = (
        milestone.xp_threshold
    )

    achieved = (
        current_xp >= threshold
    )

    return {
        "id": milestone.id,
        "name": milestone.name,
        "xp_threshold": threshold,
        "reward_description": (
            milestone.reward_description
        ),
        "reward_value": (
            milestone.reward_value
        ),
        "reward_type": (
            milestone.reward_type
        ),
        "sort_order": (
            milestone.sort_order
        ),
        "active": milestone.active,
        "achieved": achieved,
        "awarded_at": (
            milestone.awarded_at
        ),
    }


@router.get("/jackpot")
def get_jackpot(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    current_xp = group_xp(
        db,
        programme.id,
    )

    target_xp = (
        programme.target_xp or 0
    )

    progress_percent = (
        (current_xp / target_xp) * 100
        if target_xp > 0
        else 0
    )

    milestones = (
        db.query(ProgrammeMilestone)
        .filter(
            ProgrammeMilestone.programme_id
            == programme.id
        )
        .order_by(
            ProgrammeMilestone.sort_order.asc(),
            ProgrammeMilestone.xp_threshold.asc(),
            ProgrammeMilestone.id.asc(),
        )
        .all()
    )

    return {
        "programme": {
            "id": programme.id,
            "name": programme.name,
            "target_xp": target_xp,
            "weekly_target_xp": (
                programme.weekly_target_xp
                or 0
            ),
            "max_group_penalty_percent": (
                programme.max_group_penalty_percent
            ),
        },
        "current_xp": current_xp,
        "progress_percent": round(
            min(progress_percent, 100),
            2,
        ),
        "remaining_xp": max(
            target_xp - current_xp,
            0,
        ),
        "milestones": [
            milestone_response(
                milestone,
                current_xp,
            )
            for milestone in milestones
            if milestone.active
        ],
    }


@router.post("/jackpot/milestones")
def create_jackpot_milestone(
    data: ProgrammeMilestoneRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    existing = (
        db.query(ProgrammeMilestone)
        .filter(
            ProgrammeMilestone.programme_id
            == programme.id,
            ProgrammeMilestone.xp_threshold
            == data.xp_threshold,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "A milestone already exists "
                "at this XP threshold."
            ),
        )

    milestone = ProgrammeMilestone(
        programme_id=programme.id,
        name=data.name.strip(),
        xp_threshold=data.xp_threshold,
        reward_description=(
            data.reward_description.strip()
            if data.reward_description
            else None
        ),
        reward_value=data.reward_value,
        reward_type=data.reward_type.strip(),
        sort_order=data.sort_order,
        active=data.active,
    )

    db.add(milestone)

    db.flush()

    audit(
        db,
        user.id,
        "programme_milestone.created",
        (
            f"id={milestone.id};"
            f"threshold="
            f"{milestone.xp_threshold};"
            f"reward="
            f"{milestone.reward_value}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": milestone.id,
    }


@router.put(
    "/jackpot/milestones/{milestone_id}"
)
def update_jackpot_milestone(
    milestone_id: int,
    data: ProgrammeMilestoneRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    milestone = (
        db.query(ProgrammeMilestone)
        .filter(
            ProgrammeMilestone.id
            == milestone_id,
            ProgrammeMilestone.programme_id
            == programme.id,
        )
        .first()
    )

    if not milestone:
        raise HTTPException(
            status_code=404,
            detail="Milestone not found.",
        )

    duplicate = (
        db.query(ProgrammeMilestone)
        .filter(
            ProgrammeMilestone.programme_id
            == programme.id,
            ProgrammeMilestone.xp_threshold
            == data.xp_threshold,
            ProgrammeMilestone.id
            != milestone.id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=(
                "Another milestone already "
                "uses this XP threshold."
            ),
        )

    old_values = (
        f"name={milestone.name};"
        f"threshold="
        f"{milestone.xp_threshold};"
        f"reward="
        f"{milestone.reward_value};"
        f"active={milestone.active}"
    )

    milestone.name = data.name.strip()
    milestone.xp_threshold = (
        data.xp_threshold
    )
    milestone.reward_description = (
        data.reward_description.strip()
        if data.reward_description
        else None
    )
    milestone.reward_value = (
        data.reward_value
    )
    milestone.reward_type = (
        data.reward_type.strip()
    )
    milestone.sort_order = (
        data.sort_order
    )
    milestone.active = data.active

    audit(
        db,
        user.id,
        "programme_milestone.updated",
        (
            f"id={milestone.id};"
            f"old=[{old_values}];"
            f"new=["
            f"name={milestone.name};"
            f"threshold="
            f"{milestone.xp_threshold};"
            f"reward="
            f"{milestone.reward_value};"
            f"active={milestone.active}"
            f"]"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": milestone.id,
    }


@router.delete(
    "/jackpot/milestones/{milestone_id}"
)
def disable_jackpot_milestone(
    milestone_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    milestone = (
        db.query(ProgrammeMilestone)
        .filter(
            ProgrammeMilestone.id
            == milestone_id,
            ProgrammeMilestone.programme_id
            == programme.id,
        )
        .first()
    )

    if not milestone:
        raise HTTPException(
            status_code=404,
            detail="Milestone not found.",
        )

    milestone.active = False

    audit(
        db,
        user.id,
        "programme_milestone.disabled",
        (
            f"id={milestone.id};"
            f"name={milestone.name}"
        ),
    )

    db.commit()

    return {
        "success": True,
        "id": milestone.id,
        "active": False,
    }


# ============================================================
# SIMPLE ADMIN DATA ENDPOINTS
# ============================================================

@router.get("/players")
def admin_players(
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
        .join(
            YouthGroup,
            Player.group_id
            == YouthGroup.id,
            isouter=True,
        )
        .filter(
            Player.active == True,
        )
        .order_by(
            Player.gamertag.asc()
        )
        .all()
    )

    return [
        {
            "id": player.id,
            "gamertag": player.gamertag,
            "avatar": player.avatar,
            "active": player.active,
            "suspended": player.suspended,
            "public_visible": (
                player.public_visible
            ),
            "group_id": player.group_id,
            "xp": player_xp(
                db,
                player.id,
            ),
        }
        for player in players
    ]


@router.get("/themes")
def admin_themes(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    programme = get_programme(db)

    themes = (
        db.query(Theme)
        .filter(
            Theme.programme_id
            == programme.id
        )
        .order_by(
            Theme.name.asc()
        )
        .all()
    )

    return [
        {
            "id": theme.id,
            "name": theme.name,
            "primary": theme.primary,
            "secondary": theme.secondary,
            "accent": theme.accent,
            "background": theme.background,
            "surface": theme.surface,
            "text": theme.text,
            "logo_url": theme.logo_url,
            "font_family": theme.font_family,
            "active": theme.active,
            "selected": (
                theme.id
                == programme.active_theme_id
            ),
        }
        for theme in themes
    ]
