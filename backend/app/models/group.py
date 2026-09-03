from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    programme_id: Mapped[int | None] = mapped_column(
        ForeignKey("programmes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    programme: Mapped["Programme | None"] = relationship(
        "Programme",
        back_populates="groups",
    )

    players: Mapped[list["Player"]] = relationship(
        "Player",
        back_populates="group",
    )
