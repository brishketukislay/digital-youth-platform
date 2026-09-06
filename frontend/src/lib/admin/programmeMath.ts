export type PointRuleCalculation = {
  id: string;
  name: string;

  individualXpPerAward: number;
  groupXpPerAward: number;

  awardsPerWeek: number;
  weeklyCap: number | null;

  individualWeeklyYield: number;
  groupWeeklyYield: number;

  enabled: boolean;
};

export type EconomyProjection = {
  individualWeeklyYield: number;
  groupWeeklyYield: number;

  programmeWeeks: number;

  projectedGroupXp: number;

  targetXp: number;

  bufferXp: number;
  bufferPercentage: number;

  progressPercentage: number;

  weeklyTargetXp: number | null;

  weeklyVarianceXp: number | null;

  status: "behind" | "on-track" | "ahead";
};

export function calculateWeeklyYield(
  rules: PointRuleCalculation[],
): number {
  return rules
    .filter((rule) => rule.enabled)
    .reduce(
      (total, rule) =>
        total + rule.groupWeeklyYield,
      0,
    );
}

export function calculateIndividualWeeklyYield(
  rules: PointRuleCalculation[],
): number {
  return rules
    .filter((rule) => rule.enabled)
    .reduce(
      (total, rule) =>
        total + rule.individualWeeklyYield,
      0,
    );
}

function calculateRuleWeeklyYield(
  xpPerAward: number,
  awardsPerWeek: number,
  weeklyCap: number | null,
): number {
  const uncapped =
    Math.max(0, xpPerAward) *
    Math.max(0, awardsPerWeek);

  if (
    weeklyCap === null ||
    !Number.isFinite(weeklyCap) ||
    weeklyCap < 0
  ) {
    return uncapped;
  }

  return Math.min(
    uncapped,
    Math.max(0, weeklyCap),
  );
}

export function calculateProjection({
  individualWeeklyYield,
  groupWeeklyYield,
  programmeWeeks,
  currentGroupXp,
  targetXp,
  weeklyTargetXp,
}: {
  individualWeeklyYield: number;
  groupWeeklyYield: number;
  programmeWeeks: number;
  currentGroupXp: number;
  targetXp: number;
  weeklyTargetXp: number | null;
}): EconomyProjection {
  const safeWeeks = Math.max(
    0,
    Math.round(programmeWeeks),
  );

  const safeCurrentGroupXp = Math.max(
    0,
    currentGroupXp,
  );

  const safeTarget = Math.max(
    0,
    targetXp,
  );

  const safeGroupWeeklyYield = Math.max(
    0,
    groupWeeklyYield,
  );

  const projectedGroupXp =
    safeCurrentGroupXp +
    safeGroupWeeklyYield * safeWeeks;

  const bufferXp =
    projectedGroupXp - safeTarget;

  const bufferPercentage =
    safeTarget > 0
      ? (bufferXp / safeTarget) * 100
      : 0;

  const progressPercentage =
    safeTarget > 0
      ? Math.min(
          100,
          (safeCurrentGroupXp / safeTarget) * 100,
        )
      : 0;

  let status: EconomyProjection["status"];

  if (projectedGroupXp < safeTarget) {
    status = "behind";
  } else if (projectedGroupXp === safeTarget) {
    status = "on-track";
  } else {
    status = "ahead";
  }

  const safeWeeklyTarget =
    weeklyTargetXp === null
      ? null
      : Math.max(0, weeklyTargetXp);

  const weeklyVarianceXp =
    safeWeeklyTarget === null
      ? null
      : safeGroupWeeklyYield -
        safeWeeklyTarget;

  return {
    individualWeeklyYield:
      Math.max(0, individualWeeklyYield),

    groupWeeklyYield:
      safeGroupWeeklyYield,

    programmeWeeks:
      safeWeeks,

    projectedGroupXp,

    targetXp:
      safeTarget,

    bufferXp,

    bufferPercentage,

    progressPercentage,

    weeklyTargetXp:
      safeWeeklyTarget,

    weeklyVarianceXp,

    status,
  };
}

export function toPointRuleCalculation(
  rule: {
    id: number;
    name: string;
    individual_xp: number;
    group_xp: number;
    weekly_cap?: number | null;
    awards_per_week: number;
    enabled: boolean;
  },
): PointRuleCalculation {
  const individualXpPerAward =
    Math.max(
      0,
      Number(rule.individual_xp || 0),
    );

  const groupXpPerAward =
    Math.max(
      0,
      Number(rule.group_xp || 0),
    );

  const awardsPerWeek =
    Math.max(
      0,
      Number(rule.awards_per_week || 0),
    );

  const weeklyCap =
    rule.weekly_cap === null ||
    rule.weekly_cap === undefined
      ? null
      : Math.max(
          0,
          Number(rule.weekly_cap),
        );

  return {
    id: String(rule.id),
    name: rule.name,

    individualXpPerAward,
    groupXpPerAward,

    awardsPerWeek,
    weeklyCap,

    individualWeeklyYield:
      calculateRuleWeeklyYield(
        individualXpPerAward,
        awardsPerWeek,
        weeklyCap,
      ),

    groupWeeklyYield:
      calculateRuleWeeklyYield(
        groupXpPerAward,
        awardsPerWeek,
        weeklyCap,
      ),

    enabled:
      Boolean(rule.enabled),
  };
}

export function formatXp(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
  ).format(Math.round(value));
}

export function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    },
  ).format(value);
}
