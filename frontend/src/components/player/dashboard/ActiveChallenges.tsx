import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  CSSProperties,
  ReactNode,
} from "react";
import type {
  DashboardSectionProps,
} from "./dashboardTypes";
import {
  DashboardCard,
  ProgressBar,
  StatusPill,
} from "./DashboardPrimitives";
import {
  formatXP,
} from "./dashboardUtils";

interface Challenge {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  instructions?: string;
  icon?: ReactNode;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  expires_at?: string;
  attempts?: number;
  max_attempts?: number;
  attempts_remaining?: number;
  current_score?: number;
  best_score?: number;
  top_score?: number;
  completion_xp?: number;
  participation_xp?: number;
  elite_xp?: number;
  winner_xp?: number;
  completed?: boolean;
  submitted?: boolean;
  result?: string;
  colour?: string;
}

interface NormalisedChallenge {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  icon: ReactNode;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  attempts: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  currentScore: number | null;
  bestScore: number | null;
  topScore: number | null;
  participationXP: number;
  eliteXP: number;
  winnerXP: number;
  completed: boolean;
  submitted: boolean;
  result: string | null;
  colour: string;
}

interface ActiveChallengesProps
  extends DashboardSectionProps {
  onOpenChallenge?: (
    challengeId: string,
  ) => void;
}

function normaliseChallenge(
  challenge: Challenge,
  index: number,
): NormalisedChallenge {
  return {
    id: String(
      challenge.id ??
        `challenge-${index}`,
    ),

    name:
      challenge.name ??
      challenge.title ??
      "Flash Challenge",

    description:
      challenge.description ??
      null,

    instructions:
      challenge.instructions ??
      null,

    icon:
      challenge.icon ??
      "⚡",

    status:
      challenge.status ??
      "active",

    startsAt:
      challenge.starts_at ??
      null,

    endsAt:
      challenge.ends_at ??
      challenge.expires_at ??
      null,

    attempts:
      typeof challenge.attempts ===
      "number"
        ? challenge.attempts
        : 0,

    maxAttempts:
      typeof challenge.max_attempts ===
      "number"
        ? challenge.max_attempts
        : null,

    attemptsRemaining:
      typeof challenge.attempts_remaining ===
      "number"
        ? challenge.attempts_remaining
        : null,

    currentScore:
      typeof challenge.current_score ===
      "number"
        ? challenge.current_score
        : null,

    bestScore:
      typeof challenge.best_score ===
      "number"
        ? challenge.best_score
        : null,

    topScore:
      typeof challenge.top_score ===
      "number"
        ? challenge.top_score
        : null,

    participationXP:
      typeof challenge.participation_xp ===
      "number"
        ? challenge.participation_xp
        : 300,

    eliteXP:
      typeof challenge.elite_xp ===
      "number"
        ? challenge.elite_xp
        : 1500,

    winnerXP:
      typeof challenge.winner_xp ===
      "number"
        ? challenge.winner_xp
        : 3000,

    completed:
      Boolean(
        challenge.completed,
      ),

    submitted:
      Boolean(
        challenge.submitted,
      ),

    result:
      challenge.result ??
      null,

    colour:
      challenge.colour ??
      "#06b6d4",
  };
}

function getChallenges(
  data: DashboardSectionProps["data"],
): NormalisedChallenge[] {
  const source =
    data.active_challenges ??
    data.challenges ??
    [];

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map(
    (
      challenge,
      index,
    ) =>
      normaliseChallenge(
        challenge as Challenge,
        index,
      ),
  );
}

function getTimeRemaining(
  endDate: string | null,
  now: number,
) {
  if (!endDate) {
    return null;
  }

  const end =
    new Date(endDate).getTime();

  if (
    Number.isNaN(end)
  ) {
    return null;
  }

  return Math.max(
    0,
    end - now,
  );
}

