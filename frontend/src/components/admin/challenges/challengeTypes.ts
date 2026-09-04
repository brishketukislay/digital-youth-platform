export type ChallengeStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled";

export type ChallengeEvidenceType =
  | "automatic"
  | "staff_verified"
  | "score_submission"
  | "photo"
  | "qr_scan"
  | "attendance";

export type ChallengeScoringMode =
  | "participation"
  | "ranked"
  | "threshold"
  | "custom";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  phaseId?: string | null;

  status: ChallengeStatus;

  startsAt: string;
  endsAt: string;

  scoringMode: ChallengeScoringMode;
  evidenceType: ChallengeEvidenceType;

  participationXp: number;
  eliteXp: number;
  winnerIndividualXp: number;
  winnerGroupXp: number;

  minimumAttempts?: number | null;
  eliteThreshold?: number | null;

  notificationEnabled: boolean;

  createdAt?: string;
  updatedAt?: string;
};