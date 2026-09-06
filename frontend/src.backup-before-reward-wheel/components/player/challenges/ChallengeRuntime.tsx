import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canStartChallenge,
  getChallengeState,
} from "./challengeRuntimeUtils";

import {
  ChallengeCountdown,
} from "./ChallengeCountdown";

import {
  ChallengeEvidenceForm,
} from "./ChallengeEvidenceForm";

import {
  ChallengeInstructions,
} from "./ChallengeInstructions";

import {
  ChallengeStatePanel,
} from "./ChallengeStatePanel";

import type {
  ChallengeAttempt,
  PlayerChallenge,
} from "./challengeRuntimeTypes";

type ChallengeSubmitResult = {
  attempt?: Partial<ChallengeAttempt> & {
    id?: string | number;
    score?: number | null;
  };

  achievement?: {
    participation?: boolean;
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

  player_total_xp?: number;
};

type ChallengeRuntimeProps = {
  challenge: PlayerChallenge;

  onStartAttempt?: (
    challengeId: string,
  ) => Promise<ChallengeAttempt>;

  onSubmitAttempt?: (
    payload: {
      attemptId: string;
      score?: number;
      attempts?: number;
      evidence?: string;
    },
  ) => Promise<ChallengeSubmitResult | void>;

  onComplete?: () => void;
};

export function ChallengeRuntime({
  challenge,
  onStartAttempt,
  onSubmitAttempt,
  onComplete,
}: ChallengeRuntimeProps) {
  const [now, setNow] = useState(
    () => Date.now(),
  );

  const [attempt, setAttempt] =
    useState<ChallengeAttempt | null>(
      challenge.attempt ?? null,
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<ChallengeSubmitResult | null>(
      null,
    );

  /*
   * Keep the challenge page clock alive while the
   * challenge is open.
   */
  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      1000,
    );

    return () =>
      window.clearInterval(interval);
  }, []);

  /*
   * If the parent reloads the challenge and provides
   * an existing attempt, use that attempt as the
   * authoritative initial state.
   */
  useEffect(() => {
    setAttempt(
      challenge.attempt ?? null,
    );
  }, [challenge.attempt]);

  const currentChallenge = useMemo(
    () => ({
      ...challenge,
      attempt,
    }),
    [challenge, attempt],
  );

  const state = getChallengeState(
    currentChallenge,
    now,
  );

  /*
   * Start is intentionally client-side for now.
   *
   * The backend currently exposes submission rather
   * than a dedicated "start attempt" endpoint.
   *
   * The generated UUID becomes the backend's
   * attempt_reference when the result is submitted.
   */
  const start = useCallback(
    async () => {
      if (
        !onStartAttempt ||
        !canStartChallenge(
          currentChallenge,
          now,
        )
      ) {
        return;
      }

      setSubmitError(null);
      setResult(null);

      const created =
        await onStartAttempt(
          challenge.id,
        );

      setAttempt(created);
    },
    [
      onStartAttempt,
      currentChallenge,
      now,
      challenge.id,
    ],
  );

  const submit = useCallback(
    async (payload: {
      attemptId: string;
      score?: number;
      attempts?: number;
      evidence?: string;
    }) => {
      if (!onSubmitAttempt) {
        return;
      }

      if (!payload.attemptId) {
        setSubmitError(
          "This attempt is missing its identifier.",
        );
        return;
      }

      if (
        payload.score != null &&
        !Number.isFinite(
          payload.score,
        )
      ) {
        setSubmitError(
          "Score must be a valid number.",
        );
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      setResult(null);

      try {
        const response =
          await onSubmitAttempt(
            payload,
          );

        /*
         * Preserve the authoritative backend response.
         *
         * The backend decides:
         * - final score
         * - percentile
         * - elite status
         * - winner status
         * - XP
         * - total player XP
         */
        if (response) {
          setResult(response);
        }

        /*
         * The current player endpoint returns a successful
         * submission immediately. Verification, if required,
         * is handled by staff afterwards.
         */
        setAttempt((current) => {
          if (!current) {
            return current;
          }

          const backendAttempt =
            response?.attempt;

          return {
            ...current,

            id:
              backendAttempt?.id != null
                ? String(
                    backendAttempt.id,
                  )
                : current.id,

            status:
              backendAttempt?.status ===
              "verified"
                ? "verified"
                : backendAttempt?.status ===
                    "rejected"
                  ? "rejected"
                  : "submitted",

            submittedAt:
              current.submittedAt ??
              new Date().toISOString(),

            score:
              backendAttempt?.score ??
              payload.score ??
              current.score,

            attempts:
              payload.attempts ??
              current.attempts,

            evidence:
              current.evidence,
          };
        });

        onComplete?.();
      } catch (error) {
        /*
         * The page-level submit handler is responsible for
         * converting Axios/API errors into a useful message.
         *
         * We still provide a safe fallback here so the runtime
         * never silently fails.
         */
        const message =
          error instanceof Error &&
          error.message
            ? error.message
            : "Unable to submit this challenge.";

        setSubmitError(message);

        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      onSubmitAttempt,
      onComplete,
    ],
  );

  useEffect(() => {
    if (
      state === "completed"
    ) {
      onComplete?.();
    }
  }, [
    state,
    onComplete,
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <ChallengeInstructions
        challenge={currentChallenge}
      />

      {state === "live" && (
        <ChallengeCountdown
          challenge={currentChallenge}
        />
      )}

      <ChallengeStatePanel
        state={state}
        onStart={start}
        submitting={submitting}
      />

      {submitError && (
        <div
          className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {state === "live" &&
        attempt && (
          <LiveAttemptPanel
            challenge={
              currentChallenge
            }
            attempt={attempt}
          />
        )}

      {state === "live" &&
        attempt &&
        onSubmitAttempt && (
          <ChallengeEvidenceForm
            challenge={
              currentChallenge
            }
            attempt={attempt}
            submitting={submitting}
            onSubmit={submit}
          />
        )}

      {attempt?.status ===
        "submitted" && (
        <SubmissionStatusPanel
          result={result}
        />
      )}

      {attempt?.status ===
        "verified" && (
        <VerifiedResultPanel
          result={result}
        />
      )}

      {attempt?.status ===
        "rejected" && (
        <RejectedResultPanel
          attempt={attempt}
        />
      )}
    </main>
  );
}

/* ============================================================
   LIVE ATTEMPT
============================================================ */

function LiveAttemptPanel({
  challenge,
  attempt,
}: {
  challenge: PlayerChallenge;
  attempt: ChallengeAttempt;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Attempt active
          </div>

          <h2 className="mt-1 text-lg font-black">
            Keep going
          </h2>
        </div>

        <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
          LIVE
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-black/10 p-4">
        <p className="text-sm leading-6 text-slate-500">
          Complete the activity using the
          instructions provided by your youth
          worker. When finished, submit your
          result below.
        </p>
      </div>

      {challenge.minimumAttempts != null && (
        <div className="mt-4 text-xs text-slate-600">
          Required attempts:{" "}
          <span className="font-semibold text-slate-400">
            {challenge.minimumAttempts}
          </span>
        </div>
      )}

      <div className="mt-2 text-xs text-slate-600">
        Attempt ID:{" "}
        <span className="font-mono text-slate-700">
          {attempt.id}
        </span>
      </div>
    </section>
  );
}

/* ============================================================
   SUBMITTED
============================================================ */

function SubmissionStatusPanel({
  result,
}: {
  result: ChallengeSubmitResult | null;
}) {
  const xp =
    result?.xp;

  return (
    <section
      className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 sm:p-6"
      aria-live="polite"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-blue-300">
        Result recorded
      </div>

      <h2 className="mt-1 text-lg font-black text-white">
        Challenge submitted
      </h2>

      <p className="mt-2 text-sm leading-6 text-blue-100/70">
        Your result has been recorded successfully.
        If this challenge requires staff verification,
        XP will be finalised after verification.
      </p>

      {result && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {result.attempt?.score != null && (
            <ResultMetric
              label="Score"
              value={String(
                result.attempt.score,
              )}
            />
          )}

          {xp?.participation != null &&
            xp.participation > 0 && (
              <ResultMetric
                label="Participation XP"
                value={`+${xp.participation}`}
              />
            )}

          {xp?.elite != null &&
            xp.elite > 0 &&
            result.achievement?.elite && (
              <ResultMetric
                label="Elite XP"
                value={`+${xp.elite}`}
              />
            )}

          {xp?.winner != null &&
            xp.winner > 0 &&
            result.achievement?.winner && (
              <ResultMetric
                label="Winner XP"
                value={`+${xp.winner}`}
              />
            )}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   VERIFIED
============================================================ */

function VerifiedResultPanel({
  result,
}: {
  result: ChallengeSubmitResult | null;
}) {
  return (
    <section
      className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-6"
      aria-live="polite"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
        Verified
      </div>

      <h2 className="mt-1 text-lg font-black text-white">
        Challenge verified
      </h2>

      <p className="mt-2 text-sm leading-6 text-emerald-100/70">
        Your challenge result has been verified.
      </p>

      {result?.player_total_xp != null && (
        <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
          <div className="text-xs uppercase tracking-wider text-emerald-400/70">
            Total XP
          </div>

          <div className="mt-1 text-2xl font-black text-emerald-300">
            {result.player_total_xp}
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   REJECTED
============================================================ */

function RejectedResultPanel({
  attempt,
}: {
  attempt: ChallengeAttempt;
}) {
  return (
    <section
      className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 sm:p-6"
      aria-live="polite"
    >
      <div className="text-xs font-bold uppercase tracking-wider text-red-300">
        Result rejected
      </div>

      <h2 className="mt-1 text-lg font-black text-white">
        Submission requires attention
      </h2>

      <p className="mt-2 text-sm leading-6 text-red-100/70">
        Your submitted result was not accepted.
        Please check the challenge instructions
        or speak to your youth worker.
      </p>

      {attempt.score != null && (
        <div className="mt-4 text-sm text-red-100/60">
          Submitted score:{" "}
          <span className="font-semibold text-red-200">
            {attempt.score}
          </span>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   RESULT METRIC
============================================================ */

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-xl font-black text-white">
        {value}
      </div>
    </div>
  );
}