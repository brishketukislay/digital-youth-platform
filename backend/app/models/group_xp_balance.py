from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class GroupXPBalance(Base):
    """
    Programme-wide collective jackpot balance.

    This deliberately belongs to the programme rather than a cohort.
    Multiple youth-work groups can therefore contribute to one jackpot.
    """

    __tablename__ = "group_xp_balances"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_xp_awarded: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_xp_removed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
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
