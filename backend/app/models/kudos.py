from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Kudos(Base):
    __tablename__ = "kudos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    from_player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    to_player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Controlled value selected from server configuration.
    #
    # Examples:
    #   teamwork
    #   helpful
    #   encouraging
    #   brave
    #   positive
    reaction_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    from_player: Mapped["Player"] = relationship(
        "Player",
        foreign_keys=[from_player_id],
    )

    to_player: Mapped["Player"] = relationship(
        "Player",
        foreign_keys=[to_player_id],
    )

    __table_args__ = (
        UniqueConstraint(
            "from_player_id",
            "to_player_id",
            "reaction_type",
            "created_at",
            name="uq_kudos_event",
        ),
    )
