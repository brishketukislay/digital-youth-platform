import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  adminOverview,
  getPointRules,
  getProgramme,
  updatePointRule,
  type PointRule,
} from "../../api/client";

import {
  calculateIndividualWeeklyYield,
  calculateProjection,
  toPointRuleCalculation,
  type PointRuleCalculation,
} from "./programmeMath";

import {
  PointRuleTable,
} from "./PointRuleTable";

import {
  PointRuleEditor,
} from "./PointRuleEditor";

import {
  EconomyHealth,
} from "./EconomyHealth";

export function PointEconomy() {
  const [rules, setRules] =
    useState<PointRule[]>([]);

  const [
    selectedRule,
    setSelectedRule,
  ] =
    useState<PointRuleCalculation | null>(
      null,
    );

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [programmeWeeks, setProgrammeWeeks] =
    useState(24);

  const [currentGroupXp, setCurrentGroupXp] =
    useState(0);

  const [targetXp, setTargetXp] =
    useState(1_500_000);

  const [weeklyTargetXp, setWeeklyTargetXp] =
    useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        rulesResponse,
        programmeResponse,
        overviewResponse,
      ] = await Promise.all([
        getPointRules(),
        getProgramme(),
        adminOverview(),
      ]);

      setRules(
        rulesResponse.data,
      );

      const programme =
        programmeResponse.data;

      setTargetXp(
        Number(
          programme.target_xp || 0,
        ),
      );

      setWeeklyTargetXp(
        programme.weekly_target_xp ===
          null ||
        programme.weekly_target_xp ===
          undefined
          ? null
          : Number(
              programme.weekly_target_xp,
            ),
      );

      setCurrentGroupXp(
        Number(
          overviewResponse.data
            .group_xp || 0,
        ),
      );

      if (
        programme.start_date &&
        programme.end_date
      ) {
        const start =
          new Date(
            programme.start_date,
          );

        const end =
          new Date(
            programme.end_date,
          );

        const millisecondsPerWeek =
          7 *
          24 *
          60 *
          60 *
          1000;

        const calculatedWeeks =
          Math.max(
            1,
            Math.ceil(
              (end.getTime() -
                start.getTime()) /
                millisecondsPerWeek,
            ),
          );

        setProgrammeWeeks(
          Math.min(
            104,
            calculatedWeeks,
          ),
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load the point economy. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const calculations = useMemo(
    () =>
      rules.map(
        toPointRuleCalculation,
      ),
    [rules],
  );

  const groupWeeklyYield =
    useMemo(
      () =>
        calculations
          .filter(
            (rule) =>
              rule.enabled,
          )
          .reduce(
            (total, rule) =>
              total +
              rule.groupWeeklyYield,
            0,
          ),
      [calculations],
    );

  const individualWeeklyYield =
    useMemo(
      () =>
        calculateIndividualWeeklyYield(
          calculations,
        ),
      [calculations],
    );

  const projection =
    useMemo(
      () =>
        calculateProjection({
          individualWeeklyYield,
          groupWeeklyYield,
          programmeWeeks,
          currentGroupXp,
          targetXp,
          weeklyTargetXp,
        }),
      [
        individualWeeklyYield,
        groupWeeklyYield,
        programmeWeeks,
        currentGroupXp,
        targetXp,
        weeklyTargetXp,
      ],
    );

  const selectedBackendRule =
    selectedRule
      ? rules.find(
          (rule) =>
            String(rule.id) ===
            selectedRule.id,
        )
      : null;

  const saveRule = async (
    values: {
      individualXpPerAward: number;
      groupXpPerAward: number;
      awardsPerWeek: number;
      weeklyCap: number | null;
      enabled: boolean;
    },
  ) => {
    if (!selectedBackendRule) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updatePointRule(
        selectedBackendRule.id,
        {
          name:
            selectedBackendRule.name,

          code:
            selectedBackendRule.code,

          description:
            selectedBackendRule.description ??
            null,

          individual_xp:
            values.individualXpPerAward,

          group_xp:
            values.groupXpPerAward,

          weekly_cap:
            values.weeklyCap,

          awards_per_week:
            values.awardsPerWeek,

          enabled:
            values.enabled,
        },
      );

      setRules(
        (current) =>
          current.map(
            (rule) =>
              rule.id ===
              selectedBackendRule.id
                ? {
                    ...rule,

                    individual_xp:
                      values.individualXpPerAward,

                    group_xp:
                      values.groupXpPerAward,

                    weekly_cap:
                      values.weeklyCap,

                    awards_per_week:
                      values.awardsPerWeek,

                    enabled:
                      values.enabled,
                  }
                : rule,
          ),
      );

      setSelectedRule(null);
    } catch (err) {
      console.error(err);

      setError(
        "The point rule could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (
    rule: PointRuleCalculation,
  ) => {
    setSelectedRule(rule);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-400">
        Loading point economy…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Group weekly yield"
          value={`${projection.groupWeeklyYield.toLocaleString(
            "en-GB",
          )} XP`}
          description="Projected collective jackpot XP per week."
        />

        <Metric
          label="Individual weekly yield"
          value={`${projection.individualWeeklyYield.toLocaleString(
            "en-GB",
          )} XP`}
          description="Projected player XP per week."
        />

        <Metric
          label="Current group XP"
          value={`${currentGroupXp.toLocaleString(
            "en-GB",
          )} XP`}
          description="Authoritative collective score from the backend."
        />

        <Metric
          label="Jackpot target"
          value={`${targetXp.toLocaleString(
            "en-GB",
          )} XP`}
          description="Configured collective target."
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              Projection
            </div>

            <h2 className="mt-1 text-lg font-bold">
              Programme economy
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              The projection uses configured point rules and the
              authoritative current collective XP. It does not award XP.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Programme weeks
              </span>

              <input
                type="number"
                min={1}
                max={104}
                value={
                  programmeWeeks
                }
                onChange={(event) =>
                  setProgrammeWeeks(
                    Math.max(
                      1,
                      Number(
                        event.target.value,
                      ) || 1,
                    ),
                  )
                }
                className="w-32 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <div>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Weekly target
              </span>

              <div className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                {weeklyTargetXp === null
                  ? "Not set"
                  : `${weeklyTargetXp.toLocaleString(
                      "en-GB",
                    )} XP`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <EconomyHealth
            projection={
              projection
            }
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <EconomyMetric
            label="Projected group XP"
            value={`${projection.projectedGroupXp.toLocaleString(
              "en-GB",
            )} XP`}
          />

          <EconomyMetric
            label="Projected surplus / deficit"
            value={`${projection.bufferXp >= 0 ? "+" : ""}${projection.bufferXp.toLocaleString(
              "en-GB",
            )} XP`}
          />

          <EconomyMetric
            label="Weekly variance"
            value={
              projection.weeklyVarianceXp ===
              null
                ? "Not configured"
                : `${projection.weeklyVarianceXp >= 0 ? "+" : ""}${projection.weeklyVarianceXp.toLocaleString(
                    "en-GB",
                  )} XP`
            }
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            Point rules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Individual XP drives personal progression. Group XP drives the
            collective jackpot. Changing a rule affects future awards and
            does not rewrite historical XP.
          </p>
        </div>

        {calculations.length ===
        0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-400">
            No point rules have been configured yet.
          </div>
        ) : (
          <PointRuleTable
            rules={
              calculations
            }
            onEdit={
              openEditor
            }
          />
        )}
      </section>

      <PointRuleEditor
        rule={
          selectedRule
        }
        saving={saving}
        onClose={() =>
          !saving &&
          setSelectedRule(null)
        }
        onSave={
          saveRule
        }
      />
    </div>
  );
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>

      <div className="mt-3 text-2xl font-black">
        {value}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {description}
      </div>
    </div>
  );
}

function EconomyMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-lg font-bold text-white">
        {value}
      </div>
    </div>
  );
}
