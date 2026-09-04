import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  adminOverview,
  getApiErrorMessage,
  type AdminOverview,
  type Challenge,
  type Player,
  type Programme,
} from "../../api/client";

/* ============================================================
   CONFIG
============================================================ */

const JACKPOT_TARGET = 1_500_000;
const REFRESH_INTERVAL = 30_000;

/* ============================================================
   HELPERS
============================================================ */

function asNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function formatNumber(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-GB",
  ).format(Math.round(value));
}

function formatCompact(
  value: number,
): string {
  if (value >= 1_000_000) {
    return `${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(
      value / 1_000
    ).toFixed(1)}K`;
  }

  return formatNumber(value);
}

function progressPercent(
  current: number,
  target: number,
): number {
  if (!target) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (current / target) * 100,
    ),
  );
}

function playerLabel(
  player: Player,
): string {
  return (
    player.gamertag ||
    player.username ||
    `Player ${player.id}`
  );
}

function challengeLabel(
  challenge: Challenge,
): string {
  return (
    challenge.title ||
    challenge.name ||
    "Untitled challenge"
  );
}

function timeAgo(
  value?: string,
): string {
  if (!value) {
    return "No recent activity";
  }

  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) /
        1000,
    ),
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  return `${days}d ago`;
}

/* ============================================================
   ICON
============================================================ */

function Icon({
  name,
  size = 20,
}: {
  name:
    | "users"
    | "xp"
    | "challenge"
    | "reward"
    | "arrow"
    | "refresh"
    | "plus"
    | "activity"
    | "settings"
    | "phase"
    | "alert"
    | "check";
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
  };

  switch (name) {
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "xp":
      return (
        <svg {...props}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      );

    case "challenge":
      return (
        <svg {...props}>
          <path d="M6 9h12a5 5 0 0 1 4.7 6.7l-1.1 3A3 3 0 0 1 16 20l-4-4-4 4a3 3 0 0 1-5.6-1.3l-1.1-3A5 5 0 0 1 6 9Z" />
          <path d="M7 13v4" />
          <path d="M5 15h4" />
          <circle cx="16.5" cy="14" r="1" />
          <circle cx="19" cy="16.5" r="1" />
        </svg>
      );

    case "reward":
      return (
        <svg {...props}>
          <path d="M20 12v9H4v-9" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 7v14" />
          <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
          <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...props}>
          <path d="M20 11a8 8 0 0 0-15.5-2M4 5v4h4" />
          <path d="M4 13a8 8 0 0 0 15.5-2M20 19v-4h-4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "activity":
      return (
        <svg {...props}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      );

    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-2.5v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.4V14h-.4a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    case "phase":
      return (
        <svg {...props}>
          <path d="M5 21V4" />
          <path d="M5 4c4-3 8 3 14 0v10c-6 3-10-3-14 0" />
        </svg>
      );

    case "alert":
      return (
        <svg {...props}>
          <path d="M10.3 3.7 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    default:
      return null;
  }
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon:
    | "users"
    | "xp"
    | "challenge"
    | "reward";
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="admin-stat-card">
      <div
        className={`admin-stat-icon admin-stat-icon--${tone}`}
      >
        <Icon
          name={icon}
          size={21}
        />
      </div>

      <div className="admin-stat-card__value">
        {value}
      </div>

      <div className="admin-stat-card__label">
        {label}
      </div>

      <div className="admin-stat-card__detail">
        {detail}
      </div>
    </div>
  );
}

/* ============================================================
   JACKPOT
============================================================ */

