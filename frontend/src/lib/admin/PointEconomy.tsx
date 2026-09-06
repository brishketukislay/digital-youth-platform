import { useEffect, useMemo, useState } from "react";

import {
  getPointRules,
  getProgramme,
  updatePointRule,
  type PointRule,
} from "../../api/client";

import {
  calculateProjection,
  calculateWeeklyYield,
  type PointRuleCalculation,
} from "./programmeMath";

import { PointRuleTable } from "./PointRuleTable";
import { PointRuleEditor } from "./PointRuleEditor";
import { EconomyHealth } from "./EconomyHealth";

function toCalculation(rule: PointRule): PointRuleCalculation {
  const xpPerAward = Math.max(
    0,
    Number(rule.individual_xp || 0),
  );

  const groupXpPerAward = Math.max(
    0,
    Number(rule.group_xp || 0),
  );

  const awardsPerWeek = Math.max(
    0,
    Number(rule.awards_per_week || 0),
  );

  const individualAwardCap =
    rule.individual_award_cap == null
      ? null
      : Math.max(
          1,
          Number(rule.individual_award_cap),
        );

  const groupAwardCap =
    rule.group_award_cap == null
      ? null
      : Math.max(
          1,
          Number(rule.group_award_cap),
        );

  const weeklyCap =
    rule.weekly_cap == null
      ? null
      : Math.max(
          1,
          Number(rule.weekly_cap),
        );

  const effectiveIndividualAward =
    individualAwardCap === null
      ? xpPerAward
      : Math.min(
          xpPerAward,
          individualAwardCap,
        );

  const projectedWeeklyYield =
    effectiveIndividualAward * awardsPerWeek;

  const weeklyYield =
    weeklyCap === null
      ? projectedWeeklyYield
      : Math.min(
          projectedWeeklyYield,
          weeklyCap,
        );

  return {
    id: String(rule.id),
    name: rule.name,
    xpPerAward,
    groupXpPerAward,
    awardsPerWeek,
    weeklyCap,
    individualAwardCap,
    groupAwardCap,
    weeklyYield,
    enabled: Boolean(rule.enabled),
  };
}

export function PointEconomy() {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [selectedRule, setSelectedRule] =
    useState<PointRuleCalculation | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programmeWeeks, setProgrammeWeeks] =
    useState(24);

  const [currentXp, setCurrentXp] = useState(0);
  const [targetXp, setTargetXp] =
    useState(1_500_000);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [rulesResponse, programmeResponse] =
        await Promise.all([
          getPointRules(),
          getProgramme(),
        ]);

      setRules(rulesResponse.data);

      setTargetXp(
        Number(
          programmeResponse.data.target_xp ||
            1_500_000,
        ),
      );

      if (
        programmeResponse.data.start_date &&
        programmeResponse.data.end_date
      ) {
        const start = new Date(
          programmeResponse.data.start_date,
        );

        const end = new Date(
          programmeResponse.data.end_date,
        );

        const millisecondsPerWeek =
          7 * 24 * 60 * 60 * 1000;

        const calculatedWeeks = Math.max(
          1,
          Math.ceil(
            (end.getTime() - start.getTime()) /
              millisecondsPerWeek,
          ),
        );

        setProgrammeWeeks(
          Math.min(104, calculatedWeeks),
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
    () => rules.map(toCalculation),
    [rules],
  );

  const weeklyYield = useMemo(
    () => calculateWeeklyYield(calculations),
    [calculations],
  );

  const projection = useMemo(
    () =>
      calculateProjection({
        weeklyYield,
        programmeWeeks,
        currentXp,
        targetXp,
      }),
    [
      weeklyYield,
      programmeWeeks,
      currentXp,
      targetXp,
    ],
  );

  const selectedBackendRule =
    selectedRule
      ? rules.find(
          (rule) =>
            String(rule.id) === selectedRule.id,
        )
      : null;

  const saveRule = async (
    values: Pick<
      PointRuleCalculation,
      | "xpPerAward"
      | "groupXpPerAward"
      | "awardsPerWeek"
      | "weeklyCap"
      | "individualAwardCap"
      | "groupAwardCap"
      | "enabled"
    >,
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
          name: selectedBackendRule.name,
          code: selectedBackendRule.code,
          description:
            selectedBackendRule.description ?? null,
          individual_xp:
            values.xpPerAward,
          group_xp:
            values.groupXpPerAward,
          weekly_cap:
            values.weeklyCap,
          awards_per_week:
            values.awardsPerWeek,
          individual_award_cap:
            values.individualAwardCap,
          group_award_cap:
            values.groupAwardCap,
          enabled:
            values.enabled,
        },
      );

      setRules((current) =>
        current.map((rule) =>
          rule.id === selectedBackendRule.id
            ? {
                ...rule,
                individual_xp:
                  values.xpPerAward,
                group_xp:
                  values.groupXpPerAward,
                weekly_cap:
                  values.weeklyCap,
                awards_per_week:
                  values.awardsPerWeek,
                individual_award_cap:
                  values.individualAwardCap,
                group_award_cap:
                  values.groupAwardCap,
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
          label="Weekly yield"
          value={`${weeklyYield.toLocaleString(
            "en-GB",
          )} XP`}
          description="Configured individual XP baseline."
        />

        <Metric
          label="Programme length"
          value={`${programmeWeeks} weeks`}
          description="Projection horizon."
        />

        <Metric
          label="Current XP"
          value={`${currentXp.toLocaleString(
            "en-GB",
          )} XP`}
          description="Current collective score."
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
              Projection controls
            </div>

            <h2 className="mt-1 text-lg font-bold">
              Programme economy
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              This is a planning tool. Actual XP is
              always awarded and validated by the
              backend.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Weeks
              </span>

              <input
                type="number"
                min={1}
                max={104}
                value={programmeWeeks}
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
                className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Current XP
              </span>

              <input
                type="number"
                min={0}
                step={1000}
                value={currentXp}
                onChange={(event) =>
                  setCurrentXp(
                    Math.max(
                      0,
                      Number(
                        event.target.value,
                      ) || 0,
                    ),
                  )
                }
                className="w-32 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Target XP
              </span>

              <input
                type="number"
                min={1}
                step={1000}
                value={targetXp}
                onChange={(event) =>
                  setTargetXp(
                    Math.max(
                      1,
                      Number(
                        event.target.value,
                      ) || 1,
                    ),
                  )
                }
                className="w-36 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <EconomyHealth
            projection={projection}
          />
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            Point rules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These values are stored in the programme
            database. Changing a rule affects future
            awards and does not rewrite historical XP.
          </p>
        </div>

        {calculations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-400">
            No point rules have been configured yet.
          </div>
        ) : (
          <PointRuleTable
            rules={calculations}
            onEdit={openEditor}
          />
        )}
      </section>

      <PointRuleEditor
        rule={selectedRule}
        saving={saving}
        onClose={() =>
          !saving && setSelectedRule(null)
        }
        onSave={saveRule}
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
