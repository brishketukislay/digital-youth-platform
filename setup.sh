#!/bin/bash

set -e

echo "Creating Digital Youth Platform..."

mkdir -p backend/app/routers
mkdir -p backend/app/services
mkdir -p frontend/src/components
mkdir -p frontend/src/pages
mkdir -p frontend/src/pages/admin
mkdir -p frontend/src/api
mkdir -p frontend/public

# ============================================================
# BACKEND
# ============================================================

cat > backend/requirements.txt <<'EOF'
fastapi==0.116.1
uvicorn[standard]==0.35.0
sqlalchemy==2.0.43
pydantic==2.11.7
pydantic-settings==2.10.1
python-multipart==0.0.20
passlib[argon2]==1.7.4
itsdangerous==2.2.0
qrcode[pil]==8.2
EOF

cat > backend/app/__init__.py <<'EOF'
EOF

cat > backend/app/database.py <<'EOF'
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./youth_platform.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

cat > backend/app/models.py <<'EOF'
from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    Float,
    ForeignKey,
    Text,
    UniqueConstraint,
)

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime)


class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    target_xp = Column(Integer, default=1500000)
    active = Column(Boolean, default=True)
    theme_id = Column(Integer, ForeignKey("themes.id"))
    map_id = Column(Integer, ForeignKey("maps.id"))


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    primary = Column(String(20), default="#18775B")
    secondary = Column(String(20), default="#0F513C")
    accent = Column(String(20), default="#43B98B")
    background = Column(String(20), default="#F3F7F5")
    surface = Column(String(20), default="#FFFFFF")
    text = Column(String(20), default="#17221E")


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    background_image = Column(String(500))
    active = Column(Boolean, default=True)


class MapLocation(Base):
    __tablename__ = "map_locations"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    x = Column(Float, default=0.5)
    y = Column(Float, default=0.5)
    icon = Column(String(50), default="pin")
    active = Column(Boolean, default=True)


class Phase(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(50), default="star")
    colour = Column(String(20), default="#18775B")
    start_date = Column(Date)
    end_date = Column(Date)
    sort_order = Column(Integer, default=0)
    active = Column(Boolean, default=True)


