from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ChallengeStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Challenge(Base):
    """
    A time-bound activity available to a cohort/programme.

    The actual game is selected using game_type, so new mini-games
    do not require changing the challenge model.
    """

    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    cohort_id: Mapped[int | None] = mapped_column(
        ForeignKey("cohorts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    phase_id: Mapped[int | None] = mapped_column(
        ForeignKey("phases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    game_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(
            ChallengeStatus,
            name="challenge_status",
            native_enum=False,
        ),
        nullable=False,
        default=ChallengeStatus.DRAFT,
        index=True,
    )

    starts_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    ends_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    # Number of attempts needed for participation XP.
    minimum_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    # Game-specific configuration.
    #
    # Example:
    # {
    #   "target_accuracy": 0.95,
    #   "attempt_limit": 20,
    #   "difficulty": "medium"
    # }
    game_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    # XP configuration.
    #
    # Example:
    # {
    #   "participation": 300,
    #   "elite": 1500,
    #   "winner_individual": 3000,
    #   "winner_group": 5000
    # }
    xp_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    notifications_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
    )

    cohort: Mapped["Cohort | None"] = relationship(
        "Cohort",
    )

    phase: Mapped["Phase | None"] = relationship(
        "Phase",
    )

    created_by: Mapped["User | None"] = relationship(
        "User",
    )

    attempts: Mapped[list["ChallengeAttempt"]] = relationship(
        "ChallengeAttempt",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )
