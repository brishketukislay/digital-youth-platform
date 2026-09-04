import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getApiErrorMessage,
  getChallenge,
} from "../../api/client";

import {
  ChallengeRuntime,
} from "../../components/player/challenges/ChallengeRuntime";

import type {
  PlayerChallenge,
} from "../../components/player/challenges/challengeRuntimeTypes";

export default function PlayerChallengePage() {
  const { challengeId } =
    useParams<{
      challengeId: string;
    }>();

  const [challenge, setChallenge] =
    useState<PlayerChallenge | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!challengeId) {
      setError("Challenge ID is missing.");
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
            Number(challengeId),
          );

        if (!cancelled) {
          setChallenge(response.data as unknown as PlayerChallenge);
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

  if (loading) {
    return (
      <main className="app-loading">
        <div className="app-loading__inner">
          <p>Loading challenge...</p>
        </div>
      </main>
    );
  }

  if (error || !challenge) {
    return (
      <main className="app-error">
        <div className="app-error__card">
          <h1>Challenge unavailable</h1>
          <p>
            {error ??
              "This challenge could not be found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ChallengeRuntime
        challenge={challenge}
        onSubmitAttempt={async ({
          score,
        }) => {
          await getChallenge;
          await Promise.resolve(score);
        }}
      />
    </div>
  );
}