class PhaseLocation(Base):
    __tablename__ = "phase_locations"

    id = Column(Integer, primary_key=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("map_locations.id"), nullable=False)
    is_primary = Column(Boolean, default=False)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    name = Column(String(100), nullable=False)
    active = Column(Boolean, default=True)


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"))
    gamertag = Column(String(100), unique=True, nullable=False)
    avatar = Column(String(100), default="avatar-1")
    active = Column(Boolean, default=True)


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    amount = Column(Integer, nullable=False)
    group_amount = Column(Integer, default=0)
    type = Column(String(100), nullable=False)
    reason = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class PointRule(Base):
    __tablename__ = "point_rules"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(100), unique=True, nullable=False)
    individual_xp = Column(Integer, default=0)
    group_xp = Column(Integer, default=0)
    enabled = Column(Boolean, default=True)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    code = Column(String(6), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    xp_awarded = Column(Integer, default=500)

    __table_args__ = (
        UniqueConstraint("session_id", "player_id"),
    )


class SkillTree(Base):
    __tablename__ = "skill_trees"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    active = Column(Boolean, default=True)
    current_xp = Column(Integer, default=0)


class SkillMilestone(Base):
    __tablename__ = "skill_milestones"

    id = Column(Integer, primary_key=True)
    skill_tree_id = Column(Integer, ForeignKey("skill_trees.id"))
    name = Column(String(200), nullable=False)
    required_xp = Column(Integer, nullable=False)
    reward_description = Column(String(500))
    completed = Column(Boolean, default=False)


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    colour = Column(String(20), default="#CD7F32")
    created_at = Column(DateTime, default=datetime.utcnow)


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    xp_threshold = Column(Integer)
    reward_type = Column(String(50), default="individual")
    value = Column(Float, default=0)
    active = Column(Boolean, default=True)


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True)
    phase_id = Column(Integer, ForeignKey("phases.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    start_at = Column(DateTime)
    end_at = Column(DateTime)
    participation_xp = Column(Integer, default=300)
    elite_xp = Column(Integer, default=1500)
    winner_xp = Column(Integer, default=3000)
    group_xp = Column(Integer, default=5000)
    active = Column(Boolean, default=True)


class CommunityAward(Base):
    __tablename__ = "community_awards"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    category = Column(String(100))
    description = Column(Text)
    submitted_by_name = Column(String(200))
    submitted_by_contact = Column(String(300))
    status = Column(String(30), default="pending")
    xp = Column(Integer, default=5000)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, ForeignKey("users.id"))


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True)
    phase_id = Column(Integer, ForeignKey("phases.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    resource_type = Column(String(50), default="link")
    url = Column(String(1000))
    active = Column(Boolean, default=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(200), nullable=False)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
EOF

cat > backend/app/auth.py <<'EOF'
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from passlib.hash import argon2
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .database import get_db
from .models import User

SECRET = "CHANGE_THIS_SECRET_BEFORE_PRODUCTION"
serializer = URLSafeTimedSerializer(SECRET)


def hash_password(password: str) -> str:
    return argon2.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return argon2.verify(password, password_hash)


def create_session(user_id: int) -> str:
    return serializer.dumps({"user_id": user_id})


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get("session")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        data = serializer.loads(token, max_age=60 * 60 * 24 * 7)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Session expired")

    user = db.get(User, data["user_id"])

    if not user or not user.active:
        raise HTTPException(status_code=401, detail="Account unavailable")

    return user


def require_roles(*roles):
    def dependency(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return dependency
EOF

cat > backend/app/services/xp.py <<'EOF'
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import XPTransaction, Player


def player_xp(db: Session, player_id: int) -> int:
    result = db.query(
        func.coalesce(func.sum(XPTransaction.amount), 0)
    ).filter(
        XPTransaction.player_id == player_id
    ).scalar()

    return int(result or 0)


def group_xp(db: Session) -> int:
    result = db.query(
        func.coalesce(func.sum(XPTransaction.group_amount), 0)
    ).scalar()

    return int(result or 0)


def award_xp(
    db: Session,
    player_id: int,
    amount: int,
    group_amount: int,
    transaction_type: str,
    reason: str,
    created_by: int | None = None,
):
    transaction = XPTransaction(
        player_id=player_id,
        amount=amount,
        group_amount=group_amount,
        type=transaction_type,
        reason=reason,
        created_by=created_by,
    )

    db.add(transaction)
    return transaction
EOF

cat > backend/app/routers/auth.py <<'EOF'
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..auth import verify_password, create_session, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.active:
        raise HTTPException(status_code=403, detail="Account disabled")

    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_session(user.id)

    response.set_cookie(
        "session",
        token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 24 * 7,
    )

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"success": True}


@router.get("/me")
def me(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
    }
EOF

cat > backend/app/routers/player.py <<'EOF'
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Player,
    Programme,
    Theme,
    Map,
    MapLocation,
    Phase,
    PhaseLocation,
    Badge,
    SkillTree,
    SkillMilestone,
    Challenge,
    Resource,
)
from ..auth import require_roles
from ..services.xp import player_xp, group_xp

router = APIRouter(prefix="/api/player", tags=["player"])


@router.get("/dashboard")
def dashboard(
    user=Depends(require_roles("player")),
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.user_id == user.id).first()

    if not player:
        return {"player": None}

    programme = db.query(Programme).filter(Programme.active == True).first()

    theme = db.get(Theme, programme.theme_id) if programme and programme.theme_id else None
    game_map = db.get(Map, programme.map_id) if programme and programme.map_id else None

    phases = []
    if programme:
        phases = db.query(Phase).filter(
            Phase.programme_id == programme.id,
            Phase.active == True,
        ).order_by(Phase.sort_order).all()

    current_phase = phases[0] if phases else None

    locations = []
    if game_map:
        locations = db.query(MapLocation).filter(
            MapLocation.map_id == game_map.id,
            MapLocation.active == True,
        ).all()

    badges = db.query(Badge).filter(Badge.player_id == player.id).all()
    skill = db.query(SkillTree).filter(
        SkillTree.player_id == player.id,
        SkillTree.active == True,
    ).first()

    milestones = []
    if skill:
        milestones = db.query(SkillMilestone).filter(
            SkillMilestone.skill_tree_id == skill.id
        ).all()

    challenges = db.query(Challenge).filter(
        Challenge.active == True
    ).all()

    return {
        "player": {
            "id": player.id,
            "gamertag": player.gamertag,
            "avatar": player.avatar,
            "xp": player_xp(db, player.id),
        },
        "group_xp": group_xp(db),
        "target_xp": programme.target_xp if programme else 1500000,
        "programme": {
            "name": programme.name if programme else "Youth Challenge",
        },
        "theme": {
            "primary": theme.primary,
            "secondary": theme.secondary,
            "accent": theme.accent,
            "background": theme.background,
            "surface": theme.surface,
            "text": theme.text,
        } if theme else None,
        "map": {
            "name": game_map.name,
            "background_image": game_map.background_image,
            "locations": [
                {
                    "id": x.id,
                    "name": x.name,
                    "x": x.x,
                    "y": x.y,
                    "icon": x.icon,
                }
                for x in locations
            ],
        } if game_map else None,
        "phase": {
            "id": current_phase.id,
            "name": current_phase.name,
            "description": current_phase.description,
            "colour": current_phase.colour,
            "icon": current_phase.icon,
        } if current_phase else None,
        "badges": [
            {
                "name": b.name,
                "description": b.description,
                "colour": b.colour,
            }
            for b in badges
        ],
        "skill_tree": {
            "name": skill.name,
            "description": skill.description,
            "xp": skill.current_xp,
            "milestones": [
                {
                    "name": m.name,
                    "required_xp": m.required_xp,
                    "completed": m.completed,
                    "reward": m.reward_description,
                }
                for m in milestones
            ],
        } if skill else None,
        "challenges": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "participation_xp": c.participation_xp,
                "elite_xp": c.elite_xp,
                "winner_xp": c.winner_xp,
            }
            for c in challenges
        ],
    }
