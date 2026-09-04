import { useEffect, useState } from "react";

import type { PointRuleCalculation } from "./programmeMath";

type PointRuleEditorProps = {
  rule: PointRuleCalculation | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    values: Pick<
      PointRuleCalculation,
      "xpPerAward" | "awardsPerWeek" | "enabled"
    >,
  ) => Promise<void> | void;
};

export function PointRuleEditor({
  rule,
  saving = false,
  onClose,
  onSave,
}: PointRuleEditorProps) {
  const [xpPerAward, setXpPerAward] = useState(0);
  const [awardsPerWeek, setAwardsPerWeek] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!rule) {
      return;
    }

    setXpPerAward(rule.xpPerAward);
    setAwardsPerWeek(rule.awardsPerWeek);
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
      awardsPerWeek: Math.max(
        0,
        Math.round(awardsPerWeek),
      ),
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Point rule
            </div>

            <h2 className="mt-1 text-lg font-bold">
              {rule.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-5 px-6 py-6">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                XP per award
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
                Expected awards per week
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
                Used for the projection only. Actual XP
                awards remain authoritative on the backend.
              </span>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
              <div>
                <div className="text-sm font-medium">
                  Rule enabled
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Disabled rules contribute no projected XP.
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