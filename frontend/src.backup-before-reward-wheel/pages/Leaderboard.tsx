import { useCallback, useEffect, useMemo, useState } from "react";
import {
  leaderboard,
  publicDashboard,
  type LeaderboardEntry,
  type PublicDashboard,
} from "../api/client";

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(
    Math.max(0, Math.round(value)),
  );
}

function percentage(
  current: number,
  target: number,
) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (current / target) * 100),
  );
}

function PhaseCard({
  phase,
}: {
  phase: PublicDashboard["phases"][number];
}) {
  return (
    <div
      className="public-phase"
      style={{
        "--phase-colour": phase.colour,
      } as React.CSSProperties}
    >
      <div className="public-phase__icon">
        {phase.icon || "✦"}
      </div>

      <div>
        <span className="eyebrow">
          Programme phase
        </span>

        <h2>{phase.name}</h2>

        {phase.description && (
          <p>{phase.description}</p>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [dashboard, setDashboard] =
    useState<PublicDashboard | null>(null);

  const [rows, setRows] = useState<
    LeaderboardEntry[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [
        dashboardResponse,
        leaderboardResponse,
      ] = await Promise.all([
        publicDashboard(),
        leaderboard(),
      ]);

      setDashboard(dashboardResponse.data);
      setRows(leaderboardResponse.data);
    } catch {
      setError(
        "We couldn't load the live programme progress.",
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

    return () => {
      window.clearInterval(timer);
    };
  }, [load]);

  const target =
    dashboard?.programme?.target_xp ?? 0;

  const current =
    dashboard?.group_xp ?? 0;

  const progress = useMemo(
    () => percentage(current, target),
    [current, target],
  );

  const nextMilestone =
    target > 0
      ? Math.min(
          target,
          Math.ceil(
            (current + 1) / 250000,
          ) * 250000,
        )
      : 0;

  if (loading && !dashboard) {
    return (
      <main className="public-dashboard public-dashboard--loading">
        <div className="public-loading">
          <div className="public-loading__mark">
            <span />
            <span />
            <span />
          </div>

          <p>
            Loading Cumbernauld's progress...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="public-dashboard">
      <header className="public-header">
        <div className="public-brand">
          <div className="public-brand__mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>
              Digital Youth
            </strong>
            <span>
              Cumbernauld
            </span>
          </div>
        </div>

        <div className="public-live">
          <span />
          LIVE
        </div>
      </header>

      {error && (
        <div className="public-error">
          {error}
          <button
            type="button"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="public-hero">
        <div className="public-hero__grid" />

        <div className="public-hero__content">
          <span className="public-kicker">
            COLLECTIVE PROGRESS
          </span>

          <h1>
            Cumbernauld
            <br />
            <strong>Quest</strong>
          </h1>

          <p>
            Every positive action moves the
            whole group forward.
          </p>
        </div>

        <div className="public-xp">
          <span className="public-xp__label">
            GROUP XP
          </span>

          <strong>
            {formatXP(current)}
          </strong>

          <span className="public-xp__target">
            of {formatXP(target)}
          </span>
        </div>
      </section>

      <section className="public-progress-card">
        <div className="public-progress-card__top">
          <div>
            <span>
              JOURNEY TO THE JACKPOT
            </span>

            <strong>
              {progress.toFixed(1)}%
            </strong>
          </div>

          <div className="public-next">
            <span>
              NEXT MILESTONE
            </span>

            <strong>
              {formatXP(nextMilestone)} XP
            </strong>
          </div>
        </div>

        <div className="public-progress">
          <div
            className="public-progress__fill"
            style={{
              width: `${progress}%`,
            }}
          >
            <span />
          </div>
        </div>

        <div className="public-progress__labels">
          <span>
            START
          </span>

          <span>
            {formatXP(target)} XP
          </span>
        </div>
      </section>

      {dashboard?.phases?.length ? (
        <section className="public-section">
          <div className="public-section__heading">
            <div>
              <span className="eyebrow">
                WHAT'S HAPPENING
              </span>

              <h2>
                The journey
              </h2>
            </div>
          </div>

          <div className="public-phase-grid">
            {dashboard.phases
              .slice(0, 3)
              .map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                />
              ))}
          </div>
        </section>
      ) : null}

      <section className="public-content-grid">
        <div className="public-panel public-panel--leaderboard">
          <div className="public-panel__heading">
            <div>
              <span className="eyebrow">
                RECOGNITION
              </span>

              <h2>
                Leaderboard
              </h2>
            </div>

            <span className="public-panel__live">
              LIVE
            </span>
          </div>

          <div className="public-rankings">
            {rows.length === 0 ? (
              <div className="public-empty">
                Progress will appear here
                as the programme gets moving.
              </div>
            ) : (
              rows
                .slice(0, 10)
                .map((row, index) => {
                  const rank =
                    row.rank ?? index + 1;

                  return (
                    <div
                      className={`public-ranking public-ranking--${rank}`}
                      key={`${row.gamertag}-${rank}`}
                    >
                      <div className="public-ranking__rank">
                        {rank <= 3
                          ? ["", "🥇", "🥈", "🥉"][
                              rank
                            ]
                          : `#${rank}`}
                      </div>

                      <div className="public-ranking__avatar">
                        {row.avatar || "★"}
                      </div>

                      <div className="public-ranking__player">
                        <strong>
                          {row.gamertag}
                        </strong>

                        <span>
                          Positive progress
                        </span>
                      </div>

                      <strong className="public-ranking__xp">
                        {formatXP(row.xp)}
                      </strong>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        <div className="public-panel public-panel--map">
          <div className="public-panel__heading">
            <div>
              <span className="eyebrow">
                EXPLORE
              </span>

              <h2>
                Cumbernauld
              </h2>
            </div>
          </div>

          {dashboard?.map ? (
            <div
              className="public-map"
              style={
                dashboard.map
                  .background_image
                  ? {
                      backgroundImage: `url(${dashboard.map.background_image})`,
                    }
                  : undefined
              }
            >
              <div className="public-map__overlay" />

              {dashboard.map.locations
                .slice(0, 12)
                .map((location) => (
                  <div
                    className="public-map__pin"
                    key={location.id}
                    style={{
                      left: `${location.x}%`,
                      top: `${location.y}%`,
                    }}
                    title={location.name}
                  >
                    <span>
                      {location.icon || "✦"}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="public-map public-map--empty">
              <div>
                <span>✦</span>
                <strong>
                  Map coming online
                </strong>
                <p>
                  The Cumbernauld journey will
                  appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="public-footer">
        <span>
          DIGITAL YOUTH PLATFORM
        </span>

        <span>
          Built around positive action,
          teamwork and progression.
        </span>
      </footer>
    </main>
  );
}