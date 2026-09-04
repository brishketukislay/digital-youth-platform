export type PointRuleCalculation = {
  id: string;
  name: string;
  xpPerAward: number;
  awardsPerWeek: number;
  weeklyYield: number;
  enabled: boolean;
};

export type EconomyProjection = {
  weeklyYield: number;
  programmeWeeks: number;
  projectedXp: number;
  targetXp: number;
  bufferXp: number;
  bufferPercentage: number;
  progressPercentage: number;
  status: "behind" | "on-track" | "ahead";
};

export function calculateWeeklyYield(
  rules: PointRuleCalculation[],
): number {
  return rules
    .filter((rule) => rule.enabled)
    .reduce(
      (total, rule) =>
        total +
        Math.max(0, rule.xpPerAward) *
          Math.max(0, rule.awardsPerWeek),
      0,
    );
}

export function calculateProjection({
  weeklyYield,
  programmeWeeks,
  currentXp,
  targetXp,
}: {
  weeklyYield: number;
  programmeWeeks: number;
  currentXp: number;
  targetXp: number;
}): EconomyProjection {
  const safeWeeks = Math.max(0, programmeWeeks);
  const safeTarget = Math.max(0, targetXp);
  const projectedXp =
    Math.max(0, currentXp) +
    Math.max(0, weeklyYield) * safeWeeks;

  const bufferXp = projectedXp - safeTarget;

  const bufferPercentage =
    safeTarget > 0
      ? (bufferXp / safeTarget) * 100
      : 0;

  const progressPercentage =
    safeTarget > 0
      ? Math.min(
          100,
          (Math.max(0, currentXp) / safeTarget) * 100,
        )
      : 0;

  let status: EconomyProjection["status"];

  if (projectedXp < safeTarget) {
    status = "behind";
  } else if (projectedXp === safeTarget) {
    status = "on-track";
  } else {
    status = "ahead";
  }

  return {
    weeklyYield: Math.max(0, weeklyYield),
    programmeWeeks: safeWeeks,
    projectedXp,
    targetXp: safeTarget,
    bufferXp,
    bufferPercentage,
    progressPercentage,
    status,
  };
}

export function formatXp(value: number): string {
  return new Intl.NumberFormat("en-GB").format(
    Math.round(value),
  );
}

export function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}