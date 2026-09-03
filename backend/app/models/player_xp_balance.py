from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PlayerXPBalance(Base):
    """
    Current player XP projection.

    lifetime_xp is intentionally separate from current_xp because
    penalties must not erase historical progression.
    """

    __tablename__ = "player_xp_balances"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_xp_removed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    player: Mapped["Player"] = relationship(
        "Player",
    )
