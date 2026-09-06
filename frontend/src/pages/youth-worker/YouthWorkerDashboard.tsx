import {
  useCallback,
  useEffect,
  useState,
} from "react";

import YouthWorkerGroups from "../../components/youth-worker/YouthWorkerGroups";

import {
  adminCommunityAwards,
  adminOverview,
  adminPlayers,
  getStaffGroups,
  createStaffGroup,
  updateStaffGroup,
  addPlayerToStaffGroup,
  removePlayerFromStaffGroup,
  awardXP,
  getApiErrorMessage,
  getStaffChallenges,
getStaffChallengeAttempts,
verifyChallengeAttempt,
rejectChallengeAttempt,
  reviewCommunityAward,
  startAttendance,
  type AdminOverview,
  type CommunityAward,
  type Player,
  type StaffGroup,
  type StaffChallenge,
type StaffChallengeAttempt,
} from "../../api/client";

const MAX_MANUAL_XP = 5000;

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
        Math.max(0, (current / target) * 100),
      )
    : 0;

  return (
    <div className="staff-progress">
      <div style={{ width: `${value}%` }} />
    </div>
  );
}

type Modal =
  | "attendance"
  | "xp"
  | "challenge"
  | "awards"
  | null;

export default function YouthWorkerDashboard() {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [awards, setAwards] =
    useState<CommunityAward[]>([]);

  const [groups, setGroups] =
    useState<StaffGroup[]>([]);

  const [groupName, setGroupName] =
    useState("");

  const [groupPlayerIds, setGroupPlayerIds] =
    useState<number[]>([]);

  const [editingGroupId, setEditingGroupId] =
    useState<number | null>(null);

  const [groupBusyPlayerId, setGroupBusyPlayerId] =
    useState<number | null>(null);

  const [groupSaving, setGroupSaving] =
    useState(false);

  const [challenges, setChallenges] =
    useState<StaffChallenge[]>([]);

  const [attempts, setAttempts] =
    useState<StaffChallengeAttempt[]>([]);

  const [reviewingAttemptId, setReviewingAttemptId] =
    useState<number | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [modal, setModal] =
    useState<Modal>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [attendanceCode, setAttendanceCode] =
    useState<string | null>(null);

  const [attendanceExpiry, setAttendanceExpiry] =
    useState<string | null>(null);

  const [attendanceDuration, setAttendanceDuration] =
    useState("15");

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<number | "">("");

  const [xpAmount, setXpAmount] =
    useState("500");

  const [xpReason, setXpReason] =
    useState("");

  const [reviewingAwardId, setReviewingAwardId] =
    useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [
        overviewResponse,
        playersResponse,
        awardsResponse,
        groupsResponse,
        challengesResponse,
        attemptsResponse,
      ] = await Promise.all([
        adminOverview(),
        adminPlayers(),
        adminCommunityAwards(),
        getStaffGroups(),
        getStaffChallenges(),
        getStaffChallengeAttempts({
          status: "submitted",
        }),
      ]);

      setOverview(overviewResponse.data);
      setPlayers(playersResponse.data);
      setAwards(awardsResponse.data);
      setGroups(groupsResponse.data);
      setChallenges(challengesResponse.data);

      const attemptData = attemptsResponse.data;

      setAttempts(
        Array.isArray(attemptData)
          ? attemptData
          : attemptData.attempts ?? [],
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

  async function handleStartAttendance() {
    setActionLoading(true);
    setActionError(null);

    try {
      const duration = Number(attendanceDuration);

      if (
        !Number.isInteger(duration) ||
        duration < 1 ||
        duration > 120
      ) {
        setActionError(
          "Attendance must last between 1 and 120 minutes.",
        );
        return;
      }

      const response = await startAttendance({
        expires_in_minutes: duration,
      });

      setAttendanceCode(response.data.code);
      setAttendanceExpiry(
        response.data.expires_at ?? null,
      );
      setModal("attendance");
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          "Unable to start attendance.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAwardXP() {
    const playerId =
      selectedPlayerId === ""
        ? null
        : Number(selectedPlayerId);

    const amount = Number(xpAmount);
    const reason = xpReason.trim();

    if (!playerId) {
      setActionError(
        "Select a player first.",
      );
      return;
    }

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      setActionError(
        "Enter a whole-number XP amount greater than zero.",
      );
      return;
    }

    if (amount > MAX_MANUAL_XP) {
      setActionError(
        `Manual XP awards cannot exceed ${formatXP(
          MAX_MANUAL_XP,
        )} XP.`,
      );
      return;
    }

    if (!reason) {
      setActionError(
        "Enter a reason for the XP award.",
      );
      return;
    }

    if (reason.length > 300) {
      setActionError(
        "The XP reason must be 300 characters or fewer.",
      );
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await awardXP(
        playerId,
        amount,
        reason,
      );

      setModal(null);
      setSelectedPlayerId("");
      setXpAmount("500");
      setXpReason("");

      await load();
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          "Unable to award XP.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyAttempt(
    attemptId: number,
  ) {
    setReviewingAttemptId(attemptId);
    setActionError(null);

    try {
      await verifyChallengeAttempt(attemptId);
      await load();
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          "Unable to verify challenge submission.",
        ),
      );
    } finally {
      setReviewingAttemptId(null);
    }
  }

  async function handleRejectAttempt(
    attemptId: number,
  ) {
    const reason = rejectReason.trim();

    if (!reason) {
      setActionError(
        "Enter a reason before rejecting a submission.",
      );
      return;
    }

    setReviewingAttemptId(attemptId);
    setActionError(null);

    try {
      await rejectChallengeAttempt(
        attemptId,
        { reason },
      );

      setRejectReason("");
      await load();
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          "Unable to reject challenge submission.",
        ),
      );
    } finally {
      setReviewingAttemptId(null);
    }
  }

  async function handleReviewAward(
    id: number,
    status: "approved" | "rejected",
  ) {
    let xp: number | undefined;

    if (status === "approved") {
      const input = window.prompt(
        "How many XP points should be awarded for this community recognition?",
        "25",
      );

      // Cancel means do nothing.
      if (input === null) {
        return;
      }

      const value = input.trim();

      if (!value) {
        setActionError(
          "Enter the number of XP points before approving.",
        );
        return;
      }

      // XP must be a whole positive number.
      if (!/^\\d+$/.test(value)) {
        setActionError(
          "XP points must be a whole positive number.",
        );
        return;
      }

      xp = Number(value);

      if (!Number.isSafeInteger(xp) || xp < 1) {
        setActionError(
          "XP points must be greater than zero.",
        );
        return;
      }

      if (xp > 10000) {
        setActionError(
          "XP points cannot exceed 10,000.",
        );
        return;
      }
    }

    setReviewingAwardId(id);
    setActionError(null);

    try {
      await reviewCommunityAward(
        id,
        status,
        xp,
      );

      await load();
    } catch (err) {
      setActionError(
        getApiErrorMessage(
          err,
          `Unable to ${status} community award.`,
        ),
      );
    } finally {
      setReviewingAwardId(null);
    }
  }

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
          <h1>Dashboard unavailable</h1>
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
          disabled={loading}
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

      {actionError && (
        <div className="staff-inline-error">
          {actionError}
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
              disabled={actionLoading}
              onClick={() => {
                setActionError(null);
                setAttendanceCode(null);
                setAttendanceExpiry(null);
                setModal("attendance");
              }}
            >
              <span>✓</span>
              Attendance
            </button>

            <button
              type="button"
              className="staff-action"
              onClick={() => {
                setActionError(null);
                setModal("xp");
              }}
            >
              <span>⚡</span>
              Award XP
            </button>

            <button
              type="button"
              className="staff-action"
              onClick={() => {
                setActionError(null);
                setModal("challenge");
              }}
            >
              <span>🎮</span>
              Challenge
            </button>

            <button
              type="button"
              className="staff-action"
              onClick={() => {
                setActionError(null);
                setModal("awards");
              }}
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
                    {player.avatar || "★"}
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
                    {formatXP(player.xp)} XP
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

            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setActionError(null);
                setModal("awards");
              }}
            >
              Review
            </button>
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

                  <div className="staff-award__actions">
                    <span
                      className={
                        "staff-status " +
                        `staff-status--${award.status}`
                      }
                    >
                      {award.status}
                    </span>

                    {award.status === "pending" && (
                      <div className="staff-award__buttons">
                        <button
                          type="button"
                          className="button button--primary"
                          disabled={
                            reviewingAwardId === award.id
                          }
                          onClick={() =>
                            void handleReviewAward(
                              award.id,
                              "approved",
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="button button--danger"
                          disabled={
                            reviewingAwardId === award.id
                          }
                          onClick={() =>
                            void handleReviewAward(
                              award.id,
                              "rejected",
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
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

          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setActionError(null);
              setModal("challenge");
            }}
          >
            Manage
          </button>
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
                    `staff-status--${
                      challenge.state ??
                      "scheduled"
                    }`
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

      <YouthWorkerGroups
        players={players}
      />

      {modal === "attendance" && (
        <div className="staff-modal-backdrop">
          <div className="staff-modal">
            <div className="staff-modal__header">
              <div>
                <span className="staff-eyebrow">
                  ATTENDANCE
                </span>

                <h2>
                  {attendanceCode
                    ? "Session ready"
                    : "Start attendance"}
                </h2>
              </div>

              <button
                type="button"
                className="staff-modal__close"
                disabled={actionLoading}
                onClick={() => {
                  if (!actionLoading) {
                    setModal(null);
                  }
                }}
              >
                ×
              </button>
            </div>

            {attendanceCode ? (
              <>
                <p>
                  Ask participants to enter this
                  code on their attendance screen.
                </p>

                <div className="staff-attendance-code">
                  {attendanceCode}
                </div>

                <div className="staff-modal__meta">
                  Expires:{" "}
                  {formatDate(
                    attendanceExpiry,
                  )}
                </div>

                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => {
                    setModal(null);
                    setAttendanceCode(null);
                    setAttendanceExpiry(null);
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p>
                  Choose how long the attendance
                  session should remain active.
                </p>

                <div className="staff-form">
                  <label>
                    Session duration

                    <select
                      value={attendanceDuration}
                      onChange={(event) =>
                        setAttendanceDuration(
                          event.target.value,
                        )
                      }
                      disabled={actionLoading}
                    >
                      <option value="5">
                        5 minutes
                      </option>

                      <option value="10">
                        10 minutes
                      </option>

                      <option value="15">
                        15 minutes
                      </option>

                      <option value="30">
                        30 minutes
                      </option>

                      <option value="60">
                        60 minutes
                      </option>

                      <option value="120">
                        120 minutes
                      </option>
                    </select>
                  </label>
                </div>

                {actionError && (
                  <div className="staff-inline-error">
                    {actionError}
                  </div>
                )}

                <div className="staff-modal__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    disabled={actionLoading}
                    onClick={() =>
                      setModal(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="button button--primary"
                    disabled={actionLoading}
                    onClick={() =>
                      void handleStartAttendance()
                    }
                  >
                    {actionLoading
                      ? "Starting..."
                      : "Start session"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "xp" && (
        <div className="staff-modal-backdrop">
          <div className="staff-modal">
            <div className="staff-modal__header">
              <div>
                <span className="staff-eyebrow">
                  XP
                </span>

                <h2>
                  Award XP
                </h2>
              </div>

              <button
                type="button"
                className="staff-modal__close"
                onClick={() =>
                  setModal(null)
                }
              >
                ×
              </button>
            </div>

            <div className="staff-form">
              <label>
                Player
                <select
                  value={selectedPlayerId}
                  onChange={(event) =>
                    setSelectedPlayerId(
                      event.target.value
                        ? Number(
                            event.target.value,
                          )
                        : "",
                    )
                  }
                >
                  <option value="">
                    Select player
                  </option>

                  {players.map((player) => (
                    <option
                      key={player.id}
                      value={player.id}
                    >
                      {player.gamertag} —{" "}
                      {formatXP(player.xp)} XP
                    </option>
                  ))}
                </select>
              </label>

              <label>
                XP amount
                <input
                  type="number"
                  step="1"
                  value={xpAmount}
                  onChange={(event) =>
                    setXpAmount(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Reason
                <textarea
                  rows={3}
                  value={xpReason}
                  onChange={(event) =>
                    setXpReason(
                      event.target.value,
                    )
                  }
                  placeholder="Explain why this XP is being awarded..."
                />
              </label>

              {actionError && (
                <div className="staff-inline-error">
                  {actionError}
                </div>
              )}

              <button
                type="button"
                className="button button--primary"
                disabled={actionLoading}
                onClick={() =>
                  void handleAwardXP()
                }
              >
                {actionLoading
                  ? "Awarding..."
                  : "Award XP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "challenge" && (
        <div className="staff-modal-backdrop">
          <div className="staff-modal staff-modal--wide">
            <div className="staff-modal__header">
              <div>
                <span className="staff-eyebrow">
                  CHALLENGES
                </span>

                <h2>
                  Challenge control
                </h2>
              </div>

              <button
                type="button"
                className="staff-modal__close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            <div className="staff-review-section">
              <div className="staff-review-section__heading">
                <div>
                  <span className="staff-eyebrow">
                    SUBMISSIONS
                  </span>

                  <h3>
                    Awaiting review
                  </h3>
                </div>

                <span className="staff-count">
                  {attempts.length}
                </span>
              </div>

              {attempts.length === 0 ? (
                <div className="staff-empty">
                  No challenge submissions are waiting
                  for review.
                </div>
              ) : (
                <div className="staff-review-list">
                  {attempts.map((attempt) => (
                    <article
                      className="staff-review-item"
                      key={attempt.id}
                    >
                      <div className="staff-review-item__content">
                        <strong>
                          {attempt.challenge_title ||
                            `Challenge #${attempt.challenge_id}`}
                        </strong>

                        <p>
                          {attempt.gamertag ||
                            attempt.player_name ||
                            attempt.player_username ||
                            `Player #${attempt.player_id}`}
                        </p>

                        <p>
                          Score:{" "}
                          <strong>
                            {attempt.score}
                          </strong>
                        </p>

                        {attempt.evidence_type && (
                          <small>
                            Evidence:{" "}
                            {attempt.evidence_type}
                          </small>
                        )}

                        {attempt.evidence_payload && (
                          <div className="staff-evidence">
                            <strong>
                              Evidence
                            </strong>

                            <p>
                              {attempt.evidence_payload}
                            </p>
                          </div>
                        )}

                        <small>
                          Submitted:{" "}
                          {formatDate(
                            attempt.submitted_at ||
                              attempt.created_at,
                          )}
                        </small>

                        <small>
                          Reference:{" "}
                          {attempt.attempt_reference}
                        </small>
                      </div>

                      <div className="staff-review-form">
                        <button
                          type="button"
                          className="button button--primary"
                          disabled={
                            reviewingAttemptId ===
                            attempt.id
                          }
                          onClick={() =>
                            void handleVerifyAttempt(
                              attempt.id,
                            )
                          }
                        >
                          {reviewingAttemptId ===
                          attempt.id
                            ? "Reviewing..."
                            : "Verify & award XP"}
                        </button>

                        <textarea
                          rows={3}
                          value={
                            reviewingAttemptId ===
                            attempt.id
                              ? rejectReason
                              : undefined
                          }
                          onChange={(event) =>
                            setRejectReason(
                              event.target.value,
                            )
                          }
                          placeholder="Reason for rejection"
                        />

                        <button
                          type="button"
                          className="button button--danger"
                          disabled={
                            reviewingAttemptId ===
                            attempt.id
                          }
                          onClick={() =>
                            void handleRejectAttempt(
                              attempt.id,
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="staff-review-section">
              <div className="staff-review-section__heading">
                <div>
                  <span className="staff-eyebrow">
                    LIVE CHALLENGES
                  </span>

                  <h3>
                    Challenge status
                  </h3>
                </div>

                <span className="staff-count">
                  {challenges.length}
                </span>
              </div>

              <div className="staff-review-list">
                {challenges.map((challenge) => (
                  <div
                    className="staff-review-item"
                    key={challenge.id}
                  >
                    <div>
                      <strong>
                        {challenge.title}
                      </strong>

                      <p>
                        {challenge.description ||
                          "No description"}
                      </p>

                      <small>
                        {challenge.state ||
                          "scheduled"}{" "}
                        ·{" "}
                        {formatDate(
                          challenge.start_at,
                        )}
                      </small>
                    </div>

                    <span
                      className={
                        "staff-status " +
                        `staff-status--${
                          challenge.state ||
                          "scheduled"
                        }`
                      }
                    >
                      {challenge.state ||
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
            </div>
          </div>
        </div>
      )}

      {modal === "awards" && (
        <div className="staff-modal-backdrop">
          <div className="staff-modal staff-modal--wide">
            <div className="staff-modal__header">
              <div>
                <span className="staff-eyebrow">
                  COMMUNITY
                </span>

                <h2>
                  Review awards
                </h2>
              </div>

              <button
                type="button"
                className="staff-modal__close"
                onClick={() =>
                  setModal(null)
                }
              >
                ×
              </button>
            </div>

            <div className="staff-review-list">
              {awards.map((award) => (
                <article
                  className="staff-review-item"
                  key={award.id}
                >
                  <div>
                    <strong>
                      {award.category}
                    </strong>

                    <p>
                      {award.description}
                    </p>

                    <small>
                      Submitted by{" "}
                      {award.submitted_by_name ||
                        "Unknown"}{" "}
                      ·{" "}
                      {formatDate(
                        award.created_at,
                      )}
                    </small>
                  </div>

                  {award.status ===
                  "pending" ? (
                    <div className="staff-review-form">
                      <button
                        type="button"
                        className="button button--primary"
                        disabled={
                          reviewingAwardId ===
                          award.id
                        }
                        onClick={() =>
                          void handleReviewAward(
                            award.id,
                            "approved",
                          )
                        }
                      >
                        {reviewingAwardId ===
                        award.id
                          ? "Working..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        className="button button--danger"
                        disabled={
                          reviewingAwardId ===
                          award.id
                        }
                        onClick={() =>
                          void handleReviewAward(
                            award.id,
                            "rejected",
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span
                      className={
                        "staff-status " +
                        `staff-status--${award.status}`
                      }
                    >
                      {award.status}
                    </span>
                  )}
                </article>
              ))}

              {!awards.length && (
                <div className="staff-empty">
                  No community awards yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
