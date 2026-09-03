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
    from app.models.user import User


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProgrammeStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class PhaseStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProgrammeTheme(str, enum.Enum):
    """
    Broad theme categories.

    This is deliberately not exhaustive. The actual theme displayed to
    participants is configurable through ProgrammePhase.theme_name.

    These values are useful for analytics and default UI behaviour.
    """

    ART = "art"
    CIVIC_SAFETY = "civic_safety"
    ROAD_SAFETY = "road_safety"
    SPORT = "sport"
    COMMUNITY = "community"
    DIGITAL = "digital"
    WELLBEING = "wellbeing"
    CUSTOM = "custom"


class MapLocationType(str, enum.Enum):
    AREA = "area"
    VENUE = "venue"
    LANDMARK = "landmark"
    ACTIVITY = "activity"
    HOTSPOT = "hotspot"
    MEETING_POINT = "meeting_point"
    CUSTOM = "custom"


class MapStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Programme(Base):
    """
    Top-level configuration for one delivery programme/pilot.

    Nothing in the application should assume that this is specifically
    the Cumbernauld programme.

    A future programme could therefore be:

        Cumbernauld Youth Platform
        Coatbridge Youth Platform
        another local authority
        another cohort
    """

    __tablename__ = "programmes"

    __table_args__ = (
        UniqueConstraint(
            "slug",
            name="uq_programme_slug",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(200),
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

    status: Mapped[ProgrammeStatus] = mapped_column(
        Enum(
            ProgrammeStatus,
            name="programme_status",
            native_enum=False,
        ),
        nullable=False,
        default=ProgrammeStatus.DRAFT,
        index=True,
    )

    # ------------------------------------------------------------------
    # Programme duration
    # ------------------------------------------------------------------

    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Collective XP target
    # ------------------------------------------------------------------

    jackpot_target_xp: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1_500_000,
    )

    """
    Denormalised current collective XP balance.

    The XP ledger remains authoritative.

    This field exists for fast dashboard/leaderboard reads and must only
    be changed by the XP service.
    """

    group_xp_balance: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ------------------------------------------------------------------
    # Public platform configuration
    # ------------------------------------------------------------------

    public_leaderboard_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    public_roster_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    public_social_sharing_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # ------------------------------------------------------------------
    # UI / branding
    # ------------------------------------------------------------------

    """
    Configurable application appearance.

    Example:

        {
            "primary": "#6D28D9",
            "secondary": "#06B6D4",
            "accent": "#F59E0B",
            "background": "#0F172A",
            "surface": "#1E293B",
            "text": "#F8FAFC",
            "success": "#22C55E",
            "danger": "#EF4444"
        }

    Frontend should consume this configuration rather than having
    programme colours hard-coded.
    """

    theme_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    """
    General frontend configuration.

    This allows administrators to control things such as:

        logo
        dashboard title
        welcome message
        leaderboard labels
        enabled modules
        notification behaviour
        cosmetic presentation

    It should not be used for security-sensitive configuration.
    """

    platform_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
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

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    phases: Mapped[list["ProgrammePhase"]] = relationship(
        "ProgrammePhase",
        back_populates="programme",
        cascade="all, delete-orphan",
        order_by="ProgrammePhase.sort_order",
    )

    maps: Mapped[list["ProgrammeMap"]] = relationship(
        "ProgrammeMap",
        back_populates="programme",
        cascade="all, delete-orphan",
        order_by="ProgrammeMap.sort_order",
    )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def activate(self) -> None:
        self.status = ProgrammeStatus.ACTIVE

    def pause(self) -> None:
        self.status = ProgrammeStatus.PAUSED

    def complete(self) -> None:
        self.status = ProgrammeStatus.COMPLETED

    def archive(self) -> None:
        self.status = ProgrammeStatus.ARCHIVED
        self.archived_at = utc_now()

    @property
    def progress_percentage(self) -> float:
        if self.jackpot_target_xp <= 0:
            return 0.0

        percentage = (
            self.group_xp_balance
            / self.jackpot_target_xp
        ) * 100

        return min(
            round(percentage, 2),
            100.0,
        )


class ProgrammePhase(Base):
    """
    One themed phase of a programme.

    Examples:

        Art
        Civic Safety
        Road Safety
        Sport

    Phases are configurable and can be reordered, scheduled, activated,
    completed or archived from the admin interface.
    """

    __tablename__ = "programme_phases"

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "slug",
            name="uq_phase_programme_slug",
        ),
        UniqueConstraint(
            "programme_id",
            "sort_order",
            name="uq_phase_programme_sort_order",
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

    theme: Mapped[ProgrammeTheme] = mapped_column(
        Enum(
            ProgrammeTheme,
            name="programme_theme",
            native_enum=False,
        ),
        nullable=False,
        default=ProgrammeTheme.CUSTOM,
    )

    """
    Display name controlled by the programme team.

    This means a youth-designed name such as "Look Out For Your Squad"
    can be displayed even when the internal theme is civic_safety.
    """

    theme_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[PhaseStatus] = mapped_column(
        Enum(
            PhaseStatus,
            name="phase_status",
            native_enum=False,
        ),
        nullable=False,
        default=PhaseStatus.DRAFT,
        index=True,
    )

    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    """
    Phase-specific styling.

    Example:

        {
            "primary": "#EC4899",
            "map_filter": "art",
            "background_asset": "phase-art-bg",
            "music": "phase-art-theme"
        }
    """

    theme_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    """
    Feature switches specific to this phase.

    Example:

        {
            "show_map": true,
            "show_skill_tree": true,
            "show_civic_awards": true,
            "show_bystander_lab": false,
            "show_flash_challenges": true
        }
    """

    feature_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    programme: Mapped["Programme"] = relationship(
        "Programme",
        back_populates="phases",
    )

    def activate(self) -> None:
        self.status = PhaseStatus.ACTIVE

    def complete(self) -> None:
        self.status = PhaseStatus.COMPLETED

    def archive(self) -> None:
        self.status = PhaseStatus.ARCHIVED


class ProgrammeMap(Base):
    """
    Configurable map for a programme.

    The platform does not assume the map represents Cumbernauld.

    A programme can have multiple maps and an administrator can choose
    which one is active.
    """

    __tablename__ = "programme_maps"

    __table_args__ = (
        UniqueConstraint(
            "programme_id",
            "slug",
            name="uq_map_programme_slug",
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

    status: Mapped[MapStatus] = mapped_column(
        Enum(
            MapStatus,
            name="map_status",
            native_enum=False,
        ),
        nullable=False,
        default=MapStatus.DRAFT,
        index=True,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ------------------------------------------------------------------
    # Map asset
    # ------------------------------------------------------------------

    """
    Reference to the map asset.

    This should point to object storage/CDN rather than storing large
    image/SVG files directly in the database.
    """

    asset_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    asset_key: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    """
    Optional map dimensions.

    Useful if frontend coordinates are based on an SVG/image canvas.
    """

    width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    """
    Additional rendering information.

    Example:

        {
            "projection": "flat",
            "background": "#111827",
            "default_zoom": 1.1
        }
    """

    map_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
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

    programme: Mapped["Programme"] = relationship(
        "Programme",
        back_populates="maps",
    )

    locations: Mapped[list["MapLocation"]] = relationship(
        "MapLocation",
        back_populates="map",
        cascade="all, delete-orphan",
        order_by="MapLocation.sort_order",
    )

    def activate(self) -> None:
        self.status = MapStatus.ACTIVE

    def archive(self) -> None:
        self.status = MapStatus.ARCHIVED


class MapLocation(Base):
    """
    A point/area displayed on a ProgrammeMap.

    Examples:

        Link Centre
        an underpass
        a youth hub
        a road safety hotspot
        a community venue

    Coordinates are relative to the map asset rather than geographic
    coordinates. This allows a stylised youth-designed map to be used.
    """

    __tablename__ = "map_locations"

    __table_args__ = (
        UniqueConstraint(
            "map_id",
            "slug",
            name="uq_map_location_slug",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    map_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "programme_maps.id",
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

    location_type: Mapped[MapLocationType] = mapped_column(
        Enum(
            MapLocationType,
            name="map_location_type",
            native_enum=False,
        ),
        nullable=False,
        default=MapLocationType.CUSTOM,
    )

    """
    Percentage-based coordinates.

    x = 0..100
    y = 0..100

    This makes locations responsive across device sizes and map assets.
    """

    x_position: Mapped[float] = mapped_column(
        nullable=False,
    )

    y_position: Mapped[float] = mapped_column(
        nullable=False,
    )

    icon_key: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    colour: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    """
    Controls whether the location should be visible to participants
    before it is unlocked by a phase or activity.
    """

    visible_by_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    """
    Flexible metadata for phase-specific behaviour.

    Example:

        {
            "phase_slugs": ["art"],
            "activity_ids": ["..."],
            "badge_key": "art-explorer"
        }
    """

    metadata_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
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

    map: Mapped["ProgrammeMap"] = relationship(
        "ProgrammeMap",
        back_populates="locations",
    )

    def validate_coordinates(self) -> None:
        if not 0 <= self.x_position <= 100:
            raise ValueError(
                "Map X position must be between 0 and 100."
            )

        if not 0 <= self.y_position <= 100:
            raise ValueError(
                "Map Y position must be between 0 and 100."
            )
