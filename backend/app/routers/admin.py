from datetime import datetime
import secrets

from fastapi import APIRouter, Depends, HTTPException
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
    PhaseLocation,
    PointRule,
    XPTransaction,
    Badge,
)
from ..auth import require_roles, hash_password
from ..services.xp import award_xp, player_xp, group_xp

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/overview")
def overview(
    user=Depends(require_roles("admin", "youth_worker")),
    db: Session = Depends(get_db),
):
    return {
        "players": db.query(Player).count(),
        "staff": db.query(User).filter(
            User.role.in_(["admin", "youth_worker"])
        ).count(),
        "group_xp": group_xp(db),
        "programme": db.query(Programme).filter(
            Programme.active == True
        ).first().name if db.query(Programme).filter(
            Programme.active == True
        ).first() else None,
    }


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str
    gamertag: str | None = None
    avatar: str = "avatar-1"
    group_id: int | None = None


@router.post("/users")
def create_user(
    data: CreateUserRequest,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    if data.role not in ["admin", "youth_worker", "player"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")

    new_user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
    )

    db.add(new_user)
    db.flush()

    if data.role == "player":
        if not data.gamertag:
            raise HTTPException(status_code=400, detail="Gamertag required")

        player = Player(
            user_id=new_user.id,
            group_id=data.group_id,
            gamertag=data.gamertag,
            avatar=data.avatar,
        )
        db.add(player)

    db.commit()

    return {"success": True, "id": new_user.id}


class AwardXPRequest(BaseModel):
    player_id: int
    amount: int
    reason: str


@router.post("/xp/award")
def award_player_xp(
    data: AwardXPRequest,
    user=Depends(require_roles("admin", "youth_worker")),
    db: Session = Depends(get_db),
):
    player = db.get(Player, data.player_id)

    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    award_xp(
        db,
        player.id,
        data.amount,
        data.amount,
        "manual",
        data.reason,
        user.id,
    )

    db.commit()

    return {
        "success": True,
        "xp": player_xp(db, player.id),
    }


class ThemeRequest(BaseModel):
    name: str
    primary: str
    secondary: str
    accent: str
    background: str
    surface: str
    text: str


@router.post("/themes")
def create_theme(
    data: ThemeRequest,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    theme = Theme(**data.model_dump())
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return {"id": theme.id}


class PhaseRequest(BaseModel):
    name: str
    description: str | None = None
    colour: str = "#18775B"
    icon: str = "star"


@router.post("/phases")
def create_phase(
    data: PhaseRequest,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    programme = db.query(Programme).filter(
        Programme.active == True
    ).first()

    if not programme:
        raise HTTPException(status_code=404, detail="No active programme")

    phase = Phase(
        programme_id=programme.id,
        name=data.name,
        description=data.description,
        colour=data.colour,
        icon=data.icon,
        sort_order=db.query(Phase).count(),
    )

    db.add(phase)
    db.commit()

    return {"id": phase.id}


@router.get("/players")
def players(
    user=Depends(require_roles("admin", "youth_worker")),
    db: Session = Depends(get_db),
):
    result = []

    for player in db.query(Player).filter(Player.active == True).all():
        result.append({
            "id": player.id,
            "gamertag": player.gamertag,
            "avatar": player.avatar,
            "xp": player_xp(db, player.id),
        })

    return result


@router.get("/themes")
def themes(
    user=Depends(require_roles("admin")),
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
