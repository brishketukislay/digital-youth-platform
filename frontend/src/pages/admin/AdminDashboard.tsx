import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  adminCommunityAwards,
  adminOverview,
  getApiErrorMessage,
  getStaffChallenges,
  type AdminOverview,
  type CommunityAward,
  type PlayerChallenge,
} from "../../api/client";

import { AdminShell } from "../../components/admin/AdminShell";
import type { AdminSection } from "../../components/admin/adminTypes";

import { PointEconomy } from "../../lib/admin/PointEconomy";
import { JackpotPage } from "../../components/admin/scoring/JackpotPage";
import { ChallengeManager } from "../../components/admin/challenges/ChallengeManager";
import { ChallengeAttemptReview } from "../../components/admin/challenges/ChallengeAttemptReview";
import RewardsManager from "../../components/admin/RewardsManager";
import RewardGamesManager from "../../components/admin/RewardGamesManager";
import { AuditLogPanel } from "../../components/admin/audit/AuditLogPanel";
import { PlayersPanel } from "../../components/admin/people/PlayersPanel";

import AdminProgramme from "./AdminProgramme";
import AdminMap from "./AdminMap";
import AdminThemes from "./AdminThemes";
import AdminPhases from "./AdminPhases";

type QuickAction = {
  section: AdminSection;
  label: string;
  description: string;
  icon: string;
};

