import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../../components/Layout";

import {
  GameMap,
  MapLocation,
  Phase,
  Programme,
  Theme,
  createMap,
  createMapLocation,
  createPhase,
  createTheme,
  getApiErrorMessage,
  getMaps,
  getMapLocations,
  getPhases,
  getProgramme,
  getThemes,
  activateMap,
  activateTheme,
  updateMap,
  updateMapLocation,
  updateProgramme,
  updateTheme,
} from "../../api/client";

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_THEME = {
  name: "Forest",
  primary: "#18775B",
  secondary: "#0F513C",
  accent: "#43B98B",
  background: "#F3F7F5",
  surface: "#FFFFFF",
  text: "#17221E",
};

const DEFAULT_MAP = {
  name: "Cumbernauld",
  description:
    "Young-person co-designed programme map of Cumbernauld.",
  background_image: "",
};

const DEFAULT_PHASE = {
  name: "",
  description: "",
  colour: "#18775B",
  icon: "★",
  start_date: "",
  end_date: "",
  active: true,
};

const DEFAULT_LOCATION = {
  name: "",
  description: "",
  x: 0.5,
  y: 0.5,
  icon: "pin",
};

/* ============================================================
   HELPERS
============================================================ */

function formatDate(
  value: string | null | undefined,
) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function clamp01(value: number) {
  return Math.min(
    1,
    Math.max(0, value),
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AdminProgramme() {
  const [programme, setProgramme] =
    useState<Programme | null>(null);

  const [themes, setThemes] =
    useState<Theme[]>([]);

  const [maps, setMaps] =
    useState<GameMap[]>([]);

  const [phases, setPhases] =
    useState<Phase[]>([]);

  const [locations, setLocations] =
    useState<MapLocation[]>([]);

  const [selectedMapId, setSelectedMapId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [savingProgramme, setSavingProgramme] =
    useState(false);

  const [savingTheme, setSavingTheme] =
    useState(false);

  const [savingMap, setSavingMap] =
    useState(false);

  const [savingPhase, setSavingPhase] =
    useState(false);

  const [savingLocation, setSavingLocation] =
    useState(false);

  const [editingThemeId, setEditingThemeId] =
    useState<number | null>(null);

  const [editingMapId, setEditingMapId] =
    useState<number | null>(null);

  const [editingLocationId, setEditingLocationId] =
    useState<number | null>(null);

  const [showThemeForm, setShowThemeForm] =
    useState(false);

  const [showMapForm, setShowMapForm] =
    useState(false);

  const [showPhaseForm, setShowPhaseForm] =
    useState(false);

  const [showLocationForm, setShowLocationForm] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [themeForm, setThemeForm] =
    useState(DEFAULT_THEME);

  const [mapForm, setMapForm] =
    useState(DEFAULT_MAP);

  const [phaseForm, setPhaseForm] =
    useState(DEFAULT_PHASE);

  const [locationForm, setLocationForm] =
    useState(DEFAULT_LOCATION);

  /* ==========================================================
     LOAD
  ========================================================== */

  async function loadProgrammeData(
    preserveMap = true,
  ) {
    try {
      setLoading(true);
      setError("");

      const [
        programmeResponse,
        themesResponse,
        mapsResponse,
        phasesResponse,
      ] = await Promise.all([
        getProgramme(),
        getThemes(),
        getMaps(),
        getPhases(),
      ]);

      const nextProgramme =
        programmeResponse.data;

      const nextThemes =
        themesResponse.data;

      const nextMaps =
        mapsResponse.data;

      const nextPhases =
        phasesResponse.data;

      setProgramme(nextProgramme);
      setThemes(nextThemes);
      setMaps(nextMaps);
      setPhases(nextPhases);

      const activeMapId =
        nextProgramme.map_id ??
        nextMaps.find(
          map => map.active,
        )?.id ??
        null;

      if (
        preserveMap &&
        selectedMapId &&
        nextMaps.some(
          map =>
            map.id === selectedMapId,
        )
      ) {
        setSelectedMapId(
          selectedMapId,
        );
      } else {
        setSelectedMapId(
          activeMapId ??
            nextMaps[0]?.id ??
            null,
        );
      }

      if (activeMapId) {
        const response =
          await getMapLocations(
            activeMapId,
          );

        setLocations(
          response.data,
        );
      } else {
        setLocations([]);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load programme configuration.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProgrammeData(
      false,
    );
  }, []);

  /* ==========================================================
     SELECTED MAP
  ========================================================== */

  useEffect(() => {
    if (!selectedMapId) {
      setLocations([]);
      return;
    }

    let cancelled = false;

    async function loadLocations() {
      try {
        const response =
          await getMapLocations(
            selectedMapId!,
          );

        if (!cancelled) {
          setLocations(
            response.data,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Unable to load map locations.",
            ),
          );
        }
      }
    }

    void loadLocations();

    return () => {
      cancelled = true;
    };
  }, [selectedMapId]);

  /* ==========================================================
     DERIVED STATE
  ========================================================== */

  const activeTheme = useMemo(
    () =>
      themes.find(
        theme =>
          theme.id ===
          programme?.theme_id,
      ) ?? null,
    [themes, programme],
  );

  const activeMap = useMemo(
    () =>
      maps.find(
        map =>
          map.id ===
          programme?.map_id,
      ) ?? null,
    [maps, programme],
  );

  const activePhase = useMemo(
    () =>
      phases.find(
        phase =>
          phase.id ===
          programme?.phase_id,
      ) ?? null,
    [phases, programme],
  );

  /* ==========================================================
     NOTICES
  ========================================================== */

  function clearNotices() {
    setMessage("");
    setError("");
  }

  function success(text: string) {
    setError("");
    setMessage(text);
  }

  function failure(
    err: unknown,
    fallback: string,
  ) {
    setMessage("");
    setError(
      getApiErrorMessage(
        err,
        fallback,
      ),
    );
  }

  /* ==========================================================
     PROGRAMME
  ========================================================== */

  async function saveProgramme(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!programme) return;

    try {
      setSavingProgramme(true);
      clearNotices();

      if (
        !programme.name.trim()
      ) {
        setError(
          "Programme name is required.",
        );
        return;
      }

      if (
        !Number.isFinite(
          programme.target_xp,
        ) ||
        programme.target_xp <= 0
      ) {
        setError(
          "Target XP must be greater than zero.",
        );
        return;
      }

      if (
        programme.weekly_target_xp !== null &&
        programme.weekly_target_xp !== undefined &&
        (
          !Number.isFinite(
            programme.weekly_target_xp,
          ) ||
          programme.weekly_target_xp < 0
        )
      ) {
        setError(
          "Weekly target XP must be zero or greater.",
        );
        return;
      }

      if (
        !Number.isFinite(
          programme.max_group_penalty_percent,
        ) ||
        programme.max_group_penalty_percent < 0 ||
        programme.max_group_penalty_percent > 100
      ) {
        setError(
          "Maximum group penalty must be between 0% and 100%.",
        );
        return;
      }

      if (
        programme.start_date &&
        programme.end_date &&
        programme.end_date <
          programme.start_date
      ) {
        setError(
          "The programme end date cannot be before the start date.",
        );
        return;
      }

      await updateProgramme({
        name:
          programme.name.trim(),
        description:
          programme.description?.trim() ||
          null,
        start_date:
          programme.start_date ||
          null,
        end_date:
          programme.end_date ||
          null,
        target_xp:
          Number(
            programme.target_xp,
          ),
        weekly_target_xp:
          programme.weekly_target_xp === null ||
          programme.weekly_target_xp === undefined
            ? null
            : Number(
                programme.weekly_target_xp,
              ),
        max_group_penalty_percent:
          Number(
            programme.max_group_penalty_percent,
          ),
      });

      success(
        "Programme settings saved.",
      );

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to save programme settings.",
      );
    } finally {
      setSavingProgramme(false);
    }
  }

  /* ==========================================================
     THEME
  ========================================================== */

  function openNewTheme() {
    clearNotices();
    setEditingThemeId(null);
    setThemeForm({
      ...DEFAULT_THEME,
    });
    setShowThemeForm(true);
  }

  function editTheme(
    theme: Theme,
  ) {
    clearNotices();

    setEditingThemeId(
      theme.id,
    );

    setThemeForm({
      name: theme.name,
      primary: theme.primary,
      secondary:
        theme.secondary,
      accent: theme.accent,
      background:
        theme.background,
      surface: theme.surface,
      text: theme.text,
    });

    setShowThemeForm(true);
  }

  function cancelTheme() {
    setEditingThemeId(null);
    setShowThemeForm(false);
    setThemeForm({
      ...DEFAULT_THEME,
    });
  }

  async function saveTheme(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setSavingTheme(true);
      clearNotices();

      if (
        !themeForm.name.trim()
      ) {
        setError(
          "Theme name is required.",
        );
        return;
      }

      if (editingThemeId) {
        await updateTheme(
          editingThemeId,
          themeForm,
        );

        success(
          "Theme updated.",
        );
      } else {
        await createTheme(
          themeForm,
        );

        success(
          "Theme created.",
        );
      }

      cancelTheme();

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to save theme.",
      );
    } finally {
      setSavingTheme(false);
    }
  }

  async function useTheme(
    theme: Theme,
  ) {
    if (
      programme?.theme_id ===
      theme.id
    ) {
      return;
    }

    try {
      clearNotices();

      await activateTheme(
        theme.id,
      );

      success(
        `${theme.name} is now the active theme.`,
      );

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to activate theme.",
      );
    }
  }

  /* ==========================================================
     MAPS
  ========================================================== */

  function openNewMap() {
    clearNotices();

    setEditingMapId(null);

    setMapForm({
      ...DEFAULT_MAP,
    });

    setShowMapForm(true);
  }

  function editMap(
    map: GameMap,
  ) {
    clearNotices();

    setEditingMapId(
      map.id,
    );

    setMapForm({
      name: map.name,
      description:
        map.description ?? "",
      background_image:
        map.background_image ??
        "",
    });

    setShowMapForm(true);
  }

  function cancelMap() {
    setEditingMapId(null);
    setShowMapForm(false);

    setMapForm({
      ...DEFAULT_MAP,
    });
  }

  async function saveMap(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setSavingMap(true);
      clearNotices();

      if (
        !mapForm.name.trim()
      ) {
        setError(
          "Map name is required.",
        );
        return;
      }

      if (editingMapId) {
        await updateMap(
          editingMapId,
          {
            name:
              mapForm.name.trim(),
            description:
              mapForm.description.trim() ||
              null,
            background_image:
              mapForm.background_image.trim() ||
              null,
          },
        );

        success(
          "Map updated.",
        );
      } else {
        const response =
          await createMap({
            name:
              mapForm.name.trim(),
            description:
              mapForm.description.trim() ||
              null,
            background_image:
              mapForm.background_image.trim() ||
              null,
          });

        setSelectedMapId(
          response.data.id,
        );

        success(
          "Map created.",
        );
      }

      cancelMap();

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to save map.",
      );
    } finally {
      setSavingMap(false);
    }
  }

  async function useMap(
    map: GameMap,
  ) {
    if (
      programme?.map_id ===
      map.id
    ) {
      return;
    }

    try {
      clearNotices();

      await activateMap(
        map.id,
      );

      setSelectedMapId(
        map.id,
      );

      success(
        `${map.name} is now the active map.`,
      );

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to activate map.",
      );
    }
  }

  /* ==========================================================
     PHASES
  ========================================================== */

  function openNewPhase() {
    clearNotices();

    setPhaseForm({
      ...DEFAULT_PHASE,
    });

    setShowPhaseForm(true);
  }

  function cancelPhase() {
    setShowPhaseForm(false);

    setPhaseForm({
      ...DEFAULT_PHASE,
    });
  }

  async function savePhase(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setSavingPhase(true);
      clearNotices();

      if (
        !phaseForm.name.trim()
      ) {
        setError(
          "Phase name is required.",
        );
        return;
      }

      if (
        phaseForm.start_date &&
        phaseForm.end_date &&
        phaseForm.end_date <
          phaseForm.start_date
      ) {
        setError(
          "The phase end date cannot be before the start date.",
        );
        return;
      }

      await createPhase({
        name:
          phaseForm.name.trim(),
        description:
          phaseForm.description.trim() ||
          null,
        colour:
          phaseForm.colour,
        icon:
          phaseForm.icon ||
          "★",
        start_date:
          phaseForm.start_date ||
          null,
        end_date:
          phaseForm.end_date ||
          null,
        active:
          phaseForm.active,
      });

      success(
        `${phaseForm.name.trim()} phase created.`,
      );

      cancelPhase();

      await loadProgrammeData();
    } catch (err) {
      failure(
        err,
        "Unable to create phase.",
      );
    } finally {
      setSavingPhase(false);
    }
  }

  /* ==========================================================
     LOCATIONS
  ========================================================== */

  function openNewLocation() {
    if (!selectedMapId) {
      setError(
        "Select a map before adding a location.",
      );
      return;
    }

    clearNotices();

    setEditingLocationId(
      null,
    );

    setLocationForm({
      ...DEFAULT_LOCATION,
    });

    setShowLocationForm(
      true,
    );
  }

  function editLocation(
    location: MapLocation,
  ) {
    clearNotices();

    setEditingLocationId(
      location.id,
    );

    setLocationForm({
      name: location.name,
      description:
        location.description ??
        "",
      x: location.x,
      y: location.y,
      icon:
        location.icon ||
        "pin",
    });

    setShowLocationForm(
      true,
    );
  }

  function cancelLocation() {
    setEditingLocationId(null);
    setShowLocationForm(false);

    setLocationForm({
      ...DEFAULT_LOCATION,
    });
  }

  async function saveLocation(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selectedMapId) {
      setError(
        "Select a map before saving a location.",
      );
      return;
    }

    try {
      setSavingLocation(
        true,
      );

      clearNotices();

      const x =
        clamp01(
          Number(
            locationForm.x,
          ),
        );

      const y =
        clamp01(
          Number(
            locationForm.y,
          ),
        );

      if (
        !locationForm.name.trim()
      ) {
        setError(
          "Location name is required.",
        );
        return;
      }

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        setError(
          "Map coordinates must be valid numbers.",
        );
        return;
      }

      const payload = {
        name:
          locationForm.name.trim(),
        description:
          locationForm.description.trim() ||
          null,
        x,
        y,
        icon:
          locationForm.icon.trim() ||
          "pin",
      };

      if (
        editingLocationId
      ) {
        await updateMapLocation(
          editingLocationId,
          payload,
        );

        success(
          "Map location updated.",
        );
      } else {
        await createMapLocation(
          selectedMapId,
          payload,
        );

        success(
          "Map location created.",
        );
      }

      cancelLocation();

      const response =
        await getMapLocations(
          selectedMapId,
        );

      setLocations(
        response.data,
      );
    } catch (err) {
      failure(
        err,
        "Unable to save map location.",
      );
    } finally {
      setSavingLocation(
        false,
      );
    }
  }

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Layout title="Programme Configuration">
        <section className="hero">
          <div className="eyebrow hero-eyebrow">
            PROGRAMME
          </div>

          <h1>
            Programme configuration
          </h1>

          <p>
            Loading the current
            programme configuration…
          </p>
        </section>

        <section className="card">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>
              Loading programme,
              themes, maps and phases…
            </span>
          </div>
        </section>
      </Layout>
    );
  }

  if (!programme) {
    return (
      <Layout title="Programme Configuration">
        <section className="hero">
          <div className="eyebrow hero-eyebrow">
            PROGRAMME
          </div>

          <h1>
            Programme configuration
          </h1>

          <p>
            There is currently no
            active programme available
            to configure.
          </p>
        </section>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}
      </Layout>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <Layout title="Programme Configuration">
      <section className="hero">
        <div className="eyebrow hero-eyebrow">
          PROGRAMME CONTROL
        </div>

        <h1>
          Programme configuration
        </h1>

        <p>
          Configure the live programme
          without changing application
          code.
        </p>
      </section>

      {message && (
        <div
          className="notice"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="notice error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ======================================================
          LIVE CONFIGURATION SUMMARY
      ====================================================== */}

      <section className="stats-grid">
        <div className="stat-card">
          <span>ACTIVE THEME</span>

          <strong className="stat-text">
            {activeTheme?.name ??
              "Not configured"}
          </strong>
        </div>

        <div className="stat-card">
          <span>ACTIVE MAP</span>

          <strong className="stat-text">
            {activeMap?.name ??
              "Not configured"}
          </strong>
        </div>

        <div className="stat-card">
          <span>ACTIVE PHASE</span>

          <strong className="stat-text">
            {activePhase?.name ??
              "Not configured"}
          </strong>
        </div>

        <div className="stat-card">
          <span>GROUP TARGET</span>

          <strong>
            {programme.target_xp.toLocaleString()}
            <small> XP</small>
          </strong>
        </div>
      </section>

      {/* ======================================================
          PROGRAMME
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              CORE SETTINGS
            </div>

            <h2>
              Programme
            </h2>

            <p className="muted">
              Set the programme identity,
              delivery dates and collective
              jackpot target.
            </p>
          </div>

          <span className="admin-icon">
            ⚙️
          </span>
        </div>

        <form
          onSubmit={
            saveProgramme
          }
        >
          <div className="form-grid">
            <label>
              Programme name

              <input
                value={
                  programme.name
                }
                onChange={event =>
                  setProgramme({
                    ...programme,
                    name:
                      event.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Collective target XP

              <input
                type="number"
                min="1"
                step="1"
                value={
                  programme.target_xp
                }
                onChange={event =>
                  setProgramme({
                    ...programme,
                    target_xp:
                      Number(
                        event.target.value,
                      ),
                  })
                }
                required
              />
            </label>

            <label>
              Weekly target XP

              <input
                type="number"
                min="0"
                step="1"
                value={
                  programme.weekly_target_xp ?? ""
                }
                onChange={event =>
                  setProgramme({
                    ...programme,
                    weekly_target_xp:
                      event.target.value === ""
                        ? null
                        : Number(
                            event.target.value,
                          ),
                  })
                }
                placeholder="5000"
              />

              <span className="muted">
                Target group XP earned per week.
              </span>
            </label>

            <label>
              Maximum group penalty

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    programme.max_group_penalty_percent
                  }
                  onChange={event =>
                    setProgramme({
                      ...programme,
                      max_group_penalty_percent:
                        Number(
                          event.target.value,
                        ),
                    })
                  }
                  className="pr-10"
                  placeholder="10"
                />

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                  %
                </span>
              </div>

              <span className="muted">
                Maximum reduction applied to group rewards.
              </span>
            </label>

            <label>
              Start date

              <input
                type="date"
                value={
                  programme.start_date ??
                  ""
                }
                onChange={event =>
                  setProgramme({
                    ...programme,
                    start_date:
                      event.target.value ||
                      null,
                  })
                }
              />
            </label>

            <label>
              End date

              <input
                type="date"
                value={
                  programme.end_date ??
                  ""
                }
                onChange={event =>
                  setProgramme({
                    ...programme,
                    end_date:
                      event.target.value ||
                      null,
                  })
                }
              />
            </label>
          </div>

          <label>
            Programme description

            <textarea
              value={
                programme.description ??
                ""
              }
              rows={4}
              onChange={event =>
                setProgramme({
                  ...programme,
                  description:
                    event.target.value,
                })
              }
              placeholder="Describe the purpose and current delivery model of the programme."
            />
          </label>

          <div className="button-row">
            <button
              className="btn"
              type="submit"
              disabled={
                savingProgramme
              }
            >
              {savingProgramme
                ? "Saving…"
                : "Save programme"}
            </button>
          </div>
        </form>
      </section>

      {/* ======================================================
          PHASES
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PROGRAMME STRUCTURE
            </div>

            <h2>
              Phases
            </h2>

            <p className="muted">
              Themes such as Art, Civic
              Safety and Sport can be
              represented as programme
              phases.
            </p>
          </div>

          <button
            className="btn"
            type="button"
            onClick={
              openNewPhase
            }
          >
            Add phase
          </button>
        </div>

        {showPhaseForm && (
          <form
            className="inline-editor"
            onSubmit={
              savePhase
            }
          >
            <div className="editor-heading">
              <div>
                <strong>
                  New programme phase
                </strong>

                <span className="muted">
                  Configure the phase
                  metadata used by the
                  player experience.
                </span>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={
                  cancelPhase
                }
              >
                Cancel
              </button>
            </div>

            <div className="form-grid">
              <label>
                Phase name

                <input
                  value={
                    phaseForm.name
                  }
                  onChange={event =>
                    setPhaseForm({
                      ...phaseForm,
                      name:
                        event.target.value,
                    })
                  }
                  placeholder="e.g. Art"
                  required
                />
              </label>

              <label>
                Icon

                <input
                  value={
                    phaseForm.icon
                  }
                  onChange={event =>
                    setPhaseForm({
                      ...phaseForm,
                      icon:
                        event.target.value,
                    })
                  }
                  maxLength={8}
                  placeholder="🎨"
                />
              </label>

              <label>
                Start date

                <input
                  type="date"
                  value={
                    phaseForm.start_date
                  }
                  onChange={event =>
                    setPhaseForm({
                      ...phaseForm,
                      start_date:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                End date

                <input
                  type="date"
                  value={
                    phaseForm.end_date
                  }
                  onChange={event =>
                    setPhaseForm({
                      ...phaseForm,
                      end_date:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Phase colour

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      phaseForm.colour
                    }
                    onChange={event =>
                      setPhaseForm({
                        ...phaseForm,
                        colour:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      phaseForm.colour
                    }
                  </code>
                </div>
              </label>
            </div>

            <label>
              Description

              <textarea
                rows={3}
                value={
                  phaseForm.description
                }
                onChange={event =>
                  setPhaseForm({
                    ...phaseForm,
                    description:
                      event.target.value,
                  })
                }
                placeholder="What is this phase about?"
              />
            </label>

            <div className="button-row">
              <button
                className="btn"
                type="submit"
                disabled={
                  savingPhase
                }
              >
                {savingPhase
                  ? "Creating…"
                  : "Create phase"}
              </button>
            </div>
          </form>
        )}

        <div className="admin-list">
          {phases.length === 0 ? (
            <div className="empty-state">
              <span>🧭</span>

              <p>
                No programme phases
                have been configured.
              </p>
            </div>
          ) : (
            phases.map(phase => {
              const active =
                phase.id ===
                programme.phase_id;

              return (
                <div
                  className="admin-row"
                  key={phase.id}
                >
                  <div
                    className="phase-colour"
                    style={{
                      background:
                        phase.colour,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div className="row-heading">
                      <strong>
                        {phase.icon}{" "}
                        {phase.name}
                      </strong>

                      {active && (
                        <span className="status-pill">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="muted">
                      {phase.description ||
                        "No description"}
                    </div>

                    <small className="muted">
                      {formatDate(
                        phase.start_date,
                      )}{" "}
                      →{" "}
                      {formatDate(
                        phase.end_date,
                      )}
                    </small>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="configuration-note">
          <strong>
            Phase activation
          </strong>

          <p>
            The current backend exposes
            phase creation but does not
            yet expose an activation/update
            endpoint. This screen therefore
            does not pretend that a phase can
            be activated when the server
            cannot persist that operation.
          </p>
        </div>
      </section>

      {/* ======================================================
          THEMES
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              VISUAL IDENTITY
            </div>

            <h2>
              Themes
            </h2>

            <p className="muted">
              Change the visual language
              between programme phases
              without redeploying the
              application.
            </p>
          </div>

          <button
            className="btn"
            type="button"
            onClick={
              openNewTheme
            }
          >
            Add theme
          </button>
        </div>

        {showThemeForm && (
          <form
            className="inline-editor"
            onSubmit={
              saveTheme
            }
          >
            <div className="editor-heading">
              <div>
                <strong>
                  {editingThemeId
                    ? "Edit theme"
                    : "New theme"}
                </strong>

                <span className="muted">
                  Theme colours are stored
                  by the backend.
                </span>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={
                  cancelTheme
                }
              >
                Cancel
              </button>
            </div>

            <div className="form-grid">
              <label>
                Name

                <input
                  value={
                    themeForm.name
                  }
                  onChange={event =>
                    setThemeForm({
                      ...themeForm,
                      name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Primary

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      themeForm.primary
                    }
                    onChange={event =>
                      setThemeForm({
                        ...themeForm,
                        primary:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      themeForm.primary
                    }
                  </code>
                </div>
              </label>

              <label>
                Secondary

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      themeForm.secondary
                    }
                    onChange={event =>
                      setThemeForm({
                        ...themeForm,
                        secondary:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      themeForm.secondary
                    }
                  </code>
                </div>
              </label>

              <label>
                Accent

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      themeForm.accent
                    }
                    onChange={event =>
                      setThemeForm({
                        ...themeForm,
                        accent:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      themeForm.accent
                    }
                  </code>
                </div>
              </label>

              <label>
                Background

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      themeForm.background
                    }
                    onChange={event =>
                      setThemeForm({
                        ...themeForm,
                        background:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      themeForm.background
                    }
                  </code>
                </div>
              </label>

              <label>
                Surface

                <div className="colour-input">
                  <input
                    type="color"
                    value={
                      themeForm.surface
                    }
                    onChange={event =>
                      setThemeForm({
                        ...themeForm,
                        surface:
                          event.target.value,
                      })
                    }
                  />

                  <code>
                    {
                      themeForm.surface
                    }
                  </code>
                </div>
              </label>
              </div>

<label>
  Text
  <div className="colour-input">
    <input
      type="color"
      value={themeForm.text}
      onChange={event =>
        setThemeForm({
          ...themeForm,
          text: event.target.value,
        })
      }
    />

    <code>
      {themeForm.text}
    </code>
  </div>
</label>


            <div
              className="theme-live-preview"
              style={{
                background:
                  themeForm.background,
                color:
                  themeForm.text,
              }}
            >
              <div
                className="theme-preview-banner"
                style={{
                  background:
                    themeForm.primary,
                }}
              >
                <strong>
                  {themeForm.name ||
                    "Theme preview"}
                </strong>

                <span>
                  Digital Youth
                  Platform
                </span>
              </div>

              <div className="theme-preview-body">
                <div
                  className="theme-preview-card"
                  style={{
                    borderColor:
                      themeForm.accent,
                  }}
                >
                  <span
                    style={{
                      color:
                        themeForm.secondary,
                    }}
                  >
                    XP PROGRESS
                  </span>

                  <strong>
                    750,000 XP
                  </strong>

                  <div
                    className="theme-preview-bar"
                    style={{
                      background:
                        themeForm.surface,
                    }}
                  >
                    <div
                      style={{
                        background:
                          themeForm.accent,
                        width:
                          "68%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="button-row">
              <button
                className="btn"
                type="submit"
                disabled={
                  savingTheme
                }
              >
                {savingTheme
                  ? "Saving…"
                  : editingThemeId
                    ? "Save theme"
                    : "Create theme"}
              </button>
            </div>
          </form>
        )}

        <div className="theme-grid">
          {themes.length === 0 ? (
            <div className="empty-state">
              <span>🎨</span>

              <p>
                No themes have been
                configured yet.
              </p>
            </div>
          ) : (
            themes.map(theme => {
              const active =
                theme.id ===
                programme.theme_id;

              return (
                <article
                  className="theme-card"
                  key={theme.id}
                  style={{
                    background:
                      theme.background,
                    color:
                      theme.text,
                    borderColor:
                      active
                        ? theme.accent
                        : "transparent",
                  }}
                >
                  <div
                    className="theme-preview"
                    style={{
                      background:
                        theme.primary,
                    }}
                  >
                    <strong>
                      {theme.name}
                    </strong>

                    {active && (
                      <span>
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="theme-swatches">
                    <span
                      title="Primary"
                      style={{
                        background:
                          theme.primary,
                      }}
                    />

                    <span
                      title="Secondary"
                      style={{
                        background:
                          theme.secondary,
                      }}
                    />

                    <span
                      title="Accent"
                      style={{
                        background:
                          theme.accent,
                      }}
                    />

                    <span
                      title="Background"
                      style={{
                        background:
                          theme.background,
                      }}
                    />
                  </div>

                  <div className="button-row">
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() =>
                        editTheme(
                          theme,
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="btn"
                      type="button"
                      disabled={
                        active
                      }
                      onClick={() =>
                        useTheme(
                          theme,
                        )
                      }
                    >
                      {active
                        ? "Active"
                        : "Use theme"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* ======================================================
          MAPS
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              GAME WORLD
            </div>

            <h2>
              Programme map
            </h2>

            <p className="muted">
              Manage the stylised
              geographical world used by
              the game.
            </p>
          </div>

          <button
            className="btn"
            type="button"
            onClick={
              openNewMap
            }
          >
            Add map
          </button>
        </div>

        {showMapForm && (
          <form
            className="inline-editor"
            onSubmit={
              saveMap
            }
          >
            <div className="editor-heading">
              <div>
                <strong>
                  {editingMapId
                    ? "Edit map"
                    : "New map"}
                </strong>

                <span className="muted">
                  A map can later contain
                  multiple named locations.
                </span>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={
                  cancelMap
                }
              >
                Cancel
              </button>
            </div>

            <div className="form-grid">
              <label>
                Map name

                <input
                  value={
                    mapForm.name
                  }
                  onChange={event =>
                    setMapForm({
                      ...mapForm,
                      name:
                        event.target.value,
                    })
                  }
                  placeholder="Cumbernauld"
                  required
                />
              </label>

              <label>
                Background image URL

                <input
                  type="url"
                  value={
                    mapForm.background_image
                  }
                  onChange={event =>
                    setMapForm({
                      ...mapForm,
                      background_image:
                        event.target.value,
                    })
                  }
                  placeholder="https://…"
                />
              </label>
            </div>

            <label>
              Description

              <textarea
                rows={3}
                value={
                  mapForm.description
                }
                onChange={event =>
                  setMapForm({
                    ...mapForm,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Describe the map."
              />
            </label>

            <div className="button-row">
              <button
                className="btn"
                type="submit"
                disabled={
                  savingMap
                }
              >
                {savingMap
                  ? "Saving…"
                  : editingMapId
                    ? "Save map"
                    : "Create map"}
              </button>
            </div>
          </form>
        )}

        <div className="map-list">
          {maps.length === 0 ? (
            <div className="empty-state">
              <span>🗺️</span>

              <p>
                No maps have been
                configured.
              </p>
            </div>
          ) : (
            maps.map(map => {
              const active =
                map.id ===
                programme.map_id;

              const selected =
                map.id ===
                selectedMapId;

              return (
                <button
                  className={`map-row ${
                    selected
                      ? "selected"
                      : ""
                  }`}
                  key={map.id}
                  type="button"
                  onClick={() =>
                    setSelectedMapId(
                      map.id,
                    )
                  }
                >
                  <div className="map-row-preview">
                    {map.background_image ? (
                      <img
                        src={
                          map.background_image
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        🗺️
                      </span>
                    )}
                  </div>

                  <div className="map-row-info">
                    <div className="row-heading">
                      <strong>
                        {map.name}
                      </strong>

                      {active && (
                        <span className="status-pill">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p>
                      {map.description ||
                        "No description"}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        editMap(
                          map,
                        );
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn"
                      type="button"
                      disabled={
                        active
                      }
                      onClick={event => {
                        event.stopPropagation();
                        void useMap(
                          map,
                        );
                      }}
                    >
                      {active
                        ? "Active"
                        : "Use map"}
                    </button>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* ======================================================
          MAP LOCATIONS
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              MAP CONTENT
            </div>

            <h2>
              Map locations
            </h2>

            <p className="muted">
              Add named points of interest
              to the selected map. Coordinates
              are stored as percentages from
              the top-left of the map.
            </p>
          </div>

          <button
            className="btn"
            type="button"
            onClick={
              openNewLocation
            }
            disabled={
              !selectedMapId
            }
          >
            Add location
          </button>
        </div>

        <div className="map-selector">
          <label>
            Editing map

            <select
              value={
                selectedMapId ??
                ""
              }
              onChange={event =>
                setSelectedMapId(
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : null,
                )
              }
            >
              <option value="">
                Select a map
              </option>

              {maps.map(map => (
                <option
                  key={map.id}
                  value={map.id}
                >
                  {map.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {showLocationForm && (
          <form
            className="inline-editor"
            onSubmit={
              saveLocation
            }
          >
            <div className="editor-heading">
              <div>
                <strong>
                  {editingLocationId
                    ? "Edit location"
                    : "New map location"}
                </strong>

                <span className="muted">
                  Coordinates range from
                  0 to 1.
                </span>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={
                  cancelLocation
                }
              >
                Cancel
              </button>
            </div>

            <div className="form-grid">
              <label>
                Location name

                <input
                  value={
                    locationForm.name
                  }
                  onChange={event =>
                    setLocationForm({
                      ...locationForm,
                      name:
                        event.target.value,
                    })
                  }
                  placeholder="Central Park"
                  required
                />
              </label>

              <label>
                Icon

                <input
                  value={
                    locationForm.icon
                  }
                  onChange={event =>
                    setLocationForm({
                      ...locationForm,
                      icon:
                        event.target.value,
                    })
                  }
                  placeholder="pin"
                />
              </label>

              <label>
                X position

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={
                    locationForm.x
                  }
                  onChange={event =>
                    setLocationForm({
                      ...locationForm,
                      x:
                        Number(
                          event.target.value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                Y position

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={
                    locationForm.y
                  }
                  onChange={event =>
                    setLocationForm({
                      ...locationForm,
                      y:
                        Number(
                          event.target.value,
                        ),
                    })
                  }
                />
              </label>
            </div>

            <label>
              Description

              <textarea
                rows={3}
                value={
                  locationForm.description
                }
                onChange={event =>
                  setLocationForm({
                    ...locationForm,
                    description:
                      event.target.value,
                  })
                }
              />
            </label>

            <div className="button-row">
              <button
                className="btn"
                type="submit"
                disabled={
                  savingLocation
                }
              >
                {savingLocation
                  ? "Saving…"
                  : editingLocationId
                    ? "Save location"
                    : "Create location"}
              </button>
            </div>
          </form>
        )}

        {!selectedMapId ? (
          <div className="empty-state">
            <span>🗺️</span>

            <p>
              Select a map to manage
              its locations.
            </p>
          </div>
        ) : locations.length === 0 ? (
          <div className="empty-state">
            <span>📍</span>

            <p>
              No locations have been
              added to this map yet.
            </p>

            <button
              className="btn secondary"
              type="button"
              onClick={
                openNewLocation
              }
            >
              Add first location
            </button>
          </div>
        ) : (
          <div className="location-list">
            {locations.map(
              location => (
                <div
                  className="location-row"
                  key={
                    location.id
                  }
                >
                  <div className="location-marker">
                    {location.icon ||
                      "📍"}
                  </div>

                  <div className="location-info">
                    <strong>
                      {location.name}
                    </strong>

                    <p>
                      {location.description ||
                        "No description"}
                    </p>

                    <small>
                      Position:{" "}
                      {(
                        location.x *
                        100
                      ).toFixed(0)}
                      % ×{" "}
                      {(
                        location.y *
                        100
                      ).toFixed(0)}
                      %
                    </small>
                  </div>

                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() =>
                      editLocation(
                        location,
                      )
                    }
                  >
                    Edit
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      {/* ======================================================
          IMPLEMENTATION BOUNDARIES
      ====================================================== */}

      <section className="card section-gap">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              IMPLEMENTATION STATUS
            </div>

            <h2>
              Configuration coverage
            </h2>

            <p className="muted">
              This screen intentionally
              reflects what the current
              backend can persist.
            </p>
          </div>
        </div>

        <div className="configuration-grid">
          <ConfigurationStatus
            icon="✓"
            title="Programme"
            description="Name, description, dates and collective XP target."
            complete
          />

          <ConfigurationStatus
            icon="✓"
            title="Themes"
            description="Create, edit and activate platform themes."
            complete
          />

          <ConfigurationStatus
            icon="✓"
            title="Maps"
            description="Create, edit and activate programme maps."
            complete
          />

          <ConfigurationStatus
            icon="✓"
            title="Map locations"
            description="Create and edit locations with normalised coordinates."
            complete
          />

          <ConfigurationStatus
            icon="✓"
            title="Phases"
            description="Create phase records and metadata."
            complete
          />

          <ConfigurationStatus
            icon="→"
            title="XP economy"
            description="Point rules and reward configuration will be moved into the dedicated economy/rewards screens."
          />

          <ConfigurationStatus
            icon="→"
            title="Skill trees"
            description="Requires persisted milestone and progression models before the UI is built."
          />

          <ConfigurationStatus
            icon="→"
            title="Flash challenges"
            description="Requires challenge scheduling, attempt verification and result persistence."
          />

          <ConfigurationStatus
            icon="→"
            title="Notifications"
            description="Requires subscription/device registration and notification scheduling."
          />
        </div>
      </section>
    </Layout>
  );
}

/* ============================================================
   STATUS CARD
============================================================ */

function ConfigurationStatus({
  icon,
  title,
  description,
  complete = false,
}: {
  icon: string;
  title: string;
  description: string;
  complete?: boolean;
}) {
  return (
    <div
      className={`configuration-tile ${
        complete
          ? "configuration-complete"
          : ""
      }`}
    >
      <span
        className={
          complete
            ? "configuration-status complete"
            : "configuration-status"
        }
      >
        {icon}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}
