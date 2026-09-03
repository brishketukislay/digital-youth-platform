from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class CheckInMethod(str, enum.Enum):
    PLAYER_QR = "player_qr"
    SESSION_QR = "session_qr"
    STAFF_TABLET = "staff_tablet"
    MANUAL = "manual"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    EXCUSED = "excused"
    VOIDED = "voided"


class Attendance(Base):
    """
    One attendance record per player/session.

    The unique player/session constraint is essential for preventing
    duplicate attendance XP.
    """

    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    session_id: Mapped[int] = mapped_column(
        ForeignKey("youth_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(
            AttendanceStatus,
            name="attendance_status",
            native_enum=False,
        ),
        nullable=False,
        default=AttendanceStatus.PRESENT,
    )

    check_in_method: Mapped[CheckInMethod] = mapped_column(
        Enum(
            CheckInMethod,
            name="check_in_method",
            native_enum=False,
        ),
        nullable=False,
    )

    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Idempotency protects against mobile retries/double taps.
    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    recorded_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    note: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    session: Mapped["YouthSession"] = relationship(
        "YouthSession",
        back_populates="attendance_records",
    )

    player: Mapped["Player"] = relationship(
        "Player",
    )

    recorded_by: Mapped["User | None"] = relationship(
        "User",
    )
