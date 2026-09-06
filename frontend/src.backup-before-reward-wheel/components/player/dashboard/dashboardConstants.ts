/**
 * Player dashboard configuration.
 *
 * Keep gameplay/economy values here rather than scattering
 * magic numbers throughout React components.
 */

/**
 * Collective programme jackpot target from the PRD.
 */
export const DEFAULT_GROUP_TARGET_XP = 1_500_000;

/**
 * Mystery reward thresholds are based on lifetime individual XP.
 *
 * The rewards themselves are intentionally not encoded here because
 * the actual physical rewards should remain configurable by admins.
 */
export const MYSTERY_MILESTONES = [
  {
    key: "early-hook",
    label: "Early Hook",
    xp: 15_000,
  },
  {
    key: "midway",
    label: "Midway",
    xp: 45_000,
  },
  {
    key: "legendary",
    label: "Legendary",
    xp: 85_000,
  },
] as const;

/**
 * Skill-tree reward milestones from the PRD.
 *
 * These are UI defaults only. The backend/admin configuration should
 * remain authoritative if these values become configurable.
 */
export const DEFAULT_SKILL_TREE_THRESHOLDS = [
  {
    tier: 1,
    label: "Tier 1",
    xp: 15_000,
    voucherValue: 5,
  },
  {
    tier: 2,
    label: "Tier 2",
    xp: 40_000,
    voucherValue: 10,
  },
  {
    tier: 3,
    label: "Tier 3",
    xp: 75_000,
    voucherValue: 20,
  },
] as const;

/**
 * Long-term badge progression.
 */
export const BADGE_TIERS = [
  {
    tier: 1,
    name: "Iron",
    xpReward: 1_000,
    frame: "bronze",
  },
  {
    tier: 2,
    name: "Bronze",
    xpReward: 1_500,
    frame: "silver",
  },
  {
    tier: 3,
    name: "Silver",
    xpReward: 2_000,
    frame: "gold",
  },
  {
    tier: 4,
    name: "Gold Prestige",
    xpReward: 2_500,
    frame: "prestige",
    groupSurgeXP: 5_000,
  },
] as const;

/**
 * Time-bound challenge defaults.
 */
export const CHALLENGE_REWARDS = {
  participation: {
    individualXP: 300,
    groupXP: 300,
  },

  elite: {
    individualXP: 1_500,
    groupXP: 1_500,
  },

  winner: {
    individualXP: 3_000,
    groupXP: 5_000,
  },
} as const;

/**
 * Attendance scan defaults.
 */
export const ATTENDANCE_XP = {
  standard: 500,
  multiplier: 750,
} as const;

/**
 * Behaviour baseline from the PRD.
 */
export const BEHAVIOUR_BASELINE_XP = 1_000;

/**
 * Processing/reflection chat reward.
 */
export const PROCESSING_CHAT_XP = 1_200;

/**
 * Friday/time-bound participation baseline.
 */
export const TIME_BOUND_BASELINE_XP = 300;

/**
 * Community civic-action reward.
 */
export const COMMUNITY_NOMINATION_XP = 5_000;

/**
 * Skill-tree group surge.
 */
export const SKILL_TREE_GROUP_SURGE_XP = 5_000;

/**
 * Loot wheel average reward.
 */
export const LOOT_WHEEL_AVERAGE_XP = 3_500;

/**
 * Digital bystander lab group surge.
 */
export const BYSTANDER_LAB_GROUP_SURGE_XP = 10_000;

/**
 * Maximum individual/group exceptional penalty from the
 * current programme design.
 */
export const EXCEPTIONAL_GROUP_LOSS = {
  minimumXP: 25_000,
  maximumXP: 50_000,
  maximumPercentageOfTarget: 0.1,
} as const;

/**
 * Individual conduct penalties.
 */
export const CONDUCT_PENALTIES = {
  tier1: -300,
  tier2: -1_500,
  tier2RestorativeReturn: 750,
} as const;

/**
 * Engagement multipliers.
 *
 * These should be displayed as informational/gameplay state.
 * Do not perform XP calculations inside presentation components.
 */
export const ENGAGEMENT_MULTIPLIERS = {
  attendance: 1.5,
  behaviour: 1.2,
  endurance: 2,
  disengagedPlayer: 1.2,
} as const;

/**
 * Avatar fallback.
 *
 * The backend should remain authoritative for actual avatar assets.
 * These are merely safe presentation fallbacks.
 */
export const DEFAULT_AVATAR = "⭐";

/**
 * Legacy/simple avatar identifiers.
 *
 * Keep this deliberately small. Once the admin avatar catalogue is
 * available, components should use the configured avatar asset instead.
 */
export const FALLBACK_AVATARS: Record<string, string> = {
  "avatar-1": "🦊",
  "avatar-2": "🐼",
  "avatar-3": "🐸",
  "avatar-4": "🐯",
  "avatar-5": "🐺",
  "avatar-6": "🤖",
  "avatar-7": "👾",
  "avatar-8": "🐙",
  "avatar-9": "🦉",
  "avatar-10": "🐻",
  "avatar-11": "🐨",
  "avatar-12": "🦁",
};

/**
 * Dashboard refresh interval.
 *
 * The public/group progress is described as real-time in the PRD.
 * Polling is a safe frontend fallback until websocket/SSE support
 * is introduced.
 */
export const DASHBOARD_REFRESH_INTERVAL_MS =
  30_000;

/**
 * Countdown refresh interval.
 */
export const CHALLENGE_TIMER_INTERVAL_MS =
  1_000;

/**
 * Browser notification defaults.
 */
export const NOTIFICATION_DEFAULTS = {
  enabledByDefault: false,
  requireExplicitPermission: true,
} as const;