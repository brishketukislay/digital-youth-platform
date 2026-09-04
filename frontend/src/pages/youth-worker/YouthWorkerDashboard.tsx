import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  adminCommunityAwards,
  adminOverview,
  adminPlayers,
  getApiErrorMessage,
  getStaffChallenges,
  type AdminOverview,
  type CommunityAward,
  type Player,
  type StaffChallenge,
} from "../../api/client";

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(
    value,
  );
}

function ProgressBar({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const value = target
    ? Math.min(
        100,
        Math.max(
          0,
          (current / target) * 100,
        ),
      )
    : 0;

  return (
    <div className="staff-progress">
      <div
        style={{
          width: `${value}%`,
        }}
      />
    </div>
  );
}

export default function YouthWorkerDashboard() {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [awards, setAwards] =
    useState<CommunityAward[]>([]);

  const [challenges, setChallenges] =
    useState<StaffChallenge[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [
        overviewResponse,
        playersResponse,
        awardsResponse,
        challengesResponse,
      ] = await Promise.all([
        adminOverview(),
        adminPlayers(),
        adminCommunityAwards(),
        getStaffChallenges(),
      ]);

      setOverview(
        overviewResponse.data,
      );

      setPlayers(
        playersResponse.data,
      );

      setAwards(
        awardsResponse.data,
      );

      setChallenges(
        challengesResponse.data,
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load the youth worker dashboard.",
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

  if (loading && !overview) {
    return (
      <main className="staff-page">
        <div className="staff-loading">
          Loading delivery dashboard...
        </div>
      </main>
    );
  }

  if (error && !overview) {
    return (
      <main className="staff-page">
        <div className="staff-error">
          <h1>
            Dashboard unavailable
          </h1>

          <p>{error}</p>

          <button
            className="button button--primary"
            type="button"
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

  const groupProgress =
    overview?.target_xp
      ? Math.min(
          100,
          (overview.group_xp /
            overview.target_xp) *
            100,
        )
      : 0;

  const pendingAwards =
    awards.filter(
      (award) =>
        award.status === "pending",
    ).length;

  const liveChallenges =
    challenges.filter(
      (challenge) =>
        challenge.state === "live",
    ).length;

  return (
    <main className="staff-page">
      <header className="staff-header">
        <div>
          <span className="staff-eyebrow">
            YOUTH WORKER
          </span>

          <h1>
            Delivery dashboard
          </h1>

          <p>
            Everything you need to keep
            the programme moving today.
          </p>
        </div>

        <button
          className="button button--secondary"
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="staff-inline-error">
          {error}
        </div>
      )}

      <section className="staff-stat-grid">
        <div className="staff-stat staff-stat--green">
          <span>PLAYERS</span>
          <strong>
            {overview?.players ?? players.length}
          </strong>
          <small>
            active participants
          </small>
        </div>

        <div className="staff-stat staff-stat--purple">
          <span>GROUP XP</span>
          <strong>
            {formatXP(
              overview?.group_xp ?? 0,
            )}
          </strong>
          <small>
            {groupProgress.toFixed(1)}% of target
          </small>
        </div>

        <div className="staff-stat staff-stat--orange">
          <span>AWARDS</span>
          <strong>
            {pendingAwards}
          </strong>
          <small>
            awaiting review
          </small>
        </div>

        <div className="staff-stat staff-stat--blue">
          <span>CHALLENGES</span>
          <strong>
            {liveChallenges}
          </strong>
          <small>
            currently live
          </small>
        </div>
      </section>

      <section className="staff-main-grid">
        <div className="staff-card staff-card--progress">
          <div className="staff-card__heading">
            <div>
              <span>
                COLLECTIVE PROGRESS
              </span>

              <h2>
                {formatXP(
                  overview?.group_xp ?? 0,
                )}{" "}
                XP
              </h2>
            </div>

            <strong>
              {groupProgress.toFixed(1)}%
            </strong>
          </div>

          <ProgressBar
            current={
              overview?.group_xp ?? 0
            }
            target={
              overview?.target_xp ?? 0
            }
          />

          <div className="staff-progress-meta">
            <span>
              Programme target
            </span>

            <strong>
              {formatXP(
                overview?.target_xp ?? 0,
              )}{" "}
              XP
            </strong>
          </div>
        </div>

        <div className="staff-card">
          <div className="staff-card__heading">
            <div>
              <span>
                QUICK ACTIONS
              </span>

              <h2>
                Run the session
              </h2>
            </div>
          </div>

          <div className="staff-actions">
            <button
              type="button"
              className="staff-action"
            >
              <span>✓</span>
              Attendance
            </button>

            <button
              type="button"
              className="staff-action"
            >
              <span>⚡</span>
              Award XP
            </button>

            <button
              type="button"
              className="staff-action"
            >
              <span>🎮</span>
              Challenge
            </button>

            <button
              type="button"
              className="staff-action"
            >
              <span>★</span>
              Community awards
            </button>
          </div>
        </div>
      </section>

      <section className="staff-main-grid">
        <div className="staff-card">
          <div className="staff-card__heading">
            <div>
              <span>
                PARTICIPANTS
              </span>

              <h2>
                Player progress
              </h2>
            </div>

            <span className="staff-count">
              {players.length}
            </span>
          </div>

          <div className="staff-player-list">
            {players
              .slice(0, 8)
              .map((player) => (
                <div
                  className="staff-player"
                  key={player.id}
                >
                  <div className="staff-player__avatar">
                    {player.avatar ||
                      "★"}
                  </div>

                  <div className="staff-player__name">
                    <strong>
                      {player.gamertag}
                    </strong>

                    <small>
                      Player #{player.id}
                    </small>
                  </div>

                  <strong>
                    {formatXP(player.xp)}
                    {" "}XP
                  </strong>
                </div>
              ))}

            {!players.length && (
              <div className="staff-empty">
                No players found.
              </div>
            )}
          </div>
        </div>

        <div className="staff-card">
          <div className="staff-card__heading">
            <div>
              <span>
                COMMUNITY
              </span>

              <h2>
                Recent awards
              </h2>
            </div>
          </div>

          <div className="staff-award-list">
            {awards
              .slice(0, 5)
              .map((award) => (
                <div
                  className="staff-award"
                  key={award.id}
                >
                  <span className="staff-award__icon">
                    ★
                  </span>

                  <div>
                    <strong>
                      {award.category}
                    </strong>

                    <small>
                      {award.description}
                    </small>
                  </div>

                  <span
                    className={
                      "staff-status " +
                      `staff-status--${award.status}`
                    }
                  >
                    {award.status}
                  </span>
                </div>
              ))}

            {!awards.length && (
              <div className="staff-empty">
                No community awards yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="staff-card">
        <div className="staff-card__heading">
          <div>
            <span>
              CHALLENGES
            </span>

            <h2>
              Challenge control
            </h2>
          </div>

          <span className="staff-count">
            {challenges.length}
          </span>
        </div>

        <div className="staff-challenge-list">
          {challenges
            .slice(0, 6)
            .map((challenge) => (
              <div
                className="staff-challenge"
                key={challenge.id}
              >
                <div>
                  <strong>
                    {challenge.title}
                  </strong>

                  <small>
                    {challenge.description ||
                      "No description"}
                  </small>
                </div>

                <span
                  className={
                    "staff-status " +
                    `staff-status--${challenge.state ?? "scheduled"}`
                  }
                >
                  {challenge.state ??
                    "scheduled"}
                </span>
              </div>
            ))}

          {!challenges.length && (
            <div className="staff-empty">
              No challenges configured.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}