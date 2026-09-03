from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Programme(Base):
    __tablename__ = "programmes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    # Public-facing programme configuration.
    #
    # These values can be changed by authorised administrators without
    # requiring a frontend deployment.
    public_title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Digital Youth Platform",
    )

    primary_colour: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="#6C5CE7",
    )

    secondary_colour: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="#00B894",
    )

    accent_colour: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="#FDCB6E",
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Collective progression target.
    #
    # This is configuration, not the current score. Current group XP
    # will be derived from the XP ledger.
    group_target_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1_500_000,
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

    phases: Mapped[list["Phase"]] = relationship(
        "Phase",
        back_populates="programme",
        cascade="all, delete-orphan",
        order_by="Phase.position",
    )

    groups: Mapped[list["Group"]] = relationship(
        "Group",
        back_populates="programme",
    )
