import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../components/Layout";

import {
  getApiErrorMessage,
  playerDashboard,
  type PlayerDashboard as PlayerDashboardData,
  type SkillMilestone,
} from "../api/client";

/* ============================================================
   CONSTANTS
============================================================ */

const DEFAULT_TARGET_XP = 1_500_000;

const MYSTERY_THRESHOLDS = [
  {
    xp: 15_000,
    label: "Early Hook",
  },
  {
    xp: 45_000,
    label: "Midway",
  },
  {
    xp: 85_000,
    label: "Legendary",
  },
] as const;

/* ============================================================
   HELPERS
============================================================ */

function formatXP(value: number | null | undefined) {
  return Math.max(0, value ?? 0).toLocaleString();
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function percentage(
  current: number,
  target: number,
) {
  if (!target || target <= 0) {
    return 0;
  }

  return clampPercentage(
    (Math.max(0, current) / target) * 100,
  );
}

function getNextThreshold(
  current: number,
  thresholds: readonly number[],
) {
  return (
    thresholds.find(
      threshold => current < threshold,
    ) ?? null
  );
}

function getAvatar(avatar?: string) {
  const avatars: Record<string, string> = {
    "avatar-1": "🦊",
    "avatar-2": "🐼",
    "avatar-3": "🐸",
    "avatar-4": "🐯",
    "avatar-5": "🐺",
    "avatar-6": "🤖",
    "avatar-7": "👾",
    "avatar-8": "🐙",
    "avatar-9": "🦉",
    "avatar-10": "🐻",
    "avatar-11": "🐨",
    "avatar-12": "🦁",
  };

  return avatars[avatar ?? ""] ?? "⭐";
}

function getMilestonePercentage(
  milestones: SkillMilestone[],
) {
  if (!milestones.length) {
    return 0;
  }

  const completed = milestones.filter(
    milestone => milestone.completed,
  ).length;

  return clampPercentage(
    (completed / milestones.length) * 100,
  );
}

function getCompletedMilestones(
  milestones: SkillMilestone[],
) {
  return milestones.filter(
    milestone => milestone.completed,
  ).length;
}

function getCurrentPhaseColour(
  data: PlayerDashboardData,
) {
  return (
    data.phase?.colour ||
    data.theme?.primary ||
    "#22c55e"
  );
}

/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

function ProgressBar({
  value,
  className = "",
  colour,
  ariaLabel,
}: {
  value: number;
  className?: string;
  colour?: string;
  ariaLabel: string;
}) {
  return (
    <div
      className={`progress ${className}`.trim()}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress__fill"
        style={{
          width: `${value}%`,
          background: colour,
        }}
      />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-title-row">
      <div>
        {eyebrow && (
          <div className="eyebrow">
            {eyebrow}
          </div>
        )}

        <h2>{title}</h2>
      </div>

      {action}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span
        className="empty-state__icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}

/* ============================================================
   XP HEADER
============================================================ */

function PlayerHero({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const avatar = getAvatar(data.player.avatar);

  return (
    <section className="hero player-hero">
      <div className="player-identity">
        <div
          className="large-avatar"
          aria-hidden="true"
        >
          {avatar}
        </div>

        <div>
          <div className="hero-eyebrow">
            YOUR PROFILE
          </div>

          <h1>{data.player.gamertag}</h1>

          <p className="hero-subtitle">
            Your journey, your goals, your squad.
          </p>
        </div>
      </div>

      <div className="player-xp-block">
        <div className="xp">
          {formatXP(data.player.xp)}
          <span> XP</span>
        </div>

        <div className="hero-muted">
          Lifetime XP
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   GROUP PROGRESS
============================================================ */

function GroupProgress({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const target =
    data.target_xp || DEFAULT_TARGET_XP;

  const progress = percentage(
    data.group_xp,
    target,
  );

  const remaining = Math.max(
    0,
    target - data.group_xp,
  );

  return (
    <section className="card featured-progress">
      <SectionHeading
        eyebrow="SQUAD PROGRESS"
        title={`${formatXP(data.group_xp)} XP`}
        action={
          <div className="progress-number">
            {Math.round(progress)}%
          </div>
        }
      />

      <p className="muted progress-description">
        Every player's positive progress contributes
        towards the shared squad goal.
      </p>

      <ProgressBar
        value={progress}
        className="large-progress"
        ariaLabel="Squad progress towards the group goal"
      />

      <div className="progress-footer">
        <span>
          Goal: {formatXP(target)} XP
        </span>

        <strong>
          {formatXP(remaining)} XP to go
        </strong>
      </div>
    </section>
  );
}

/* ============================================================
   CURRENT PHASE
============================================================ */

function CurrentPhase({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const phase = data.phase;

  if (!phase) {
    return (
      <section className="card">
        <SectionHeading
          eyebrow="PROGRAMME"
          title="Current phase"
        />

        <EmptyState
          icon="🗺️"
          title="No active phase"
          description="Your youth worker will let you know when the next phase is ready."
        />
      </section>
    );
  }

  const colour = getCurrentPhaseColour(data);

  return (
    <section className="card">
      <SectionHeading
        eyebrow="CURRENT PHASE"
        title={phase.name}
        action={
          <span
            className="phase-pill"
            style={{
              background: colour,
            }}
          >
            ACTIVE
          </span>
        }
      />

      <div
        className="phase-display"
        style={{
          borderColor: colour,
        }}
      >
        <div
          className="phase-icon"
          style={{
            background: colour,
          }}
          aria-hidden="true"
        >
          {phase.icon || "⭐"}
        </div>

        <div>
          <h3>{phase.name}</h3>

          <p className="muted">
            {phase.description ||
              "Your current programme phase."}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SKILL TREE
============================================================ */

function SkillTree({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const skillTree = data.skill_tree;

  if (!skillTree) {
    return (
      <section className="card">
        <SectionHeading
          eyebrow="PERSONAL PROGRESSION"
          title="Skill tree"
        />

        <EmptyState
          icon="🌱"
          title="Your next goal is coming"
          description="Your youth worker will help you choose a personal skill goal."
        />
      </section>
    );
  }

  const milestones =
    skillTree.milestones ?? [];

  const completed =
    getCompletedMilestones(milestones);

  const progress =
    getMilestonePercentage(milestones);

  return (
    <section className="card skill-tree-card">
      <SectionHeading
        eyebrow="PERSONAL PROGRESSION"
        title="Skill tree"
        action={
          <span className="percentage-badge">
            {Math.round(progress)}%
          </span>
        }
      />

      <div className="skill-tree-heading">
        <h3>{skillTree.name}</h3>

        {skillTree.description && (
          <p className="muted">
            {skillTree.description}
          </p>
        )}
      </div>

      <ProgressBar
        value={progress}
        className="skill-progress"
        ariaLabel="Skill tree completion"
      />

      <div className="skill-progress-meta">
        <span>
          {completed} of {milestones.length}{" "}
          milestones complete
        </span>

        <strong>
          {Math.round(progress)}%
        </strong>
      </div>

      <div className="skill-tree">
        {milestones.map(
          (milestone, index) => {
            const previousCompleted =
              milestones
                .slice(0, index)
                .every(
                  item => item.completed,
                );

            const state =
              milestone.completed
                ? "completed"
                : previousCompleted
                ? "current"
                : "locked";

            return (
              <div
                key={`${milestone.name}-${index}`}
                className={`skill-node ${state}`}
              >
                <div
                  className="skill-node-icon"
                  aria-hidden="true"
                >
                  {milestone.completed
                    ? "✓"
                    : index + 1}
                </div>

                <div className="skill-node-content">
                  <strong>
                    {milestone.name}
                  </strong>

                  <span>
                    {formatXP(
                      milestone.required_xp,
                    )}{" "}
                    XP
                  </span>

                  {milestone.reward && (
                    <small>
                      {milestone.reward}
                    </small>
                  )}
                </div>

                <div
                  className="skill-node-status"
                  aria-label={
                    milestone.completed
                      ? "Completed"
                      : state === "current"
                      ? "Current milestone"
                      : "Locked"
                  }
                >
                  {milestone.completed
                    ? "DONE"
                    : state === "current"
                    ? "NEXT"
                    : "LOCKED"}
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}

/* ============================================================
   BADGES
============================================================ */

function BadgeCabinet({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const badges = data.badges ?? [];

  return (
    <section className="card">
      <SectionHeading
        eyebrow="ACHIEVEMENTS"
        title="Badge cabinet"
      />

      {badges.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Your cabinet is empty"
          description="Complete your first achievement to start building your collection."
        />
      ) : (
        <div className="badge-grid">
          {badges.map((badge, index) => (
            <article
              className="badge"
              key={`${badge.name}-${index}`}
              style={{
                background:
                  badge.colour ||
                  "var(--primary)",
              }}
            >
              <span
                className="badge__icon"
                aria-hidden="true"
              >
                🏆
              </span>

              <strong>{badge.name}</strong>

              {badge.description && (
                <small>
                  {badge.description}
                </small>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   MYSTERY PROGRESS
============================================================ */

function MysteryProgress({
  xp,
}: {
  xp: number;
}) {
  const next =
    getNextThreshold(
      xp,
      MYSTERY_THRESHOLDS.map(
        item => item.xp,
      ),
    );

  const unlocked =
    MYSTERY_THRESHOLDS.filter(
      item => xp >= item.xp,
    );

  return (
    <section className="card">
      <SectionHeading
        eyebrow="MYSTERY CONTENT"
        title="Hidden rewards"
      />

      <p className="muted">
        Your lifetime XP unlocks mystery
        milestones. Rewards are revealed by the
        platform when they are genuinely earned.
      </p>

      <div className="mystery-track">
        {MYSTERY_THRESHOLDS.map(
          milestone => {
            const complete =
              xp >= milestone.xp;

            return (
              <div
                key={milestone.xp}
                className={`mystery-node ${
                  complete
                    ? "completed"
                    : ""
                }`}
              >
                <div
                  className="mystery-node__icon"
                  aria-hidden="true"
                >
                  {complete ? "🎁" : "?"}
                </div>

                <strong>
                  {milestone.label}
                </strong>

                <span>
                  {formatXP(
                    milestone.xp,
                  )}{" "}
                  XP
                </span>
              </div>
            );
          },
        )}
      </div>

      {next ? (
        <div className="mystery-next">
          <span>
            Next unlock
          </span>

          <strong>
            {formatXP(
              Math.max(0, next - xp),
            )}{" "}
            XP to go
          </strong>
        </div>
      ) : (
        <div className="notice notice--success">
          All current mystery milestones
          unlocked.
        </div>
      )}

      {unlocked.length > 0 && (
        <p className="small-muted">
          {unlocked.length} of{" "}
          {MYSTERY_THRESHOLDS.length} mystery
          milestones reached.
        </p>
      )}
    </section>
  );
}

/* ============================================================
   CHALLENGES
============================================================ */

function Challenges({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const challenges = data.challenges ?? [];

  if (!challenges.length) {
    return (
      <section className="card section-gap">
        <SectionHeading
          eyebrow="GAMEPLAY"
          title="Challenges"
        />

        <EmptyState
          icon="⚡"
          title="No live challenges"
          description="New challenges will appear here when your youth work team activates them."
        />
      </section>
    );
  }

  return (
    <section className="card section-gap">
      <SectionHeading
        eyebrow="LIVE GAMEPLAY"
        title="Current challenges"
        action={
          <span className="live-dot">
            LIVE
          </span>
        }
      />

      <div className="challenge-grid">
        {challenges.map(challenge => (
          <article
            className="challenge-card"
            key={challenge.id}
          >
            <div
              className="challenge-icon"
              aria-hidden="true"
            >
              ⚡
            </div>

            <div className="challenge-card__content">
              <h3>{challenge.title}</h3>

              {challenge.description && (
                <p className="muted">
                  {challenge.description}
                </p>
              )}
            </div>

            <div className="challenge-rewards">
              <div>
                <small>
                  Participation
                </small>

                <strong>
                  +
                  {formatXP(
                    challenge.participation_xp,
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Elite
                </small>

                <strong>
                  +
                  {formatXP(
                    challenge.elite_xp,
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Winner
                </small>

                <strong>
                  +
                  {formatXP(
                    challenge.winner_xp,
                  )}
                </strong>
              </div>
            </div>

            <div className="challenge-card__footer">
              Complete the challenge to have
              your result verified by the game.
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   MAP
============================================================ */

function GameMap({
  data,
}: {
  data: PlayerDashboardData;
}) {
  const map = data.map;

  if (!map) {
    return null;
  }

  const colour = getCurrentPhaseColour(data);

  return (
    <section className="card section-gap">
      <SectionHeading
        eyebrow="YOUR WORLD"
        title={map.name}
        action={
          <span className="map-status">
            ● LIVE
          </span>
        }
      />

      <div
        className="game-map"
        style={{
          backgroundImage:
            map.background_image
              ? `url("${map.background_image}")`
              : undefined,
        }}
      >
        {!map.background_image && (
          <div className="map-placeholder">
            <span
              aria-hidden="true"
            >
              🗺️
            </span>

            <strong>
              {map.name}
            </strong>

            <small>
              Your squad's current map
            </small>
          </div>
        )}

        {(map.locations ?? []).map(
          location => (
            <div
              key={location.id}
              className="map-pin enhanced-map-pin"
              title={location.name}
              style={{
                left: `${location.x * 100}%`,
                top: `${location.y * 100}%`,
              }}
            >
              <span
                className="map-pin__marker"
                style={{
                  borderColor: colour,
                  background: colour,
                }}
                aria-hidden="true"
              >
                {location.icon &&
                location.icon.length <= 4
                  ? location.icon
                  : "📍"}
              </span>

              <small>
                {location.name}
              </small>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PROFILE PRIVACY
============================================================ */

function PrivacyNotice() {
  return (
    <section className="privacy-notice">
      <div
        className="privacy-notice__icon"
        aria-hidden="true"
      >
        🔒
      </div>

      <div>
        <strong>
          Your game identity stays anonymous
        </strong>

        <p>
          The public game uses your gamertag and
          avatar. Your real name and photograph are
          never displayed on the public leaderboard.
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PlayerDashboard() {
  const [data, setData] =
    useState<PlayerDashboardData | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadDashboard = useCallback(
    async (background = false) => {
      try {
        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response =
          await playerDashboard();

        setData(response.data);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Unable to load your dashboard.",
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
    void loadDashboard();
  }, [loadDashboard]);

  /*
   * Keep the player dashboard reasonably fresh without
   * creating aggressive polling.
   *
   * This is deliberately a refresh rather than client-side
   * mutation. The server remains the source of truth.
   */
  useEffect(() => {
    const interval = window.setInterval(
      () => {
        void loadDashboard(true);
      },
      60_000,
    );

    return () =>
      window.clearInterval(interval);
  }, [loadDashboard]);

  const themeStyle = useMemo(() => {
    if (!data?.theme) {
      return undefined;
    }

    return {
      "--player-primary":
        data.theme.primary,
      "--player-secondary":
        data.theme.secondary,
      "--player-accent":
        data.theme.accent,
      "--player-background":
        data.theme.background,
      "--player-surface":
        data.theme.surface,
      "--player-text":
        data.theme.text,
    } as React.CSSProperties;
  }, [data?.theme]);

  if (loading) {
    return (
      <Layout>
        <div
          className="card dashboard-loading"
          aria-live="polite"
        >
          <div
            className="loading-orb"
            aria-hidden="true"
          >
            ✦
          </div>

          <h2>
            Loading your journey...
          </h2>

          <p className="muted">
            Getting your latest progress.
          </p>
        </div>
      </Layout>
    );
  }

  if (error && !data) {
    return (
      <Layout>
        <div
          className="card dashboard-error"
          role="alert"
        >
          <div
            className="dashboard-error__icon"
            aria-hidden="true"
          >
            !
          </div>

          <h2>
            We couldn't load your journey
          </h2>

          <p className="muted">
            {error}
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              void loadDashboard()
            }
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  if (!data?.player) {
    return (
      <Layout>
        <div className="card">
          <EmptyState
            icon="👤"
            title="Player profile not found"
            description="Please speak to your youth worker."
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={
        data.programme?.name ||
        "Digital Youth Platform"
      }
    >
      <div
        className="player-dashboard"
        style={themeStyle}
      >
        {/* ==================================================
            HERO
        ================================================== */}

        <PlayerHero data={data} />

        {/* ==================================================
            BACKGROUND REFRESH
        ================================================== */}

        {refreshing && (
          <div
            className="dashboard-sync"
            aria-live="polite"
          >
            Updating your progress...
          </div>
        )}

        {/* ==================================================
            GROUP XP
        ================================================== */}

        <GroupProgress data={data} />

        {/* ==================================================
            TWO COLUMN CORE
        ================================================== */}

        <div className="grid player-core-grid">
          <CurrentPhase data={data} />

          <MysteryProgress
            xp={data.player.xp}
          />
        </div>

        {/* ==================================================
            PERSONAL PROGRESSION
        ================================================== */}

        <div className="grid player-progression-grid">
          <SkillTree data={data} />

          <BadgeCabinet data={data} />
        </div>

        {/* ==================================================
            CHALLENGES
        ================================================== */}

        <Challenges data={data} />

        {/* ==================================================
            MAP
        ================================================== */}

        <GameMap data={data} />

        {/* ==================================================
            PRIVACY
        ================================================== */}

        <PrivacyNotice />

        {/* ==================================================
            NON-BLOCKING ERROR
        ================================================== */}

        {error && data && (
          <div
            className="notice notice--error section-gap"
            role="status"
          >
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}
