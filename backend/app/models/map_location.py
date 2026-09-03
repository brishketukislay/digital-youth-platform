from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class MapLocation(Base):
    """
    A named point/node on the game map.

    These are intentionally abstract rather than tied to real
    latitude/longitude coordinates.
    """

    __tablename__ = "map_locations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    map_id: Mapped[int] = mapped_column(
        ForeignKey("game_maps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    phase_id: Mapped[int | None] = mapped_column(
        ForeignKey("phases.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    icon: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Coordinates are visual map coordinates, not geographic ones.
    position_x: Mapped[float] = mapped_column(
        nullable=False,
        default=0,
    )

    position_y: Mapped[float] = mapped_column(
        nullable=False,
        default=0,
    )

    # Optional visual state.
    config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    sort_order: Mapped[int] = mapped_column(
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

    game_map: Mapped["GameMap"] = relationship(
        "GameMap",
        back_populates="locations",
    )

    phase: Mapped["Phase | None"] = relationship(
        "Phase",
        back_populates="locations",
    )
