from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class XPTransaction(Base):
    """
    Immutable XP ledger entry.

    amount:
        Change to the individual player's XP.

    group_amount:
        Change to the collective group/programme XP pool.

    Existing transactions must never be edited to correct a balance.
    Create a compensating transaction instead.
    """

    __tablename__ = "xp_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int | None] = mapped_column(
        ForeignKey("players.id"),
        nullable=True,
        index=True,
    )

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id"),
        nullable=True,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    group_amount: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    transaction_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    reference_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    reference_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
    )

    player: Mapped["Player | None"] = relationship(
        "Player",
        back_populates="xp_transactions",
    )

    created_by_user: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[created_by],
    )

    __table_args__ = (
        CheckConstraint(
            "amount != 0 OR group_amount != 0",
            name="ck_xp_transaction_non_zero",
        ),
        UniqueConstraint(
            "reference_type",
            "reference_id",
            name="uq_xp_transaction_reference",
        ),
    )
