import type {
  PlayerDashboardData,
  SkillMilestone,
} from "./dashboardTypes";

import {
  AVATAR_MAP,
  DEFAULT_AVATAR,
} from "./dashboardConstants";

export function formatXP(
  value: number | null | undefined,
): string {
  return Math.max(
    0,
    value ?? 0,
  ).toLocaleString();
}

export function clampPercentage(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  );
}

export function percentage(
  current: number,
  target: number,
): number {
  if (
    !target ||
    target <= 0
  ) {
    return 0;
  }

  return clampPercentage(
    (Math.max(0, current) / target) *
      100,
  );
}

export function getNextThreshold(
  current: number,
  thresholds: readonly number[],
): number | null {
  return (
    thresholds.find(
      threshold =>
        current < threshold,
    ) ?? null
  );
}

export function getAvatar(
  avatar?: string | null,
): string {
  return (
    AVATAR_MAP[
      avatar ?? ""
    ] ?? DEFAULT_AVATAR
  );
}

export function getCompletedMilestones(
  milestones: SkillMilestone[],
): number {
  return milestones.filter(
    milestone =>
      milestone.completed,
  ).length;
}

export function getMilestonePercentage(
  milestones: SkillMilestone[],
): number {
  if (!milestones.length) {
    return 0;
  }

  return clampPercentage(
    (getCompletedMilestones(
      milestones,
    ) /
      milestones.length) *
      100,
  );
}

export function getCurrentPhaseColour(
  data: PlayerDashboardData,
): string {
  return (
    data.phase?.colour ||
    data.theme?.primary ||
    "#22c55e"
  );
}

export function getRemainingXP(
  current: number,
  target: number,
): number {
  return Math.max(
    0,
    target - current,
  );
}

export function isMysteryUnlocked(
  currentXP: number,
  threshold: number,
): boolean {
  return currentXP >= threshold;
}