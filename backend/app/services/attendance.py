from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import Attendance, Player, Session as YouthSession
from .xp import award_xp


ATTENDANCE_XP = 500


def check_in(
    db: Session,
    *,
    player_id: int,
    session_id: int,
    created_by: int | None = None,
) -> Attendance:
    """
    Register one player for one youth-work session.

    Attendance is idempotent at the database level.
    """

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.player_id == player_id,
            Attendance.session_id == session_id,
        )
        .first()
    )

    if existing:
        return existing

    player = (
        db.query(Player)
        .filter(Player.id == player_id)
        .first()
    )

    if player is None:
        raise ValueError("Player not found.")

    session = (
        db.query(YouthSession)
        .filter(YouthSession.id == session_id)
        .first()
    )

    if session is None:
        raise ValueError("Session not found.")

    attendance = Attendance(
        player_id=player_id,
        session_id=session_id,
    )

    db.add(attendance)

    try:
        db.flush()

        transaction = award_xp(
            db,
            player=player,
            amount=ATTENDANCE_XP,
            group_amount=ATTENDANCE_XP,
            transaction_type="attendance",
            reason="Session attendance",
            reference=f"attendance:{attendance.id}",
            created_by=created_by,
        )

        attendance.xp_awarded = True
        attendance.xp_transaction_id = transaction.id

        db.flush()

        return attendance

    except IntegrityError:
        db.rollback()

        existing = (
            db.query(Attendance)
            .filter(
                Attendance.player_id == player_id,
                Attendance.session_id == session_id,
            )
            .first()
        )

        if existing:
            return existing

        raise
