import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getApiErrorMessage,
  publicDashboard,
  type PublicDashboard as PublicDashboardData,
} from "../api/client";

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(
    value,
  );
}

function percentage(
  current: number,
  target: number,
) {
  if (!target) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      (current / target) * 100,
    ),
  );
}

function MapPreview({
  data,
}: {
  data: PublicDashboardData;
}) {
  const map = data.map;

  if (!map) {
    return (
      <div className="public-map public-map--empty">
        <div>
          <span className="public-map__eyebrow">
            CUMBERNAULD
          </span>

          <h2>Map coming soon</h2>

          <p>
            The programme map will appear here as
            locations are added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="public-map"
      style={
        map.background_image
          ? {
              backgroundImage: `linear-gradient(rgba(7,15,24,.22), rgba(7,15,24,.52)), url("${map.background_image}")`,
            }
          : undefined
      }
    >
      <div className="public-map__header">
        <div>
          <span className="public-map__eyebrow">
            CURRENT MAP
          </span>

          <h2>{map.name}</h2>
        </div>

        <span className="public-map__count">
          {map.locations.length} locations
        </span>
      </div>

      <div className="public-map__surface">
        {map.locations.map((location) => (
          <div
            key={location.id}
            className="public-map__pin"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
            }}
            title={location.name}
          >
            <span>
              {location.icon || "★"}
            </span>

            <strong>
              {location.name}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicDashboard() {
  const [data, setData] =
    useState<PublicDashboardData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const response =
        await publicDashboard();

      setData(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "The public dashboard could not be loaded.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const timer = window.setInterval(
      () => void load(),
      15000,
    );

    return () =>
      window.clearInterval(timer);
  }, [load]);

  const progress = useMemo(() => {
    if (!data?.programme) return 0;

    return percentage(
      data.group_xp,
      data.programme.target_xp,
    );
  }, [data]);

  const nextMilestone = useMemo(() => {
    if (!data?.programme) return null;

    const milestones = [
      500_000,
      1_000_000,
      1_500_000,
    ];

    return (
      milestones.find(
        (milestone) =>
          milestone > data.group_xp,
      ) ??
      data.programme.target_xp
    );
  }, [data]);

  if (loading && !data) {
    return (
      <main className="public-page public-page--loading">
        <div className="public-loading-orb" />
        <p>Loading Cumbernauld Quest...</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="public-page public-page--loading">
        <div className="public-error">
          <span>!</span>
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>

          <button
            type="button"
            className="public-button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const phase =
    data.phases[0] ?? null;

  const primary =
    data.theme?.primary ??
    "#8B5CF6";

  const accent =
    data.theme?.accent ??
    "#54F59A";

  return (
    <main
      className="public-page"
      style={{
        "--public-primary": primary,
        "--public-accent": accent,
      } as React.CSSProperties}
    >
      <header className="public-topbar">
        <div className="public-brand">
          <div className="public-brand__mark">
            D
          </div>

          <div>
            <strong>
              DIGITAL YOUTH
            </strong>

            <span>
              CUMBERNAULD QUEST
            </span>
          </div>
        </div>

        <div className="public-live">
          <span />
          LIVE PROGRESS
        </div>
      </header>

      <section className="public-hero">
        <div className="public-hero__copy">
          <span className="public-kicker">
            {phase?.icon ?? "⚡"} CURRENT PHASE
          </span>

          <h1>
            {phase?.name ??
              "The journey is underway"}
          </h1>

          <p>
            Every positive action moves the
            whole group closer to the next
            milestone.
          </p>
        </div>

        <div className="public-hero__xp">
          <span className="public-xp-label">
            GROUP XP
          </span>

          <strong>
            {formatXP(data.group_xp)}
          </strong>

          <span>
            /{" "}
            {formatXP(
              data.programme?.target_xp ??
                1_500_000,
            )}
          </span>
        </div>
      </section>

      <section className="public-progress-card">
        <div className="public-progress-card__top">
          <div>
            <span>COLLECTIVE PROGRESS</span>
            <strong>
              {progress.toFixed(1)}%
            </strong>
          </div>

          <div className="public-next">
            <span>
              NEXT MILESTONE
            </span>

            <strong>
              {nextMilestone
                ? formatXP(nextMilestone)
                : "—"}{" "}
              XP
            </strong>
          </div>
        </div>

        <div className="public-progress">
          <div
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="public-progress__labels">
          <span>
            START
          </span>

          <span>
            {formatXP(data.group_xp)} XP
          </span>

          <span>
            {formatXP(
              data.programme?.target_xp ??
                1_500_000,
            )}{" "}
            XP
          </span>
        </div>
      </section>

      <section className="public-grid">
        <MapPreview data={data} />

        <aside className="public-side">
          <div className="public-panel">
            <span className="public-panel__eyebrow">
              PROGRAMME
            </span>

            <h2>
              {data.programme?.name ??
                "Cumbernauld Quest"}
            </h2>

            <div className="public-stat">
              <span>
                Weekly target
              </span>

              <strong>
                {formatXP(
                  data.programme
                    ?.weekly_target_xp ?? 0,
                )}{" "}
                XP
              </strong>
            </div>
          </div>

          <div className="public-panel">
            <span className="public-panel__eyebrow">
              PHASES
            </span>

            <div className="public-phase-list">
              {data.phases.map(
                (item, index) => (
                  <div
                    className={
                      "public-phase " +
                      (index === 0
                        ? "public-phase--active"
                        : "")
                    }
                    key={item.id}
                  >
                    <span
                      className="public-phase__icon"
                      style={{
                        background:
                          item.colour ||
                          primary,
                      }}
                    >
                      {item.icon || "★"}
                    </span>

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {index === 0
                          ? "CURRENT PHASE"
                          : "UPCOMING"}
                      </small>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </aside>
      </section>

      <footer className="public-footer">
        <span>
          Built with young people in
          Cumbernauld
        </span>

        <span>
          Anonymous avatars • Positive
          progress • Collective success
        </span>
      </footer>
    </main>
  );
}