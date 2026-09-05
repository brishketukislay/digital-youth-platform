import { FormEvent, useEffect, useState } from "react";

type Phase = {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  colour: string;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  active: boolean;
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

async function api(
  path: string,
  options: RequestInit = {},
) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPhases() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [form, setForm] = useState<PhaseForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPhases() {
    setLoading(true);
    setError(null);

    try {
      const data = await api("/api/admin/phases");
      setPhases(Array.isArray(data) ? data : data.phases ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load phases.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPhases();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function editPhase(phase: Phase) {
    setEditingId(phase.id);

    setForm({
      name: phase.name,
      description: phase.description ?? "",
      icon: phase.icon ?? "★",
      colour: phase.colour ?? "#18775B",
      start_date: phase.start_date ?? "",
      end_date: phase.end_date ?? "",
      active: phase.active,
    });

    setMessage(null);
    setError(null);
  }

  function updateField<K extends keyof PhaseForm>(
    field: K,
    value: PhaseForm[K],
  ) {
    setForm(current => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    setError(null);
    setMessage(null);

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
        "Phase end date cannot be before the start date.",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim() || null,
        icon: form.icon.trim() || "★",
        colour: form.colour.trim() || "#18775B",
        start_date:
          form.start_date || null,
        end_date:
          form.end_date || null,
        active: form.active,
      };

      if (editingId === null) {
        await api("/api/admin/phases", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Phase created successfully.");
      } else {
        await api(`/api/admin/phases/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage("Phase updated successfully.");
      }

      resetForm();
      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save phase.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activatePhase(id: number) {
    setActionId(id);
    setError(null);
    setMessage(null);

    try {
      await api(`/api/admin/phases/${id}/activate`, {
        method: "POST",
      });

      setMessage("Phase activated.");
      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to activate phase.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function deletePhase(phase: Phase) {
    const confirmed = window.confirm(
      `Delete "${phase.name}"?\n\nThis cannot be undone.`,
    );

    if (!confirmed) return;

    setActionId(phase.id);
    setError(null);
    setMessage(null);

    try {
      await api(`/api/admin/phases/${phase.id}`, {
        method: "DELETE",
      });

      if (editingId === phase.id) {
        resetForm();
      }

      setMessage("Phase deleted.");
      await loadPhases();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete phase.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="admin-phases">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#18775B",
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontSize: 12,
            }}
          >
            PROGRAMME STRUCTURE
          </p>

          <h1
            style={{
              margin: "6px 0 8px",
              fontSize: 32,
            }}
          >
            Phases
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              maxWidth: 700,
            }}
          >
            Create and manage the stages of the youth
            programme, including dates, visual identity and
            active phase state.
          </p>
        </div>

        {editingId !== null && (
          <button
            type="button"
            className="button"
            onClick={resetForm}
          >
            + New phase
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 10,
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <strong>
                Programme phases
              </strong>

              <span style={{ color: "#64748b" }}>
                {phases.length} phase
                {phases.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: 24 }}>
                Loading phases…
              </div>
            ) : phases.length === 0 ? (
              <div
                style={{
                  padding: 36,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    fontSize: 34,
                    marginBottom: 10,
                  }}
                >
                  ◇
                </div>

                <strong
                  style={{
                    display: "block",
                    color: "#334155",
                    marginBottom: 6,
                  }}
                >
                  No phases yet
                </strong>

                Create the first programme phase
                using the form.
              </div>
            ) : (
              phases.map(phase => (
                <div
                  key={phase.id}
                  style={{
                    padding: 20,
                    borderBottom:
                      "1px solid #e2e8f0",
                    display: "grid",
                    gridTemplateColumns:
                      "auto minmax(0, 1fr) auto",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background:
                        phase.colour || "#18775B",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {phase.icon || "★"}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>
                        {phase.name}
                      </strong>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding:
                            "4px 8px",
                          borderRadius: 999,
                          background:
                            phase.active
                              ? "#dcfce7"
                              : "#f1f5f9",
                          color:
                            phase.active
                              ? "#166534"
                              : "#64748b",
                        }}
                      >
                        {phase.active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginTop: 5,
                      }}
                    >
                      {formatDate(
                        phase.start_date,
                      )}{" "}
                      →{" "}
                      {formatDate(
                        phase.end_date,
                      )}
                    </div>

                    {phase.description && (
                      <div
                        style={{
                          color: "#475569",
                          fontSize: 13,
                          marginTop: 6,
                        }}
                      >
                        {phase.description}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      className="button"
                      onClick={() =>
                        editPhase(phase)
                      }
                    >
                      Edit
                    </button>

                    {!phase.active && (
                      <button
                        type="button"
                        className="button button--primary"
                        disabled={
                          actionId === phase.id
                        }
                        onClick={() =>
                          void activatePhase(
                            phase.id,
                          )
                        }
                      >
                        {actionId === phase.id
                          ? "…"
                          : "Activate"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="button"
                      disabled={
                        actionId === phase.id
                      }
                      onClick={() =>
                        void deletePhase(
                          phase,
                        )
                      }
                      style={{
                        color: "#b91c1c",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            padding: 22,
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 20,
            }}
          >
            {editingId === null
              ? "Create phase"
              : "Edit phase"}
          </h2>

          <p
            style={{
              margin: "0 0 20px",
              color: "#64748b",
              fontSize: 13,
            }}
          >
            Configure the phase shown throughout the
            programme.
          </p>

          <label
            style={{
              display: "block",
              marginBottom: 16,
            }}
          >
            <span className="form-label">
              Phase name
            </span>

            <input
              className="input"
              value={form.name}
              onChange={event =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              placeholder="e.g. Road Safety"
              required
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: 16,
            }}
          >
            <span className="form-label">
              Description
            </span>

            <textarea
              className="input"
              value={form.description}
              onChange={event =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="What happens during this phase?"
              rows={4}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <label>
              <span className="form-label">
                Icon
              </span>

              <input
                className="input"
                value={form.icon}
                onChange={event =>
                  updateField(
                    "icon",
                    event.target.value,
                  )
                }
                maxLength={50}
              />
            </label>

            <label>
              <span className="form-label">
                Colour
              </span>

              <input
                className="input"
                type="text"
                value={form.colour}
                onChange={event =>
                  updateField(
                    "colour",
                    event.target.value,
                  )
                }
                placeholder="#18775B"
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <label>
              <span className="form-label">
                Start date
              </span>

              <input
                className="input"
                type="date"
                value={form.start_date}
                onChange={event =>
                  updateField(
                    "start_date",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span className="form-label">
                End date
              </span>

              <input
                className="input"
                type="date"
                value={form.end_date}
                onChange={event =>
                  updateField(
                    "end_date",
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 22,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.active}
              onChange={event =>
                updateField(
                  "active",
                  event.target.checked,
                )
              }
            />

            <span>
              Phase is active
            </span>
          </label>

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button
              type="submit"
              className="button button--primary"
              disabled={saving}
              style={{
                flex: 1,
              }}
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
                className="button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
