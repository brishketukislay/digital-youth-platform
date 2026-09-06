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
    <section className="rounded-2xl border border-white/10 bg-slate-900">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Collective jackpot
            </div>

            <h2 className="mt-1 text-xl font-black">
              Programme reward progression
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              The group XP pool progresses through shared
              milestones. Individual XP and the collective
              jackpot remain separate concepts.
            </p>
          </div>

          <div className="md:text-right">
            <div className="text-2xl font-black">
              {formatXp(currentXp)}
              <span className="ml-2 text-sm font-medium text-slate-500">
                XP
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {formatXp(remaining)} XP remaining
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-4 overflow-hidden rounded-full bg-black/30 p-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-500">
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

      <div className="grid gap-3 p-5 sm:p-6 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            currentXp={currentXp}
          />
        ))}
      </div>

      {nextMilestone && (
        <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Next milestone
              </div>

              <div className="mt-1 font-bold text-white">
                {nextMilestone.label}
              </div>
            </div>

            <div className="text-sm font-semibold text-amber-300">
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
        "relative overflow-hidden rounded-xl border p-4 transition",
        reached
          ? "border-emerald-400/20 bg-emerald-400/5"
          : "border-white/10 bg-black/10",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {milestone.label}
          </div>

          <div className="mt-2 text-xl font-black">
            {formatXp(milestone.xp)}
            <span className="ml-1 text-xs font-medium text-slate-500">
              XP
            </span>
          </div>
        </div>

        <div
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full text-sm",
            reached
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-white/5 text-slate-500",
          ].join(" ")}
        >
          {reached ? "✓" : "○"}
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            reached
              ? "bg-emerald-400"
              : "bg-amber-400",
          ].join(" ")}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">
            Reward
          </div>

          <div className="mt-0.5 text-sm font-bold text-white">
            {milestone.rewardLabel ??
              formatCurrency(
                milestone.rewardAmount,
              )}
          </div>
        </div>

        <div className="text-xs font-semibold">
          {reached ? (
            <span className="text-emerald-300">
              Achieved
            </span>
          ) : (
            <span className="text-slate-500">
              {progress.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}