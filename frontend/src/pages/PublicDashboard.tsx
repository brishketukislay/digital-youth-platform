import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowUpRight,
  Flag,
  MapPin,
  Radio,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import {
  getApiErrorMessage,
  publicDashboard,
  type PublicDashboard as PublicDashboardData,
} from "../api/client";

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(
    Math.max(0, Number(value) || 0),
  );
}

function percentage(current: number, target: number) {
  if (!target) return 0;

  return Math.min(
    100,
    Math.max(0, (current / target) * 100),
  );
}

function compactXP(value: number) {
  const amount = Math.max(0, Number(value) || 0);

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(
      amount >= 10_000_000 ? 0 : 1,
    )}M`;
  }

  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(
      amount >= 100_000 ? 0 : 1,
    )}K`;
  }

  return formatXP(amount);
}

function MapPreview({
  data,
}: {
  data: PublicDashboardData;
}) {
  const map = data.map;

  if (!map) {
    return (
      <section className="dyp-dashboard-shell public-card public-map-card public-map-card--empty">
        <div className="dyp-dashboard public-card-heading">
          <div>
            <span className="public-eyebrow">
              <MapPin size={14} />
              WORLD MAP
            </span>
            <h2>Map coming soon</h2>
          </div>
        </div>

        <div className="public-map-empty-content">
          <div className="public-map-empty-icon">
            <MapPin size={28} />
          </div>
          <p>
            Programme locations will appear here as
            the journey expands.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="public-card public-map-card">
      <div className="public-card-heading public-map-heading">
        <div>
          <span className="public-eyebrow">
            <MapPin size={14} />
            WORLD MAP
          </span>

          <h2>{map.name}</h2>
        </div>

        <span className="public-pill">
          {map.locations.length}{" "}
          {map.locations.length === 1
            ? "location"
            : "locations"}
        </span>
      </div>

      <div
        className="public-map-surface"
        style={
          map.background_image
            ? {
                backgroundImage:
                  `linear-gradient(180deg, rgba(8,16,24,.08), rgba(8,16,24,.5)), url("${map.background_image}")`,
              }
            : undefined
        }
      >
        <div className="public-map-grid" />

        {map.locations.map((location) => (
          <div
            key={location.id}
            className="public-map-pin"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
            }}
            title={
              location.description
                ? `${location.name}: ${location.description}`
                : location.name
            }
          >
            <span className="public-map-pin__dot">
              {location.icon || "★"}
            </span>

            <span className="public-map-pin__label">
              {location.name}
            </span>
          </div>
        ))}

        {map.locations.length === 0 && (
          <div className="public-map-no-locations">
            <MapPin size={20} />
            <span>Locations will appear here</span>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "purple" | "green" | "orange" | "blue";
}) {
  return (
    <article
      className={`public-stat-card public-stat-card--${tone}`}
    >
      <div className="public-stat-card__icon">
        {icon}
      </div>

      <div className="public-stat-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

export default function PublicDashboard() {
  const [data, setData] =
    useState<PublicDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const response = await publicDashboard();

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

    return () => {
      window.clearInterval(timer);
    };
  }, [load]);

  const progress = useMemo(() => {
    if (!data?.programme) return 0;

    return percentage(
      data.group_xp,
      data.programme.target_xp,
    );
  }, [data]);

  const remainingXP = useMemo(() => {
    if (!data?.programme) return 0;

    return Math.max(
      0,
      data.programme.target_xp - data.group_xp,
    );
  }, [data]);

  const nextMilestone = useMemo(() => {
    if (!data) return null;

    const target = data.programme?.target_xp ?? 0;

    const candidates = [
      100_000,
      250_000,
      500_000,
      750_000,
      1_000_000,
      1_250_000,
      1_500_000,
      target,
    ]
      .filter((value) => value > data.group_xp)
      .sort((a, b) => a - b);

    return candidates[0] ?? null;
  }, [data]);

  const primary =
    data?.theme?.primary ?? "#7357ff";

  const accent =
    data?.theme?.accent ?? "#35e6a2";

  if (loading && !data) {
    return (
      <main className="public-page public-page--loading">
        <div className="public-loading-card">
          <div className="public-loading-mark">
            <Zap size={22} />
          </div>

          <strong>Loading the journey</strong>
          <span>
            Getting the latest community progress…
          </span>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="public-page public-page--loading">
        <div className="public-error-card">
          <div className="public-error-icon">
            !
          </div>

          <span className="public-eyebrow">
            LIVE DASHBOARD
          </span>

          <h1>Dashboard unavailable</h1>

          <p>{error}</p>

          <button
            type="button"
            className="public-retry-button"
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

  const phase = data.phases[0] ?? null;

  const programmeName =
    data.programme?.name ??
    "Cumbernauld Quest";

  const targetXP =
    data.programme?.target_xp ?? 0;

  const weeklyTarget =
    data.programme?.weekly_target_xp ?? 0;

  return (
    <main
      className="public-page"
      style={
        {
          "--public-primary": primary,
          "--public-accent": accent,
        } as React.CSSProperties
      }
    >
      <div className="public-shell">
        <header className="public-header">
          <div className="public-brand">
            <div className="public-brand-mark">
              <Zap size={19} strokeWidth={2.8} />
            </div>

            <div>
              <span className="public-brand-kicker">
                DIGITAL YOUTH
              </span>

              <strong>{programmeName}</strong>
            </div>
          </div>

          <div className="public-live-status">
            <span className="public-live-dot" />
            <span>LIVE</span>
            <small>Updates every 15 sec</small>
          </div>
        </header>

        <section className="public-hero">
          <div className="public-hero-copy">
            <div className="public-phase-badge">
              <span>
                {phase?.icon || "⚡"}
              </span>

              <div>
                <small>CURRENT PHASE</small>
                <strong>
                  {phase?.name ??
                    "The journey is underway"}
                </strong>
              </div>
            </div>

            <h1>
              Every action
              <br />
              <em>moves the community.</em>
            </h1>

            <p>
              Young people are working together,
              earning XP and unlocking the next
              stage of the journey.
            </p>

            <div className="public-hero-meta">
              <span>
                <Users size={16} />
                Collective progress
              </span>

              <span>
                <Activity size={16} />
                Live scoreboard
              </span>
            </div>
          </div>

          <div className="public-hero-score">
            <div className="public-score-orbit">
              <div className="public-score-inner">
                <span>GROUP XP</span>
                <strong>
                  {compactXP(data.group_xp)}
                </strong>
                <small>
                  {progress.toFixed(0)}% complete
                </small>
              </div>
            </div>

            <div className="public-score-caption">
              <span>
                Target
              </span>
              <strong>
                {formatXP(targetXP)} XP
              </strong>
            </div>
          </div>
        </section>

        <section className="public-stat-grid">
          <StatCard
            icon={<Trophy size={20} />}
            label="GROUP XP"
            value={formatXP(data.group_xp)}
            detail="Earned together"
            tone="purple"
          />

          <StatCard
            icon={<Target size={20} />}
            label="TO GO"
            value={compactXP(remainingXP)}
            detail="Until programme target"
            tone="green"
          />

          <StatCard
            icon={<Flag size={20} />}
            label="NEXT MILESTONE"
            value={
              nextMilestone
                ? compactXP(nextMilestone)
                : "Complete"
            }
            detail={
              nextMilestone
                ? "XP milestone"
                : "Programme target reached"
            }
            tone="orange"
          />

          <StatCard
            icon={<Sparkles size={20} />}
            label="WEEKLY TARGET"
            value={compactXP(weeklyTarget)}
            detail="Programme target"
            tone="blue"
          />
        </section>

        <section className="public-progress-card">
          <div className="public-progress-top">
            <div>
              <span className="public-eyebrow">
                <Trophy size={14} />
                COMMUNITY JOURNEY
              </span>

              <h2>
                {formatXP(data.group_xp)}{" "}
                <span>
                  / {formatXP(targetXP)} XP
                </span>
              </h2>
            </div>

            <div className="public-progress-percent">
              <strong>
                {progress.toFixed(1)}%
              </strong>
              <span>complete</span>
            </div>
          </div>

          <div
            className="public-progress-track"
            aria-label={`Community progress ${progress.toFixed(1)} percent`}
          >
            <div
              className="public-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            >
              <span />
            </div>
          </div>

          <div className="public-progress-footer">
            <span>START</span>

            <strong>
              {remainingXP > 0
                ? `${formatXP(remainingXP)} XP to go`
                : "Target reached"}
            </strong>

            <span>
              {formatXP(targetXP)} XP
            </span>
          </div>
        </section>

        <section className="public-main-grid">
          <MapPreview data={data} />

          <div className="public-sidebar">
            <section className="public-card public-programme-card">
              <div className="public-card-heading">
                <div>
                  <span className="public-eyebrow">
                    <Sparkles size={14} />
                    PROGRAMME
                  </span>

                  <h2>{programmeName}</h2>
                </div>

                <ArrowUpRight
                  size={18}
                  className="public-heading-arrow"
                />
              </div>

              <p className="public-programme-description">
                A shared challenge where individual
                actions build collective progress.
              </p>

              <div className="public-programme-stats">
                <div>
                  <span>Weekly target</span>
                  <strong>
                    {formatXP(weeklyTarget)}
                  </strong>
                  <small>XP</small>
                </div>

                <div>
                  <span>Programme target</span>
                  <strong>
                    {compactXP(targetXP)}
                  </strong>
                  <small>XP</small>
                </div>
              </div>
            </section>

            <section className="public-card public-phases-card">
              <div className="public-card-heading">
                <div>
                  <span className="public-eyebrow">
                    <Activity size={14} />
                    JOURNEY
                  </span>

                  <h2>Phases</h2>
                </div>

                <span className="public-pill">
                  {data.phases.length}
                </span>
              </div>

              <div className="public-phase-list">
                {data.phases.length === 0 ? (
                  <div className="public-empty-state">
                    No phases configured yet.
                  </div>
                ) : (
                  data.phases.map(
                    (item, index) => {
                      const active =
                        index === 0;

                      return (
                        <div
                          className={
                            "public-phase-row " +
                            (active
                              ? "public-phase-row--active"
                              : "")
                          }
                          key={item.id}
                        >
                          <div
                            className="public-phase-number"
                            style={{
                              background:
                                item.colour ||
                                primary,
                            }}
                          >
                            {active
                              ? "✓"
                              : index + 1}
                          </div>

                          <div className="public-phase-content">
                            <strong>
                              {item.name}
                            </strong>

                            <span>
                              {active
                                ? "CURRENT PHASE"
                                : "UPCOMING"}
                            </span>
                          </div>

                          {active && (
                            <span className="public-current-dot" />
                          )}
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </section>
          </div>
        </section>

        <footer className="public-footer">
          <div>
            <span className="public-footer-mark">
              <Radio size={13} />
            </span>

            <span>
              Live community progress
            </span>
          </div>

          <span>
            Anonymous • Positive action • Collective success
          </span>
        </footer>
      </div>
    </main>
  );
}
