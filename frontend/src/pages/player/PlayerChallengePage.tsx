import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getApiErrorMessage,
  getChallenge,
  submitChallengeAttempt,
} from "../../api/client";

import {
  ChallengeRuntime,
} from "../../components/player/challenges/ChallengeRuntime";

import type {
  ChallengeAttempt,
  PlayerChallenge,
} from "../../components/player/challenges/challengeRuntimeTypes";

/* ============================================================
   API → RUNTIME MAPPING
============================================================ */

type ApiChallenge = Awaited<
  ReturnType<typeof getChallenge>
>["data"];

type ApiChallengeAttempt =
  ApiChallenge extends {
    attempt?: infer A;
  }
    ? A
    : never;

function mapChallengeAttempt(
  attempt: ApiChallengeAttempt | null | undefined,
): ChallengeAttempt | null {
  if (!attempt) {
    return null;
  }

  const raw =
    attempt as Record<string, unknown>;

  return {
    id: String(
      raw.id ?? "",
    ),

    challengeId: String(
      raw.challenge_id ??
        raw.challengeId ??
        "",
    ),

    playerId: String(
      raw.player_id ??
        raw.playerId ??
        "current",
    ),

    startedAt: String(
      raw.started_at ??
        raw.startedAt ??
        new Date().toISOString(),
    ),

    submittedAt:
      raw.submitted_at != null
        ? String(
            raw.submitted_at,
          )
        : raw.submittedAt != null
          ? String(
              raw.submittedAt,
            )
          : null,

    score:
      typeof raw.score === "number"
        ? raw.score
        : null,

    attempts:
      typeof raw.attempts === "number"
        ? raw.attempts
        : typeof raw.attempt_number ===
            "number"
          ? raw.attempt_number
          : null,

    status:
      raw.status === "verified"
        ? "verified"
        : raw.status === "rejected"
          ? "rejected"
          : raw.status === "submitted"
            ? "submitted"
            : "started",

    evidence: null,
  };
}