EOF

cat > backend/app/routers/leaderboard.py <<'EOF'
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Player, XPTransaction

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("")
def leaderboard(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Player.id,
            Player.gamertag,
            Player.avatar,
            func.coalesce(func.sum(XPTransaction.amount), 0).label("xp"),
        )
        .outerjoin(XPTransaction, XPTransaction.player_id == Player.id)
        .filter(Player.active == True)
        .group_by(Player.id)
        .order_by(func.sum(XPTransaction.amount).desc())
        .all()
    )

    return [
        {
            "rank": index + 1,
            "gamertag": row.gamertag,
            "avatar": row.avatar,
            "xp": int(row.xp or 0),
        }
        for index, row in enumerate(rows)
    ]
EOF

cat > backend/app/routers/attendance.py <<'EOF'
from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    AttendanceSession,
    Attendance,
    Player,
    PointRule,
)
from ..auth import require_roles, get_current_user
from ..services.xp import award_xp

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


def make_code():
    return f"{secrets.randbelow(1000000):06d}"


@router.post("/start")
def start_session(
    user=Depends(require_roles("admin", "youth_worker")),
    db: Session = Depends(get_db),
):
    rule = db.query(PointRule).filter(
        PointRule.code == "ATTENDANCE"
    ).first()

    xp = rule.individual_xp if rule else 500

    session = AttendanceSession(
        code=make_code(),
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        active=True,
        created_by=user.id,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "code": session.code,
        "expires_at": session.expires_at,
        "xp": xp,
    }


class CheckInRequest(BaseModel):
    code: str


