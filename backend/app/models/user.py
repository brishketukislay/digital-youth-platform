from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


if TYPE_CHECKING:
    from app.models.player import Player


def utc_now() -> datetime:
    """
    Return a timezone-aware UTC datetime.

    All persisted application timestamps should be stored in UTC.
    """
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    """
    Application-level roles.

    A user account is deliberately separate from a player profile.

    This allows:
        - youth participants
        - youth workers
        - programme administrators
        - system administrators

    to share authentication infrastructure without exposing staff concepts
    to the public player-facing application.
    """

    PLAYER = "player"
    YOUTH_WORKER = "youth_worker"
    PROGRAMME_ADMIN = "programme_admin"
    SYSTEM_ADMIN = "system_admin"


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    PENDING = "pending"
    ARCHIVED = "archived"


class User(Base):
    """
    Authenticated application identity.

    IMPORTANT:
    ----------------
    This table does not contain a player's public gamertag/avatar.

    Authentication identity and public game identity are intentionally
    separated so that the public leaderboard never needs access to a
    participant's real identity.

    In production, sensitive identity data should be kept to the absolute
    minimum required by the programme's approved safeguarding/data-protection
    model.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ------------------------------------------------------------------
    # Authentication identity
    # ------------------------------------------------------------------

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(
            UserRole,
            name="user_role",
            native_enum=False,
        ),
        nullable=False,
        default=UserRole.PLAYER,
        index=True,
    )

    status: Mapped[AccountStatus] = mapped_column(
        Enum(
            AccountStatus,
            name="account_status",
            native_enum=False,
        ),
        nullable=False,
        default=AccountStatus.PENDING,
        index=True,
    )

    # ------------------------------------------------------------------
    # Operational metadata
    # ------------------------------------------------------------------

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    disabled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Safeguarding / operational flags
    # ------------------------------------------------------------------

    """
    These are intentionally coarse operational flags.

    They should NOT become a dumping ground for sensitive safeguarding
    information. Detailed safeguarding records belong in the appropriate
    restricted system/process rather than the game database.
    """

    requires_staff_attention: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    staff_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    player_profile: Mapped["Player | None"] = relationship(
        "Player",
        back_populates="user",
        uselist=False,
    )

    # ------------------------------------------------------------------
    # Domain helpers
    # ------------------------------------------------------------------

    @property
    def is_active(self) -> bool:
        return self.status == AccountStatus.ACTIVE

    @property
    def is_staff(self) -> bool:
        return self.role in {
            UserRole.YOUTH_WORKER,
            UserRole.PROGRAMME_ADMIN,
            UserRole.SYSTEM_ADMIN,
        }

    @property
    def can_manage_programme(self) -> bool:
        return self.role in {
            UserRole.PROGRAMME_ADMIN,
            UserRole.SYSTEM_ADMIN,
        }

    @property
    def can_manage_system(self) -> bool:
        return self.role == UserRole.SYSTEM_ADMIN

    def disable(self) -> None:
        """
        Disable the account without deleting historical records.

        We should never hard-delete a user merely because access has been
        revoked. Historical XP/reward/audit records need referential
        integrity.
        """

        self.status = AccountStatus.DISABLED
        self.disabled_at = utc_now()

    def activate(self) -> None:
        self.status = AccountStatus.ACTIVE
        self.disabled_at = None

    def mark_login(self) -> None:
        self.last_login_at = utc_now()
