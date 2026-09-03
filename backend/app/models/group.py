from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


if TYPE_CHECKING:
    from app.models.player import Player
    from app.models.programme import Programme


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProgrammeGroup(Base):
    """
    A delivery group within a programme.

    This is intentionally separate from the overall programme.

    Example:

        Programme: Cumbernauld Digital Youth Work Trial

        Groups:
            - Group A
            - Group B
            - Group C
            - Friday Group

    The PRD makes clear that some youth-work groups may not work together
    physically, while still contributing to the same collective programme.

    Therefore the group is an operational construct, while the programme
    remains the shared collective progression pool.
    """

    __tablename__ = "programme_groups"

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "slug",
            name="uq_programme_group_slug",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    programme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Optional display ordering for staff dashboards.

    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
        back_populates="groups",
    )

    memberships: Mapped[list["GroupMembership"]] = relationship(
        "GroupMembership",
        back_populates="group",
        cascade="all, delete-orphan",
    )


class GroupMembership(Base):
    """
    Links a player to an operational group.

    A player can have historical memberships, which is why membership is
    represented as its own entity rather than simply putting group_id on
    Player.

    This allows staff to move a player between groups while preserving
    programme history.
    """

    __tablename__ = "group_memberships"

    __table_args__ = (
        UniqueConstraint(
            "group_id",
            "player_id",
            name="uq_group_player_membership",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    group_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("programme_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    group: Mapped["ProgrammeGroup"] = relationship(
        "ProgrammeGroup",
        back_populates="memberships",
    )

    player: Mapped["Player"] = relationship(
        "Player",
        back_populates="group_memberships",
    )

    @property
    def currently_active(self) -> bool:
        return (
            self.is_active
            and self.left_at is None
        )

    def close(self) -> None:
        self.is_active = False
        self.left_at = utc_now()