@router.post("/check-in")
def check_in(
    data: CheckInRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "player":
        raise HTTPException(status_code=403, detail="Players only")

    session = db.query(AttendanceSession).filter(
        AttendanceSession.code == data.code,
        AttendanceSession.active == True,
        AttendanceSession.expires_at > datetime.utcnow(),
    ).first()

    if not session:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    player = db.query(Player).filter(
        Player.user_id == user.id
    ).first()

    if not player:
        raise HTTPException(status_code=404, detail="Player profile not found")

    existing = db.query(Attendance).filter(
        Attendance.session_id == session.id,
        Attendance.player_id == player.id,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Already checked in")

    rule = db.query(PointRule).filter(
        PointRule.code == "ATTENDANCE"
    ).first()

    xp = rule.individual_xp if rule else 500
    group_xp = rule.group_xp if rule else 500

    attendance = Attendance(
        session_id=session.id,
        player_id=player.id,
        xp_awarded=xp,
    )

    db.add(attendance)

    award_xp(
        db,
        player.id,
        xp,
        group_xp,
        "attendance",
        "Session attendance",
    )

    db.commit()

    return {
        "success": True,
        "xp": xp,
    }
EOF

cat > backend/app/routers/admin.py <<'EOF'
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
EOF

cat > backend/app/routers/public.py <<'EOF'
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Programme, Phase, Theme, Map, MapLocation
from ..services.xp import group_xp

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/dashboard")
def public_dashboard(db: Session = Depends(get_db)):
    programme = db.query(Programme).filter(
        Programme.active == True
    ).first()

    if not programme:
        return {
            "programme": None,
            "group_xp": 0,
        }

    theme = db.get(Theme, programme.theme_id) if programme.theme_id else None
    game_map = db.get(Map, programme.map_id) if programme.map_id else None

    phases = db.query(Phase).filter(
        Phase.programme_id == programme.id,
        Phase.active == True,
    ).order_by(Phase.sort_order).all()

    locations = []

    if game_map:
        locations = db.query(MapLocation).filter(
            MapLocation.map_id == game_map.id,
            MapLocation.active == True,
        ).all()

    return {
        "programme": {
            "name": programme.name,
            "target_xp": programme.target_xp,
        },
        "group_xp": group_xp(db),
        "theme": {
            "primary": theme.primary,
            "secondary": theme.secondary,
            "accent": theme.accent,
            "background": theme.background,
            "surface": theme.surface,
            "text": theme.text,
        } if theme else None,
        "phases": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "colour": p.colour,
                "icon": p.icon,
            }
            for p in phases
        ],
        "map": {
            "name": game_map.name,
            "background_image": game_map.background_image,
            "locations": [
                {
                    "id": l.id,
                    "name": l.name,
                    "x": l.x,
                    "y": l.y,
                    "icon": l.icon,
                }
                for l in locations
            ],
        } if game_map else None,
    }
EOF

