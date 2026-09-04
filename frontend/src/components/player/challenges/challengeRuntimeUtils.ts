import type {
  PlayerChallenge,
  PlayerChallengeState,
} from "./challengeRuntimeTypes";

export function getChallengeState(
  challenge: PlayerChallenge,
  now = Date.now(),
): PlayerChallengeState {
  const start = new Date(
    challenge.startsAt,
  ).getTime();

  const end = new Date(
    challenge.endsAt,
  ).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return "scheduled";
  }

  if (challenge.attempt?.status === "verified") {
    return "completed";
  }

  if (challenge.attempt?.status === "rejected") {
    return "rejected";
  }

  if (challenge.attempt?.status === "submitted") {
    return "awaiting_verification";
  }

  if (now < start) {
    return "scheduled";
  }

  if (now > end) {
    return "ended";
  }

  return "live";
}

export function getRemainingSeconds(
  challenge: PlayerChallenge,
  now = Date.now(),
): number {
  const end = new Date(
    challenge.endsAt,
  ).getTime();

  if (Number.isNaN(end)) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((end - now) / 1000),
  );
}

export function getRemainingMilliseconds(
  challenge: PlayerChallenge,
  now = Date.now(),
): number {
  const end = new Date(
    challenge.endsAt,
  ).getTime();

  if (Number.isNaN(end)) {
    return 0;
  }

  return Math.max(
    0,
    end - now,
  );
}

export function formatCountdown(
  seconds: number,
): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds),
  );

  const hours = Math.floor(
    safeSeconds / 3600,
  );

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );

  const remainingSeconds =
    safeSeconds % 60;

  if (hours > 0) {
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      remainingSeconds
        .toString()
        .padStart(2, "0"),
    ].join(":");
  }

  return [
    minutes.toString().padStart(2, "0"),
    remainingSeconds
      .toString()
      .padStart(2, "0"),
  ].join(":");
}

export function canStartChallenge(
  challenge: PlayerChallenge,
  now = Date.now(),
): boolean {
  return (
    getChallengeState(
      challenge,
      now,
    ) === "live" &&
    !challenge.attempt
  );
}

export function canSubmitChallenge(
  challenge: PlayerChallenge,
): boolean {
  if (!challenge.attempt) {
    return false;
  }

  return (
    challenge.attempt.status ===
    "started"
  );
}