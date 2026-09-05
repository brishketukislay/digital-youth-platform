import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Theme,
  ThemeRequest,
  activateTheme,
  createTheme,
  getApiErrorMessage,
  getThemes,
  updateTheme,
} from "../../api/client";

const DEFAULT_THEME: ThemeRequest = {
  name: "Forest",
  primary: "#18775B",
  secondary: "#0F513C",
  accent: "#43B98B",
  background: "#F3F7F5",
  surface: "#FFFFFF",
  text: "#17221E",
  logo_url: "",
  font_family: "",
};

const colourFields: Array<{
  key: keyof Pick<
    ThemeRequest,
    | "primary"
    | "secondary"
    | "accent"
    | "background"
    | "surface"
    | "text"
  >;
  label: string;
}> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
];

export default function AdminThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] =
    useState<ThemeRequest>({
      ...DEFAULT_THEME,
    });

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [activatingId, setActivatingId] =
    useState<number | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadThemes() {
    try {
      setLoading(true);
      setError("");

      const response =
        await getThemes();

      setThemes(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load themes.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadThemes();
  }, []);

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm({
      ...DEFAULT_THEME,
    });
  }

  function openCreate() {
    setMessage("");
    setError("");
    setEditingId(null);
    setForm({
      ...DEFAULT_THEME,
    });
    setShowForm(true);
  }

  function openEdit(theme: Theme) {
    setMessage("");
    setError("");

    setEditingId(theme.id);

    setForm({
      name: theme.name,
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      background: theme.background,
      surface: theme.surface,
      text: theme.text,
      logo_url: theme.logo_url ?? "",
      font_family:
        theme.font_family ?? "",
    });

    setShowForm(true);
  }

  function updateField(
    key: keyof ThemeRequest,
    value: string,
  ) {
    setForm(current => ({
      ...current,
      [key]: value,
    }));
  }

  async function save(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Theme name is required.",
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload: ThemeRequest = {
        name: form.name.trim(),
        primary: form.primary.trim(),
        secondary:
          form.secondary.trim(),
        accent: form.accent.trim(),
        background:
          form.background.trim(),
        surface: form.surface.trim(),
        text: form.text.trim(),
        logo_url:
          form.logo_url?.trim() || null,
        font_family:
          form.font_family?.trim() || null,
      };

      if (editingId !== null) {
        await updateTheme(
          editingId,
          payload,
        );

        setMessage(
          "Theme updated successfully.",
        );
      } else {
        await createTheme(
          payload,
        );

        setMessage(
          "Theme created successfully.",
        );
      }

      resetForm();
      await loadThemes();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to save theme.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function activate(
    theme: Theme,
  ) {
    if (theme.selected) {
      return;
    }

    try {
      setActivatingId(theme.id);
      setMessage("");
      setError("");

      await activateTheme(
        theme.id,
      );

      setMessage(
        `${theme.name} is now the active theme.`,
      );

      await loadThemes();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to activate theme.",
        ),
      );
    } finally {
      setActivatingId(null);
    }
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            PROGRAMME
          </div>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Themes
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Configure the visual identity used across the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-slate-400">
          Loading themes…
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            PROGRAMME
          </div>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Themes
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Control colours, typography and visual identity without changing frontend code.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          + New theme
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={save}
          className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {editingId === null
                  ? "Create theme"
                  : "Edit theme"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Define the visual system for the programme.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Theme name
              </span>

              <input
                value={form.name}
                onChange={event =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Forest"
              />
            </label>

            {colourFields.map(
              field => (
                <label key={field.key}>
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    {field.label}
                  </span>

                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(
                          form[field.key],
                        )
                          ? form[field.key]
                          : "#18775B"
                      }
                      onChange={event =>
                        updateField(
                          field.key,
                          event.target.value,
                        )
                      }
                      className="h-12 w-14 cursor-pointer rounded-lg border border-white/10 bg-slate-950"
                    />

                    <input
                      value={
                        form[field.key]
                      }
                      onChange={event =>
                        updateField(
                          field.key,
                          event.target.value,
                        )
                      }
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </label>
              ),
            )}

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Logo URL
              </span>

              <input
                value={
                  form.logo_url ?? ""
                }
                onChange={event =>
                  updateField(
                    "logo_url",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="https://…"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Font family
              </span>

              <input
                value={
                  form.font_family ?? ""
                }
                onChange={event =>
                  updateField(
                    "font_family",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Inter, system-ui, sans-serif"
              />
            </label>
          </div>

          <div
            className="mt-6 rounded-2xl p-6"
            style={{
              background:
                form.background,
              color: form.text,
            }}
          >
            <div
              className="rounded-xl p-5"
              style={{
                background:
                  form.surface,
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  color:
                    form.accent,
                }}
              >
                LIVE PREVIEW
              </div>

              <div
                className="mt-2 text-2xl font-bold"
                style={{
                  color:
                    form.primary,
                }}
              >
                {form.name ||
                  "Theme preview"}
              </div>

              <p className="mt-2 opacity-80">
                This is how the selected visual system will feel.
              </p>

              <button
                type="button"
                className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  background:
                    form.primary,
                  color:
                    form.surface,
                }}
              >
                Example action
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editingId === null
                  ? "Create theme"
                  : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900 p-10 text-center">
          <div className="text-4xl">✦</div>

          <h2 className="mt-4 text-lg font-semibold text-white">
            No themes configured
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Create your first visual theme for the programme.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {themes.map(theme => (
            <article
              key={theme.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
            >
              <div
                className="h-24"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">
                        {theme.name}
                      </h2>

                      {theme.selected && (
                        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Theme #{theme.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(theme)
                    }
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    Edit
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Primary", theme.primary],
                    ["Secondary", theme.secondary],
                    ["Accent", theme.accent],
                    ["Background", theme.background],
                    ["Surface", theme.surface],
                    ["Text", theme.text],
                  ].map(
                    ([label, colour]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-slate-950 p-3"
                      >
                        <div
                          className="h-10 rounded-lg"
                          style={{
                            background:
                              colour,
                          }}
                        />

                        <div className="mt-2 text-xs text-slate-400">
                          {label}
                        </div>

                        <div className="mt-1 font-mono text-[11px] text-slate-300">
                          {colour}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      theme.selected ||
                      activatingId ===
                        theme.id
                    }
                    onClick={() =>
                      void activate(
                        theme,
                      )
                    }
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {theme.selected
                      ? "Active theme"
                      : activatingId ===
                          theme.id
                        ? "Activating…"
                        : "Use this theme"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