cat > backend/app/main.py <<'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .database import Base, engine
from .routers import auth, player, leaderboard, attendance, admin, public

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Digital Youth Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(player.router)
app.include_router(leaderboard.router)
app.include_router(attendance.router)
app.include_router(admin.router)
app.include_router(public.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


frontend = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if frontend.exists():
    app.mount(
        "/",
        StaticFiles(directory=frontend, html=True),
        name="frontend",
    )
EOF

cat > backend/app/routers/__init__.py <<'EOF'
EOF

cat > backend/seed.py <<'EOF'
from datetime import date

from app.database import Base, engine, SessionLocal
from app.models import (
    User,
    Programme,
    Theme,
    Map,
    MapLocation,
    Phase,
    Group,
    Player,
    PointRule,
    SkillTree,
    SkillMilestone,
)
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(User).count() == 0:
    theme = Theme(
        name="Forest",
        primary="#18775B",
        secondary="#0F513C",
        accent="#43B98B",
        background="#F3F7F5",
        surface="#FFFFFF",
        text="#17221E",
    )
    db.add(theme)
    db.flush()

    game_map = Map(
        name="Cumbernauld",
        description="Initial pilot map. This can be replaced by administrators.",
    )
    db.add(game_map)
    db.flush()

    locations = [
        ("Town Centre", 0.50, 0.45),
        ("The Link", 0.72, 0.62),
        ("Underpass", 0.30, 0.64),
        ("Library", 0.43, 0.28),
        ("Sports Centre", 0.78, 0.78),
    ]

    for name, x, y in locations:
        db.add(
            MapLocation(
                map_id=game_map.id,
                name=name,
                x=x,
                y=y,
            )
        )

    programme = Programme(
        name="Cumbernauld Youth Challenge",
        description="Six month digital youth work pilot.",
        start_date=date.today(),
        target_xp=1500000,
        theme_id=theme.id,
        map_id=game_map.id,
        active=True,
    )
    db.add(programme)
    db.flush()

    phases = [
        ("Art", "Creativity, design and community spaces.", "#9B51E0", "palette"),
        ("Civic Safety", "Recognising risk and keeping your squad safe.", "#F2994A", "shield"),
        ("Sport", "Sport, fitness and wellbeing.", "#2F80ED", "trophy"),
        ("Digital Bystander", "Online-to-offline safety and de-escalation.", "#00A6A6", "smartphone"),
    ]

    for index, (name, description, colour, icon) in enumerate(phases):
        db.add(
            __import__("app.models", fromlist=["Phase"]).Phase(
                programme_id=programme.id,
                name=name,
                description=description,
                colour=colour,
                icon=icon,
                sort_order=index,
            )
        )

    group = Group(
        programme_id=programme.id,
        name="Pilot Group",
    )
    db.add(group)
    db.flush()

    rules = [
        ("Attendance", "ATTENDANCE", 500, 500),
        ("Daily Behaviour", "BEHAVIOUR", 1000, 1000),
        ("Processing Chat", "PROCESSING_CHAT", 1200, 1200),
        ("Game Participation", "GAME_PARTICIPATION", 300, 300),
        ("Community Action", "COMMUNITY_ACTION", 5000, 5000),
    ]

    for name, code, individual, group_xp in rules:
        db.add(
            PointRule(
                name=name,
                code=code,
                individual_xp=individual,
                group_xp=group_xp,
            )
        )

    admin = User(
        username="admin",
        password_hash=hash_password("ChangeMe123!"),
        role="admin",
    )
    db.add(admin)

    staff = User(
        username="youthworker",
        password_hash=hash_password("ChangeMe123!"),
        role="youth_worker",
    )
    db.add(staff)

    player_user = User(
        username="player01",
        password_hash=hash_password("ChangeMe123!"),
        role="player",
    )
    db.add(player_user)
    db.flush()

    player = Player(
        user_id=player_user.id,
        group_id=group.id,
        gamertag="NightRider",
        avatar="avatar-1",
    )
    db.add(player)
    db.flush()

    skill = SkillTree(
        player_id=player.id,
        name="Personal Goal",
        description="Your current skill tree goal.",
    )
    db.add(skill)
    db.flush()

    milestones = [
        ("First Step", 15000, "£5 voucher"),
        ("Progress", 40000, "£10 voucher"),
        ("Mastery", 75000, "£20 voucher"),
    ]

    for name, xp, reward in milestones:
        db.add(
            SkillMilestone(
                skill_tree_id=skill.id,
                name=name,
                required_xp=xp,
                reward_description=reward,
            )
        )

    db.commit()

    print("")
    print("==========================================")
    print(" Digital Youth Platform")
    print(" Initial database created")
    print("==========================================")
    print("")
    print("Admin:")
    print("  username: admin")
    print("  password: ChangeMe123!")
    print("")
    print("Youth worker:")
    print("  username: youthworker")
    print("  password: ChangeMe123!")
    print("")
    print("Player:")
    print("  username: player01")
    print("  password: ChangeMe123!")
    print("")
    print("IMPORTANT: change these passwords.")
    print("")

else:
    print("Database already contains data. Nothing seeded.")

db.close()
EOF

# ============================================================
# FRONTEND
# ============================================================

cat > frontend/package.json <<'EOF'
{
  "name": "digital-youth-platform",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "axios": "^1.11.0",
    "lucide-react": "^0.468.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.8.2",
    "typescript": "^5.9.2",
    "vite": "^7.1.3"
  },
  "devDependencies": {}
}
EOF

cat > frontend/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
EOF

cat > frontend/vite.config.ts <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
EOF

cat > frontend/index.html <<'EOF'
<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Digital Youth Platform</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
EOF

cat > frontend/src/api/client.ts <<'EOF'
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

export async function login(username: string, password: string) {
  return api.post("/auth/login", { username, password });
}

export async function logout() {
  return api.post("/auth/logout");
}

