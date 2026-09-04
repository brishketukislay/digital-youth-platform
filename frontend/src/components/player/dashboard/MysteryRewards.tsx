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

interface MysteryReward {
  id?: string | number;
  name?: string;
  title?: string;
  label?: string;

  threshold_xp?: number;
  xp_threshold?: number;
  required_xp?: number;

  unlocked?: boolean;
  claimed?: boolean;

  icon?: ReactNode;
  colour?: string;

  /*
   * Intentionally optional.
   *
   * The backend should normally NOT send the
   * actual reward description while locked.
   */
  reward_label?: string;
  reward?: string;
}

interface NormalisedMysteryReward {
  id: string;
  name: string;
  thresholdXP: number;
  unlocked: boolean;
  claimed: boolean;
  icon: ReactNode;
  colour: string;
  rewardLabel: string | null;
}

const DEFAULT_MYSTERY_REWARDS:
  NormalisedMysteryReward[] = [
    {
      id: "early-hook",
      name: "Early Hook",
      thresholdXP: 15_000,
      unlocked: false,
      claimed: false,
      icon: "🎁",
      colour: "#38bdf8",
      rewardLabel: null,
    },
    {
      id: "midway",
      name: "Midway",
      thresholdXP: 45_000,
      unlocked: false,
      claimed: false,
      icon: "✨",
      colour: "#a855f7",
      rewardLabel: null,
    },
    {
      id: "legendary",
      name: "Legendary",
      thresholdXP: 85_000,
      unlocked: false,
      claimed: false,
      icon: "👑",
      colour: "#f59e0b",
      rewardLabel: null,
    },
  ];

function normaliseReward(
  reward: MysteryReward,
  index: number,
): NormalisedMysteryReward {
  const fallback =
    DEFAULT_MYSTERY_REWARDS[
      index
    ] ??
    DEFAULT_MYSTERY_REWARDS[
      DEFAULT_MYSTERY_REWARDS.length - 1
    ];

  const thresholdXP =
    reward.threshold_xp ??
    reward.xp_threshold ??
    reward.required_xp ??
    fallback.thresholdXP;

  return {
    id: String(
      reward.id ??
        fallback.id ??
        `mystery-${index}`,
    ),

    name:
      reward.name ??
      reward.title ??
      reward.label ??
      fallback.name,

    thresholdXP,

    unlocked:
      Boolean(
        reward.unlocked,
      ),

    claimed:
      Boolean(
        reward.claimed,
      ),

    icon:
      reward.icon ??
      fallback.icon,

    colour:
      reward.colour ??
      fallback.colour,

    rewardLabel:
      reward.reward_label ??
      reward.reward ??
      null,
  };
}

function getLifetimeXP(
  data: DashboardSectionProps["data"],
): number {
  const candidates = [
    data.lifetime_xp,
    data.lifetimeXP,
    data.total_xp,
    data.totalXP,
    data.xp,
  ];

  const value =
    candidates.find(
      candidate =>
        typeof candidate ===
        "number",
    );

  return value ?? 0;
}

function getRewards(
  data: DashboardSectionProps["data"],
): NormalisedMysteryReward[] {
  const source =
    data.mystery_rewards ??
    data.mysteryRewards ??
    data.mystery_prizes ??
    data.mysteryPrizes;

  if (!Array.isArray(source)) {
    return DEFAULT_MYSTERY_REWARDS;
  }

  if (source.length === 0) {
    return DEFAULT_MYSTERY_REWARDS;
  }

  return source.map(
    (
      reward,
      index,
    ) =>
      normaliseReward(
        reward as MysteryReward,
        index,
      ),
  );
}

function getPreviousThreshold(
  rewards: NormalisedMysteryReward[],
  index: number,
): number {
  if (index <= 0) {
    return 0;
  }

  return (
    rewards[index - 1]
      ?.thresholdXP ?? 0
  );
}

function getRewardProgress(
  lifetimeXP: number,
  rewards: NormalisedMysteryReward[],
  index: number,
): number {
  const reward =
    rewards[index];

  if (!reward) {
    return 0;
  }

  const previousThreshold =
    getPreviousThreshold(
      rewards,
      index,
    );

  const range =
    reward.thresholdXP -
    previousThreshold;

  if (range <= 0) {
    return lifetimeXP >=
      reward.thresholdXP
      ? 100
      : 0;
  }

  const progress =
    ((lifetimeXP -
      previousThreshold) /
      range) *
    100;

  return Math.min(
    100,
    Math.max(
      0,
      progress,
    ),
  );
}

function getNextReward(
  rewards: NormalisedMysteryReward[],
  lifetimeXP: number,
) {
  return rewards.find(
    reward =>
      !reward.unlocked &&
      lifetimeXP <
        reward.thresholdXP,
  );
}

