import { useEffect, useState } from "react";

import type { PointRuleCalculation } from "./programmeMath";

type PointRuleEditorProps = {
  rule: PointRuleCalculation | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (
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
  ) => Promise<void> | void;
};

function nullableNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(1, Math.round(parsed));
}

export function PointRuleEditor({
  rule,
  saving = false,
  onClose,
  onSave,
}: PointRuleEditorProps) {
  const [xpPerAward, setXpPerAward] = useState(0);
  const [groupXpPerAward, setGroupXpPerAward] = useState(0);
  const [awardsPerWeek, setAwardsPerWeek] = useState(0);
  const [weeklyCap, setWeeklyCap] = useState<number | null>(null);
  const [individualAwardCap, setIndividualAwardCap] =
    useState<number | null>(null);
  const [groupAwardCap, setGroupAwardCap] =
    useState<number | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!rule) {
      return;
    }

    setXpPerAward(rule.xpPerAward);
    setGroupXpPerAward(rule.groupXpPerAward);
    setAwardsPerWeek(rule.awardsPerWeek);
    setWeeklyCap(rule.weeklyCap);
    setIndividualAwardCap(rule.individualAwardCap);
    setGroupAwardCap(rule.groupAwardCap);
    setEnabled(rule.enabled);
  }, [rule]);

  if (!rule) {
    return null;
  }

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await onSave({
      xpPerAward: Math.max(
        0,
        Math.round(xpPerAward),
      ),
      groupXpPerAward: Math.max(
        0,
        Math.round(groupXpPerAward),
      ),
      awardsPerWeek: Math.max(
        0,
        Math.round(awardsPerWeek),
      ),
      weeklyCap,
      individualAwardCap,
      groupAwardCap,
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Point rule
            </div>

            <h2 className="mt-1 text-lg font-bold">
              {rule.name}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Configure future awards. Historical XP is never rewritten.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Individual XP per award
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={xpPerAward}
                onChange={(event) =>
                  setXpPerAward(
                    Number(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Group XP per award
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={groupXpPerAward}
                onChange={(event) =>
                  setGroupXpPerAward(
                    Number(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Individual award cap
              </span>

              <input
                type="number"
                min={1}
                step={1}
                placeholder="No limit"
                value={individualAwardCap ?? ""}
                onChange={(event) =>
                  setIndividualAwardCap(
                    nullableNumber(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />

              <span className="mt-2 block text-xs text-slate-500">
                Maximum individual XP from one award.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Group award cap
              </span>

              <input
                type="number"
                min={1}
                step={1}
                placeholder="No limit"
                value={groupAwardCap ?? ""}
                onChange={(event) =>
                  setGroupAwardCap(
                    nullableNumber(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />

              <span className="mt-2 block text-xs text-slate-500">
                Maximum group XP from one award.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Weekly individual XP cap
              </span>

              <input
                type="number"
                min={1}
                step={1}
                placeholder="No limit"
                value={weeklyCap ?? ""}
                onChange={(event) =>
                  setWeeklyCap(
                    nullableNumber(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />

              <span className="mt-2 block text-xs text-slate-500">
                Maximum individual XP from this rule per UTC week.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Awards per week
              </span>

              <input
                type="number"
                min={0}
                step={1}
                value={awardsPerWeek}
                onChange={(event) =>
                  setAwardsPerWeek(
                    Number(event.target.value),
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />

              <span className="mt-2 block text-xs text-slate-500">
                Set to 0 for unlimited awards.
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:col-span-2">
              <div>
                <div className="text-sm font-medium">
                  Rule enabled
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Disabled rules cannot award XP.
                </div>
              </div>

              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) =>
                  setEnabled(event.target.checked)
                }
                className="h-5 w-5 accent-cyan-400"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
