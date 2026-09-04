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

export type DashboardThemeStyle =
  React.CSSProperties & {
    "--player-primary"?: string;
    "--player-secondary"?: string;
    "--player-accent"?: string;
    "--player-background"?: string;
    "--player-surface"?: string;
    "--player-text"?: string;
  };

export type MysteryMilestone = {
  xp: number;
  label: string;
};

export type SkillMilestoneState =
  | "completed"
  | "current"
  | "locked";

export type DashboardSectionProps = {
  data: PlayerDashboardData;
};

export type DashboardProgressProps = {
  current: number;
  target: number;
  label?: string;
  colour?: string;
};