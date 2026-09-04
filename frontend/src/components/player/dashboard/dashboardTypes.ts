import type {
  CSSProperties,
} from "react";

import type {
  Challenge,
  PlayerBadge,
  PlayerDashboardData,
  SkillMilestone,
  SkillTree,
} from "../../../api/client";

export type {
  Challenge,
  PlayerBadge,
  PlayerDashboardData,
  SkillMilestone,
  SkillTree,
};

/**
 * CSS custom properties used by the player dashboard theme.
 *
 * Keeping these here means every dashboard component can use
 * the same theme contract without inventing its own variables.
 */
export type DashboardThemeStyle =
  CSSProperties & {
    "--player-primary"?: string;
    "--player-secondary"?: string;
    "--player-accent"?: string;
    "--player-background"?: string;
    "--player-surface"?: string;
    "--player-text"?: string;
    "--player-muted"?: string;
    "--player-border"?: string;
    "--player-success"?: string;
    "--player-warning"?: string;
    "--player-danger"?: string;
  };

/**
 * Generic dashboard state.
 */
export type DashboardStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

/**
 * Mystery reward milestone.
 *
 * The actual reward should remain hidden from the player until
 * the backend confirms that the milestone has been unlocked.
 */
export type MysteryMilestone = {
  id?: string | number;
  xp: number;
  label: string;

  unlocked?: boolean;
  claimed?: boolean;

  /**
   * Do not populate this for locked rewards.
   */
  rewardLabel?: string;
};

/**
 * Skill-tree milestone state used by the player UI.
 */
export type SkillMilestoneState =
  | "completed"
  | "current"
  | "locked";

/**
 * Shared dashboard section props.
 */
export type DashboardSectionProps = {
  data: PlayerDashboardData;
};

/**
 * Standard progress-bar props.
 */
export type DashboardProgressProps = {
  current: number;
  target: number;
  label?: string;
  colour?: string;
};

/**
 * Activity categories shown in the recent-activity feed.
 */
export type DashboardActivityType =
  | "xp"
  | "attendance"
  | "skill"
  | "badge"
  | "challenge"
  | "civic"
  | "reward"
  | "penalty"
  | "group"
  | "system";

/**
 * Player activity/event.
 *
 * The backend can eventually expose this as a first-class
 * event/transaction model. Keeping it typed here means the
 * dashboard components don't need to know the database shape.
 */
export type DashboardActivity = {
  id: string | number;

  type:
    | DashboardActivityType
    | string;

  title: string;

  description?: string | null;

  /**
   * Positive = earned XP.
   * Negative = deducted XP.
   */
  xp?: number;

  created_at?: string | null;
  occurred_at?: string | null;
  timestamp?: string | null;

  status?: string | null;

  icon?: string | null;
};

/**
 * Resource library item.
 */
export type DashboardResource = {
  id: string | number;

  title: string;

  description?: string | null;

  type?: string | null;

  category?: string | null;

  url?: string | null;
  href?: string | null;

  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;

  duration?: string | null;

  duration_minutes?: number | null;
  durationMinutes?: number | null;

  phase_id?: string | number | null;
  phaseId?: string | number | null;

  phase_name?: string | null;
  phaseName?: string | null;

  unlocked?: boolean;
  is_unlocked?: boolean;
  isUnlocked?: boolean;

  completed?: boolean;
  is_completed?: boolean;
  isCompleted?: boolean;

  progress?: number;

  icon?: string | null;
};

/**
 * Normalised player mystery reward used by UI components.
 */
export type DashboardMysteryReward = {
  id: string;

  name: string;

  thresholdXP: number;

  unlocked: boolean;

  claimed: boolean;

  icon?: string;

  colour?: string;

  /**
   * Null while locked.
   */
  rewardLabel?: string | null;
};

/**
 * Current programme phase.
 *
 * The generated API type may evolve independently, so the
 * dashboard accepts the common fields it needs.
 */
export type DashboardPhase = {
  id?: string | number;

  name?: string;

  title?: string;

  description?: string | null;

  theme?: string | null;

  colour?: string | null;

  map_location?: string | null;

  mapLocation?: string | null;

  starts_at?: string | null;
  startsAt?: string | null;

  ends_at?: string | null;
  endsAt?: string | null;
};

/**
 * Player identity presented publicly.
 *
 * Never add real name, email, phone number, address or photograph
 * fields to this type. The player-facing/public model must remain
 * anonymous by design.
 */
export type PlayerPublicIdentity = {
  gamertag: string;

  avatar?: string | null;

  avatarUrl?: string | null;

  level?: number;

  frame?: string | null;
};

