from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ============================================================
# BASE
# ============================================================


class Base(DeclarativeBase):
    pass


# ============================================================
# ENUMS
# ============================================================


class ChallengeAttemptStatus(str, Enum):
    CREATED = "created"
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ChallengeEvidenceType(str, Enum):
    NONE = "none"
    GAME_RESULT = "game_result"
    STAFF_VERIFICATION = "staff_verification"
    PHOTO = "photo"
    VIDEO = "video"
    QR = "qr"


# ============================================================
# USER
# ============================================================


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

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

    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="player",
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    player: Mapped["Player | None"] = relationship(
        back_populates="user",
        uselist=False,
    )


# ============================================================
# GROUP
# ============================================================


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    players: Mapped[list["Player"]] = relationship(
        back_populates="group",
    )


# ============================================================
# PLAYER
# ============================================================


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id"),
        nullable=True,
        index=True,
    )

    gamertag: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    avatar: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    lifetime_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    user: Mapped["User"] = relationship(
        back_populates="player",
    )

    group: Mapped["Group | None"] = relationship(
        back_populates="players",
    )

    challenge_attempts: Mapped[list["ChallengeAttempt"]] = relationship(
        back_populates="player",
    )

    xp_transactions: Mapped[list["XPTransaction"]] = relationship(
        back_populates="player",
    )


# ============================================================
# PHASE
# ============================================================


class Phase(Base):
    __tablename__ = "phases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    theme_key: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    map_config: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    challenges: Mapped[list["Challenge"]] = relationship(
        back_populates="phase",
    )


# ============================================================
# CHALLENGE
# ============================================================


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    phase_id: Mapped[int | None] = mapped_column(
        ForeignKey("phases.id"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    game_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="generic",
    )

    scoring_direction: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="higher",
    )

    start_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    end_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    participation_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=300,
    )

    elite_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1500,
    )

    winner_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3000,
    )

    group_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5000,
    )

    max_attempts_per_player: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=5,
    )

    elite_percentile: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=90.0,
    )

    requires_verification: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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

    phase: Mapped["Phase | None"] = relationship(
        back_populates="challenges",
    )

    attempts: Mapped[list["ChallengeAttempt"]] = relationship(
        back_populates="challenge",
    )


# ============================================================
# CHALLENGE ATTEMPT
# ============================================================


class ChallengeAttempt(Base):
    """
    Immutable-ish record of a player's participation in a challenge.

    This is the authoritative record for:

    - what challenge was played
    - who played it
    - when they played
    - what score was submitted
    - whether evidence exists
    - whether staff verification is required
    - what XP was ultimately awarded
    """

    __tablename__ = "challenge_attempts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id"),
        nullable=False,
        index=True,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id"),
        nullable=False,
        index=True,
    )

    attempt_reference: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=ChallengeAttemptStatus.CREATED.value,
        index=True,
    )

    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    percentile: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    elite: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    winner: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    participation_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    elite_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    winner_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    individual_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    group_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    evidence_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        default=ChallengeEvidenceType.NONE.value,
    )

    evidence_payload: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    client_metadata: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    verified_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    challenge: Mapped["Challenge"] = relationship(
        back_populates="attempts",
    )

    player: Mapped["Player"] = relationship(
        back_populates="challenge_attempts",
    )

    __table_args__ = (
        UniqueConstraint(
            "challenge_id",
            "player_id",
            "attempt_reference",
            name="uq_challenge_player_attempt_reference",
        ),
    )


# ============================================================
# XP TRANSACTION
# ============================================================


class XPTransaction(Base):
    """
    Append-only XP ledger.

    Player balances should be derived/maintained from this ledger,
    rather than individual routers modifying XP arbitrarily.
    """

    __tablename__ = "xp_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
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
    group: Mapped["Group | None"] = relationship(
        "Group",
    )


    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    group_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    reference: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    player: Mapped["Player | None"] = relationship(
        back_populates="xp_transactions",
    )
