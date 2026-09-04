import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  canStartChallenge,
  getChallengeState,
} from "./challengeRuntime";

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
  ) => Promise<void>;

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
    useState<
      ChallengeAttempt | null
    >(challenge.attempt ?? null);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      1000,
    );

    return () =>
      window.clearInterval(interval);
  }, []);

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

      setSubmitting(true);

      try {
        await onSubmitAttempt(
          payload,
        );

        setAttempt((current) =>
          current
            ? {
                ...current,
                status: "submitted",
                submittedAt:
                  new Date().toISOString(),
                score:
                  payload.score ??
                  current.score,
                attempts:
                  payload.attempts ??
                  current.attempts,
              }
            : current,
        );
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitAttempt],
  );

  useEffect(() => {
    if (state === "completed") {
      onComplete?.();
    }
  }, [state, onComplete]);

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

      {state === "live" &&
        attempt && (
          <LiveAttemptPanel
            challenge={
              currentChallenge
            }
            attempt={attempt}
            onSubmit={() => {
              // Submission is intentionally handled
              // by ChallengeEvidenceForm below.
            }}
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

      {state === "awaiting_verification" && (
        <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 text-sm text-blue-200/70">
          Your result is safely recorded. XP will only
          be added after verification.
        </div>
      )}
    </main>
  );
}

function LiveAttemptPanel({
  challenge,
  attempt,
}: {
  challenge: PlayerChallenge;
  attempt: ChallengeAttempt;
  onSubmit: () => void;
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
          Complete the activity using the instructions
          provided by your youth worker. When finished,
          submit your result below.
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