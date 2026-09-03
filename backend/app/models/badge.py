from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Badge(Base):
    """
    Badge definition.

    Badges are programme configuration and can be changed by admins.
    """

    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    asset: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    profile_frame: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    sequence_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    xp_reward: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    group_xp_reward: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
    )