function formatDuration(
  milliseconds: number,
) {
  const totalSeconds =
    Math.floor(
      milliseconds / 1000,
    );

  const days =
    Math.floor(
      totalSeconds /
        86_400,
    );

  const hours =
    Math.floor(
      (totalSeconds %
        86_400) /
        3_600,
    );

  const minutes =
    Math.floor(
      (totalSeconds %
        3_600) /
        60,
    );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(
      hours,
    ).padStart(
      2,
      "0",
    )}h`;
  }

  return [
    String(hours).padStart(
      2,
      "0",
    ),
    String(minutes).padStart(
      2,
      "0",
    ),
    String(seconds).padStart(
      2,
      "0",
    ),
  ].join(":");
}

function getChallengeStatus(
  challenge: NormalisedChallenge,
  remaining: number | null,
) {
  if (
    challenge.completed
  ) {
    return {
      label: "Complete",
      tone: "success" as const,
    };
  }

  if (
    challenge.submitted
  ) {
    return {
      label: "Submitted",
      tone: "info" as const,
    };
  }

  if (
    remaining !== null &&
    remaining <= 0
  ) {
    return {
      label: "Closed",
      tone: "neutral" as const,
    };
  }

  if (
    challenge.status ===
    "upcoming"
  ) {
    return {
      label: "Coming soon",
      tone: "warning" as const,
    };
  }

  return {
    label: "Live",
    tone: "success" as const,
  };
}

function ChallengeCard({
  challenge,
  now,
  onOpen,
}: {
  challenge: NormalisedChallenge;
  now: number;
  onOpen?: (
    id: string,
  ) => void;
}) {
  const remaining =
    getTimeRemaining(
      challenge.endsAt,
      now,
    );

  const status =
    getChallengeStatus(
      challenge,
      remaining,
    );

  const hasScore =
    challenge.bestScore !==
      null ||
    challenge.currentScore !==
      null;

  const score =
    challenge.bestScore ??
    challenge.currentScore ??
    0;

  const scoreProgress =
    challenge.topScore &&
    challenge.topScore > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (score /
              challenge.topScore) *
              100,
          ),
        )
      : 0;

  const canPlay =
    status.label ===
      "Live" &&
    !challenge.completed &&
    !challenge.submitted &&
    (challenge.attemptsRemaining ===
      null ||
      challenge.attemptsRemaining >
        0);

  const actionLabel =
    challenge.completed
      ? "View result"
      : challenge.submitted
        ? "View submission"
        : canPlay
          ? "Play challenge"
          : "View challenge";

  return (
    <article
      className="active-challenge"
      style={
        {
          "--challenge-colour":
            challenge.colour,
        } as CSSProperties
      }
    >
      <div className="active-challenge__header">
        <div className="active-challenge__icon">
          {challenge.icon}
        </div>

        <StatusPill
          status={status.label}
          tone={status.tone}
        />
      </div>

      <div className="active-challenge__body">
        <h3>
          {challenge.name}
        </h3>

        {challenge.description && (
          <p>
            {challenge.description}
          </p>
        )}

        {challenge.instructions && (
          <div className="active-challenge__instructions">
            <strong>
              What to do
            </strong>

            <span>
              {challenge.instructions}
            </span>
          </div>
        )}

        {remaining !== null &&
          status.label !==
            "Complete" && (
            <div className="active-challenge__timer">
              <span>
                {remaining > 0
                  ? "Time remaining"
                  : "Challenge closed"}
              </span>

              <strong>
                {formatDuration(
                  remaining,
                )}
              </strong>
            </div>
          )}

        {challenge.maxAttempts !==
          null && (
          <div className="active-challenge__attempts">
            <span>
              Attempts
            </span>

            <strong>
              {challenge.attempts}
              {" / "}
              {challenge.maxAttempts}
            </strong>
          </div>
        )}

        {hasScore && (
          <div className="active-challenge__score">
            <div className="active-challenge__score-header">
              <span>
                Best score
              </span>

              <strong>
                {challenge.bestScore ??
                  challenge.currentScore}
              </strong>
            </div>

            {challenge.topScore !==
              null && (
              <ProgressBar
                value={
                  scoreProgress
                }
                label="Position against current top score"
                valueLabel={`${Math.round(
                  scoreProgress,
                )}%`}
                colour={
                  challenge.colour
                }
              />
            )}
          </div>
        )}

        <div className="active-challenge__rewards">
          <div>
            <span>
              Participation
            </span>

            <strong>
              +{formatXP(
                challenge.participationXP,
              )} XP
            </strong>
          </div>

          <div>
            <span>
              Elite
            </span>

            <strong>
              +{formatXP(
                challenge.eliteXP,
              )} XP
            </strong>
          </div>

          <div>
            <span>
              Winner
            </span>

            <strong>
              +{formatXP(
                challenge.winnerXP,
              )} XP
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="active-challenge__button"
          onClick={() =>
            onOpen?.(
              challenge.id,
            )
          }
          disabled={
            !onOpen ||
            status.label ===
              "Closed"
          }
        >
          {actionLabel}

          <span aria-hidden="true">
            →
          </span>
        </button>

        {challenge.result && (
          <div className="active-challenge__result">
            <span>
              Result
            </span>

            <strong>
              {challenge.result}
            </strong>
          </div>
        )}
      </div>
    </article>
  );
}

export function ActiveChallenges({
  data,
  onOpenChallenge,
}: ActiveChallengesProps) {
  const challenges =
    useMemo(
      () => getChallenges(data),
      [data],
    );

  const [
    now,
    setNow,
  ] = useState(
    () => Date.now(),
  );

  useEffect(() => {
    const interval =
      window.setInterval(
        () =>
          setNow(
            Date.now(),
          ),
        1000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  const liveChallenges =
    challenges.filter(
      challenge => {
        const remaining =
          getTimeRemaining(
            challenge.endsAt,
            now,
          );

        return (
          challenge.status !==
            "upcoming" &&
          (remaining ===
            null ||
            remaining > 0)
        );
      },
    );

  const upcomingChallenges =
    challenges.filter(
      challenge =>
        challenge.status ===
        "upcoming",
    );

  if (
    liveChallenges.length ===
      0 &&
    upcomingChallenges.length ===
      0
  ) {
    return (
      <DashboardCard
        className="active-challenges"
        eyebrow="LIVE PLAY"
        title="Flash Challenges"
      >
        <div className="active-challenges__empty">
          <div
            className="active-challenges__empty-icon"
            aria-hidden="true"
          >
            ⚡
          </div>

          <div>
            <h3>
              No live challenges
            </h3>

            <p className="muted">
              New challenges will appear
              here when your squad has
              something to take on.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      className="active-challenges"
      eyebrow="LIVE PLAY"
      title="Flash Challenges"
      action={
        liveChallenges.length >
        0 ? (
          <StatusPill
            status={`${liveChallenges.length} live`}
            tone="success"
          />
        ) : undefined
      }
    >
      <div className="active-challenges__intro">
        <span
          className="active-challenges__intro-icon"
          aria-hidden="true"
        >
          ⚡
        </span>

        <div>
          <strong>
            Quick challenge. Real
            progress.
          </strong>

          <p>
            Take part while the timer is
            running. Your performance is
            recorded by the platform and
            verified server-side.
          </p>
        </div>
      </div>

      <div className="active-challenges__list">
        {liveChallenges.map(
          challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              now={now}
              onOpen={
                onOpenChallenge
              }
            />
          ),
        )}
      </div>

      {upcomingChallenges.length >
        0 && (
        <div className="active-challenges__upcoming">
          <div className="active-challenges__upcoming-header">
            <strong>
              Coming up
            </strong>

            <span>
              {upcomingChallenges.length}
            </span>
          </div>

          {upcomingChallenges.map(
            challenge => (
              <div
                key={challenge.id}
                className="upcoming-challenge"
              >
                <span>
                  {challenge.icon}
                </span>

                <div>
                  <strong>
                    {challenge.name}
                  </strong>

                  {challenge.startsAt && (
                    <time
                      dateTime={
                        challenge.startsAt
                      }
                    >
                      Starts{" "}
                      {new Date(
                        challenge.startsAt,
                      ).toLocaleString(
                        undefined,
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </DashboardCard>
  );
}