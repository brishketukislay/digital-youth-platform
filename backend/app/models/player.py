from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Public identity.
    #
    # These are the ONLY identity fields that should be exposed
    # through the public leaderboard.
    gamertag: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    avatar_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="default",
    )

    avatar_frame_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Account state.
    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    leaderboard_visible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # XP here is a cached projection only.
    #
    # The authoritative source is the XP ledger.
    # Keeping the projection allows dashboards/leaderboards to remain
    # fast without making the Player row the source of truth.
    lifetime_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
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

    user: Mapped["User"] = relationship(
        "User",
        back_populates="player",
    )

    group: Mapped["Group | None"] = relationship(
        "Group",
        back_populates="players",
    )
