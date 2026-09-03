from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class XPTransactionType(str, enum.Enum):
    ATTENDANCE = "attendance"
    BEHAVIOUR = "behaviour"
    REFLECTION = "reflection"
    ACTIVITY = "activity"
    CHALLENGE = "challenge"
    CIVIC_ACTION = "civic_action"
    COMMUNITY_AWARD = "community_award"

    SKILL_MILESTONE = "skill_milestone"
    BADGE = "badge"
    BONUS = "bonus"
    MULTIPLIER = "multiplier"

    PENALTY = "penalty"
    GROUP_PENALTY = "group_penalty"

    ADMIN_ADJUSTMENT = "admin_adjustment"
    SYSTEM = "system"


class XPTransaction(Base):
    """
    Immutable XP ledger entry.

    Balances are projections derived from these transactions.
    This table is the authoritative audit history.
    """

    __tablename__ = "xp_transactions"

    __table_args__ = (
        CheckConstraint(
            "amount <> 0",
            name="ck_xp_transaction_non_zero",
        ),
        CheckConstraint(
            """
            player_id IS NOT NULL
            OR cohort_id IS NOT NULL
            """,
            name="ck_xp_transaction_has_target",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int | None] = mapped_column(
        ForeignKey("players.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    cohort_id: Mapped[int | None] = mapped_column(
        ForeignKey("cohorts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    transaction_type: Mapped[XPTransactionType] = mapped_column(
        Enum(
            XPTransactionType,
            name="xp_transaction_type",
            native_enum=False,
        ),
        nullable=False,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    source_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    source_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    metadata_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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

    player: Mapped["Player | None"] = relationship(
        "Player",
    )

    cohort: Mapped["Cohort | None"] = relationship(
        "Cohort",
    )

    created_by: Mapped["User | None"] = relationship(
        "User",
    )
