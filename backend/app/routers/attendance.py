from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models.models import (
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