/**
 * Individual skill-tree progression.
 */
export type DashboardSkillTreeProgress = {
  id?: string | number;

  title?: string;

  name?: string;

  description?: string | null;

  current_xp?: number;
  currentXP?: number;

  target_xp?: number;
  targetXP?: number;

  progress?: number;

  completed?: boolean;

  current_milestone?: number;
  currentMilestone?: number;

  milestones?: Array<
    SkillMilestone & {
      state?: SkillMilestoneState;
    }
  >;
};

/**
 * Group progression shown on the player dashboard.
 *
 * This is deliberately separate from individual XP.
 */
export type DashboardGroupProgress = {
  current_xp?: number;
  currentXP?: number;

  target_xp?: number;
  targetXP?: number;

  progress?: number;

  milestone?: string | null;

  next_milestone_xp?: number | null;
  nextMilestoneXP?: number | null;

  status?: string | null;
};

/**
 * Player dashboard-specific data extensions.
 *
 * The backend-generated PlayerDashboardData remains the source
 * of truth. These fields allow the frontend to safely consume
 * newly introduced dashboard features while the API client is
 * being regenerated/evolved.
 */
export type PlayerDashboardViewData =
  PlayerDashboardData & {
    /**
     * Lifetime XP is never reset when a skill tree resets.
     */
    lifetime_xp?: number;
    lifetimeXP?: number;

    total_xp?: number;
    totalXP?: number;

    xp?: number;

    /**
     * Current individual skill tree.
     */
    current_skill_tree?: DashboardSkillTreeProgress;
    currentSkillTree?: DashboardSkillTreeProgress;

    skill_tree?: DashboardSkillTreeProgress;
    skillTree?: DashboardSkillTreeProgress;

    /**
     * Player's anonymous public identity.
     */
    player?: PlayerPublicIdentity;

    identity?: PlayerPublicIdentity;

    /**
     * Current programme phase.
     */
    current_phase?: DashboardPhase | string | number | null;
    currentPhase?:
      | DashboardPhase
      | string
      | number
      | null;

    /**
     * Group/jackpot progress.
     */
    group_progress?: DashboardGroupProgress;
    groupProgress?: DashboardGroupProgress;

    group_xp?: number;
    groupXP?: number;

    group_target_xp?: number;
    groupTargetXP?: number;

    /**
     * Recent events.
     */
    recent_activity?: DashboardActivity[];
    recentActivity?: DashboardActivity[];

    activities?: DashboardActivity[];

    activity?: DashboardActivity[];

    /**
     * Mystery reward milestones.
     */
    mystery_rewards?: DashboardMysteryReward[];
    mysteryRewards?: DashboardMysteryReward[];

    mystery_prizes?: DashboardMysteryReward[];
    mysteryPrizes?: DashboardMysteryReward[];

    /**
     * Phase-aware resource library.
     */
    resources?: DashboardResource[];

    resource_library?: DashboardResource[];
    resourceLibrary?: DashboardResource[];

    /**
     * Challenges currently available to the player.
     */
    active_challenges?: Challenge[];
    activeChallenges?: Challenge[];

    /**
     * Player badges.
     */
    badges?: PlayerBadge[];

    player_badges?: PlayerBadge[];
    playerBadges?: PlayerBadge[];

    /**
     * Optional dashboard-level completion counters.
     */
    completed_challenges?: number;
    completedChallenges?: number;

    completed_resources?: number;
    completedResources?: number;

    /**
     * Session/check-in state.
     */
    checked_in?: boolean;
    checkedIn?: boolean;

    attendance_streak?: number;
    attendanceStreak?: number;

    /**
     * Optional dashboard notifications.
     *
     * These should contain anonymous gameplay information only.
     */
    notifications?: DashboardNotification[];
  };

/**
 * Dashboard notification.
 */
export type DashboardNotification = {
  id: string | number;

  type?:
    | "achievement"
    | "challenge"
    | "reward"
    | "phase"
    | "system"
    | string;

  title: string;

  message?: string | null;

  created_at?: string | null;
  createdAt?: string | null;

  read?: boolean;
};

/**
 * Props for components that operate directly on the
 * dashboard's normalised view model.
 */
export type DashboardViewProps = {
  data: PlayerDashboardViewData;
};

/**
 * Generic async operation state used by interactive dashboard
 * controls such as check-in, challenge submission and reward
 * claiming.
 */
export type DashboardActionState =
  | "idle"
  | "submitting"
  | "success"
  | "error";

/**
 * Result returned by an interactive dashboard action.
 */
export type DashboardActionResult = {
  success: boolean;

  message?: string;

  error?: string;
};