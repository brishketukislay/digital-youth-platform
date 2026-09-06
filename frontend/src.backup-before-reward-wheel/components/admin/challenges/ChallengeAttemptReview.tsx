import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getApiErrorMessage,
  getStaffChallengeAttempt,
  getStaffChallengeAttempts,
  rejectChallengeAttempt,
  verifyChallengeAttempt,
  type ChallengeAttemptStatus,
  type StaffChallengeAttempt,
} from "../../../api/client";

type ChallengeAttemptReviewProps = {
  onClose?: () => void;
};

type Filter =
  | "all"
  | "submitted"
  | "verified"
  | "rejected";

function normaliseAttempts(
  response: {
    data:
      | StaffChallengeAttempt[]
      | {
          attempts: StaffChallengeAttempt[];
          [key: string]: unknown;
        };
  },
): StaffChallengeAttempt[] {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  return Array.isArray(response.data.attempts)
    ? response.data.attempts
    : [];
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function statusLabel(
  status: ChallengeAttemptStatus,
) {
  switch (status) {
    case "submitted":
      return "Needs review";

    case "verified":
      return "Verified";

    case "rejected":
      return "Rejected";

    default:
      return "Created";
  }
}

function statusClasses(
  status: ChallengeAttemptStatus,
) {
  switch (status) {
    case "submitted":
      return "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20";

    case "verified":
      return "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20";

    case "rejected":
      return "bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20";

    default:
      return "bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20";
  }
}

function prettyEvidence(
  attempt: StaffChallengeAttempt,
) {
  if (!attempt.evidence_payload) {
    return "No evidence payload supplied.";
  }

  try {
    return JSON.stringify(
      JSON.parse(attempt.evidence_payload),
      null,
      2,
    );
  } catch {
    return attempt.evidence_payload;
  }
}

export function ChallengeAttemptReview({
  onClose,
}: ChallengeAttemptReviewProps) {
  const [attempts, setAttempts] =
    useState<StaffChallengeAttempt[]>([]);

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const [selected, setSelected] =
    useState<StaffChallengeAttempt | null>(null);

  const [filter, setFilter] =
    useState<Filter>("submitted");

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [rejecting, setRejecting] =
    useState(false);

  const [rejectReason, setRejectReason] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const loadAttempts = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await getStaffChallengeAttempts(
            filter === "all"
              ? undefined
              : {
                  status: filter,
                },
          );

        const next =
          normaliseAttempts(response);

        setAttempts(next);

        if (
          selectedId !== null &&
          !next.some(
            (attempt) =>
              attempt.id === selectedId,
          )
        ) {
          setSelectedId(null);
          setSelected(null);
        }
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load challenge attempts.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [filter, selectedId],
  );

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    if (selectedId === null) {
      setSelected(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);

      try {
        const response =
          await getStaffChallengeAttempt(
            selectedId!,
          );

        if (!cancelled) {
          setSelected(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Unable to load attempt details.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredAttempts =
    useMemo(() => {
      const value =
        query.trim().toLowerCase();

      if (!value) {
        return attempts;
      }

      return attempts.filter(
        (attempt) =>
          String(
            attempt.attempt_reference ?? "",
          )
            .toLowerCase()
            .includes(value) ||
          String(
            attempt.player_name ?? "",
          )
            .toLowerCase()
            .includes(value) ||
          String(
            attempt.player_username ?? "",
          )
            .toLowerCase()
            .includes(value) ||
          String(
            attempt.challenge_title ?? "",
          )
            .toLowerCase()
            .includes(value),
      );
    }, [attempts, query]);

  const submittedCount =
    attempts.filter(
      (attempt) =>
        attempt.status === "submitted",
    ).length;

  async function verify() {
    if (!selected) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        await verifyChallengeAttempt(
          selected.id,
        );

      setMessage(
        `Attempt verified. ${response.data.xp.individual} individual XP awarded.`,
      );

      await loadAttempts();

      setSelected({
        ...selected,
        status: "verified",
        verified: true,
        elite:
          response.data.achievement.elite,
        winner:
          response.data.achievement.winner,
        percentile:
          response.data.percentile,
        individual_xp:
          response.data.xp.individual,
        group_xp:
          response.data.xp.group,
        participation_xp:
          response.data.xp.participation,
        elite_xp:
          response.data.xp.elite,
        winner_xp:
          response.data.xp.winner,
      });
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to verify this attempt.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function reject() {
    const reason =
      rejectReason.trim();

    if (!selected || !reason) {
      setError(
        "Please provide a rejection reason.",
      );
      return;
    }

    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      await rejectChallengeAttempt(
        selected.id,
        { reason },
      );

      setMessage(
        "Attempt rejected. No XP was awarded.",
      );

      setRejecting(false);

      setSelected({
        ...selected,
        status: "rejected",
        rejection_reason: reason,
      });

      setRejectReason("");

      await loadAttempts();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to reject this attempt.",
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
            Engagement
          </div>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Attempt review
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Review submitted challenge evidence and
            decide whether the participant should receive
            the configured rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              void loadAttempts()
            }
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing…"
              : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Awaiting review
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-300">
            {submittedCount}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Showing
          </div>
          <div className="mt-2 text-3xl font-bold text-white">
            {filteredAttempts.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Queue
          </div>
          <div className="mt-2 text-sm font-medium text-slate-300">
            {filter === "submitted"
              ? "Pending staff decisions"
              : "Challenge attempt history"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["submitted", "Needs review"],
                ["all", "All"],
                ["verified", "Verified"],
                ["rejected", "Rejected"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setFilter(value)
                  }
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    filter === value
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search participant, challenge or reference…"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
          />
        </div>
      </div>

      <div className="grid min-h-[520px] gap-4 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.5fr)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="font-semibold text-white">
              Review queue
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Select an attempt to inspect it.
            </div>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading attempts…
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl">
                  ✓
                </div>
                <div className="mt-3 font-semibold text-white">
                  Nothing to review
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  There are no attempts matching
                  the current filter.
                </div>
              </div>
            ) : (
              filteredAttempts.map(
                (attempt) => {
                  const active =
                    selectedId ===
                    attempt.id;

                  return (
                    <button
                      key={attempt.id}
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          attempt.id,
                        )
                      }
                      className={[
                        "w-full border-b border-white/5 p-4 text-left transition",
                        active
                          ? "bg-cyan-400/[0.08]"
                          : "hover:bg-white/[0.03]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-white">
                            {attempt.player_name ||
                              attempt.player_username ||
                              `Player #${attempt.player_id}`}
                          </div>

                          <div className="mt-1 truncate text-xs text-slate-500">
                            {attempt.challenge_title ||
                              `Challenge #${attempt.challenge_id}`}
                          </div>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                            statusClasses(
                              attempt.status,
                            ),
                          ].join(" ")}
                        >
                          {statusLabel(
                            attempt.status,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-500">
                          {attempt.attempt_reference}
                        </span>

                        <span className="font-semibold text-cyan-300">
                          Score {attempt.score}
                        </span>
                      </div>
                    </button>
                  );
                },
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70">
          {!selectedId ? (
            <div className="flex h-full min-h-[520px] items-center justify-center p-8 text-center">
              <div>
                <div className="text-5xl">
                  ⚡
                </div>
                <div className="mt-4 text-lg font-semibold text-white">
                  Select an attempt
                </div>
                <div className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Choose a submission from the queue
                  to inspect its score, evidence and
                  reward outcome.
                </div>
              </div>
            </div>
          ) : detailLoading ? (
            <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
              Loading attempt details…
            </div>
          ) : selected ? (
            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-mono text-xs text-slate-500">
                    {selected.attempt_reference}
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-white">
                    {selected.challenge_title ||
                      `Challenge #${selected.challenge_id}`}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Submitted by{" "}
                    <span className="font-medium text-slate-200">
                      {selected.player_name ||
                        selected.player_username ||
                        `Player #${selected.player_id}`}
                    </span>
                  </p>
                </div>

                <span
                  className={[
                    "self-start rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                    statusClasses(
                      selected.status,
                    ),
                  ].join(" ")}
                >
                  {statusLabel(
                    selected.status,
                  )}
                </span>
              </div>

              <div className="grid gap-3 py-6 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.04] p-4">
                  <div className="text-xs text-slate-500">
                    Score
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {selected.score}
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] p-4">
                  <div className="text-xs text-slate-500">
                    Percentile
                  </div>
                  <div className="mt-1 text-2xl font-bold text-cyan-300">
                    {selected.percentile != null
                      ? `${selected.percentile.toFixed(1)}%`
                      : "—"}
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] p-4">
                  <div className="text-xs text-slate-500">
                    Evidence
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {selected.evidence_type ||
                      "Not specified"}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Evidence
                  </div>

                  <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs leading-5 text-slate-300">
                    {prettyEvidence(
                      selected,
                    )}
                  </pre>
                </div>

                {selected.evidence_hash && (
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Evidence hash
                    </div>

                    <div className="break-all rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs text-slate-400">
                      {selected.evidence_hash}
                    </div>
                  </div>
                )}

                {selected.status ===
                  "rejected" &&
                  selected.rejection_reason && (
                    <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">
                        Rejection reason
                      </div>

                      <p className="mt-2 text-sm leading-6 text-rose-100">
                        {selected.rejection_reason}
                      </p>
                    </div>
                  )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs text-slate-500">
                      Created
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {formatDate(
                        selected.created_at,
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs text-slate-500">
                      Verified at
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {formatDate(
                        selected.verified_at,
                      )}
                    </div>
                  </div>
                </div>

                {selected.status ===
                  "verified" && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-emerald-300">
                        Reward outcome
                      </span>

                      {selected.elite && (
                        <span className="rounded-full bg-purple-400/10 px-2 py-1 text-xs font-semibold text-purple-300">
                          Elite
                        </span>
                      )}

                      {selected.winner && (
                        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-300">
                          Winner
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs text-slate-500">
                          Individual XP
                        </div>
                        <div className="mt-1 font-bold text-white">
                          +
                          {selected.individual_xp ??
                            0}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">
                          Group XP
                        </div>
                        <div className="mt-1 font-bold text-white">
                          +
                          {selected.group_xp ??
                            0}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">
                          Participation XP
                        </div>
                        <div className="mt-1 font-bold text-white">
                          +
                          {selected.participation_xp ??
                            0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selected.status ===
                "submitted" && (
                <div className="mt-7 border-t border-white/10 pt-6">
                  {!rejecting ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          setRejecting(true)
                        }
                        className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-5 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/20 disabled:opacity-50"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          void verify()
                        }
                        className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionLoading
                          ? "Verifying…"
                          : "Verify & award XP"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-5">
                      <div className="font-semibold text-white">
                        Reject this attempt
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        The attempt will be marked rejected
                        and will not receive XP.
                      </p>

                      <textarea
                        value={rejectReason}
                        onChange={(event) =>
                          setRejectReason(
                            event.target.value,
                          )
                        }
                        rows={4}
                        maxLength={1000}
                        placeholder="Explain why this submission cannot be verified…"
                        className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-400/50"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={
                            actionLoading
                          }
                          onClick={() => {
                            setRejecting(false);
                            setRejectReason("");
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading ||
                            !rejectReason.trim()
                          }
                          onClick={() =>
                            void reject()
                          }
                          className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading
                            ? "Rejecting…"
                            : "Confirm rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