function mapChallenge(
  apiChallenge: ApiChallenge,
): PlayerChallenge {
  const raw =
    apiChallenge as unknown as Record<
      string,
      unknown
    >;

  const id =
    raw.id;

  const startsAt =
    raw.starts_at ??
    raw.startsAt;

  const endsAt =
    raw.ends_at ??
    raw.endsAt;

  const participationXp =
    raw.participation_xp ??
    raw.participationXp ??
    0;

  const eliteXp =
    raw.elite_xp ??
    raw.eliteXp ??
    0;

  const winnerIndividualXp =
    raw.winner_individual_xp ??
    raw.winnerIndividualXp ??
    raw.winner_xp ??
    0;

  const minimumAttempts =
    raw.minimum_attempts ??
    raw.minimumAttempts ??
    null;

  const eliteThreshold =
    raw.elite_threshold ??
    raw.eliteThreshold ??
    null;

  const evidenceType =
    raw.evidence_type ??
    raw.evidenceType ??
    "score_submission";

  return {
    id: String(
      id ?? "",
    ),

    title: String(
      raw.title ?? "",
    ),

    description: String(
      raw.description ?? "",
    ),

    startsAt: String(
      startsAt ??
        new Date().toISOString(),
    ),

    endsAt: String(
      endsAt ??
        new Date().toISOString(),
    ),

    participationXp:
      Number(
        participationXp,
      ),

    eliteXp:
      Number(
        eliteXp,
      ),

    winnerIndividualXp:
      Number(
        winnerIndividualXp,
      ),

    minimumAttempts:
      minimumAttempts == null
        ? null
        : Number(
            minimumAttempts,
          ),

    eliteThreshold:
      eliteThreshold == null
        ? null
        : Number(
            eliteThreshold,
          ),

    evidenceType:
      evidenceType ===
      "automatic"
        ? "automatic"
        : evidenceType ===
            "staff_verified"
          ? "staff_verified"
          : evidenceType ===
              "qr_scan"
            ? "qr_scan"
            : evidenceType ===
                "attendance"
              ? "attendance"
              : "score_submission",

    attempt:
      mapChallengeAttempt(
        raw.attempt as
          | ApiChallengeAttempt
          | null
          | undefined,
      ),
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function PlayerChallengePage() {
  const navigate =
    useNavigate();

  const {
    challengeId,
  } = useParams<{
    challengeId: string;
  }>();

  const [
    challenge,
    setChallenge,
  ] = useState<PlayerChallenge | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    resultMessage,
    setResultMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    challengeResult,
    setChallengeResult,
  ] = useState<any>(
    null,
  );

  useEffect(() => {
    if (!challengeId) {
      setError(
        "Challenge ID is missing.",
      );

      setLoading(false);

      return;
    }

    const numericChallengeId =
      Number(
        challengeId,
      );

    if (
      !Number.isInteger(
        numericChallengeId,
      ) ||
      numericChallengeId <= 0
    ) {
      setError(
        "Invalid challenge ID.",
      );

      setLoading(false);

      return;
    }

    let cancelled = false;

    async function loadChallenge() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await getChallenge(
            numericChallengeId,
          );

        if (!cancelled) {
          setChallenge(
            mapChallenge(
              response.data,
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Unable to load this challenge.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="app-loading">
        <div className="app-loading__inner">
          <p>
            Loading challenge...
          </p>
        </div>
      </main>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error ||
    !challenge
  ) {
    return (
      <main className="app-error">
        <div className="app-error__card">
          <h1>
            Challenge unavailable
          </h1>

          <p>
            {error ??
              "This challenge could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const numericChallengeId =
    Number(
      challengeId,
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {resultMessage && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"
            role="status"
          >
            {resultMessage}
          </div>
        </div>
      )}

      {/* ======================================================
          CHALLENGE RESULT
      ====================================================== */}

      {challengeResult && (
        <section className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div
              className="mb-2 text-xs font-bold tracking-widest text-white/60"
            >
              CHALLENGE COMPLETE
            </div>

            <h2 className="text-xl font-semibold">
              Challenge complete
            </h2>

            {typeof challengeResult.player_total_xp ===
              "number" && (
              <p className="mt-2 text-sm text-white/70">
                Total XP:{" "}
                <strong className="text-white">
                  {challengeResult.player_total_xp.toLocaleString(
                    "en-GB",
                  )}
                </strong>
              </p>
            )}

            <button
              type="button"
              className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={() =>
                navigate(
                  "/player",
                )
              }
            >
              Back to my dashboard
            </button>
          </div>
        </section>
      )}

      {/* ======================================================
          CHALLENGE RUNTIME
      ====================================================== */}

      <ChallengeRuntime
        challenge={
          challenge
        }

        onStartAttempt={
          async () => {
            /*
             * The backend currently does not expose a separate
             * player start-attempt endpoint.
             *
             * This UUID becomes attempt_reference when the
             * authoritative result is submitted.
             */

            const attemptId =
              crypto.randomUUID();

            const now =
              new Date().toISOString();

            const attempt: ChallengeAttempt = {
              id:
                attemptId,

              challengeId:
                String(
                  numericChallengeId,
                ),

              playerId:
                "current",

              startedAt:
                now,

              submittedAt:
                null,

              score:
                null,

              attempts:
                null,

              status:
                "started",

              evidence:
                null,
            };

            return attempt;
          }
        }

        onSubmitAttempt={
          async (payload) => {
            if (
              !Number.isInteger(
                numericChallengeId,
              ) ||
              numericChallengeId <= 0
            ) {
              throw new Error(
                "Invalid challenge ID.",
              );
            }

            /*
             * The backend requires a real numeric score.
             *
             * Do not silently convert an absent score into 0,
             * because 0 is a legitimate score and means something
             * different from "the client failed to provide a score".
             */

            if (
              payload.score == null ||
              !Number.isFinite(
                payload.score,
              )
            ) {
              throw new Error(
                "A valid score is required before submitting.",
              );
            }

            const response =
              await submitChallengeAttempt(
                numericChallengeId,
                {
                  score:
                    payload.score,

                  attempt_id:
                    payload.attemptId,

                  metadata: {
                    attempts:
                      payload.attempts ??
                      null,

                    evidence:
                      payload.evidence ??
                      null,

                    client_submitted_at:
                      new Date().toISOString(),
                  },
                },
              );

            const result =
              response.data;

            /*
             * Store the complete authoritative backend result
             * so the completion panel can render it.
             */
            setChallengeResult(
              result,
            );

            const xp =
              result.xp;

            const totalXp =
              result.player_total_xp;

            const rewards: string[] =
              [];

            if (
              xp.participation > 0
            ) {
              rewards.push(
                `+${xp.participation} participation XP`,
              );
            }

            if (
              xp.elite > 0 &&
              result.achievement
                .elite
            ) {
              rewards.push(
                `+${xp.elite} elite XP`,
              );
            }

            if (
              xp.winner > 0 &&
              result.achievement
                .winner
            ) {
              rewards.push(
                `+${xp.winner} winner XP`,
              );
            }

            if (
              rewards.length > 0
            ) {
              setResultMessage(
                `Challenge submitted successfully. ${rewards.join(
                  ", ",
                )}. Total XP: ${totalXp}.`,
              );
            } else {
              setResultMessage(
                `Challenge submitted successfully. Total XP: ${totalXp}.`,
              );
            }

            return {
              attempt:
                result.attempt,

              achievement:
                result.achievement,

              xp:
                result.xp,

              player_total_xp:
                result.player_total_xp,
            };
          }
        }
      />
    </div>
  );
}