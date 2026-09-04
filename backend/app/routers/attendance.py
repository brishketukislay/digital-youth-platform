from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db.database import get_db
from ..db.models import AttendanceSession, Player
from ..schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceResponse,
)
from ..services.attendance import check_in


router = APIRouter(
    prefix="/api/attendance",
    tags=["attendance"],
)


@router.post(
    "/check-in",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def check_in_player(
    payload: AttendanceCheckInRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    Register the authenticated player for an attendance session.
    """

    player = (
        db.query(Player)
        .filter(Player.user_id == user.id)
        .first()
    )

    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found.",
        )

    attendance_session = db.get(
        AttendanceSession,
        payload.session_id,
    )

    if not attendance_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance session not found.",
        )

    try:
        attendance = check_in(
            db,
            player=player,
            attendance_session=attendance_session,
            created_by=user.id,
        )

        db.commit()
        db.refresh(attendance)

        return attendance

    except ValueError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
