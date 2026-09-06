import { useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  RefreshCw,
  XCircle,
} from "lucide-react";

type Attempt = {
  id: number;
  challenge_id?: number;
  player_id?: number;
  attempt_number?: number;
  attempt_reference?: string;
  status?: string;
  score?: number | null;
  percentile?: number | null;
  performance_percentile?: number | null;
  submitted_at?: string | null;
  verified?: boolean;
  verified_by?: number | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  evidence_type?: string | null;
  evidence_payload?: unknown;
  evidence_hash?: string | null;
  elite?: boolean;
  winner?: boolean;
  participation_awarded?: boolean;
  elite_awarded?: boolean;
  winner_awarded?: boolean;
  participation_xp?: number;
  elite_xp?: number;
  winner_xp?: number;
  individual_xp?: number;
  group_xp?: number;
  challenge?: {
    id?: number;
    title?: string;
  };
  player?: {
    id?: number;
    user_id?: number;
  };
  attempt?: {
    attempt_number?: number;
    attempt_reference?: string;
    status?: string;
    score?: number | null;
    percentile?: number | null;
    performance_percentile?: number | null;
    submitted_at?: string | null;
  };
  evidence?: {
    type?: string | null;
    payload?: unknown;
    hash?: string | null;
  };
  review?: {
    verified?: boolean;
    verified_by?: number | null;
    verified_at?: string | null;
    rejection_reason?: string | null;
  };
  achievement?: {
    participation_awarded?: boolean;
    elite_awarded?: boolean;
    winner_awarded?: boolean;
    elite?: boolean;
    winner?: boolean;
  };
  xp?: {
    participation?: number;
    elite?: number;
    winner?: number;
    individual?: number;
    group?: number;
  };
};

type ApiResponse = Attempt[] | { attempts?: Attempt[]; data?: Attempt[] };

function getToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function authHeaders() {
  const token = getToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function normaliseAttempts(data: ApiResponse): Attempt[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.attempts)) {
    return data.attempts;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

function statusLabel(status?: string): string {
  switch (status) {
    case "created":
      return "Created";
    case "submitted":
      return "Submitted";
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return status || "Unknown";
  }
}

function statusClasses(status?: string): string {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "submitted":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function displayScore(attempt: Attempt): string {
  const score = attempt.attempt?.score ?? attempt.score;

  return score === null || score === undefined
    ? "—"
    : String(score);
}

function displayPercentile(attempt: Attempt): string {
  const percentile =
    attempt.attempt?.percentile ??
    attempt.percentile ??
    attempt.performance_percentile;

  return percentile === null || percentile === undefined
    ? "—"
    : `${Number(percentile).toFixed(1)}%`;
}

function challengeTitle(attempt: Attempt): string {
  return (
    attempt.challenge?.title ||
    `Challenge #${attempt.challenge?.id ?? attempt.challenge_id ?? "—"}`
  );
}

function playerLabel(attempt: Attempt): string {
  const playerId = attempt.player?.id ?? attempt.player_id;

  return playerId === undefined
    ? "Unknown player"
    : `Player #${playerId}`;
}

export default function ChallengeAttempts() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] =
    useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function loadAttempts() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<ApiResponse>(
        "/api/challenges/staff/attempts",
        {
          headers: authHeaders(),
        },
      );

      setAttempts(normaliseAttempts(response.data));
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to load challenge attempts.",
        );
      } else {
        setError("Unable to load challenge attempts.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAttempt(attemptId: number) {
    setDetailLoading(true);
    setError("");

    try {
      const response = await axios.get<Attempt>(
        `/api/challenges/staff/attempts/${attemptId}`,
        {
          headers: authHeaders(),
        },
      );

      setSelectedAttempt(response.data);
      setShowReject(false);
      setRejectReason("");
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to load challenge attempt.",
        );
      } else {
        setError("Unable to load challenge attempt.");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function verifyAttempt() {
    if (!selectedAttempt) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await axios.post<Attempt>(
        `/api/challenges/staff/attempts/${selectedAttempt.id}/verify`,
        {},
        {
          headers: authHeaders(),
        },
      );

      setSelectedAttempt(response.data);
      await loadAttempts();
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to verify challenge attempt.",
        );
      } else {
        setError("Unable to verify challenge attempt.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectAttempt() {
    if (!selectedAttempt) {
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setError("A rejection reason is required.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const response = await axios.post<Attempt>(
        `/api/challenges/staff/attempts/${selectedAttempt.id}/reject`,
        {
          reason,
        },
        {
          headers: authHeaders(),
        },
      );

      setSelectedAttempt(response.data);
      setShowReject(false);
      setRejectReason("");
      await loadAttempts();
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to reject challenge attempt.",
        );
      } else {
        setError("Unable to reject challenge attempt.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    void loadAttempts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Challenge Attempts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review player submissions and approve or reject
              challenge results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAttempts()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Submissions
                  </h2>
                  <p className="text-sm text-slate-500">
                    {attempts.length} attempt
                    {attempts.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center px-5 py-16 text-sm text-slate-500">
                Loading attempts…
              </div>
            ) : attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <Clock
                  size={36}
                  className="mb-3 text-slate-300"
                />
                <p className="font-medium text-slate-700">
                  No challenge attempts found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Player submissions will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attempts.map((attempt) => {
                  const status =
                    attempt.attempt?.status ||
                    attempt.status;

                  const isSelected =
                    selectedAttempt?.id === attempt.id;

                  return (
                    <button
                      key={attempt.id}
                      type="button"
                      onClick={() => void loadAttempt(attempt.id)}
                      className={`block w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                        isSelected
                          ? "bg-blue-50"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {challengeTitle(attempt)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {playerLabel(attempt)}
                            {" · "}
                            Attempt #
                            {attempt.attempt?.attempt_number ??
                              attempt.attempt_number ??
                              "—"}
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {formatDate(
                              attempt.attempt?.submitted_at ??
                                attempt.submitted_at,
                            )}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                              status,
                            )}`}
                          >
                            {statusLabel(status)}
                          </span>

                          <span className="text-sm font-semibold text-slate-700">
                            Score: {displayScore(attempt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Attempt Review
              </h2>
            </div>

            {!selectedAttempt ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Eye
                  size={36}
                  className="mb-3 text-slate-300"
                />
                <p className="font-medium text-slate-700">
                  Select an attempt
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a submission from the list to review it.
                </p>
              </div>
            ) : detailLoading ? (
              <div className="px-6 py-16 text-center text-sm text-slate-500">
                Loading attempt…
              </div>
            ) : (
              <div className="space-y-6 p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {challengeTitle(selectedAttempt)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {playerLabel(selectedAttempt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                        selectedAttempt.attempt?.status ||
                          selectedAttempt.status,
                      )}`}
                    >
                      {statusLabel(
                        selectedAttempt.attempt?.status ||
                          selectedAttempt.status,
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Score
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {displayScore(selectedAttempt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Percentile
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {displayPercentile(selectedAttempt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Attempt reference
                    </span>
                    <span className="break-all text-right font-medium text-slate-800">
                      {selectedAttempt.attempt?.attempt_reference ??
                        selectedAttempt.attempt_reference ??
                        "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Submitted
                    </span>
                    <span className="text-right font-medium text-slate-800">
                      {formatDate(
                        selectedAttempt.attempt?.submitted_at ??
                          selectedAttempt.submitted_at,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Evidence type
                    </span>
                    <span className="text-right font-medium text-slate-800">
                      {selectedAttempt.evidence?.type ??
                        selectedAttempt.evidence_type ??
                        "—"}
                    </span>
                  </div>
                </div>

                <details className="rounded-lg border border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                    Evidence
                    <ChevronDown size={16} />
                  </summary>

                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">
                      {JSON.stringify(
                        selectedAttempt.evidence?.payload ??
                          selectedAttempt.evidence_payload ??
                          null,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </details>

                <details className="rounded-lg border border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                    XP & achievements
                    <ChevronUp size={16} />
                  </summary>

                  <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">
                          Participation
                        </span>
                        <p className="font-semibold">
                          {selectedAttempt.xp?.participation ??
                            selectedAttempt.participation_xp ??
                            0}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Elite
                        </span>
                        <p className="font-semibold">
                          {selectedAttempt.xp?.elite ??
                            selectedAttempt.elite_xp ??
                            0}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Winner
                        </span>
                        <p className="font-semibold">
                          {selectedAttempt.xp?.winner ??
                            selectedAttempt.winner_xp ??
                            0}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          Total individual
                        </span>
                        <p className="font-semibold">
                          {selectedAttempt.xp?.individual ??
                            selectedAttempt.individual_xp ??
                            0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(selectedAttempt.achievement?.elite ??
                        selectedAttempt.elite) && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                          Elite
                        </span>
                      )}

                      {(selectedAttempt.achievement?.winner ??
                        selectedAttempt.winner) && (
                        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                          Winner
                        </span>
                      )}

                      {(selectedAttempt.achievement
                        ?.participation_awarded ??
                        selectedAttempt.participation_awarded) && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Participation XP
                        </span>
                      )}
                    </div>
                  </div>
                </details>

                {(
                  selectedAttempt.review
                    ?.rejection_reason ??
                  selectedAttempt.rejection_reason
                ) && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                      Rejection reason
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      {selectedAttempt.review
                        ?.rejection_reason ??
                        selectedAttempt.rejection_reason}
                    </p>
                  </div>
                )}

                {(
                  selectedAttempt.attempt?.status ??
                  selectedAttempt.status
                ) === "submitted" && (
                  <div className="space-y-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() => void verifyAttempt()}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle size={17} />
                      {actionLoading
                        ? "Processing…"
                        : "Verify & Award XP"}
                    </button>

                    {!showReject ? (
                      <button
                        type="button"
                        onClick={() => setShowReject(true)}
                        disabled={actionLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={17} />
                        Reject Attempt
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <label className="block text-sm font-medium text-red-800">
                          Rejection reason
                        </label>

                        <textarea
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReason(event.target.value)
                          }
                          rows={4}
                          placeholder="Explain why this attempt is being rejected…"
                          className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowReject(false);
                              setRejectReason("");
                            }}
                            disabled={actionLoading}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => void rejectAttempt()}
                            disabled={actionLoading}
                            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
