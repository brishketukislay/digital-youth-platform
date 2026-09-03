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


class RewardScope(str, enum.Enum):
    PLAYER = "player"
    GROUP = "group"


class RewardType(str, enum.Enum):
    VOUCHER = "voucher"
    PHYSICAL = "physical"
    COSMETIC = "cosmetic"
    XP = "xp"
    CUSTOM = "custom"


class RewardStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class Reward(Base):
    """
    Configurable reward definition.

    This describes what a participant/cohort can receive.
    RewardClaim records whether it has actually been issued.
    """

    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reward_type: Mapped[RewardType] = mapped_column(
        Enum(
            RewardType,
            name="reward_type",
            native_enum=False,
        ),
        nullable=False,
    )

    scope: Mapped[RewardScope] = mapped_column(
        Enum(
            RewardScope,
            name="reward_scope",
            native_enum=False,
        ),
        nullable=False,
    )

    financial_value_pence: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    status: Mapped[RewardStatus] = mapped_column(
        Enum(
            RewardStatus,
            name="reward_status",
            native_enum=False,
        ),
        nullable=False,
        default=RewardStatus.ACTIVE,
        index=True,
    )

    # Allows the same reward definition to be used for multiple
    # milestone configurations where appropriate.
    repeatable: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
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

    milestones: Mapped[list["RewardMilestone"]] = relationship(
        "RewardMilestone",
        back_populates="reward",
        cascade="all, delete-orphan",
    )
