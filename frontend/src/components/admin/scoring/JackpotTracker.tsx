import {
  formatCurrency,
  formatXp,
} from "../../../lib/admin/programmeMath";

export type JackpotMilestone = {
  id: string;
  label: string;
  xp: number;
  rewardAmount: number;
  rewardLabel?: string;
  achieved: boolean;
};

type JackpotTrackerProps = {
  currentXp: number;
  targetXp: number;
  milestones: JackpotMilestone[];
};

function getProgress(
  currentXp: number,
  targetXp: number,
) {
  if (targetXp <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (currentXp / targetXp) * 100),
  );
}

function getNextMilestone(
  currentXp: number,
  milestones: JackpotMilestone[],
) {
  return (
    milestones
      .filter((milestone) => milestone.xp > currentXp)
      .sort((a, b) => a.xp - b.xp)[0] ?? null
  );
}

export function JackpotTracker({
  currentXp,
  targetXp,
  milestones,
}: JackpotTrackerProps) {
  const progress = getProgress(
    currentXp,
    targetXp,
  );

  const nextMilestone = getNextMilestone(
    currentXp,
    milestones,
  );

  const remaining = Math.max(
    0,
    targetXp - currentXp,
  );

  return (
    <section className="admin-jackpot-card admin-jackpot-tracker">
      <div className="admin-jackpot-tracker__header">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="admin-jackpot-hero__eyebrow">
              Collective jackpot
            </div>

            <h2 className="admin-jackpot-hero__title">
              Programme reward progression
            </h2>

            <p className="admin-jackpot-hero__description">
              The group XP pool progresses through shared
              milestones. Individual XP and the collective
              jackpot remain separate concepts.
            </p>
          </div>

          <div className="md:text-right">
            <div className="admin-jackpot-current-xp">
              {formatXp(currentXp)}
              <span className="admin-jackpot-current-xp__unit">
                XP
              </span>
            </div>

            <div className="admin-jackpot-current-xp__remaining">
              {formatXp(remaining)} XP remaining
            </div>
          </div>
        </div>

        <div className="admin-jackpot-progress-wrap">
          <div className="admin-jackpot-progress">
            <div
              className="admin-jackpot-progress__fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="admin-jackpot-progress__labels">
            <span>0 XP</span>

            <span>
              {progress.toFixed(1)}%
            </span>

            <span>
              {formatXp(targetXp)} XP
            </span>
          </div>
        </div>
      </div>

      <div className="admin-jackpot-milestones">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            currentXp={currentXp}
          />
        ))}
      </div>

      {nextMilestone && (
        <div className="admin-jackpot-next">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="admin-jackpot-next__label">
                Next milestone
              </div>

              <div className="admin-jackpot-next__title">
                {nextMilestone.label}
              </div>
            </div>

            <div className="admin-jackpot-next__value">
              {formatXp(
                Math.max(
                  0,
                  nextMilestone.xp - currentXp,
                ),
              )}{" "}
              XP to go
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MilestoneCard({
  milestone,
  currentXp,
}: {
  milestone: JackpotMilestone;
  currentXp: number;
}) {
  const reached =
    milestone.achieved ||
    currentXp >= milestone.xp;

  const progress = Math.min(
    100,
    Math.max(
      0,
      (currentXp / milestone.xp) * 100,
    ),
  );

  return (
    <div
      className={[
        "admin-jackpot-tier",
        reached
          ? "admin-jackpot-tier--reached"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="admin-jackpot-next__label">
            {milestone.label}
          </div>

          <div className="admin-jackpot-tier__target">
            {formatXp(milestone.xp)}
            <span className="admin-jackpot-tier__unit">
              XP
            </span>
          </div>
        </div>

        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full text-sm",
            reached
              ? "admin-jackpot__milestone-mark--active"
              : "",
          ].join(" ")}
        >
          {reached ? "✓" : "○"}
        </div>
      </div>

      <div className="admin-jackpot-tier__progress">
        <div
          className={[
            "admin-jackpot-tier__progress-fill",
            reached
              ? "admin-jackpot-tier__progress-fill--reached"
              : "",
          ].join(" ")}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="admin-jackpot-tier__footer">
        <div>
          <div className="admin-jackpot-tier__reward-label">
            Reward
          </div>

          <div className="admin-jackpot-tier__reward">
            {milestone.rewardLabel ??
              formatCurrency(
                milestone.rewardAmount,
              )}
          </div>
        </div>

        <div className="admin-jackpot-tier__status">
          {reached ? (
            <span className="">
              Achieved
            </span>
          ) : (
            <span className="">
              {progress.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}