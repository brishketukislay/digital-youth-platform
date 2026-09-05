from __future__ import annotations

import enum

from app.db.models.core import XPTransaction


class XPTransactionType(str, enum.Enum):
    """
    Canonical transaction type values used by the application.

    The database stores transaction_type as VARCHAR, so keeping this enum
    here provides a stable public API without introducing a second ORM model.
    """

    ATTENDANCE = "attendance"
    BEHAVIOUR = "behaviour"
    REFLECTION = "reflection"
    ACTIVITY = "activity"
    CHALLENGE = "challenge"
    CIVIC_ACTION = "civic_action"
    COMMUNITY_AWARD = "community_award"

    SKILL_MILESTONE = "skill_milestone"
    BADGE = "badge"
    BONUS = "bonus"
    MULTIPLIER = "multiplier"

    PENALTY = "penalty"
    GROUP_PENALTY = "group_penalty"

    ADMIN_ADJUSTMENT = "admin_adjustment"
    SYSTEM = "system"


__all__ = [
    "XPTransaction",
    "XPTransactionType",
]
