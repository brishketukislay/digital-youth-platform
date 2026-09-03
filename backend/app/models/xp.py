from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    ForeignKey,
    Index,
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


class XPTransactionType(str, enum.Enum):
    """
    Direction of an XP ledger transaction.

    AWARD:
        Positive XP.

    DEDUCTION:
        Negative XP applied to a player's current balance.

    GROUP_DEDUCTION:
        Exceptional collective penalty applied to the programme pool.

    REVERSAL:
        A compensating transaction that reverses a previous transaction.

    ADJUSTMENT:
        Controlled administrative correction. This should be rare and
        always require an audit record.
    """

    AWARD = "award"
    DEDUCTION = "deduction"
    GROUP_DEDUCTION = "group_deduction"
    REVERSAL = "reversal"
    ADJUSTMENT = "adjustment"


class XPSourceType(str, enum.Enum):
    """
    Business reason for an XP transaction.

    Keeping source types explicit means analytics can later answer things
    such as:

        How much XP came from civic action?
        How much came from attendance?
        How much came from weekend challenges?
        How many deductions were behavioural?

    without parsing free-form descriptions.
    """

    ATTENDANCE = "attendance"
    BEHAVIOUR = "behaviour"
    PROCESSING_CHAT = "processing_chat"
    GAME_PARTICIPATION = "game_participation"

    CIVIC_ACTION = "civic_action"
    COMMUNITY_AWARD = "community_award"

    SKILL_TREE = "skill_tree"
    BADGE = "badge"

    LOOT_WHEEL = "loot_wheel"

    TIME_BOUND_CHALLENGE = "time_bound_challenge"
    CHALLENGE_BONUS = "challenge_bonus"

    DIGITAL_BYSTANDER = "digital_bystander"

    MULTIPLIER = "multiplier"

    GROUP_SURGE = "group_surge"
    GROUP_DEDUCTION = "group_deduction"

    BEHAVIOUR_PENALTY = "behaviour_penalty"
    RESTORATIVE_ACTION = "restorative_action"

    ADMIN_ADJUSTMENT = "admin_adjustment"
    REVERSAL = "reversal"


class XPSubjectType(str, enum.Enum):
    """
    What balance an XP transaction affects.
    """

    PLAYER = "player"
    PROGRAMME = "programme"


class XPTransactionStatus(str, enum.Enum):
    POSTED = "posted"
    REVERSED = "reversed"


class XPTransaction(Base):
    """
    Immutable XP ledger entry.

    This table is the authoritative record of XP movement.

    IMPORTANT:
    -----------
    Do not update or delete posted transactions.

    If an award was wrong:

        original +5,000
                    ↓
              compensating -5,000

    This preserves an auditable history.

    The Player.current_xp and Programme.group_xp_balance fields are
    denormalised projections maintained by the XP service.
    """

    __tablename__ = "xp_transactions"

    __table_args__ = (
        # Idempotency is critical because mobile clients can retry requests
        # due to poor connectivity.
        UniqueConstraint(
            "idempotency_key",
            name="uq_xp_transaction_idempotency_key",
        ),

        Index(
            "ix_xp_player_created_at",
            "player_id",
            "created_at",
        ),

        Index(
            "ix_xp_programme_created_at",
            "programme_id",
            "created_at",
        ),

        Index(
            "ix_xp_source_created_at",
            "source_type",
            "created_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ------------------------------------------------------------------
    # Scope
    # ------------------------------------------------------------------

    programme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "programmes.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    player_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "players.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    # ------------------------------------------------------------------
    # Transaction semantics
    # ------------------------------------------------------------------

    subject_type: Mapped[XPSubjectType] = mapped_column(
        Enum(
            XPSubjectType,
            name="xp_subject_type",
            native_enum=False,
        ),
        nullable=False,
    )

    transaction_type: Mapped[XPTransactionType] = mapped_column(
        Enum(
            XPTransactionType,
            name="xp_transaction_type",
            native_enum=False,
        ),
        nullable=False,
    )

    source_type: Mapped[XPSourceType] = mapped_column(
        Enum(
            XPSourceType,
            name="xp_source_type",
            native_enum=False,
        ),
        nullable=False,
        index=True,
    )

    """
    Signed XP amount.

    Examples:

        +500
        +5000
        -300
        -1500
        -25000

    A positive amount increases the relevant balance.
    A negative amount decreases it.
    """

    amount: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    # ------------------------------------------------------------------
    # Idempotency / external references
    # ------------------------------------------------------------------

    """
    A UUID/string supplied or generated by the service for every logical
    XP operation.

    This prevents:

        mobile retry
        browser double click
        network retry
        duplicate webhook
        repeated staff action

    from creating duplicate XP.
    """

    idempotency_key: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    """
    Optional reference to the domain event which caused the XP.

    Examples:

        attendance:<session_id>:<player_id>
        challenge:<challenge_id>:<player_id>
        civic_award:<award_id>
        skill_tree:<milestone_id>
    """

    reference_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    reference_id: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Reversal relationship
    # ------------------------------------------------------------------

    reversed_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "xp_transactions.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    status: Mapped[XPTransactionStatus] = mapped_column(
        Enum(
            XPTransactionStatus,
            name="xp_transaction_status",
            native_enum=False,
        ),
        nullable=False,
        default=XPTransactionStatus.POSTED,
        index=True,
    )

    # ------------------------------------------------------------------
    # Human-readable audit context
    # ------------------------------------------------------------------

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    """
    Structured metadata.

    Examples:

        {
            "multiplier": 1.5,
            "base_amount": 500,
            "streak": 3
        }

        {
            "challenge_rank": 1,
            "score": 98.7
        }

    This is for context, not core relational data.
    """

    metadata_json: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Audit identity
    # ------------------------------------------------------------------

    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        index=True,
    )

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    programme: Mapped["Programme"] = relationship(
        "Programme",
    )

    player: Mapped["Player | None"] = relationship(
        "Player",
    )

    created_by: Mapped["User | None"] = relationship(
        "User",
    )

    reversed_transaction: Mapped["XPTransaction | None"] = relationship(
        "XPTransaction",
        remote_side=[id],
    )

    # ------------------------------------------------------------------
    # Domain helpers
    # ------------------------------------------------------------------

    @property
    def is_positive(self) -> bool:
        return self.amount > 0

    @property
    def is_negative(self) -> bool:
        return self.amount < 0

    @property
    def absolute_amount(self) -> int:
        return abs(self.amount)

    @property
    def is_player_transaction(self) -> bool:
        return self.subject_type == XPSubjectType.PLAYER

    @property
    def is_programme_transaction(self) -> bool:
        return self.subject_type == XPSubjectType.PROGRAMME
