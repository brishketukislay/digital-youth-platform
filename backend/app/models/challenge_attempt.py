from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ChallengeAttempt(Base):
    """
    Immutable-ish record of a player's attempt.

    The server, not the browser, determines whether an attempt is
    valid for scoring and XP.
    """

    __tablename__ = "challenge_attempts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    attempt_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )

    # Server-calculated normalized score/ranking value.
    percentile: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    valid: Mapped[bool] = mapped_column(
        nullable=False,
        default=True,
        index=True,
    )

    # Game-specific evidence.
    #
    # Example:
    # {
    #   "accuracy": 0.973,
    #   "duration_ms": 842,
    #   "event_id": "..."
    # }
    evidence: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    # Client correlation ID. Useful for retry protection.
    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    challenge: Mapped["Challenge"] = relationship(
        "Challenge",
        back_populates="attempts",
    )

    player: Mapped["Player"] = relationship(
        "Player",
    )
