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
      <div className="admin-point-economy__state">
        Loading point economy…
      </div>
    );
  }

  return (
    <div className="admin-point-economy">
      {error && (
        <div
          role="alert"
          className="admin-point-economy__alert"
        >
          {error}
        </div>
      )}

      <div className="admin-point-economy__summary">
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

      <section className="admin-point-economy__card">
        <div className="admin-point-economy__card-header">
          <div>
            <div className="admin-eyebrow">
              Projection
            </div>

            <h2 className="admin-point-economy__title">
              Programme economy
            </h2>

            <p className="admin-point-economy__description">
              The projection uses configured point rules and the
              authoritative current collective XP. It does not award XP.
            </p>
          </div>

          <div className="admin-point-economy__controls">
            <label className="admin-point-economy__control">
              <span className="admin-point-economy__label">
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
                className="admin-point-economy__input"
              />
            </label>

            <div>
              <span className="admin-point-economy__label">
                Weekly target
              </span>

              <div className="admin-point-economy__readonly">
                {weeklyTargetXp === null
                  ? "Not set"
                  : `${weeklyTargetXp.toLocaleString(
                      "en-GB",
                    )} XP`}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-point-economy__projection">
          <EconomyHealth
            projection={
              projection
            }
          />
        </div>

        <div className="admin-point-economy__projection-stats">
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
        <div className="admin-point-economy__section-header">
          <h2 className="admin-point-economy__section-title">
            Point rules
          </h2>

          <p className="admin-point-economy__section-description">
            Individual XP drives personal progression. Group XP drives the
            collective jackpot. Changing a rule affects future awards and
            does not rewrite historical XP.
          </p>
        </div>

        {calculations.length ===
        0 ? (
          <div className="admin-point-economy__state">
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
    <div className="admin-point-economy__metric">
      <div className="admin-point-economy__metric-label">
        {label}
      </div>

      <div className="admin-point-economy__metric-value">
        {value}
      </div>

      <div className="admin-point-economy__metric-note">
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
    <div className="admin-point-economy__projection-card">
      <div className="admin-point-economy__projection-label">
        {label}
      </div>

      <div className="admin-point-economy__projection-value">
        {value}
      </div>
    </div>
  );
}
