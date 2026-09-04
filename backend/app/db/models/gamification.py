from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


# ============================================================================
# ENUMS
# ============================================================================


class XPSourceType(str, Enum):
    ATTENDANCE = "attendance"
    BEHAVIOUR_BASELINE = "behaviour_baseline"
    PROCESSING_CHAT = "processing_chat"
    GAME_PARTICIPATION = "game_participation"
    CHALLENGE = "challenge"
    CHALLENGE_BONUS = "challenge_bonus"
    CIVIC_ACTION = "civic_action"
    SKILL_TREE = "skill_tree"
    BADGE = "badge"
    LOOT_WHEEL = "loot_wheel"
    COMMUNITY_AWARD = "community_award"
    RESTORATIVE_ACTION = "restorative_action"
    MANUAL = "manual"
    PENALTY = "penalty"
    GROUP_PENALTY = "group_penalty"
    MULTIPLIER = "multiplier"
    SYSTEM = "system"


class XPTransactionStatus(str, Enum):
    POSTED = "posted"
    VOIDED = "voided"


class RewardType(str, Enum):
    VOUCHER = "voucher"
    PHYSICAL = "physical"
    DIGITAL = "digital"
    GROUP = "group"
    FOOD = "food"
    COSMETIC = "cosmetic"


class RewardClaimStatus(str, Enum):
    ELIGIBLE = "eligible"
    PENDING = "pending"
    APPROVED = "approved"
    FULFILLED = "fulfilled"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class SkillTreeStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BadgeTier(str, Enum):
    IRON = "iron"
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD_PRESTIGE = "gold_prestige"


# ============================================================================
# INDIVIDUAL XP LEDGER
# ============================================================================


class XPTransaction(Base):
    """
    Immutable-style individual XP ledger entry.

    NEVER update the amount of an existing posted transaction.

    If an award was wrong:
        original transaction
                    ↓
             reversal transaction

    This gives us an auditable financial-ledger-like history.
    """

    __tablename__ = "xp_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
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

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    source_type: Mapped[XPSourceType] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    source_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[XPTransactionStatus] = mapped_column(
        String(32),
        nullable=False,
        default=XPTransactionStatus.POSTED,
        index=True,
    )

    # Who caused/approved this transaction.
    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # If this transaction reverses another transaction.
    reversal_of_id: Mapped[int | None] = mapped_column(
        ForeignKey("xp_transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    player: Mapped["Player"] = relationship(
        foreign_keys=[player_id],
    )

    group: Mapped["Group | None"] = relationship(
        foreign_keys=[group_id],
    )

    created_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[created_by_user_id],
    )

    reversal_of: Mapped["XPTransaction | None"] = relationship(
        remote_side=[id],
        foreign_keys=[reversal_of_id],
    )

    __table_args__ = (
        Index(
            "ix_xp_transactions_player_created",
            "player_id",
            "created_at",
        ),
        Index(
            "ix_xp_transactions_programme_source",
            "programme_id",
            "source_type",
            "created_at",
        ),
    )


# ============================================================================
# GROUP / JACKPOT XP LEDGER
# ============================================================================


class GroupXPTransaction(Base):
    """
    Collective programme/group XP ledger.

    This is deliberately separate from XPTransaction.

    An individual penalty therefore does NOT automatically reduce the
    collective jackpot.

    Only a GroupXPTransaction can change the collective jackpot.
    """

    __tablename__ = "group_xp_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    source_type: Mapped[XPSourceType] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    source_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[XPTransactionStatus] = mapped_column(
        String(32),
        nullable=False,
        default=XPTransactionStatus.POSTED,
        index=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    reversal_of_id: Mapped[int | None] = mapped_column(
        ForeignKey("group_xp_transactions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    group: Mapped["Group | None"] = relationship(
        foreign_keys=[group_id],
    )

    created_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[created_by_user_id],
    )

    reversal_of: Mapped["GroupXPTransaction | None"] = relationship(
        remote_side=[id],
        foreign_keys=[reversal_of_id],
    )

    __table_args__ = (
        Index(
            "ix_group_xp_transactions_programme_created",
            "programme_id",
            "created_at",
        ),
    )


# ============================================================================
# SKILL TREES
# ============================================================================


class SkillTree(Base):
    """
    Definition of a skill-tree type.

    Example:
        Cooking
        Fitness
        SVQ progression
        Communication
    """

    __tablename__ = "skill_trees"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
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

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    configuration: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    milestones: Mapped[list["SkillMilestone"]] = relationship(
        back_populates="skill_tree",
        cascade="all, delete-orphan",
        order_by="SkillMilestone.display_order",
    )

    player_trees: Mapped[list["PlayerSkillTree"]] = relationship(
        back_populates="skill_tree",
    )