function Jackpot({
  xp,
  target,
}: {
  xp: number;
  target: number;
}) {
  const percentage =
    progressPercent(xp, target);

  const remaining = Math.max(
    0,
    target - xp,
  );

  const milestones = [
    {
      label: "First prize",
      value: 500_000,
    },
    {
      label: "Mid prize",
      value: 1_000_000,
    },
    {
      label: "Jackpot",
      value: 1_500_000,
    },
  ];

  return (
    <section className="admin-card admin-jackpot">
      <div className="admin-card-header">
        <div>
          <span className="admin-eyebrow">
            Collective progression
          </span>

          <h2>
            Group jackpot
          </h2>

          <p>
            Individual achievements build
            the shared cohort total.
          </p>
        </div>

        <div className="jackpot-percentage">
          {percentage.toFixed(1)}%
        </div>
      </div>

      <div className="jackpot-total">
        <strong>
          {formatNumber(xp)}
        </strong>

        <span>
          / {formatNumber(target)} XP
        </span>
      </div>

      <div className="jackpot-track">
        <div
          className="jackpot-track__fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="jackpot-milestones">
        {milestones.map(
          milestone => {
            const reached =
              xp >= milestone.value;

            return (
              <div
                key={milestone.value}
                className={`jackpot-milestone ${
                  reached
                    ? "jackpot-milestone--reached"
                    : ""
                }`}
              >
                <div className="jackpot-milestone__dot">
                  {reached && (
                    <Icon
                      name="check"
                      size={12}
                    />
                  )}
                </div>

                <div>
                  <strong>
                    {formatCompact(
                      milestone.value,
                    )}
                  </strong>

                  <span>
                    {milestone.label}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="jackpot-footer">
        <span>
          {formatCompact(
            remaining,
          )}{" "}
          XP remaining
        </span>

        <Link
          to="/admin"
          className="admin-text-button"
        >
          View economy
          <Icon
            name="arrow"
            size={14}
          />
        </Link>
      </div>
    </section>
  );
}

/* ============================================================
   CURRENT PHASE
============================================================ */

function CurrentPhase({
  programme,
}: {
  programme?: Programme;
}) {
  const phase =
    programme?.current_phase ||
    "No active phase";

  const status =
    programme?.status ||
    "Configured";

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="admin-eyebrow">
            Programme
          </span>

          <h2>
            Current phase
          </h2>
        </div>

        <Icon
          name="phase"
          size={22}
        />
      </div>

      <div className="phase-visual">
        <div className="phase-orbit phase-orbit--one" />
        <div className="phase-orbit phase-orbit--two" />

        <div className="phase-visual__icon">
          <Icon
            name="phase"
            size={27}
          />
        </div>
      </div>

      <div className="phase-content">
        <span className="status-badge">
          <span />
          {status}
        </span>

        <h3>{phase}</h3>

        <p>
          The active phase controls the
          theme, activities, map area,
          resources and progression
          content available to players.
        </p>
      </div>

      <Link
        to="/admin"
        className="admin-card-link"
      >
        Manage phase
        <Icon
          name="arrow"
          size={15}
        />
      </Link>
    </section>
  );
}

/* ============================================================
   CHALLENGES
============================================================ */

function Challenges({
  challenges,
}: {
  challenges: Challenge[];
}) {
  const active = challenges
    .filter(challenge => {
      const status =
        challenge.status?.toLowerCase();

      return (
        !status ||
        status === "active" ||
        status === "scheduled"
      );
    })
    .slice(0, 5);

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="admin-eyebrow">
            Engagement
          </span>

          <h2>
            Live challenges
          </h2>
        </div>

        <Link
          to="/admin"
          className="admin-text-button"
        >
          Manage
          <Icon
            name="arrow"
            size={14}
          />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty__icon">
            <Icon
              name="challenge"
              size={23}
            />
          </div>

          <strong>
            No active challenges
          </strong>

          <p>
            Create a time-bound activity
            to give players another route
            to earn XP.
          </p>

          <Link
            to="/admin"
            className="admin-button admin-button--primary"
          >
            <Icon
              name="plus"
              size={16}
            />
            Create challenge
          </Link>
        </div>
      ) : (
        <div className="challenge-list">
          {active.map(
            challenge => {
              const reward =
                asNumber(
                  challenge.xp_reward,
                  challenge.points,
                );

              return (
                <div
                  key={challenge.id}
                  className="challenge-item"
                >
                  <div className="challenge-icon">
                    <Icon
                      name="challenge"
                      size={17}
                    />
                  </div>

                  <div className="challenge-copy">
                    <strong>
                      {challengeLabel(
                        challenge,
                      )}
                    </strong>

                    <span>
                      {challenge.starts_at
                        ? `Starts ${new Date(
                            challenge.starts_at,
                          ).toLocaleString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            },
                          )}`
                        : "No start time"}
                    </span>
                  </div>

                  <div className="challenge-reward">
                    +{formatCompact(reward)}
                    <small>
                      XP
                    </small>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   PLAYER ATTENTION
============================================================ */

function PlayerAttention({
  players,
}: {
  players: Player[];
}) {
  const needsAttention =
    useMemo(() => {
      return players
        .filter(player => {
          if (
            player.is_active === false
          ) {
            return false;
          }

          if (
            typeof player.engagement_score ===
              "number"
          ) {
            return (
              player.engagement_score <
              50
            );
          }

          const last =
            player.last_activity ||
            player.last_seen;

          if (!last) {
            return false;
          }

          const age =
            Date.now() -
            new Date(last).getTime();

          return (
            age >
            7 * 24 * 60 * 60 * 1000
          );
        })
        .slice(0, 5);
    }, [players]);

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="admin-eyebrow">
            Youth work support
          </span>

          <h2>
            Engagement watch
          </h2>
        </div>

        <Link
          to="/admin"
          className="admin-text-button"
        >
          All players
          <Icon
            name="arrow"
            size={14}
          />
        </Link>
      </div>

      {needsAttention.length === 0 ? (
        <div className="attention-positive">
          <div>
            <Icon
              name="check"
              size={21}
            />
          </div>

          <section>
            <strong>
              No immediate concerns
            </strong>

            <p>
              There are currently no
              players flagged by the
              available engagement data.
            </p>
          </section>
        </div>
      ) : (
        <div className="attention-list">
          {needsAttention.map(
            player => (
              <div
                key={player.id}
                className="attention-item"
              >
                <div className="attention-avatar">
                  ★
                </div>

                <div className="attention-copy">
                  <strong>
                    {playerLabel(
                      player,
                    )}
                  </strong>

                  <span>
                    {timeAgo(
                      player.last_activity ||
                        player.last_seen,
                    )}
                  </span>
                </div>

                <div className="attention-alert">
                  <Icon
                    name="alert"
                    size={15}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   QUICK ACTIONS
============================================================ */

function QuickActions() {
  const actions = [
    {
      label: "Create challenge",
      description:
        "Launch a timed engagement event",
      icon: "challenge" as const,
    },
    {
      label: "Manage players",
      description:
        "Review anonymous player profiles",
      icon: "users" as const,
    },
    {
      label: "Configure XP",
      description:
        "Control the point economy",
      icon: "xp" as const,
    },
    {
      label: "Manage rewards",
      description:
        "Configure vouchers and prizes",
      icon: "reward" as const,
    },
  ];

  return (
    <section className="admin-quick-actions">
      <div>
        <span className="admin-eyebrow">
          Staff tools
        </span>

        <h2>
          Quick actions
        </h2>
      </div>

      <div className="quick-action-grid">
        {actions.map(action => (
          <Link
            key={action.label}
            to="/admin"
            className="quick-action"
          >
            <div className="quick-action__icon">
              <Icon
                name={action.icon}
                size={20}
              />
            </div>

            <div>
              <strong>
                {action.label}
              </strong>

              <span>
                {action.description}
              </span>
            </div>

            <Icon
              name="arrow"
              size={15}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <main className="admin-page">
      <div className="admin-loading">
        <div className="admin-loading__spinner" />

        <strong>
          Loading programme data
        </strong>

        <span>
          Connecting to the platform…
        </span>
      </div>
    </main>
  );
}

/* ============================================================
   ERROR
============================================================ */

function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <main className="admin-page">
      <div className="admin-error">
        <div className="admin-error__icon">
          <Icon
            name="alert"
            size={25}
          />
        </div>

        <div>
          <h2>
            Dashboard unavailable
          </h2>

          <p>{message}</p>

          <button
            type="button"
            onClick={retry}
            className="admin-button admin-button--primary"
          >
            <Icon
              name="refresh"
              size={16}
            />
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function AdminDashboard() {
  const [data, setData] =
    useState<AdminOverview | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (
      background = false,
    ) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setError(null);

        const response =
          await adminOverview();

        setData(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load the staff dashboard.",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();

    const interval =
      window.setInterval(
        () => {
          void load(true);
        },
        REFRESH_INTERVAL,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return (
      <ErrorState
        message={error}
        retry={() => void load()}
      />
    );
  }

  const programme =
    data?.programme ||
    data?.programs?.[0];

  const players =
    data?.players || [];

  const challenges =
    data?.challenges || [];

  const collectiveXp =
    asNumber(
      data?.stats?.collective_xp,
      data?.stats?.total_xp,
      programme?.collective_xp,
      programme?.total_xp,
      programme?.group_xp,
    );

  const target =
    asNumber(
      programme?.target_xp,
      programme?.jackpot_target,
      JACKPOT_TARGET,
    );

  const activePlayers =
    asNumber(
      data?.stats?.active_players,
      players.filter(
        player =>
          player.is_active !== false,
      ).length,
    );

  const totalPlayers =
    asNumber(
      data?.stats?.total_players,
      players.length,
    );

  const weeklyXp =
    asNumber(
      data?.stats?.weekly_xp,
    );

  const pendingAwards =
    asNumber(
      data?.stats?.pending_awards,
    );

  const activeChallenges =
    asNumber(
      data?.stats?.active_challenges,
      challenges.filter(
        challenge =>
          challenge.status?.toLowerCase() ===
          "active",
      ).length,
    );

  const programmeName =
    programme?.name ||
    programme?.title ||
    "Digital Youth Platform";

  return (
    <main className="admin-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">
            {programmeName}
          </span>

          <h1>
            Programme command centre
          </h1>

          <p>
            A live overview of collective
            progress, engagement and
            programme activity.
          </p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-live-status">
            <span
              className={
                refreshing
                  ? "admin-live-status__dot admin-live-status__dot--refreshing"
                  : "admin-live-status__dot"
              }
            />

            {refreshing
              ? "Updating"
              : "Live"}
          </div>

          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={() =>
              void load(true)
            }
            disabled={refreshing}
          >
            <Icon
              name="refresh"
              size={16}
            />

            Refresh
          </button>
        </div>
      </header>

      {/* ======================================================
          NON-BLOCKING ERROR
      ====================================================== */}

      {error && (
        <div
          className="admin-warning"
          role="status"
        >
          <Icon
            name="alert"
            size={18}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              void load(true)
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <section className="admin-stat-grid">
        <StatCard
          icon="xp"
          label="Collective XP"
          value={`${formatCompact(
            collectiveXp,
          )} XP`}
          detail={`${progressPercent(
            collectiveXp,
            target,
          ).toFixed(
            1,
          )}% of jackpot target`}
          tone="purple"
        />

        <StatCard
          icon="users"
          label="Active players"
          value={formatNumber(
            activePlayers,
          )}
          detail={`${formatNumber(
            totalPlayers,
          )} enrolled`}
          tone="blue"
        />

        <StatCard
          icon="xp"
          label="XP this week"
          value={formatCompact(
            weeklyXp,
          )}
          detail="Across the programme"
          tone="green"
        />

        <StatCard
          icon="challenge"
          label="Active challenges"
          value={formatNumber(
            activeChallenges,
          )}
          detail={
            pendingAwards
              ? `${formatNumber(
                  pendingAwards,
                )} awards awaiting review`
              : "No pending awards"
          }
          tone="amber"
        />
      </section>

      {/* ======================================================
          TOP ROW
      ====================================================== */}

      <section className="admin-dashboard-grid admin-dashboard-grid--top">
        <Jackpot
          xp={collectiveXp}
          target={target}
        />

        <CurrentPhase
          programme={programme}
        />
      </section>

      {/* ======================================================
          SECOND ROW
      ====================================================== */}

      <section className="admin-dashboard-grid">
        <Challenges
          challenges={challenges}
        />

        <PlayerAttention
          players={players}
        />
      </section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <QuickActions />
    </main>
  );
}
