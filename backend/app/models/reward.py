from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


if TYPE_CHECKING:
    from app.models.player import Player
    from app.models.programme import Programme
    from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RewardType(str, enum.Enum):
    """
    Physical/digital reward categories.

    GIFT_CARD:
        Used for the structured skill-tree rewards.

    PHYSICAL:
        Used for mystery prizes, food items, merchandise, etc.

    GROUP_PRIZE:
        Collective programme milestone reward.

    COSMETIC:
        Digital-only reward.

    XP:
        Rare reward where a reward grants additional XP.
    """

    GIFT_CARD = "gift_card"
    PHYSICAL = "physical"
    GROUP_PRIZE = "group_prize"
    COSMETIC = "cosmetic"
    XP = "xp"


class RewardStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DISABLED = "disabled"
    RETIRED = "retired"


class RewardClaimStatus(str, enum.Enum):
    ELIGIBLE = "eligible"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ISSUED = "issued"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class Reward(Base):
    """
    Configurable reward definition.

    Rewards are data rather than hard-coded business logic.

    An administrator can therefore configure:

        15,000 XP -> £5 reward
        40,000 XP -> £10 reward
        75,000 XP -> £20 reward

    without changing application code.

    The exact financial value is deliberately stored as integer pence.
    """

    __tablename__ = "rewards"

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "slug",
            name="uq_reward_programme_slug",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    programme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "programmes.id",
            ondelete="CASCADE",
        ),
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

    reward_type: Mapped[RewardType] = mapped_column(
        Enum(
            RewardType,
            name="reward_type",
            native_enum=False,
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[RewardStatus] = mapped_column(
        Enum(
            RewardStatus,
            name="reward_status",
            native_enum=False,
        ),
        nullable=False,
        default=RewardStatus.DRAFT,
        index=True,
    )

    # ------------------------------------------------------------------
    # Reward value
    # ------------------------------------------------------------------

    """
    Monetary value stored in pence.

    Example:

        £5.00  -> 500
        £10.00 -> 1000
        £20.00 -> 2000

    This avoids floating-point financial calculations.
    """

    monetary_value_pence: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Eligibility
    # ------------------------------------------------------------------

    required_lifetime_xp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    required_current_xp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    required_skill_tree_tier: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    required_completed_skill_trees: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    required_group_xp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Claim behaviour
    # ------------------------------------------------------------------

    """
    Whether this reward may only be claimed once by a player.

    This is important for milestone rewards.
    """

    one_time_per_player: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    """
    Whether staff approval is required before the reward can be issued.

    Physical and financial rewards should normally require approval.
    """

    requires_staff_approval: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ------------------------------------------------------------------
    # Display
    # ------------------------------------------------------------------

    icon_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    cosmetic_config: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Audit
    # ------------------------------------------------------------------

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
    )

    claims: Mapped[list["RewardClaim"]] = relationship(
        "RewardClaim",
        back_populates="reward",
        cascade="all, delete-orphan",
    )


class RewardClaim(Base):
    """
    A player's entitlement/claim against a configured reward.

    This is separate from Reward because the same reward definition can
    apply to many players.

    The claim lifecycle provides an audit trail:

        ELIGIBLE
            ↓
        PENDING_APPROVAL
            ↓
        APPROVED
            ↓
        ISSUED
    """

    __tablename__ = "reward_claims"

    __table_args__ = (
        UniqueConstraint(
            "reward_id",
            "player_id",
            name="uq_reward_player_claim",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    reward_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "rewards.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    player_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "players.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[RewardClaimStatus] = mapped_column(
        Enum(
            RewardClaimStatus,
            name="reward_claim_status",
            native_enum=False,
        ),
        nullable=False,
        default=RewardClaimStatus.ELIGIBLE,
        index=True,
    )

    # XP at the exact moment eligibility was established.

    qualifying_xp: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    approved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    issued_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    """
    External voucher/reference information.

    This should never contain the voucher itself in plaintext if the
    provider supplies sensitive redemption credentials.
    """

    fulfilment_reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    staff_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    reward: Mapped["Reward"] = relationship(
        "Reward",
        back_populates="claims",
    )

    player: Mapped["Player"] = relationship(
        "Player",
    )

    approved_by: Mapped["User | None"] = relationship(
        "User",
    )

    def approve(self, user_id: uuid.UUID) -> None:
        self.status = RewardClaimStatus.APPROVED
        self.approved_by_user_id = user_id
        self.approved_at = utc_now()

    def issue(self, fulfilment_reference: str | None = None) -> None:
        self.status = RewardClaimStatus.ISSUED
        self.issued_at = utc_now()

        if fulfilment_reference:
            self.fulfilment_reference = fulfilment_reference

    def decline(self, note: str | None = None) -> None:
        self.status = RewardClaimStatus.DECLINED

        if note:
            self.staff_note = note