export async function me() {
  return api.get("/auth/me");
}

export async function playerDashboard() {
  return api.get("/player/dashboard");
}

export async function leaderboard() {
  return api.get("/leaderboard");
}

export async function publicDashboard() {
  return api.get("/public/dashboard");
}

export async function adminOverview() {
  return api.get("/admin/overview");
}

export async function adminPlayers() {
  return api.get("/admin/players");
}

export async function startAttendance() {
  return api.post("/attendance/start");
}

export async function checkIn(code: string) {
  return api.post("/attendance/check-in", { code });
}
EOF

cat > frontend/src/styles.css <<'EOF'
:root {
  --primary: #18775B;
  --secondary: #0F513C;
  --accent: #43B98B;
  --background: #F3F7F5;
  --surface: #FFFFFF;
  --text: #17221E;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: var(--background);
  color: var(--text);
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  min-height: 100vh;
}

.topbar {
  background: var(--secondary);
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  font-size: 20px;
  font-weight: 800;
}

.container {
  max-width: 1200px;
  margin: auto;
  padding: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card {
  background: var(--surface);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 4px 20px rgba(0,0,0,.06);
}

.hero {
  background: linear-gradient(
    135deg,
    var(--secondary),
    var(--primary)
  );
  color: white;
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 20px;
}

.xp {
  font-size: 42px;
  font-weight: 900;
}

.progress {
  height: 16px;
  background: rgba(255,255,255,.2);
  border-radius: 20px;
  overflow: hidden;
}

.progress > div {
  height: 100%;
  background: var(--accent);
  border-radius: inherit;
}

.btn {
  border: 0;
  border-radius: 10px;
  padding: 12px 18px;
  background: var(--primary);
  color: white;
  font-weight: 700;
}

.btn.secondary {
  background: #e8efec;
  color: var(--secondary);
}

input {
  width: 100%;
  border: 1px solid #d5dfdb;
  border-radius: 10px;
  padding: 13px;
  margin: 8px 0 14px;
}

.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.login-card {
  width: min(420px, 100%);
  background: white;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,.08);
}

.map {
  position: relative;
  min-height: 420px;
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(135deg, #dbe9e3, #b9d2c8);
}

.map-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  background: var(--primary);
  color: white;
  border: 3px solid white;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
}

.leaderboard-row {
  display: grid;
  grid-template-columns: 60px 1fr 120px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #edf1ef;
}

.rank {
  font-size: 22px;
  font-weight: 900;
}

.muted {
  color: #71817a;
}

.big-code {
  font-size: 52px;
  letter-spacing: 10px;
  font-weight: 900;
  text-align: center;
  color: var(--primary);
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .xp {
    font-size: 32px;
  }

  .big-code {
    font-size: 38px;
    letter-spacing: 5px;
  }
}
EOF

cat > frontend/src/components/Layout.tsx <<'EOF'
import { ReactNode } from "react";
import { logout } from "../api/client";

