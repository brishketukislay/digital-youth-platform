import type {
  DashboardActivity,
  DashboardGroupProgress,
  DashboardMysteryReward,
  DashboardMysteryRewardSource,
  DashboardPhase,
  DashboardResource,
  DashboardSkillTreeProgress,
  PlayerDashboardViewData,
} from "./dashboardTypes";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const XP_THRESHOLDS = {
  MYSTERY: {
    EARLY_HOOK: 15_000,
    MIDWAY: 45_000,
    LEGENDARY: 85_000,
  },

  SKILL_TREE: {
    TIER_1: 15_000,
    TIER_2: 40_000,
    TIER_3: 75_000,
  },

  GROUP: {
    TIER_1: 500_000,
    TIER_2: 1_000_000,
    TIER_3: 1_500_000,
  },
} as const;

export const PROGRAMME = {
  WEEKS: 24,
  TARGET_XP: 1_500_000,
  PLANNED_MAX_XP: 1_784_000,
} as const;

/* -------------------------------------------------------------------------- */
/* Number helpers                                                             */
/* -------------------------------------------------------------------------- */

export function toNumber(
  value: unknown,
  fallback = 0,
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

export function calculatePercentage(
  current: number,
  target: number,
): number {
  if (target <= 0) {
    return current > 0
      ? 100
      : 0;
  }

  return clamp(
    (current / target) * 100,
  );
}

export function calculateProgress(
  current: number,
  target: number,
): number {
  return Math.round(
    calculatePercentage(
      current,
      target,
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* XP formatting                                                              */
/* -------------------------------------------------------------------------- */

export function formatXP(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Math.max(
      0,
      Math.round(value),
    ),
  );
}

export function formatSignedXP(
  value: number,
): string {
  const rounded =
    Math.round(value);

  if (rounded > 0) {
    return `+${formatXP(
      rounded,
    )}`;
  }

  if (rounded < 0) {
    return `−${formatXP(
      Math.abs(rounded),
    )}`;
  }

  return "0";
}

export function formatCompactXP(
  value: number,
): string {
  const absolute =
    Math.abs(value);

  if (absolute >= 1_000_000) {
    return `${(
      value / 1_000_000
    )
      .toFixed(
        value % 1_000_000 === 0
          ? 0
          : 1,
      )}M`;
  }

  if (absolute >= 1_000) {
    return `${(
      value / 1_000
    )
      .toFixed(
        value % 1_000 === 0
          ? 0
          : 1,
      )}k`;
  }

  return formatXP(
    value,
  );
}

/* -------------------------------------------------------------------------- */
/* Lifetime XP                                                                */
/* -------------------------------------------------------------------------- */

export function getLifetimeXP(
  data: PlayerDashboardViewData,
): number {
  const candidates = [
    data.lifetime_xp,
    data.lifetimeXP,
    data.total_xp,
    data.totalXP,
    data.xp,
  ];

  for (const value of candidates) {
    if (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) {
      return Math.max(
        0,
        value,
      );
    }
  }

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Group XP                                                                   */
/* -------------------------------------------------------------------------- */

export function getGroupXP(
  data: PlayerDashboardViewData,
): number {
  const group =
    data.group_progress ??
    data.groupProgress;

  if (group) {
    const value =
      group.current_xp ??
      group.currentXP;

    if (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) {
      return Math.max(
        0,
        value,
      );
    }
  }

  const candidates = [
    data.group_xp,
    data.groupXP,
  ];

  for (const value of candidates) {
    if (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) {
      return Math.max(
        0,
        value,
      );
    }
  }

  return 0;
}

export function getGroupTargetXP(
  data: PlayerDashboardViewData,
): number {
  const group =
    data.group_progress ??
    data.groupProgress;

  if (group) {
    const value =
      group.target_xp ??
      group.targetXP;

    if (
      typeof value ===
        "number" &&
      value > 0
    ) {
      return value;
    }
  }

  const candidates = [
    data.group_target_xp,
    data.groupTargetXP,
  ];

  for (const value of candidates) {
    if (
      typeof value ===
        "number" &&
      value > 0
    ) {
      return value;
    }
  }

  return PROGRAMME.TARGET_XP;
}

export function getGroupProgress(
  data: PlayerDashboardViewData,
): number {
  return calculateProgress(
    getGroupXP(data),
    getGroupTargetXP(data),
  );
}

/* -------------------------------------------------------------------------- */
/* Group milestone calculations                                               */
/* -------------------------------------------------------------------------- */

export type GroupMilestone = {
  id: string;
  label: string;
  thresholdXP: number;
  reached: boolean;
  current: boolean;
};

export function getGroupMilestones(
  groupXP: number,
): GroupMilestone[] {
  const thresholds = [
    {
      id: "tier-1",
      label: "First milestone",
      thresholdXP:
        XP_THRESHOLDS.GROUP.TIER_1,
    },
    {
      id: "tier-2",
      label: "Mid milestone",
      thresholdXP:
        XP_THRESHOLDS.GROUP.TIER_2,
    },
    {
      id: "tier-3",
      label: "Grand jackpot",
      thresholdXP:
        XP_THRESHOLDS.GROUP.TIER_3,
    },
  ];

  const nextIndex =
    thresholds.findIndex(
      milestone =>
        groupXP <
        milestone.thresholdXP,
    );

  return thresholds.map(
    (
      milestone,
      index,
    ) => ({
      ...milestone,
      reached:
        groupXP >=
        milestone.thresholdXP,
      current:
        nextIndex === index,
    }),
  );
}

export function getNextGroupMilestone(
  groupXP: number,
): GroupMilestone | null {
  return (
    getGroupMilestones(
      groupXP,
    ).find(
      milestone =>
        !milestone.reached,
    ) ?? null
  );
}

export function getXPToGroupMilestone(
  groupXP: number,
  thresholdXP: number,
): number {
  return Math.max(
    0,
    thresholdXP -
      groupXP,
  );
}

/* -------------------------------------------------------------------------- */
/* Skill tree                                                                 */
/* -------------------------------------------------------------------------- */

export type SkillTier = {
  tier: 1 | 2 | 3;
  thresholdXP: number;
  label: string;
  rewardValue: number;
  reached: boolean;
};

export const SKILL_TIERS: SkillTier[] = [
  {
    tier: 1,
    thresholdXP:
      XP_THRESHOLDS.SKILL_TREE.TIER_1,
    label: "Tier 1",
    rewardValue: 5,
    reached: false,
  },
  {
    tier: 2,
    thresholdXP:
      XP_THRESHOLDS.SKILL_TREE.TIER_2,
    label: "Tier 2",
    rewardValue: 10,
    reached: false,
  },
  {
    tier: 3,
    thresholdXP:
      XP_THRESHOLDS.SKILL_TREE.TIER_3,
    label: "Tier 3",
    rewardValue: 20,
    reached: false,
  },
];

export function getSkillTree(
  data: PlayerDashboardViewData,
): DashboardSkillTreeProgress | null {
  return (
    data.current_skill_tree ??
    data.currentSkillTree ??
    data.skill_tree ??
    data.skillTree ??
    null
  );
}

export function getSkillTreeXP(
  data: PlayerDashboardViewData,
): number {
  const tree =
    getSkillTree(data);

  if (!tree) {
    return 0;
  }

  return Math.max(
    0,
    toNumber(
      tree.current_xp ??
        tree.currentXP,
    ),
  );
}

export function getSkillTreeTargetXP(
  data: PlayerDashboardViewData,
): number {
  const tree =
    getSkillTree(data);

  if (!tree) {
    return XP_THRESHOLDS.SKILL_TREE.TIER_3;
  }

  const target =
    tree.target_xp ??
    tree.targetXP;

  return target &&
    target > 0
    ? target
    : XP_THRESHOLDS.SKILL_TREE.TIER_3;
}

export function getSkillTreeProgress(
  data: PlayerDashboardViewData,
): number {
  const tree =
    getSkillTree(data);

  if (
    tree?.progress !==
    undefined
  ) {
    return clamp(
      toNumber(
        tree.progress,
      ),
    );
  }

  return calculateProgress(
    getSkillTreeXP(data),
    getSkillTreeTargetXP(data),
  );
}

export function getSkillTiers(
  skillXP: number,
): SkillTier[] {
  return SKILL_TIERS.map(
    tier => ({
      ...tier,
      reached:
        skillXP >=
        tier.thresholdXP,
    }),
  );
}

export function getCurrentSkillTier(
  skillXP: number,
): SkillTier | null {
  const tiers =
    getSkillTiers(
      skillXP,
    );

  return (
    [...tiers]
      .reverse()
      .find(
        tier =>
          tier.reached,
      ) ?? null
  );
}

export function getNextSkillTier(
  skillXP: number,
): SkillTier | null {
  return (
    getSkillTiers(
      skillXP,
    ).find(
      tier =>
        !tier.reached,
    ) ?? null
  );
}

export function getXPToSkillTier(
  skillXP: number,
  tier: SkillTier,
): number {
  return Math.max(
    0,
    tier.thresholdXP -
      skillXP,
  );
}

/* -------------------------------------------------------------------------- */
/* Mystery rewards                                                            */
/* -------------------------------------------------------------------------- */

export const MYSTERY_REWARD_DEFAULTS: DashboardMysteryReward[] =
  [
    {
      id: "early-hook",
      name: "Early Hook",
      thresholdXP:
        XP_THRESHOLDS.MYSTERY.EARLY_HOOK,
      unlocked: false,
      claimed: false,
      icon: "🎁",
      colour: "#38bdf8",
      rewardLabel: null,
    },
    {
      id: "midway",
      name: "Midway",
      thresholdXP:
        XP_THRESHOLDS.MYSTERY.MIDWAY,
      unlocked: false,
      claimed: false,
      icon: "✨",
      colour: "#a855f7",
      rewardLabel: null,
    },
    {
      id: "legendary",
      name: "Legendary",
      thresholdXP:
        XP_THRESHOLDS.MYSTERY.LEGENDARY,
      unlocked: false,
      claimed: false,
      icon: "👑",
      colour: "#f59e0b",
      rewardLabel: null,
    },
  ];

export function getMysteryRewards(
  data: PlayerDashboardViewData,
): DashboardMysteryReward[] {
  const source =
    data.mystery_rewards ??
    data.mysteryRewards ??
    data.mystery_prizes ??
    data.mysteryPrizes;

  if (
    !Array.isArray(source) ||
    source.length === 0
  ) {
    return MYSTERY_REWARD_DEFAULTS;
  }

  const rewards =
    source as DashboardMysteryRewardSource[];

  return rewards.map(
    (
      reward,
      index,
    ) => ({
      id: String(
        reward.id ??
          `mystery-${index}`,
      ),

      name:
        reward.name ??
        `Mystery ${index + 1}`,

      thresholdXP:
        toNumber(
          reward.thresholdXP,
        ),

      unlocked:
        Boolean(
          reward.unlocked,
        ),

      claimed:
        Boolean(
          reward.claimed,
        ),

      icon:
        reward.icon ??
        "🎁",

      colour:
        reward.colour ??
        "#38bdf8",

      rewardLabel:
        reward.rewardLabel ??
        null,
    }),
  );
}

export function getNextMysteryReward(
  lifetimeXP: number,
  rewards: DashboardMysteryReward[],
): DashboardMysteryReward | null {
  return (
    rewards.find(
      reward =>
        !reward.unlocked &&
        lifetimeXP <
          reward.thresholdXP,
    ) ?? null
  );
}

export function getMysteryRewardProgress(
  lifetimeXP: number,
  rewards: DashboardMysteryReward[],
  index: number,
): number {
  const reward =
    rewards[index];

  if (!reward) {
    return 0;
  }

  const previous =
    rewards[index - 1];

  const start =
    previous?.thresholdXP ??
    0;

  const range =
    reward.thresholdXP -
    start;

  if (range <= 0) {
    return lifetimeXP >=
      reward.thresholdXP
      ? 100
      : 0;
  }

  return clamp(
    ((lifetimeXP -
      start) /
      range) *
      100,
  );
}

/* -------------------------------------------------------------------------- */
/* Phase                                                                       */
/* -------------------------------------------------------------------------- */

export function getCurrentPhase(
  data: PlayerDashboardViewData,
): DashboardPhase | null {
  const phase =
    data.current_phase ??
    data.currentPhase;

  if (
    !phase ||
    typeof phase ===
      "string" ||
    typeof phase ===
      "number"
  ) {
    return null;
  }

  return phase;
}

export function getCurrentPhaseName(
  data: PlayerDashboardViewData,
): string | null {
  const phase =
    data.current_phase ??
    data.currentPhase;

  if (
    typeof phase ===
    "string"
  ) {
    return phase;
  }

  if (
    phase &&
    typeof phase ===
      "object"
  ) {
    return (
      phase.name ??
      phase.title ??
      null
    );
  }

  return null;
}

export function getCurrentPhaseId(
  data: PlayerDashboardViewData,
): string | null {
  const phase =
    data.current_phase ??
    data.currentPhase;

  if (
    typeof phase ===
      "string" ||
    typeof phase ===
      "number"
  ) {
    return String(
      phase,
    );
  }

  if (
    phase &&
    typeof phase ===
      "object" &&
    phase.id !==
      undefined
  ) {
    return String(
      phase.id,
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Resources                                                                   */
/* -------------------------------------------------------------------------- */

export function getResources(
  data: PlayerDashboardViewData,
): DashboardResource[] {
  const resources =
    data.resources ??
    data.resource_library ??
    data.resourceLibrary ??
    [];

  return Array.isArray(
    resources,
  )
    ? resources
    : [];
}

export function getPhaseResources(
  data: PlayerDashboardViewData,
): DashboardResource[] {
  const resources =
    getResources(data);

  const phaseId =
    getCurrentPhaseId(
      data,
    );

  const phaseName =
    getCurrentPhaseName(
      data,
    );

  if (
    !phaseId &&
    !phaseName
  ) {
    return resources;
  }

  const matched =
    resources.filter(
      resource => {
        if (
          phaseId &&
          resource.phaseId !==
            undefined &&
          String(
            resource.phaseId,
          ) === phaseId
        ) {
          return true;
        }

        if (
          phaseName &&
          resource.phaseName &&
          resource.phaseName.toLowerCase() ===
            phaseName.toLowerCase()
        ) {
          return true;
        }

        return false;
      },
    );

  return matched.length >
    0
    ? matched
    : resources;
}

/* -------------------------------------------------------------------------- */
/* Challenges                                                                  */
/* -------------------------------------------------------------------------- */

export function getActiveChallenges(
  data: PlayerDashboardViewData,
) {
  return (
    data.active_challenges ??
    data.activeChallenges ??
    []
  );
}

/* -------------------------------------------------------------------------- */
/* Activity                                                                    */
/* -------------------------------------------------------------------------- */

export function getRecentActivity(
  data: PlayerDashboardViewData,
): DashboardActivity[] {
  const activities =
    data.recent_activity ??
    data.recentActivity ??
    data.activities ??
    data.activity ??
    [];

  if (
    !Array.isArray(
      activities,
    )
  ) {
    return [];
  }

  return [
    ...activities,
  ].sort(
    (
      first,
      second,
    ) => {
      const firstDate =
        first.created_at ??
        first.occurred_at ??
        first.timestamp;

      const secondDate =
        second.created_at ??
        second.occurred_at ??
        second.timestamp;

      if (
        !firstDate ||
        !secondDate
      ) {
        return 0;
      }

      return (
        new Date(
          secondDate,
        ).getTime() -
        new Date(
          firstDate,
        ).getTime()
      );
    },
  );
}

export function getActivityXP(
  activity: DashboardActivity,
): number {
  return toNumber(
    activity.xp,
  );
}

export function getActivityXPTotal(
  activities: DashboardActivity[],
): number {
  return activities.reduce(
    (
      total,
      activity,
    ) =>
      total +
      getActivityXP(
        activity,
      ),
    0,
  );
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

export function formatRelativeDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  const difference =
    Math.max(
      0,
      Date.now() -
        date.getTime(),
    );

  const minute =
    60_000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (
    difference <
    minute
  ) {
    return "Just now";
  }

  if (
    difference <
    hour
  ) {
    return `${Math.floor(
      difference / minute,
    )}m ago`;
  }

  if (
    difference <
    day
  ) {
    return `${Math.floor(
      difference / hour,
    )}h ago`;
  }

  if (
    difference <
    7 * day
  ) {
    return `${Math.floor(
      difference / day,
    )}d ago`;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

/* -------------------------------------------------------------------------- */
/* Player level / badges                                                       */
/* -------------------------------------------------------------------------- */

export function getPlayerLevel(
  data: PlayerDashboardViewData,
): number {
  const player =
    data.player ??
    data.identity;

  return Math.max(
    1,
    Math.floor(
      toNumber(
        player?.level,
        1,
      ),
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Generic UI helpers                                                          */
/* -------------------------------------------------------------------------- */

export function getXPState(
  current: number,
  target: number,
): "complete" | "progress" | "starting" {
  if (
    current >= target
  ) {
    return "complete";
  }

  if (current > 0) {
    return "progress";
  }

  return "starting";
}

export function getProgressLabel(
  current: number,
  target: number,
): string {
  if (target <= 0) {
    return formatXP(
      current,
    );
  }

  return `${formatXP(
    current,
  )} / ${formatXP(
    target,
  )} XP`;
}

export function getRemainingXP(
  current: number,
  target: number,
): number {
  return Math.max(
    0,
    target -
      current,
  );
}
