from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceResponse,
)
from ..services.attendance import check_in


router = APIRouter(
    prefix="/attendance",
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
):
    """
    Register the authenticated player for a session.

    Authentication/player resolution will be connected to the
    final auth system rather than trusting player_id from the client.
    """

    # Temporary compatibility with the current pilot API.
    # Replace with authenticated-player resolution when auth is wired.
    player_id = None

    if player_id is None:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Authenticated player context is not configured yet.",
        )

    try:
        attendance = check_in(
            db,
            player_id=player_id,
            session_id=payload.session_id,
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