export default function Layout({
  children,
  title = "Digital Youth Platform",
}: {
  children: ReactNode;
  title?: string;
}) {
  async function signOut() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">{title}</div>
        <button
          className="btn secondary"
          onClick={signOut}
        >
          Sign out
        </button>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
EOF

cat > frontend/src/pages/Login.tsx <<'EOF'
import { useState } from "react";
import { login } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await login(username, password);
      const role = response.data.role;

      if (role === "player") {
        window.location.href = "/player";
      } else {
        window.location.href = "/admin";
      }
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Digital Youth Platform</h1>
        <p className="muted">
          Sign in to continue.
        </p>

        {error && (
          <div style={{ color: "#B42318", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button className="btn" style={{ width: "100%" }}>
          Sign in
        </button>

        <p className="muted" style={{ marginTop: 20 }}>
          Accounts are created by authorised staff.
        </p>
      </form>
    </div>
  );
}
EOF

cat > frontend/src/pages/PlayerDashboard.tsx <<'EOF'
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  playerDashboard,
  checkIn,
} from "../api/client";

type Dashboard = any;

export default function PlayerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await playerDashboard();
    setData(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function attend() {
    try {
      const response = await checkIn(code);
      setMessage(`Checked in! +${response.data.xp} XP`);
      setCode("");
      await load();
    } catch (e: any) {
      setMessage(
        e?.response?.data?.detail ||
        "Unable to check in."
      );
    }
  }

  if (!data) {
    return <div className="container">Loading...</div>;
  }

  const percentage = Math.min(
    100,
    (data.group_xp / data.target_xp) * 100
  );

  return (
    <Layout>
      <section className="hero">
        <div className="muted" style={{ color: "#d8eee5" }}>
          Welcome back
        </div>

        <h1>{data.player.gamertag}</h1>

        <div className="xp">
          {data.player.xp.toLocaleString()} XP
        </div>

        <p>
          Your squad:{" "}
          {data.group_xp.toLocaleString()} XP
        </p>

        <div className="progress">
          <div style={{ width: `${percentage}%` }} />
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Current Phase</h2>

          {data.phase ? (
            <>
              <h3 style={{ color: data.phase.colour }}>
                {data.phase.icon} {data.phase.name}
              </h3>
              <p className="muted">
                {data.phase.description}
              </p>
            </>
          ) : (
            <p>No active phase.</p>
          )}
        </section>

        <section className="card">
          <h2>Session Check-in</h2>
          <p className="muted">
            Enter the code shown by your youth worker.
          </p>

          <input
            value={code}
            onChange={e =>
              setCode(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            inputMode="numeric"
            maxLength={6}
            placeholder="6 digit code"
          />

          <button
            className="btn"
            onClick={attend}
            disabled={code.length !== 6}
          >
            Check in
          </button>

          {message && <p>{message}</p>}
        </section>

        <section className="card">
          <h2>Skill Tree</h2>

          {data.skill_tree ? (
            <>
              <h3>{data.skill_tree.name}</h3>
              <p className="muted">
                {data.skill_tree.description}
              </p>

              {data.skill_tree.milestones.map(
                (m: any) => (
                  <div key={m.name} style={{ marginBottom: 14 }}>
                    <strong>{m.name}</strong>
                    <div className="progress" style={{
                      background: "#e7efeb",
                      marginTop: 6
                    }}>
                      <div
                        style={{
                          width: m.completed ? "100%" : "0%",
                        }}
                      />
                    </div>
                    <small className="muted">
                      {m.required_xp.toLocaleString()} XP
                    </small>
                  </div>
                )
              )}
            </>
          ) : (
            <p>No skill tree assigned yet.</p>
          )}
        </section>

        <section className="card">
          <h2>Your Badges</h2>

          {data.badges.length === 0 ? (
            <p className="muted">
              Your badge cabinet is waiting for its first achievement.
            </p>
          ) : (
            data.badges.map((badge: any) => (
              <div key={badge.name} style={{
                display: "inline-block",
                margin: 8,
                padding: 16,
                borderRadius: 14,
                background: badge.colour,
                color: "white"
              }}>
                🏆 {badge.name}
              </div>
            ))
          )}
        </section>
      </div>

      {data.map && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2>{data.map.name}</h2>

          <div className="map">
            {data.map.locations.map((location: any) => (
              <div
                key={location.id}
                className="map-pin"
                title={location.name}
                style={{
                  left: `${location.x * 100}%`,
                  top: `${location.y * 100}%`,
                }}
              >
                📍
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
EOF

cat > frontend/src/pages/Leaderboard.tsx <<'EOF'
import { useEffect, useState } from "react";
import { leaderboard } from "../api/client";

export default function Leaderboard() {
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const response = await leaderboard();
    setRows(response.data);
  }

  useEffect(() => {
    load();

    const timer = setInterval(load, 15000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <div className="hero">
        <h1>Leaderboard</h1>
        <p>
          Celebrating progress across the programme.
        </p>
      </div>

      <div className="card">
        {rows.map(row => (
          <div
            className="leaderboard-row"
            key={row.gamertag}
          >
            <div className="rank">
              #{row.rank}
            </div>

            <div>
              <strong>{row.gamertag}</strong>
              <div className="muted">
                {row.avatar}
              </div>
            </div>

            <strong>
              {row.xp.toLocaleString()} XP
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

cat > frontend/src/pages/admin/AdminDashboard.tsx <<'EOF'
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  adminOverview,
  adminPlayers,
  startAttendance,
} from "../../api/client";

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>();
  const [players, setPlayers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>();

  async function load() {
    const [o, p] = await Promise.all([
      adminOverview(),
      adminPlayers(),
    ]);

    setOverview(o.data);
    setPlayers(p.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAttendance() {
    const response = await startAttendance();
    setAttendance(response.data);
  }

  return (
    <Layout title="Administration">
      <div className="hero">
        <h1>Programme Control Centre</h1>
        <p>
          Configure and operate the youth platform.
        </p>
      </div>

      {overview && (
        <div className="grid">
          <div className="card">
            <h2>Players</h2>
            <div className="xp">
              {overview.players}
            </div>
          </div>

          <div className="card">
            <h2>Group XP</h2>
            <div className="xp">
              {overview.group_xp.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <h2>Programme</h2>
            <h3>{overview.programme}</h3>
          </div>

          <div className="card">
            <h2>Attendance</h2>

            <button
              className="btn"
              onClick={createAttendance}
            >
              Start Session
            </button>

            {attendance && (
              <>
                <p>Ask players to enter:</p>

                <div className="big-code">
                  {attendance.code}
                </div>

                <p className="muted">
                  Code expires in approximately 10 minutes.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Players</h2>

        {players.map(player => (
          <div
            className="leaderboard-row"
            key={player.id}
          >
            <div>{player.avatar}</div>
            <strong>{player.gamertag}</strong>
            <strong>
              {player.xp.toLocaleString()} XP
            </strong>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Configuration</h2>

        <p>
          The next administration sections are designed
          around configuration rather than hard-coded
          programme logic:
        </p>

        <ul>
          <li>Programme settings</li>
          <li>Maps and locations</li>
          <li>Phases and phase pins</li>
          <li>Colours and themes</li>
          <li>XP rules</li>
          <li>Rewards</li>
          <li>Challenges</li>
          <li>Resources</li>
          <li>Player accounts</li>
        </ul>
      </section>
    </Layout>
  );
}
EOF

cat > frontend/src/App.tsx <<'EOF'
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import PlayerDashboard from "./pages/PlayerDashboard";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { me } from "./api/client";

function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const [state, setState] = useState<
    "loading" | "ok" | "no"
  >("loading");

  useEffect(() => {
    me()
      .then(response => {
        if (
          roles &&
          !roles.includes(response.data.role)
        ) {
          setState("no");
        } else {
          setState("ok");
        }
      })
      .catch(() => setState("no"));
  }, []);

  if (state === "loading") {
    return (
      <div className="container">
        Loading...
      </div>
    );
  }

  if (state === "no") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/player"
          element={
            <Protected roles={["player"]}>
              <PlayerDashboard />
            </Protected>
          }
        />

        <Route
          path="/admin"
          element={
            <Protected roles={["admin", "youth_worker"]}>
              <AdminDashboard />
            </Protected>
          }
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
EOF

cat > frontend/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# ============================================================
# README
# ============================================================

cat > README.md <<'EOF'
# Digital Youth Platform

React + TypeScript + FastAPI + SQLite.

## First run

Backend:

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload

In another terminal:

cd frontend
npm install
npm run dev

Open:

http://localhost:5173

## Initial accounts

Admin:
admin / ChangeMe123!

Youth worker:
youthworker / ChangeMe123!

Player:
player01 / ChangeMe123!

Change these passwords before using the application with real participants.

## Public leaderboard

http://localhost:5173/leaderboard
EOF

echo ""
echo "=============================================="
echo " Project created successfully."
echo "=============================================="
echo ""
echo "Next:"
echo ""
echo "1. cd backend"
echo "2. python3 -m venv .venv"
echo "3. source .venv/bin/activate"
echo "4. pip install -r requirements.txt"
echo "5. python seed.py"
echo "6. uvicorn app.main:app --reload"
echo ""
echo "Then open another Terminal window:"
echo ""
echo "7. cd frontend"
echo "8. npm install"
echo "9. npm run dev"
echo ""
