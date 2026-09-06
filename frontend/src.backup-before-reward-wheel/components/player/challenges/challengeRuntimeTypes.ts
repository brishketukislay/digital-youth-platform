export type PlayerChallengeState =
  | "scheduled"
  | "live"
  | "ended"
  | "submitted"
  | "awaiting_verification"
  | "completed"
  | "rejected";

export type ChallengeAttemptStatus =
  | "started"
  | "submitted"
  | "verified"
  | "rejected";

export type ChallengeAttempt = {
  id: string;
  challengeId: string;
  playerId: string;

  startedAt: string;
  submittedAt?: string | null;

  score?: number | null;
  attempts?: number | null;

  status: ChallengeAttemptStatus;

  evidence?: {
    type: string;
    value?: string | null;
  } | null;
};

export type PlayerChallenge = {
  id: string;
  title: string;
  description: string;

  startsAt: string;
  endsAt: string;

  participationXp: number;
  eliteXp: number;
  winnerIndividualXp: number;

  minimumAttempts?: number | null;
  eliteThreshold?: number | null;

  evidenceType:
    | "automatic"
    | "staff_verified"
    | "score_submission"
    | "qr_scan"
    | "attendance";

  attempt?: ChallengeAttempt | null;
};