class SkillMilestone(Base):
    """
    One milestone in a skill tree.

    The PRD currently proposes:
        15k → £5
        40k → £10
        75k → £20

    Those values belong in configuration/data rather than hard-coded
    application logic.
    """

    __tablename__ = "skill_milestones"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    skill_tree_id: Mapped[int] = mapped_column(
        ForeignKey("skill_trees.id", ondelete="CASCADE"),
        nullable=False,
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

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    required_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reward_type: Mapped[RewardType | None] = mapped_column(
        String(32),
        nullable=True,
    )

    reward_value: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    cosmetic_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    badge_id: Mapped[int | None] = mapped_column(
        ForeignKey("badges.id", ondelete="SET NULL"),
        nullable=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    skill_tree: Mapped["SkillTree"] = relationship(
        back_populates="milestones",
    )

    badge: Mapped["Badge | None"] = relationship()

    __table_args__ = (
        UniqueConstraint(
            "skill_tree_id",
            "display_order",
            name="uq_skill_milestone_order",
        ),
    )


class PlayerSkillTree(Base):
    """
    An actual skill-tree journey assigned to a player.

    Completion of this object does NOT delete it.

    The history is retained so staff can see previous achievements.
    """

    __tablename__ = "player_skill_trees"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    skill_tree_id: Mapped[int] = mapped_column(
        ForeignKey("skill_trees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    cycle_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    goal_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[SkillTreeStatus] = mapped_column(
        String(32),
        nullable=False,
        default=SkillTreeStatus.ACTIVE,
        index=True,
    )

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_milestone_id: Mapped[int | None] = mapped_column(
        ForeignKey("skill_milestones.id", ondelete="SET NULL"),
        nullable=True,
    )

    assigned_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    player: Mapped["Player"] = relationship()

    skill_tree: Mapped["SkillTree"] = relationship(
        back_populates="player_trees",
    )

    current_milestone: Mapped["SkillMilestone | None"] = relationship()

    assigned_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[assigned_by_user_id],
    )

    __table_args__ = (
        UniqueConstraint(
            "player_id",
            "cycle_number",
            name="uq_player_skill_tree_cycle",
        ),
    )


# ============================================================================
# BADGES
# ============================================================================


class Badge(Base):
    """
    Badge definition.

    Badge progression is independent from lifetime XP.
    """

    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    tier: Mapped[BadgeTier] = mapped_column(
        String(32),
        nullable=False,
    )

    icon_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    profile_frame_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    xp_award: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    group_xp_award: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "name",
            name="uq_badge_programme_name",
        ),
    )


class PlayerBadge(Base):
    """
    Historical record of a badge earned by a player.
    """

    __tablename__ = "player_badges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    badge_id: Mapped[int] = mapped_column(
        ForeignKey("badges.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    skill_tree_id: Mapped[int | None] = mapped_column(
        ForeignKey("player_skill_trees.id", ondelete="SET NULL"),
        nullable=True,
    )

    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    player: Mapped["Player"] = relationship()

    badge: Mapped["Badge"] = relationship()

    skill_tree: Mapped["PlayerSkillTree | None"] = relationship()

    __table_args__ = (
        UniqueConstraint(
            "player_id",
            "badge_id",
            "skill_tree_id",
            name="uq_player_badge_tree",
        ),
    )


# ============================================================================
# REWARDS
# ============================================================================


class Reward(Base):
    """
    Reward definition.

    Examples:
        £5 Love2shop
        £10 Love2shop
        physical mystery prize
        group milestone prize
    """

    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
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
        String(32),
        nullable=False,
    )

    monetary_value: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # The XP threshold that makes this reward eligible.
    lifetime_xp_threshold: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    group_xp_threshold: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Restrict reward to a specific skill-tree milestone if required.
    skill_milestone_id: Mapped[int | None] = mapped_column(
        ForeignKey("skill_milestones.id", ondelete="SET NULL"),
        nullable=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    requires_staff_approval: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # For one-time rewards.
    maximum_claims: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    skill_milestone: Mapped["SkillMilestone | None"] = relationship()

    claims: Mapped[list["RewardClaim"]] = relationship(
        back_populates="reward",
    )

    __table_args__ = (
        Index(
            "ix_rewards_programme_threshold",
            "programme_id",
            "lifetime_xp_threshold",
        ),
    )


class RewardClaim(Base):
    """
    State machine for an individual reward.

    A reward cannot simply be calculated from XP every time, otherwise
    the same reward could be issued repeatedly.
    """

    __tablename__ = "reward_claims"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    reward_id: Mapped[int] = mapped_column(
        ForeignKey("rewards.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int | None] = mapped_column(
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    status: Mapped[RewardClaimStatus] = mapped_column(
        String(32),
        nullable=False,
        default=RewardClaimStatus.ELIGIBLE,
        index=True,
    )

    eligible_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    fulfilled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    fulfilled_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    fulfilment_reference: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    reward: Mapped["Reward"] = relationship(
        back_populates="claims",
    )

    player: Mapped["Player | None"] = relationship()

    group: Mapped["Group | None"] = relationship()

    approved_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[approved_by_user_id],
    )

    fulfilled_by_user: Mapped["User | None"] = relationship(
        foreign_keys=[fulfilled_by_user_id],
    )

    __table_args__ = (
        Index(
            "ix_reward_claims_player_status",
            "player_id",
            "status",
        ),
        Index(
            "ix_reward_claims_group_status",
            "group_id",
            "status",
        ),
    )