const quickActions: QuickAction[] = [
  {
    section: "programme",
    label: "Programme",
    description: "Programme name, dates and XP target.",
    icon: "⚙",
  },
  {
    section: "phases",
    label: "Phases",
    description: "Manage progression phases.",
    icon: "◈",
  },
  {
    section: "themes",
    label: "Visual theme",
    description: "Control the player-facing identity.",
    icon: "✦",
  },
  {
    section: "map",
    label: "Game map",
    description: "Manage programme locations.",
    icon: "⌖",
  },
  {
    section: "points",
    label: "Point economy",
    description: "Configure XP and scoring rules.",
    icon: "✧",
  },
  {
    section: "rewards",
    label: "Rewards",
    description: "Manage participant rewards.",
    icon: "★",
  },
  {
    section: "players",
    label: "Players",
    description: "Manage accounts and XP adjustments.",
    icon: "♙",
  },
  {
    section: "audit",
    label: "Audit log",
    description: "Review administrative activity.",
    icon: "◷",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function challengeStatus(challenge: PlayerChallenge) {
  if (challenge.state === "live") {
    return "LIVE";
  }

  if (challenge.state === "scheduled") {
    return "UPCOMING";
  }

  if (challenge.active) {
    return "ACTIVE";
  }

  return "OFF";
}

function statusClass(status: string) {
  switch (status) {
    case "LIVE":
      return "admin-proto-status admin-proto-status--live";
    case "UPCOMING":
      return "admin-proto-status admin-proto-status--upcoming";
    case "ACTIVE":
      return "admin-proto-status admin-proto-status--active";
    default:
      return "admin-proto-status admin-proto-status--off";
  }
}

function AdminOverviewHome({
  onSectionChange,
}: {
  onSectionChange: (section: AdminSection) => void;
}) {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);

  const [challenges, setChallenges] =
    useState<PlayerChallenge[]>([]);

  const [awards, setAwards] =
    useState<CommunityAward[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);

      const [
        overviewResponse,
        challengeResponse,
        awardResponse,
      ] = await Promise.all([
        adminOverview(),
        getStaffChallenges(),
        adminCommunityAwards(),
      ]);

      setOverview(overviewResponse.data);
      setChallenges(challengeResponse.data);
      setAwards(awardResponse.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load the admin dashboard.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();

    const interval =
      window.setInterval(() => {
        void loadDashboard();
      }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const activeChallenges = useMemo(
    () =>
      challenges.filter(
        challenge =>
          challenge.state === "live" &&
          challenge.active,
      ),
    [challenges],
  );

  const upcomingChallenges = useMemo(
    () =>
      challenges.filter(
        challenge =>
          challenge.state === "scheduled" &&
          challenge.active,
      ),
    [challenges],
  );

  const pendingAwards = useMemo(
    () =>
      awards.filter(
        award =>
          award.status === "pending",
      ),
    [awards],
  );

  const progress = useMemo(() => {
    if (
      !overview ||
      overview.target_xp <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (overview.group_xp /
          overview.target_xp) *
          100,
      ),
    );
  }, [overview]);

  const pendingApprovals =
    pendingAwards.length;

  if (loading && !overview) {
    return (
      <div className="admin-proto-page">
        <section className="admin-proto-hero admin-proto-skeleton">
          <div />
          <div />
          <div />
        </section>

        <div className="admin-proto-stat-grid">
          {[1, 2, 3, 4].map(item => (
            <div
              className="admin-proto-card admin-proto-stat admin-proto-skeleton-card"
              key={item}
            />
          ))}
        </div>

        <div className="admin-proto-grid admin-proto-grid--2">
          <div className="admin-proto-card admin-proto-skeleton-card admin-proto-card--tall" />
          <div className="admin-proto-card admin-proto-skeleton-card admin-proto-card--tall" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="admin-proto-page">
        <div className="admin-proto-error">
          <strong>
            Unable to load admin dashboard
          </strong>

          <span>
            {error ??
              "The server did not return an overview."}
          </span>

          <button
            type="button"
            className="admin-proto-button admin-proto-button--primary"
            onClick={() => {
              setLoading(true);
              void loadDashboard();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-proto-page">
      {error && (
        <div className="admin-proto-notice">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadDashboard()}
          >
            Refresh
          </button>
        </div>
      )}

      <section className="admin-proto-hero">
        <div>
          <div className="admin-proto-eyebrow">
            PROGRAMME CONTROL
          </div>

          <h2>
            {overview.programme}
          </h2>

          <p>
            Configure games, progression,
            recognition and participant
            operations from one place.
          </p>
        </div>

        <div className="admin-proto-hero-actions">
          <button
            type="button"
            className="admin-proto-button"
            onClick={() =>
              onSectionChange("programme")
            }
          >
            Programme settings
          </button>

          <button
            type="button"
            className="admin-proto-button admin-proto-button--primary"
            onClick={() =>
              onSectionChange("challenges")
            }
          >
            + New challenge
          </button>
        </div>
      </section>

      <section className="admin-proto-stat-grid">
        <div className="admin-proto-card admin-proto-stat">
          <div className="admin-proto-stat-label">
            PLAYERS
          </div>

          <div className="admin-proto-stat-value">
            {formatNumber(overview.players)}
          </div>

          <div className="admin-proto-stat-foot">
            Active participant accounts
          </div>
        </div>

        <div className="admin-proto-card admin-proto-stat">
          <div className="admin-proto-stat-label">
            LIVE GAMES
          </div>

          <div className="admin-proto-stat-value">
            {formatNumber(activeChallenges.length)}
          </div>

          <div className="admin-proto-stat-foot">
            Currently available
          </div>
        </div>

        <div className="admin-proto-card admin-proto-stat">
          <div className="admin-proto-stat-label">
            UPCOMING
          </div>

          <div className="admin-proto-stat-value">
            {formatNumber(upcomingChallenges.length)}
          </div>

          <div className="admin-proto-stat-foot">
            Scheduled challenges
          </div>
        </div>

        <div className="admin-proto-card admin-proto-stat">
          <div className="admin-proto-stat-label">
            PENDING APPROVALS
          </div>

          <div className="admin-proto-stat-value">
            {formatNumber(pendingApprovals)}
          </div>

          <div className="admin-proto-stat-foot">
            Community recognition reviews
          </div>
        </div>
      </section>

      <section className="admin-proto-grid admin-proto-grid--2">
        <div className="admin-proto-card">
          <div className="admin-proto-card-header">
            <div>
              <h3>Game Library</h3>
              <p>
                Live challenge catalogue from the
                actual platform.
              </p>
            </div>

            <button
              type="button"
              className="admin-proto-button admin-proto-button--primary admin-proto-button--small"
              onClick={() =>
                onSectionChange("challenges")
              }
            >
              Manage
            </button>
          </div>

          <div className="admin-proto-list">
            {challenges.length === 0 ? (
              <div className="admin-proto-empty">
                No challenges configured yet.
              </div>
            ) : (
              challenges
                .slice(0, 6)
                .map(challenge => {
                  const status =
                    challengeStatus(
                      challenge,
                    );

                  return (
                    <button
                      type="button"
                      className="admin-proto-config-row admin-proto-config-row--button"
                      key={challenge.id}
                      onClick={() =>
                        onSectionChange(
                          "challenges",
                        )
                      }
                    >
                      <span className="admin-proto-icon">
                        ⚡
                      </span>

                      <span className="admin-proto-config-main">
                        <strong>
                          {challenge.title}
                        </strong>

                        <small>
                          {challenge.description ||
                            "No description"}
                        </small>
                      </span>

                      <span
                        className={statusClass(
                          status,
                        )}
                      >
                        {status}
                      </span>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        <div className="admin-proto-card">
          <div className="admin-proto-card-header">
            <div>
              <h3>Programme Health</h3>
              <p>
                Collective progress against the
                current programme target.
              </p>
            </div>

            <span className="admin-proto-badge admin-proto-badge--success">
              {progress >= 75
                ? "ON TRACK"
                : progress >= 40
                  ? "IN PROGRESS"
                  : "EARLY STAGE"}
            </span>
          </div>

          <div className="admin-proto-progress">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="admin-proto-progress-meta">
            <span>
              {formatNumber(
                overview.group_xp,
              )}{" "}
              XP
            </span>

            <span>
              {formatNumber(
                overview.target_xp,
              )}{" "}
              XP target
            </span>
          </div>

          <div className="admin-proto-health-grid">
            <button
              type="button"
              onClick={() =>
                onSectionChange("jackpot")
              }
            >
              <strong>
                {formatNumber(
                  overview.group_xp,
                )}
              </strong>

              <span>
                Collective XP
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onSectionChange("points")
              }
            >
              <strong>
                {formatNumber(
                  overview.target_xp,
                )}
              </strong>

              <span>
                Programme target
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="admin-proto-card">
        <div className="admin-proto-card-header">
          <div>
            <h3>
              Configuration & Operations
            </h3>

            <p>
              Jump directly into the live
              administrative controls.
            </p>
          </div>
        </div>

        <div className="admin-proto-action-grid">
          {quickActions.map(action => (
            <button
              type="button"
              className="admin-proto-action"
              key={action.section}
              onClick={() =>
                onSectionChange(action.section)
              }
            >
              <span className="admin-proto-icon">
                {action.icon}
              </span>

              <span>
                <strong>
                  {action.label}
                </strong>

                <small>
                  {action.description}
                </small>
              </span>

              <span className="admin-proto-arrow">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-proto-grid admin-proto-grid--2">
        <div className="admin-proto-card">
          <div className="admin-proto-card-header">
            <div>
              <h3>
                Public Dashboard Rules
              </h3>

              <p>
                Player-facing controls are kept
                in the existing configuration
                modules.
              </p>
            </div>
          </div>

          <div className="admin-proto-list">
            <button
              type="button"
              className="admin-proto-config-row admin-proto-config-row--button"
              onClick={() =>
                onSectionChange("themes")
              }
            >
              <span className="admin-proto-config-main">
                <strong>
                  Visual identity
                </strong>

                <small>
                  Manage colours and public-facing
                  presentation.
                </small>
              </span>

              <span className="admin-proto-switch admin-proto-switch--on">
                <span />
              </span>
            </button>

            <button
              type="button"
              className="admin-proto-config-row admin-proto-config-row--button"
              onClick={() =>
                onSectionChange("jackpot")
              }
            >
              <span className="admin-proto-config-main">
                <strong>
                  Collective progress
                </strong>

                <small>
                  Public programme progress and
                  milestone configuration.
                </small>
              </span>

              <span className="admin-proto-switch admin-proto-switch--on">
                <span />
              </span>
            </button>

            <button
              type="button"
              className="admin-proto-config-row admin-proto-config-row--button"
              onClick={() =>
                onSectionChange("rewards")
              }
            >
              <span className="admin-proto-config-main">
                <strong>
                  Recognition & rewards
                </strong>

                <small>
                  Manage the rewards available to
                  participants.
                </small>
              </span>

              <span className="admin-proto-switch admin-proto-switch--on">
                <span />
              </span>
            </button>
          </div>
        </div>

        <div className="admin-proto-card">
          <div className="admin-proto-card-header">
            <div>
              <h3>
                Recognition Approvals
              </h3>

              <p>
                Community nominations awaiting
                staff review.
              </p>
            </div>

            <button
              type="button"
              className="admin-proto-button admin-proto-button--small"
              onClick={() =>
                onSectionChange("community")
              }
            >
              Review
            </button>
          </div>

          <div className="admin-proto-list">
            {pendingAwards.length === 0 ? (
              <div className="admin-proto-empty admin-proto-empty--success">
                Nothing is waiting for review.
              </div>
            ) : (
              pendingAwards
                .slice(0, 4)
                .map(award => (
                  <button
                    type="button"
                    className="admin-proto-approval"
                    key={award.id}
                    onClick={() =>
                      onSectionChange(
                        "community",
                      )
                    }
                  >
                    <span>
                      <strong>
                        {award.category}
                      </strong>

                      <small>
                        {award.description}
                      </small>
                    </span>

                    <span>
                      →
                    </span>
                  </button>
                ))
            )}
          </div>
        </div>
      </section>

      <section className="admin-proto-card">
        <div className="admin-proto-card-header">
          <div>
            <h3>
              Operational Shortcuts
            </h3>

            <p>
              The prototype's compact workflow,
              connected to the real product.
            </p>
          </div>
        </div>

        <div className="admin-proto-shortcuts">
          <button
            type="button"
            onClick={() =>
              onSectionChange("attempts")
            }
          >
            <span>✓</span>
            Review attempts
          </button>

          <button
            type="button"
            onClick={() =>
              onSectionChange("reward-games")
            }
          >
            <span>🎁</span>
            Reward games
          </button>

          <button
            type="button"
            onClick={() =>
              onSectionChange("audit")
            }
          >
            <span>◷</span>
            Audit activity
          </button>

          <button
            type="button"
            onClick={() =>
              onSectionChange("players")
            }
          >
            <span>♙</span>
            Manage players
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [section, setSection] =
    useState<AdminSection>("overview");

  return (
    <AdminShell
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "overview" && (
        <AdminOverviewHome
          onSectionChange={setSection}
        />
      )}

      {section === "programme" && (
        <AdminProgramme />
      )}

      {section === "themes" && (
        <AdminThemes />
      )}

      {section === "phases" && (
        <AdminPhases />
      )}

      {section === "map" && (
        <AdminMap />
      )}

      {section === "points" && (
        <PointEconomy />
      )}

      {section === "jackpot" && (
        <JackpotPage />
      )}

      {section === "rewards" && (
        <RewardsManager />
      )}

      {section === "reward-games" && (
        <RewardGamesManager />
      )}

      {section === "challenges" && (
        <ChallengeManager />
      )}

      {section === "attempts" && (
        <ChallengeAttemptReview />
      )}

      {section === "players" && (
        <PlayersPanel />
      )}

      {section === "community" && (
        <div className="admin-proto-page">
          <div className="admin-proto-card">
            <h2>Community Awards</h2>
            <p>
              Use the existing community award
              review workflow from the staff
              administration area.
            </p>
          </div>
        </div>
      )}

      {section === "attendance" && (
        <div className="admin-proto-page">
          <div className="admin-proto-card">
            <h2>Attendance</h2>
            <p>
              Attendance management remains
              available through the existing
              staff workflow.
            </p>
          </div>
        </div>
      )}

      {section === "audit" && (
        <AuditLogPanel />
      )}
    </AdminShell>
  );
}
