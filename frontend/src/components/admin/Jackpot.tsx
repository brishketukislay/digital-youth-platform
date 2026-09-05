import {
  useEffect,
  useState,
} from "react";

import {
  createJackpotMilestone,
  disableJackpotMilestone,
  getJackpot,
  updateJackpotMilestone,
  type JackpotConfiguration,
  type ProgrammeMilestone,
  type ProgrammeMilestoneRequest,
} from "../../api/client";

function formatXP(value: number) {
  return new Intl.NumberFormat(
    "en-GB"
  ).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

const emptyForm: ProgrammeMilestoneRequest = {
  name: "",
  xp_threshold: 0,
  reward_description: "",
  reward_value: 0,
  reward_type: "group",
  sort_order: 0,
  active: true,
};

export function Jackpot() {
  const [data, setData] =
    useState<JackpotConfiguration | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [editing, setEditing] =
    useState<ProgrammeMilestone | null>(
      null
    );

  const [form, setForm] =
    useState<ProgrammeMilestoneRequest>(
      emptyForm
    );

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await getJackpot();

      setData(response.data
);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load jackpot."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    setEditing(null);

    setForm({
      ...emptyForm,
      sort_order:
        (data?.milestones.length ?? 0) + 1,
    });
  }

  function startEdit(
    milestone: ProgrammeMilestone
  ) {
    setEditing(milestone);

    setForm({
      name: milestone.name,
      xp_threshold:
        milestone.xp_threshold,
      reward_description:
        milestone.reward_description ?? "",
      reward_value:
        milestone.reward_value,
      reward_type:
        milestone.reward_type,
      sort_order:
        milestone.sort_order,
      active:
        milestone.active,
    });
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      if (editing) {
        await updateJackpotMilestone(
          editing.id,
          form
        );
      } else {
        await createJackpotMilestone(
          form
        );
      }

      setEditing(null);
      setForm(emptyForm);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save milestone."
      );
    } finally {
      setSaving(false);
    }
  }

  async function disable(
    milestone: ProgrammeMilestone
  ) {
    if (
      !window.confirm(
        `Disable "${milestone.name}"?`
      )
    ) {
      return;
    }

    setError(null);

    try {
      await disableJackpotMilestone(
        milestone.id
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to disable milestone."
      );
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-400">
        Loading jackpot configuration...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
        {error ??
          "Jackpot configuration could not be loaded."}
      </div>
    );
  }

  const progress =
    Math.min(
      Math.max(
        data.progress_percent,
        0
      ),
      100
    );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Scoring
        </div>

        <h1 className="mt-2 text-3xl font-bold">
          Jackpot
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Configure the collective programme
          milestones and track progress towards
          the group jackpot.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm text-slate-400">
              Collective progress
            </div>

            <div className="mt-2 text-4xl font-black tracking-tight">
              {formatXP(data.current_xp)}
              <span className="ml-2 text-lg font-medium text-slate-500">
                XP
              </span>
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Target{" "}
              {formatXP(
                data.programme.target_xp
              )}{" "}
              XP
            </div>
          </div>

          <div className="text-left lg:text-right">
            <div className="text-2xl font-bold text-cyan-300">
              {progress.toFixed(1)}%
            </div>

            <div className="text-xs text-slate-500">
              {formatXP(
                data.remaining_xp
              )}{" "}
              XP remaining
            </div>
          </div>
        </div>

        <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Weekly target
            </div>

            <div className="mt-1 text-lg font-bold">
              {formatXP(
                data.programme
                  .weekly_target_xp
              )}{" "}
              XP
            </div>
          </div>

          <div className="rounded-xl bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Jackpot target
            </div>

            <div className="mt-1 text-lg font-bold">
              {formatXP(
                data.programme.target_xp
              )}{" "}
              XP
            </div>
          </div>

          <div className="rounded-xl bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Group penalty cap
            </div>

            <div className="mt-1 text-lg font-bold">
              {
                data.programme
                  .max_group_penalty_percent
              }
              %
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              Jackpot milestones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Milestones are configurable and
              do not alter historical XP.
            </p>
          </div>

          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Add milestone
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {data.milestones.map(
            (milestone) => {
              const reached =
                milestone.achieved;

              return (
                <div
                  key={milestone.id}
                  className={[
                    "rounded-2xl border p-5 transition",
                    reached
                      ? "border-emerald-400/30 bg-emerald-400/5"
                      : "border-white/10 bg-black/10",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={[
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black",
                          reached
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/10 text-slate-300",
                        ].join(" ")}
                      >
                        {reached
                          ? "✓"
                          : milestone.sort_order}
                      </div>

                      <div>
                        <div className="font-bold">
                          {milestone.name}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {formatXP(
                            milestone.xp_threshold
                          )}{" "}
                          XP
                        </div>

                        {milestone.reward_description && (
                          <div className="mt-1 text-xs text-slate-500">
                            {
                              milestone.reward_description
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-slate-500">
                          Prize
                        </div>

                        <div className="mt-1 text-xl font-black text-cyan-300">
                          {formatMoney(
                            milestone.reward_value
                          )}
                        </div>
                      </div>

                      <div
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          reached
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-slate-700 text-slate-300",
                        ].join(" ")}
                      >
                        {reached
                          ? "UNLOCKED"
                          : "LOCKED"}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(
                            milestone
                          )
                        }
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          disable(
                            milestone
                          )
                        }
                        className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}

          {data.milestones.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
              No jackpot milestones have
              been configured yet.
            </div>
          )}
        </div>
      </section>

      {(editing || form.name) && (
        <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editing
                ? "Edit milestone"
                : "New milestone"}
            </h2>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
              className="text-sm text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Name
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
                placeholder="First Level Prize"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                XP threshold
              </span>

              <input
                type="number"
                min="1"
                value={
                  form.xp_threshold
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    xp_threshold:
                      Number(
                        event.target.value
                      ),
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Prize value (£)
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.reward_value
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    reward_value:
                      Number(
                        event.target.value
                      ),
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Display order
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.sort_order
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    sort_order:
                      Number(
                        event.target.value
                      ),
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Prize description
              </span>

              <textarea
                value={
                  form.reward_description ??
                  ""
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    reward_description:
                      event.target.value,
                  })
                }
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
                placeholder="Prize selected by the young people."
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm({
                    ...form,
                    active:
                      event.target.checked,
                  })
                }
                className="h-4 w-4 accent-cyan-400"
              />

              <span className="text-sm text-slate-300">
                Milestone active
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void save()
              }
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save milestone"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
