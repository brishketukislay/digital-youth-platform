import { useEffect, useState } from "react";

type Phase = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  colour?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  sort_order?: number;
  active?: boolean;
};

type PhaseForm = {
  name: string;
  description: string;
  icon: string;
  colour: string;
  start_date: string;
  end_date: string;
  active: boolean;
};

const EMPTY_FORM: PhaseForm = {
  name: "",
  description: "",
  icon: "★",
  colour: "#18775B",
  start_date: "",
  end_date: "",
  active: true,
};

function getToken(): string | null {
  return (
    localStorage.getItem("token") ??
    localStorage.getItem("access_token")
  );
}

async function api(
  path: string,
  options: RequestInit = {},
) {
  const token = getToken();

  const response = await fetch(
    `http://localhost:8000${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers ?? {}),
      },
    },
  );

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data
        ? String(
            (data as { detail: unknown }).detail,
          )
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  return data;
}

export default function PhaseManager() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [form, setForm] =
    useState<PhaseForm>(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadPhases() {
    setLoading(true);
    setError("");

    try {
      const data = await api(
        "/admin/phases",
      );

      const items =
        Array.isArray(data)
          ? data
          : Array.isArray(
                (
                  data as {
                    phases?: Phase[];
                  }
                )?.phases,
              )
            ? (
                data as {
                  phases: Phase[];
                }
              ).phases
            : [];

      setPhases(items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load phases.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPhases();
  }, []);

  function updateField<K extends keyof PhaseForm>(
    key: K,
    value: PhaseForm[K],
  ) {
    setForm(current => ({
      ...current,
      [key]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage("");
    setError("");
  }

  function startEdit(phase: Phase) {
    setEditingId(phase.id);

    setForm({
      name: phase.name ?? "",
      description:
        phase.description ?? "",
      icon: phase.icon ?? "★",
      colour:
        phase.colour ?? "#18775B",
      start_date:
        phase.start_date ?? "",
      end_date:
        phase.end_date ?? "",
      active:
        phase.active ?? true,
    });

    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setMessage("");
  }

  async function savePhase() {
    if (!form.name.trim()) {
      setError("Phase name is required.");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError(
        "End date cannot be before start date.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        icon:
          form.icon.trim() || "★",
        colour:
          form.colour.trim() || "#18775B",
        start_date:
          form.start_date || null,
        end_date:
          form.end_date || null,
        active: form.active,
      };

      if (editingId === null) {
        await api("/admin/phases", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Phase created.");
      } else {
        await api(
          `/admin/phases/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        setMessage("Phase updated.");
      }

      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save phase.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activatePhase(
    phaseId: number,
  ) {
    setError("");
    setMessage("");

    try {
      await api(
        `/admin/phases/${phaseId}/activate`,
        {
          method: "POST",
        },
      );

      setMessage("Active phase updated.");
      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not activate phase.",
      );
    }
  }

  async function deletePhase(
    phase: Phase,
  ) {
    const confirmed = window.confirm(
      `Delete phase "${phase.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api(
        `/admin/phases/${phase.id}`,
        {
          method: "DELETE",
        },
      );

      if (editingId === phase.id) {
        cancelEdit();
      }

      setMessage("Phase deleted.");
      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete phase.",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Programme configuration
        </div>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Phases
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Create and manage programme phases,
          dates, colours and the currently active
          phase.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">
                Programme phases
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {phases.length} phase
                {phases.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={startCreate}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              + New phase
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {loading && (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                Loading phases…
              </div>
            )}

            {!loading &&
              phases.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <div className="text-4xl">
                    ◈
                  </div>

                  <h3 className="mt-3 font-semibold text-white">
                    No phases yet
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Create the first phase for
                    this programme.
                  </p>
                </div>
              )}

            {!loading &&
              phases.map(phase => (
                <div
                  key={phase.id}
                  className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{
                        backgroundColor:
                          `${phase.colour ?? "#18775B"}22`,
                        color:
                          phase.colour ??
                          "#18775B",
                      }}
                    >
                      {phase.icon ?? "★"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {phase.name}
                        </h3>

                        {phase.active && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {phase.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {phase.description}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-500">
                        {phase.start_date ??
                          "No start date"}
                        {" → "}
                        {phase.end_date ??
                          "No end date"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {!phase.active && (
                      <button
                        type="button"
                        onClick={() =>
                          void activatePhase(
                            phase.id,
                          )
                        }
                        className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        startEdit(phase)
                      }
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deletePhase(
                          phase,
                        )
                      }
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">
              {editingId === null
                ? "Create phase"
                : "Edit phase"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Configure the phase identity and
              schedule.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phase name
              </span>

              <input
                value={form.name}
                onChange={event =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="e.g. Road Safety"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </span>

              <textarea
                value={form.description}
                onChange={event =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Describe what this phase is about…"
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Icon
                </span>

                <input
                  value={form.icon}
                  onChange={event =>
                    updateField(
                      "icon",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Colour
                </span>

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(
                        form.colour,
                      )
                        ? form.colour
                        : "#18775B"
                    }
                    onChange={event =>
                      updateField(
                        "colour",
                        event.target.value,
                      )
                    }
                    className="h-10 w-12 rounded border border-slate-700 bg-slate-950"
                  />

                  <input
                    value={form.colour}
                    onChange={event =>
                      updateField(
                        "colour",
                        event.target.value,
                      )
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Start date
                </span>

                <input
                  type="date"
                  value={form.start_date}
                  onChange={event =>
                    updateField(
                      "start_date",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  End date
                </span>

                <input
                  type="date"
                  value={form.end_date}
                  onChange={event =>
                    updateField(
                      "end_date",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={event =>
                  updateField(
                    "active",
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-emerald-500"
              />

              <div>
                <div className="text-sm font-medium text-white">
                  Active phase
                </div>

                <div className="text-xs text-slate-500">
                  Newly created phases can be
                  activated later.
                </div>
              </div>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void savePhase()
                }
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : editingId === null
                    ? "Create phase"
                    : "Save changes"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
