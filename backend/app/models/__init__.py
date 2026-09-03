"""
ORM domain models.
"""

from app.models.group import (
    GroupMembership,
    ProgrammeGroup,
)

from app.models.player import (
    Player,
    PlayerStatus,
    PublicVisibility,
)

from app.models.programme import (
    MapLocation,
    MapLocationType,
    MapStatus,
    PhaseStatus,
    Programme,
    ProgrammeMap,
    ProgrammePhase,
    ProgrammeStatus,
    ProgrammeTheme,
)

from app.models.progression import (
    Badge,
    BadgeTier,
    Cosmetic,
    CosmeticType,
    MilestoneStatus,
    PlayerBadge,
    PlayerCosmetic,
    PlayerSkillTree,
    PlayerSkillTreeMilestone,
    SkillDefinition,
    SkillTreeMilestone,
    SkillTreeStatus,
    SkillTreeTemplate,
)

from app.models.reward import (
    Reward,
    RewardClaim,
    RewardClaimStatus,
    RewardStatus,
    RewardType,
)

from app.models.user import (
    AccountStatus,
    User,
    UserRole,
)

from app.models.xp import (
    XPSourceType,
    XPSubjectType,
    XPTransaction,
    XPTransactionStatus,
    XPTransactionType,
)


__all__ = [
    "AccountStatus",

    "Badge",
    "BadgeTier",

    "Cosmetic",
    "CosmeticType",

    "GroupMembership",

    "MapLocation",
    "MapLocationType",
    "MapStatus",

    "MilestoneStatus",

    "PhaseStatus",

    "Player",
    "PlayerBadge",
    "PlayerCosmetic",
    "PlayerSkillTree",
    "PlayerSkillTreeMilestone",
    "PlayerStatus",

    "Programme",
    "ProgrammeGroup",
    "ProgrammeMap",
    "ProgrammePhase",
    "ProgrammeStatus",
    "ProgrammeTheme",

    "PublicVisibility",

    "Reward",
    "RewardClaim",
    "RewardClaimStatus",
    "RewardStatus",
    "RewardType",

    "SkillDefinition",
    "SkillTreeMilestone",
    "SkillTreeStatus",
    "SkillTreeTemplate",

    "User",
    "UserRole",

    "XPSourceType",
    "XPSubjectType",
    "XPTransaction",
    "XPTransactionStatus",
    "XPTransactionType",
]
