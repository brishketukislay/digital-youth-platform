from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    Float,
    ForeignKey,
    Text,
    UniqueConstraint,
)

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime)


class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)

    start_date = Column(Date)
    end_date = Column(Date)

    target_xp = Column(Integer, default=1500000)

    active = Column(Boolean, default=True)

    theme_id = Column(Integer, ForeignKey("themes.id"))
    map_id = Column(Integer, ForeignKey("maps.id"))


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True)

    name = Column(String(100), nullable=False)

    primary = Column(String(20), default="#18775B")
    secondary = Column(String(20), default="#0F513C")
    accent = Column(String(20), default="#43B98B")

    background = Column(String(20), default="#F3F7F5")
    surface = Column(String(20), default="#FFFFFF")
    text = Column(String(20), default="#17221E")


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True)

    name = Column(String(200), nullable=False)

    description = Column(Text)

    background_image = Column(String(500))

    active = Column(Boolean, default=True)


class MapLocation(Base):
    __tablename__ = "map_locations"

    id = Column(Integer, primary_key=True)

    map_id = Column(
        Integer,
        ForeignKey("maps.id"),
        nullable=False,
    )

    name = Column(String(200), nullable=False)

    description = Column(Text)

    # Coordinates are percentages from 0-1.
    # This keeps the map responsive on phones,
    # tablets and the large youth-work-room display.
    x = Column(Float, default=0.5)
    y = Column(Float, default=0.5)

    icon = Column(String(50), default="pin")

    active = Column(Boolean, default=True)


class Phase(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True)

    programme_id = Column(
        Integer,
        ForeignKey("programmes.id"),
        nullable=False,
    )

    name = Column(String(200), nullable=False)

    description = Column(Text)

    icon = Column(String(50), default="star")

    colour = Column(String(20), default="#18775B")

    start_date = Column(Date)
    end_date = Column(Date)

    sort_order = Column(Integer, default=0)

    active = Column(Boolean, default=True)


class PhaseLocation(Base):
    __tablename__ = "phase_locations"

    id = Column(Integer, primary_key=True)

    phase_id = Column(
        Integer,
        ForeignKey("phases.id"),
        nullable=False,
    )

    location_id = Column(
        Integer,
        ForeignKey("map_locations.id"),
        nullable=False,
    )

    is_primary = Column(Boolean, default=False)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)

    programme_id = Column(
        Integer,
        ForeignKey("programmes.id"),
    )

    name = Column(String(100), nullable=False)

    active = Column(Boolean, default=True)


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    group_id = Column(
        Integer,
        ForeignKey("groups.id"),
    )

    gamertag = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    # Fixed avatar ID, e.g. avatar-01.
    avatar = Column(
        String(100),
        default="avatar-01",
    )

    active = Column(Boolean, default=True)


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(Integer, primary_key=True)

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
    )

    amount = Column(Integer, nullable=False)

    group_amount = Column(Integer, default=0)

    type = Column(String(100), nullable=False)

    reason = Column(String(500))

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


class PointRule(Base):
    __tablename__ = "point_rules"

    id = Column(Integer, primary_key=True)

    name = Column(
        String(100),
        nullable=False,
    )

    code = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    individual_xp = Column(
        Integer,
        default=0,
    )

    group_xp = Column(
        Integer,
        default=0,
    )

    enabled = Column(
        Boolean,
        default=True,
    )


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True)

    group_id = Column(
        Integer,
        ForeignKey("groups.id"),
    )

    code = Column(
        String(6),
        nullable=False,
        index=True,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    active = Column(
        Boolean,
        default=True,
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
    )


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True)

    session_id = Column(
        Integer,
        ForeignKey("attendance_sessions.id"),
    )

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
    )

    checked_in_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    xp_awarded = Column(
        Integer,
        default=500,
    )

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "player_id",
        ),
    )


class SkillTree(Base):
    __tablename__ = "skill_trees"

    id = Column(Integer, primary_key=True)

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
    )

    name = Column(
        String(200),
        nullable=False,
    )

    description = Column(Text)

    active = Column(
        Boolean,
        default=True,
    )

    current_xp = Column(
        Integer,
        default=0,
    )


class SkillMilestone(Base):
    __tablename__ = "skill_milestones"

    id = Column(Integer, primary_key=True)

    skill_tree_id = Column(
        Integer,
        ForeignKey("skill_trees.id"),
    )

    name = Column(
        String(200),
        nullable=False,
    )

    required_xp = Column(
        Integer,
        nullable=False,
    )

    reward_description = Column(
        String(500),
    )

    completed = Column(
        Boolean,
        default=False,
    )


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
    )

    name = Column(
        String(100),
        nullable=False,
    )

    description = Column(Text)

    colour = Column(
        String(20),
        default="#CD7F32",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True)

    name = Column(
        String(200),
        nullable=False,
    )

    description = Column(Text)

    xp_threshold = Column(Integer)

    reward_type = Column(
        String(50),
        default="individual",
    )

    value = Column(
        Float,
        default=0,
    )

    active = Column(
        Boolean,
        default=True,
    )


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True)

    phase_id = Column(
        Integer,
        ForeignKey("phases.id"),
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(Text)

    start_at = Column(DateTime)

    end_at = Column(DateTime)

    participation_xp = Column(
        Integer,
        default=300,
    )

    elite_xp = Column(
        Integer,
        default=1500,
    )

    winner_xp = Column(
        Integer,
        default=3000,
    )

    group_xp = Column(
        Integer,
        default=5000,
    )

    active = Column(
        Boolean,
        default=True,
    )


class CommunityAward(Base):
    __tablename__ = "community_awards"

    id = Column(Integer, primary_key=True)

    player_id = Column(
        Integer,
        ForeignKey("players.id"),
    )

    group_id = Column(
        Integer,
        ForeignKey("groups.id"),
    )

    category = Column(
        String(100),
    )

    description = Column(Text)

    # These fields are staff-only.
    submitted_by_name = Column(
        String(200),
    )

    submitted_by_contact = Column(
        String(300),
    )

    status = Column(
        String(30),
        default="pending",
    )

    xp = Column(
        Integer,
        default=5000,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
    )


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True)

    phase_id = Column(
        Integer,
        ForeignKey("phases.id"),
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(Text)

    resource_type = Column(
        String(50),
        default="link",
    )

    url = Column(
        String(1000),
    )

    active = Column(
        Boolean,
        default=True,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
    )

    action = Column(
        String(200),
        nullable=False,
    )

    details = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )