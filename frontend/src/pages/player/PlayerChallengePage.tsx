import { ChallengeRuntime } from "../../components/player/challenges/ChallengeRuntime";

import type { PlayerChallenge } from "../../components/player/challenges/challengeRuntimeTypes";

type PlayerChallengePageProps = {
  challenge: PlayerChallenge;
};

export function PlayerChallengePage({
  challenge,
}: PlayerChallengePageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ChallengeRuntime
        challenge={challenge}
        onStartAttempt={async (
          challengeId,
        ) => {
          /*
           * Replace with the existing API client.
           *
           * POST /challenges/:challengeId/attempts
           *
           * The backend should:
           * - authenticate the player
           * - verify challenge is live
           * - prevent duplicate active attempts
           * - create the attempt
           * - return the attempt ID
           */

          throw new Error(
            `Start-attempt API is not wired yet for ${challengeId}`,
          );
        }}
        onSubmitAttempt={async (
          payload,
        ) => {
          /*
           * Replace with the existing API client.
           *
           * POST /challenge-attempts/:attemptId/submit
           *
           * The backend must perform all validation
           * and XP allocation.
           */

          console.log(
            "Challenge submission",
            payload,
          );
        }}
      />
    </div>
  );
}