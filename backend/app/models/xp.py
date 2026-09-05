# from __future__ import annotations

# import enum
# from datetime import datetime

# from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from .base import Base


# class XPAccountScope(str, enum.Enum):
#     PLAYER = "player"
#     GROUP = "group"
#     COHORT = "cohort"


# class XPSourceType(str, enum.Enum):
#     ATTENDANCE = "attendance"
#     BEHAVIOUR = "behaviour"
#     REFLECTION = "reflection"
#     ACTIVITY = "activity"
#     CHALLENGE = "challenge"
#     CIVIC_ACTION = "civic_action"
#     KUDOS = "kudos"
#     SKILL_MILESTONE = "skill_milestone"
#     BADGE = "badge"
#     REWARD = "reward"
#     STAFF_AWARD = "staff_award"
#     PENALTY = "penalty"
#     GROUP_PENALTY = "group_penalty"
#     MULTIPLIER = "multiplier"
#     SYSTEM = "system"


# class XPTransaction(Base):
#     __tablename__ = "xp_transactions"

#     id: Mapped[int] = mapped_column(
#         Integer,
#         primary_key=True,
#     )

#     scope: Mapped[XPAccountScope] = mapped_column(
#         Enum(
#             XPAccountScope,
#             name="xp_account_scope",
#             native_enum=False,
#         ),
#         nullable=False,
#         index=True,
#     )

#     player_id: Mapped[int | None] = mapped_column(
#         ForeignKey("players.id", ondelete="SET NULL"),
#         nullable=True,
#         index=True,
#     )

#     group_id: Mapped[int | None] = mapped_column(
#         ForeignKey("groups.id", ondelete="SET NULL"),
#         nullable=True,
#         index=True,
#     )

#     cohort_id: Mapped[int | None] = mapped_column(
#         ForeignKey("cohorts.id", ondelete="SET NULL"),
#         nullable=True,
#         index=True,
#     )

#     source_type: Mapped[XPSourceType] = mapped_column(
#         Enum(
#             XPSourceType,
#             name="xp_source_type",
#             native_enum=False,
#         ),
#         nullable=False,
#         index=True,
#     )

#     # ID of the domain object that caused this transaction.
#     source_id: Mapped[int | None] = mapped_column(
#         Integer,
#         nullable=True,
#         index=True,
#     )

#     # Positive = award.
#     # Negative = deduction.
#     amount: Mapped[int] = mapped_column(
#         Integer,
#         nullable=False,
#     )

#     # Stable idempotency key.
#     #
#     # Services should provide this for externally-triggered or
#     # automatically generated awards so retries cannot double-award XP.
#     idempotency_key: Mapped[str | None] = mapped_column(
#         String(200),
#         nullable=True,
#         unique=True,
#         index=True,
#     )

#     reason: Mapped[str | None] = mapped_column(
#         String(500),
#         nullable=True,
#     )

#     created_by_user_id: Mapped[int | None] = mapped_column(
#         ForeignKey("users.id", ondelete="SET NULL"),
#         nullable=True,
#         index=True,
#     )

#     created_at: Mapped[datetime] = mapped_column(
#         DateTime,
#         nullable=False,
#         default=datetime.utcnow,
#         index=True,
#     )

#     player: Mapped["Player | None"] = relationship(
#         "Player",
#     )

#     group: Mapped["Group | None"] = relationship(
#         "Group",
#     )

#     cohort: Mapped["Cohort | None"] = relationship(
#         "Cohort",
#     )

#     created_by: Mapped["User | None"] = relationship(
#         "User",
#     )

from __future__ import annotations

import enum


class XPAccountScope(str, enum.Enum):
    PLAYER = "player"
    GROUP = "group"
    COHORT = "cohort"


class XPSourceType(str, enum.Enum):
    ATTENDANCE = "attendance"
    BEHAVIOUR = "behaviour"
    REFLECTION = "reflection"
    ACTIVITY = "activity"
    CHALLENGE = "challenge"
    CIVIC_ACTION = "civic_action"
    KUDOS = "kudos"
    SKILL_MILESTONE = "skill_milestone"
    BADGE = "badge"
    REWARD = "reward"
    STAFF_AWARD = "staff_award"
    PENALTY = "penalty"
    GROUP_PENALTY = "group_penalty"
    MULTIPLIER = "multiplier"
    SYSTEM = "system"
