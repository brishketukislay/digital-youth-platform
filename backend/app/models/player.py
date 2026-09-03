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
    from app.models.group import GroupMembership
    from app.models.programme import Programme
    from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PlayerStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"
    ARCHIVED = "archived"


class PublicVisibility(str, enum.Enum):
    """
    Controls whether the player's anonymous game identity can appear
    on public-facing surfaces.

    This is intentionally separate from PlayerStatus.

    A player can therefore remain an active participant while their
    public profile is temporarily hidden.
    """

    VISIBLE = "visible"
    HIDDEN = "hidden"


class Player(Base):
    """
    Anonymous game identity for a programme participant.

    Identity separation:

        User
            Authentication/account identity

        Player
            Anonymous game identity used by the game

    Public surfaces should only expose Player information.

    They must never expose:
        - real name
        - email address
        - telephone number
        - staff notes
        - authentication identity
        - internal safeguarding information
    """

    __tablename__ = "players"

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "gamertag",
            name="uq_player_programme_gamertag",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ------------------------------------------------------------------
    # Account / programme relationship
    # ------------------------------------------------------------------

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        unique=True,
        index=True,
    )

    programme_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "programmes.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # ------------------------------------------------------------------
    # Anonymous public game identity
    # ------------------------------------------------------------------

    gamertag: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        index=True,
    )

    avatar_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="default",
    )

    """
    Flexible avatar configuration.

    Example:

        {
            "body": "runner_02",
            "hair": "style_04",
            "colour": "#7C3AED",
            "frame": "bronze",
            "accessory": "hoodie"
        }

    The exact cosmetic catalogue should be application configuration/data,
    not hard-coded into this model.
    """

    avatar_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    public_visibility: Mapped[PublicVisibility] = mapped_column(
        Enum(
            PublicVisibility,
            name="public_visibility",
            native_enum=False,
        ),
        nullable=False,
        default=PublicVisibility.VISIBLE,
        index=True,
    )

    # ------------------------------------------------------------------
    # Player lifecycle
    # ------------------------------------------------------------------

    status: Mapped[PlayerStatus] = mapped_column(
        Enum(
            PlayerStatus,
            name="player_status",
            native_enum=False,
        ),
        nullable=False,
        default=PlayerStatus.ACTIVE,
        index=True,
    )

    # ------------------------------------------------------------------
    # XP / progression
    # ------------------------------------------------------------------

    """
    current_xp is the player's spendable/current progression balance.

    lifetime_xp is never reduced.

    The authoritative source of XP history will be the XP ledger.
    These values are denormalised projections used for fast dashboard
    and leaderboard reads.
    """

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    lifetime_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    """
    Amount of XP attributed to the player that has contributed to the
    collective programme pool.

    This is a reporting projection, not the authoritative ledger.
    """

    contributed_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    completed_skill_trees: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    profile_frame: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="default",
    )

    # ------------------------------------------------------------------
    # Engagement state
    # ------------------------------------------------------------------

    consecutive_attendance: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    consecutive_positive_sessions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    last_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Staff-only operational fields
    # ------------------------------------------------------------------

    requires_staff_attention: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    """
    Staff notes are never included in public/player serializers.

    In the final implementation, access to these fields should be
    restricted through the staff/admin service layer.
    """

    staff_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Audit metadata
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

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    user: Mapped["User"] = relationship(
        "User",
        back_populates="player_profile",
        uselist=False,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
        foreign_keys=[programme_id],
    )

    group_memberships: Mapped[list["GroupMembership"]] = relationship(
        "GroupMembership",
        back_populates="player",
        cascade="all, delete-orphan",
    )

    # ------------------------------------------------------------------
    # Public identity
    # ------------------------------------------------------------------

    @property
    def is_publicly_visible(self) -> bool:
        return (
            self.status == PlayerStatus.ACTIVE
            and self.public_visibility == PublicVisibility.VISIBLE
        )

    def public_identity(self) -> dict:
        """
        Return the only player representation suitable for public
        leaderboard/profile responses.

        Do not add private/account fields here.
        """

        return {
            "player_id": str(self.id),
            "gamertag": self.gamertag,
            "avatar_id": self.avatar_id,
            "avatar_config": self.avatar_config,
            "current_level": self.current_level,
            "profile_frame": self.profile_frame,
        }

    # ------------------------------------------------------------------
    # XP projection helpers
    # ------------------------------------------------------------------

    def apply_xp_award(self, amount: int) -> None:
        """
        Update denormalised XP balances after an authoritative XP
        transaction has been successfully created.

        The XP service, not API routes, should call this method.
        """

        if amount <= 0:
            raise ValueError(
                "XP award amount must be greater than zero."
            )

        self.current_xp += amount
        self.lifetime_xp += amount
        self.contributed_xp += amount
        self.last_activity_at = utc_now()

    def apply_xp_deduction(self, amount: int) -> int:
        """
        Deduct XP from the current balance.

        Lifetime XP is deliberately untouched.

        Returns the actual amount deducted. This prevents a player from
        having a negative current balance when a penalty exceeds their
        available XP.
        """

        if amount <= 0:
            raise ValueError(
                "XP deduction amount must be greater than zero."
            )

        actual_amount = min(
            amount,
            self.current_xp,
        )

        self.current_xp -= actual_amount

        return actual_amount

    # ------------------------------------------------------------------
    # Progression
    # ------------------------------------------------------------------

    def complete_skill_tree(self) -> None:
        """
        Record completion of a skill tree.

        Reward issuance, badge selection and XP ledger transactions
        belong to the service layer.
        """

        self.completed_skill_trees += 1

        self.current_level = max(
            self.current_level,
            self.completed_skill_trees + 1,
        )

        self.last_activity_at = utc_now()

    # ------------------------------------------------------------------
    # Attendance / engagement
    # ------------------------------------------------------------------

    def record_attendance(self) -> None:
        self.consecutive_attendance += 1
        self.last_activity_at = utc_now()

    def reset_attendance_streak(self) -> None:
        self.consecutive_attendance = 0

    def record_positive_session(self) -> None:
        self.consecutive_positive_sessions += 1
        self.last_activity_at = utc_now()

    def reset_positive_session_streak(self) -> None:
        self.consecutive_positive_sessions = 0

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def pause(self) -> None:
        self.status = PlayerStatus.PAUSED

    def activate(self) -> None:
        self.status = PlayerStatus.ACTIVE
        self.archived_at = None

    def withdraw(self) -> None:
        self.status = PlayerStatus.WITHDRAWN
        self.public_visibility = PublicVisibility.HIDDEN

    def archive(self) -> None:
        """
        Soft-archive the player.

        Historical XP, reward and audit records remain intact.
        """

        self.status = PlayerStatus.ARCHIVED
        self.public_visibility = PublicVisibility.HIDDEN
        self.archived_at = utc_now()
