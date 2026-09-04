import { useMemo, useState } from "react";

import {
  calculateProjection,
  calculateWeeklyYield,
  type PointRuleCalculation,
} from "../../../lib/admin/programmeMath";

import { PointRuleTable } from "./PointRuleTable";
import { PointRuleEditor } from "./PointRuleEditor";
import { EconomyHealth } from "./EconomyHealth";

const initialRules: PointRuleCalculation[] = [
  {
    id: "attendance",
    name: "Attendance scans",
    xpPerAward: 500,
    awardsPerWeek: 15,
    weeklyYield: 7500,
    enabled: true,
  },
  {
    id: "behaviour",
    name: "Daily behaviour baseline",
    xpPerAward: 1000,
    awardsPerWeek: 15,
    weeklyYield: 15000,
    enabled: true,
  },
  {
    id: "processing-chat",
    name: "60-second processing chats",
    xpPerAward: 1200,
    awardsPerWeek: 15,
    weeklyYield: 18000,
    enabled: true,
  },
  {
    id: "weekend-game",
    name: "Time-bound game participation",
    xpPerAward: 300,
    awardsPerWeek: 15,
    weeklyYield: 4500,
    enabled: true,
  },
  {
    id: "civic-action",
    name: "Community nominations",
    xpPerAward: 5000,
    awardsPerWeek: 2,
    weeklyYield: 10000,
    enabled: true,
  },
  {
    id: "skill-tree",
    name: "Skill tree completion surge",
    xpPerAward: 5000,
    awardsPerWeek: 1,
    weeklyYield: 5000,
    enabled: true,
  },
  {
    id: "loot-wheel",
    name: "Loot wheel",
    xpPerAward: 3500,
    awardsPerWeek: 2,
    weeklyYield: 7000,
    enabled: true,
  },
  {
    id: "elite-performance",
    name: "Elite game performance",
    xpPerAward: 1500,
    awardsPerWeek: 1,
    weeklyYield: 1500,
    enabled: true,
  },
  {
    id: "event-winner",
    name: "Time-bound event winner",
    xpPerAward: 5000,
    awardsPerWeek: 1,
    weeklyYield: 5000,
    enabled: true,
  },
];

export function PointEconomy() {
  const [rules, setRules] =
    useState<PointRuleCalculation[]>(
      initialRules,
    );

  const [selectedRule, setSelectedRule] =
    useState<PointRuleCalculation | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [programmeWeeks, setProgrammeWeeks] =
    useState(24);

  const [currentXp, setCurrentXp] =
    useState(0);

  const [targetXp, setTargetXp] =
    useState(1_500_000);

  const weeklyYield = useMemo(
    () => calculateWeeklyYield(rules),
    [rules],
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

  const saveRule = async (
    values: Pick<
      PointRuleCalculation,
      "xpPerAward" | "awardsPerWeek" | "enabled"
    >,
  ) => {
    if (!selectedRule) {
      return;
    }

    setSaving(true);

    try {
      /*
       * Replace this local update with the existing backend
       * point-rule mutation once wired to the project API.
       *
       * The UI deliberately keeps the mutation boundary here,
       * rather than putting API calls into PointRuleEditor.
       */
      setRules((current) =>
        current.map((rule) => {
          if (rule.id !== selectedRule.id) {
            return rule;
          }

          return {
            ...rule,
            ...values,
            weeklyYield:
              values.xpPerAward *
              values.awardsPerWeek,
          };
        }),
      );

      setSelectedRule(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Weekly yield"
          value={`${weeklyYield.toLocaleString("en-GB")} XP`}
          description="Configured predictable weekly economy."
        />

        <Metric
          label="Programme length"
          value={`${programmeWeeks} weeks`}
          description="Projection horizon."
        />

        <Metric
          label="Jackpot target"
          value={`${targetXp.toLocaleString("en-GB")} XP`}
          description="Current collective target."
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
              Adjust the planning assumptions to see whether
              the configured economy can reach the jackpot.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                    Number(event.target.value),
                  )
                }
                className="w-28 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Target XP
              </span>

              <input
                type="number"
                min={0}
                step={1000}
                value={targetXp}
                onChange={(event) =>
                  setTargetXp(
                    Number(event.target.value),
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
            Configure the baseline XP economy. Actual
            awards should always be validated server-side.
          </p>
        </div>

        <PointRuleTable
          rules={rules}
          onEdit={setSelectedRule}
        />
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