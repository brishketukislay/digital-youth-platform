from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from ..database import get_db

from ..models import (
    User,
    Player,
    Group,
    Programme,
    Theme,
    Map,
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


@router.get("/programme")
def programme_config(
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
        "theme_id": programme.theme_id,
        "map_id": programme.map_id,
    }


@router.put("/programme")
def update_programme(
    data: ProgrammeRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    programme.name = data.name.strip()
    programme.description = data.description
    programme.start_date = data.start_date
    programme.end_date = data.end_date

    if data.target_xp < 1:
        raise HTTPException(
            status_code=400,
            detail="Target XP must be greater than zero",
        )

    programme.target_xp = data.target_xp

    audit(
        db,
        user.id,
        "programme.updated",
        programme.name,
    )

    db.commit()

    return {
        "success": True,
    }


# ============================================================
# THEMES
# ============================================================

class ThemeRequest(BaseModel):

    name: str

    primary: str
    secondary: str
    accent: str

    background: str
    surface: str
    text: str


@router.get("/themes")
def themes(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    return [
        {
            "id": t.id,
            "name": t.name,
            "primary": t.primary,
            "secondary": t.secondary,
            "accent": t.accent,
            "background": t.background,
            "surface": t.surface,
            "text": t.text,
        }
        for t in db.query(Theme).all()
    ]


@router.post("/themes")
def create_theme(
    data: ThemeRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    theme = Theme(
        **data.model_dump()
    )

    db.add(theme)

    audit(
        db,
        user.id,
        "theme.created",
        data.name,
    )

    db.commit()
    db.refresh(theme)

    return {
        "id": theme.id,
    }


@router.put("/themes/{theme_id}")
def update_theme(
    theme_id: int,
    data: ThemeRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    theme = db.get(
        Theme,
        theme_id,
    )

    if not theme:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    for key, value in data.model_dump().items():
        setattr(
            theme,
            key,
            value,
        )

    audit(
        db,
        user.id,
        "theme.updated",
        data.name,
    )

    db.commit()

    return {
        "success": True,
    }


@router.post("/themes/{theme_id}/activate")
def activate_theme(
    theme_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    theme = db.get(
        Theme,
        theme_id,
    )

    if not theme:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    programme.theme_id = theme.id

    audit(
        db,
        user.id,
        "theme.activated",
        theme.name,
    )

    db.commit()

    return {
        "success": True,
    }


# ============================================================
# MAPS
# ============================================================

class MapRequest(BaseModel):

    name: str
    description: str | None = None
    background_image: str | None = None


@router.get("/maps")
def maps(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    return [
        {
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "background_image": m.background_image,
            "active": m.active,
        }
        for m in db.query(Map)
        .order_by(Map.name)
        .all()
    ]


@router.post("/maps")
def create_map(
    data: MapRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    game_map = Map(
        name=data.name,
        description=data.description,
        background_image=data.background_image,
    )

    db.add(game_map)

    audit(
        db,
        user.id,
        "map.created",
        data.name,
    )

    db.commit()
    db.refresh(game_map)

    return {
        "id": game_map.id,
    }


@router.put("/maps/{map_id}")
def update_map(
    map_id: int,
    data: MapRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    game_map = db.get(
        Map,
        map_id,
    )

    if not game_map:
        raise HTTPException(
            status_code=404,
            detail="Map not found",
        )

    game_map.name = data.name
    game_map.description = data.description
    game_map.background_image = data.background_image

    audit(
        db,
        user.id,
        "map.updated",
        data.name,
    )

    db.commit()

    return {
        "success": True,
    }


@router.post("/maps/{map_id}/activate")
def activate_map(
    map_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    game_map = db.get(
        Map,
        map_id,
    )

    if not game_map:
        raise HTTPException(
            status_code=404,
            detail="Map not found",
        )

    programme.map_id = game_map.id

    audit(
        db,
        user.id,
        "map.activated",
        game_map.name,
    )

    db.commit()

    return {
        "success": True,
    }


# ============================================================
# MAP LOCATIONS
# ============================================================

class MapLocationRequest(BaseModel):

    name: str
    description: str | None = None

    x: float
    y: float

    icon: str = "pin"


@router.get("/maps/{map_id}/locations")
def map_locations(
    map_id: int,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    return [
        {
            "id": location.id,
            "name": location.name,
            "description": location.description,
            "x": location.x,
            "y": location.y,
            "icon": location.icon,
            "active": location.active,
        }
        for location in db.query(
            MapLocation
        ).filter(
            MapLocation.map_id == map_id,
            MapLocation.active == True,
        ).all()
    ]


@router.post("/maps/{map_id}/locations")
def create_map_location(
    map_id: int,
    data: MapLocationRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    if not 0 <= data.x <= 1:
        raise HTTPException(
            status_code=400,
            detail="X must be between 0 and 1",
        )

    if not 0 <= data.y <= 1:
        raise HTTPException(
            status_code=400,
            detail="Y must be between 0 and 1",
        )

    if not db.get(Map, map_id):
        raise HTTPException(
            status_code=404,
            detail="Map not found",
        )

    location = MapLocation(
        map_id=map_id,
        name=data.name,
        description=data.description,
        x=data.x,
        y=data.y,
        icon=data.icon,
    )

    db.add(location)

    audit(
        db,
        user.id,
        "map_location.created",
        data.name,
    )

    db.commit()
    db.refresh(location)

    return {
        "id": location.id,
    }


@router.put("/maps/locations/{location_id}")
def update_map_location(
    location_id: int,
    data: MapLocationRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    location = db.get(
        MapLocation,
        location_id,
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found",
        )

    if not 0 <= data.x <= 1:
        raise HTTPException(
            status_code=400,
            detail="X must be between 0 and 1",
        )

    if not 0 <= data.y <= 1:
        raise HTTPException(
            status_code=400,
            detail="Y must be between 0 and 1",
        )

    location.name = data.name
    location.description = data.description
    location.x = data.x
    location.y = data.y
    location.icon = data.icon

    audit(
        db,
        user.id,
        "map_location.updated",
        data.name,
    )

    db.commit()

    return {
        "success": True,
    }


# ============================================================
# POINT RULES
# ============================================================

class PointRuleRequest(BaseModel):

    name: str
    code: str

    individual_xp: int
    group_xp: int

    enabled: bool = True


@router.get("/point-rules")
def point_rules(
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    return [
        {
            "id": rule.id,
            "name": rule.name,
            "code": rule.code,
            "individual_xp": rule.individual_xp,
            "group_xp": rule.group_xp,
            "enabled": rule.enabled,
        }
        for rule in db.query(PointRule)
        .order_by(PointRule.name)
        .all()
    ]


@router.post("/point-rules")
def create_point_rule(
    data: PointRuleRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    existing = (
        db.query(PointRule)
        .filter(
            PointRule.code == data.code
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Point rule code already exists",
        )

    rule = PointRule(
        **data.model_dump()
    )

    db.add(rule)

    audit(
        db,
        user.id,
        "point_rule.created",
        data.code,
    )

    db.commit()
    db.refresh(rule)

    return {
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

    rule = db.get(
        PointRule,
        rule_id,
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Point rule not found",
        )

    rule.name = data.name
    rule.code = data.code
    rule.individual_xp = data.individual_xp
    rule.group_xp = data.group_xp
    rule.enabled = data.enabled

    audit(
        db,
        user.id,
        "point_rule.updated",
        data.code,
    )

    db.commit()

    return {
        "success": True,
    }


# ============================================================
# PLAYERS
# ============================================================

class CreateUserRequest(BaseModel):

    username: str
    password: str

    role: str

    gamertag: str | None = None

    avatar: str = "avatar-01"

    group_id: int | None = None


@router.post("/users")
def create_user(
    data: CreateUserRequest,
    user=Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):

    if data.role not in [
        "admin",
        "youth_worker",
        "player",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )

    if (
        db.query(User)
        .filter(
            User.username == data.username
        )
        .first()
    ):
        raise HTTPException(
            status_code=409,
            detail="Username already exists",
        )

    new_user = User(
        username=data.username,
        password_hash=hash_password(
            data.password
        ),
        role=data.role,
    )

    db.add(new_user)
    db.flush()

    if data.role == "player":

        if not data.gamertag:
            raise HTTPException(
                status_code=400,
                detail="Gamertag required",
            )

        if (
            db.query(Player)
            .filter(
                Player.gamertag == data.gamertag
            )
            .first()
        ):
            raise HTTPException(
                status_code=409,
                detail="Gamertag already exists",
            )

        player = Player(
            user_id=new_user.id,
            group_id=data.group_id,
            gamertag=data.gamertag,
            avatar=data.avatar,
        )

        db.add(player)

    audit(
        db,
        user.id,
        "user.created",
        data.username,
    )

    db.commit()

    return {
        "success": True,
        "id": new_user.id,
    }


@router.get("/players")
def players(
    user=Depends(
        require_roles(
            "admin",
            "youth_worker",
        )
    ),
    db: Session = Depends(get_db),
):

    programme = get_programme(db)

    result = []

    query = (
        db.query(Player)
        .join(
            Group,
            Player.group_id == Group.id,
        )
        .filter(
            Player.active == True,
            Group.programme_id == programme.id,
        )
    )

    for player in query.all():

        result.append(
            {
                "id": player.id,
                "gamertag": player.gamertag,
                "avatar": player.avatar,
                "xp": player_xp(
                    db,
                    player.id,
                ),
                "group_id": player.group_id,
            }
        )

    return result


# ============================================================
# MANUAL XP
# ============================================================

class AwardXPRequest(BaseModel):

    player_id: int
    amount: int
    reason: str


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