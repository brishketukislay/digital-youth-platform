type ProgrammeProgressProps = {
  programmeName: string;
  currentXp: number;
  targetXp: number;
  progress: number;
};

function formatXp(value: number) {
  return new Intl.NumberFormat("en-GB").format(
    Math.max(0, Math.round(value))
  );
}

export function ProgrammeProgress({
  programmeName,
  currentXp,
  targetXp,
  progress,
}: ProgrammeProgressProps) {
  const remaining = Math.max(
    0,
    targetXp - currentXp
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-900">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
              Collective progress
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              {programmeName}
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Every individual contribution feeds the
              collective jackpot. This is the staff view of
              the cohort's current position.
            </p>
          </div>

          <div className="md:text-right">
            <div className="text-3xl font-black text-white">
              {formatXp(currentXp)}
              <span className="ml-2 text-base font-medium text-slate-500">
                XP
              </span>
            </div>

            <div className="mt-1 text-sm text-slate-500">
              of {formatXp(targetXp)} XP target
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400">
              Jackpot progress
            </span>

            <span className="font-bold text-cyan-300">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div className="h-5 overflow-hidden rounded-full border border-white/10 bg-black/30 p-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>
              0 XP
            </span>

            <span>
              {formatXp(remaining)} XP remaining
            </span>

            <span>
              {formatXp(targetXp)} XP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}