export function MysteryRewards({
  data,
}: DashboardSectionProps) {
  const lifetimeXP =
    getLifetimeXP(data);

  const rewards =
    getRewards(data);

  const unlockedCount =
    rewards.filter(
      reward =>
        reward.unlocked,
    ).length;

  const nextReward =
    getNextReward(
      rewards,
      lifetimeXP,
    );

  const nextRewardDistance =
    nextReward
      ? Math.max(
          0,
          nextReward.thresholdXP -
            lifetimeXP,
        )
      : 0;

  return (
    <DashboardCard
      className="mystery-rewards"
      eyebrow="LIFETIME PROGRESS"
      title="Mystery Rewards"
      action={
        <StatusPill
          status={`${unlockedCount}/${rewards.length} unlocked`}
          tone={
            unlockedCount ===
            rewards.length
              ? "success"
              : "info"
          }
        />
      }
    >
      <div className="mystery-rewards__intro">
        <div
          className="mystery-rewards__intro-icon"
          aria-hidden="true"
        >
          🎁
        </div>

        <div>
          <strong>
            Keep building your lifetime
            XP.
          </strong>

          <p>
            Reach the hidden milestones to
            reveal physical rewards. The
            surprise stays hidden until you
            unlock it.
          </p>
        </div>
      </div>

      <div className="mystery-rewards__xp">
        <div>
          <span>
            Lifetime XP
          </span>

          <strong>
            {formatXP(
              lifetimeXP,
            )}
          </strong>
        </div>

        {nextReward && (
          <div className="mystery-rewards__next">
            <span>
              Next mystery
            </span>

            <strong>
              {formatXP(
                nextRewardDistance,
              )}{" "}
              XP to go
            </strong>
          </div>
        )}
      </div>

      <div
        className="mystery-rewards__track"
        aria-label="Mystery reward progression"
      >
        {rewards.map(
          (
            reward,
            index,
          ) => {
            const unlocked =
              reward.unlocked ||
              lifetimeXP >=
                reward.thresholdXP;

            const claimed =
              reward.claimed;

            const progress =
              getRewardProgress(
                lifetimeXP,
                rewards,
                index,
              );

            const previousThreshold =
              getPreviousThreshold(
                rewards,
                index,
              );

            const isNext =
              !unlocked &&
              nextReward?.id ===
                reward.id;

            const stateClass =
              claimed
                ? "claimed"
                : unlocked
                  ? "unlocked"
                  : isNext
                    ? "next"
                    : "locked";

            return (
              <article
                key={reward.id}
                className={[
                  "mystery-reward",
                  `mystery-reward--${stateClass}`,
                ].join(" ")}
                style={
                  {
                    "--reward-colour":
                      reward.colour,
                  } as CSSProperties
                }
              >
                <div className="mystery-reward__visual">
                  <div className="mystery-reward__orb">
                    <span
                      aria-hidden="true"
                    >
                      {unlocked
                        ? reward.icon
                        : "?"}
                    </span>
                  </div>

                  {claimed && (
                    <span className="mystery-reward__claimed">
                      ✓
                    </span>
                  )}
                </div>

                <div className="mystery-reward__content">
                  <span className="mystery-reward__stage">
                    {reward.name}
                  </span>

                  <h3>
                    {unlocked
                      ? reward.rewardLabel ??
                        "Mystery reward unlocked"
                      : "Mystery reward"}
                  </h3>

                  <div className="mystery-reward__threshold">
                    <span>
                      {formatXP(
                        reward.thresholdXP,
                      )}{" "}
                      lifetime XP
                    </span>
                  </div>

                  {unlocked ? (
                    <div className="mystery-reward__status">
                      <span>
                        {claimed
                          ? "Reward claimed"
                          : "Reward unlocked"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mystery-reward__locked">
                        <span>
                          🔒 Hidden until
                          unlocked
                        </span>
                      </div>

                      {isNext && (
                        <ProgressBar
                          value={
                            progress
                          }
                          label={`${formatXP(
                            previousThreshold,
                          )} → ${formatXP(
                            reward.thresholdXP,
                          )}`}
                          valueLabel={`${Math.round(
                            progress,
                          )}%`}
                          colour={
                            reward.colour
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>

      {nextReward && (
        <div className="mystery-rewards__callout">
          <span
            className="mystery-rewards__callout-icon"
            aria-hidden="true"
          >
            🔮
          </span>

          <div>
            <strong>
              Something is waiting at{" "}
              {formatXP(
                nextReward.thresholdXP,
              )}{" "}
              XP
            </strong>

            <p>
              You need{" "}
              {formatXP(
                nextRewardDistance,
              )}{" "}
              more lifetime XP to find
              out what it is.
            </p>
          </div>
        </div>
      )}

      {!nextReward &&
        rewards.length > 0 && (
          <div className="mystery-rewards__complete">
            <span
              aria-hidden="true"
            >
              👑
            </span>

            <div>
              <strong>
                All mystery rewards
                unlocked
              </strong>

              <p>
                You've reached every
                mystery milestone currently
                available.
              </p>
            </div>
          </div>
        )}
    </DashboardCard>
  );
}