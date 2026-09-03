from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class CommunityAwardStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class CommunityAward(Base):
    """
    A nomination submitted by a member of the community.

    This is NOT an XP transaction.

    XP is created only after staff approve the nomination.
    """

    __tablename__ = "community_awards"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    cohort_id: Mapped[int | None] = mapped_column(
        ForeignKey("cohorts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    player_id: Mapped[int | None] = mapped_column(
        ForeignKey("players.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Allows awarding the whole cohort instead of an individual.
    is_group_award: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )

    status: Mapped[CommunityAwardStatus] = mapped_column(
        Enum(
            CommunityAwardStatus,
            name="community_award_status",
            native_enum=False,
        ),
        nullable=False,
        default=CommunityAwardStatus.PENDING,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Submitter details are staff-only.
    submitter_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    submitter_organisation: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    submitter_contact: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    review_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Prevent duplicate processing of a public submission.
    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
    )

    cohort: Mapped["Cohort | None"] = relationship(
        "Cohort",
    )

    player: Mapped["Player | None"] = relationship(
        "Player",
    )

    reviewed_by: Mapped["User | None"] = relationship(
        "User",
    )
