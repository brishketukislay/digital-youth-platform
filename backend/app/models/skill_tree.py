from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class SkillTreeStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SkillTree(Base):
    """
    One active or historical skill-tree goal belonging to a player.

    Completing a tree does not delete it. Historical trees are retained
    for audit/progression history.
    """

    __tablename__ = "skill_trees"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[SkillTreeStatus] = mapped_column(
        Enum(
            SkillTreeStatus,
            name="skill_tree_status",
            native_enum=False,
        ),
        nullable=False,
        default=SkillTreeStatus.ACTIVE,
        index=True,
    )

    # Sequence number for the player's progression.
    sequence_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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

    player: Mapped["Player"] = relationship(
        "Player",
    )

    created_by: Mapped["User | None"] = relationship(
        "User",
    )

    milestones: Mapped[list["SkillTreeMilestone"]] = relationship(
        "SkillTreeMilestone",
        back_populates="skill_tree",
        cascade="all, delete-orphan",
        order_by="SkillTreeMilestone.position",
    )
