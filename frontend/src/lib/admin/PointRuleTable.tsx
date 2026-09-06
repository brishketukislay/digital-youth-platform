import type {
  PointRuleCalculation,
} from "./programmeMath";

import {
  formatXp,
} from "./programmeMath";

type PointRuleTableProps = {
  rules: PointRuleCalculation[];
  onEdit: (
    rule: PointRuleCalculation,
  ) => void;
};

export function PointRuleTable({
  rules,
  onEdit,
}: PointRuleTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Rule
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Individual
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Group
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Awards / week
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Group weekly yield
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Cap
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-5 py-4" />
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-white">
                    {rule.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {rule.id}
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-300">
                  {formatXp(
                    rule.individualXpPerAward,
                  )}{" "}
                  XP
                </td>

                <td className="px-5 py-4 text-sm text-cyan-300">
                  {formatXp(
                    rule.groupXpPerAward,
                  )}{" "}
                  XP
                </td>

                <td className="px-5 py-4 text-sm text-slate-300">
                  {rule.awardsPerWeek}
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-cyan-300">
                  {formatXp(
                    rule.groupWeeklyYield,
                  )}{" "}
                  XP
                </td>

                <td className="px-5 py-4 text-sm text-slate-400">
                  {rule.weeklyCap === null
                    ? "—"
                    : `${formatXp(rule.weeklyCap)} XP`}
                </td>

                <td className="px-5 py-4">
                  {rule.enabled ? (
                    <span className="inline-flex rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-400/10 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Disabled
                    </span>
                  )}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      onEdit(rule)
                    }
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/5 hover:text-cyan-300"
                  >
                    Configure
                  </button>
                </td>
              </tr>
            ))}

            {rules.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No point rules have been configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
