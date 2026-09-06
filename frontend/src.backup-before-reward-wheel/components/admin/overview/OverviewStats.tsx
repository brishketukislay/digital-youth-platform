type OverviewStatsProps = {
players: number;
staff: number;
groupXp: number;
targetXp: number;
};

function formatXp(value: number) {
return new Intl.NumberFormat("en-GB").format(
Math.round(value)
);
}

function StatCard({
label,
value,
description,
accent,
}: {
label: string;
value: string;
description: string;
accent: string;
}) {
return (
<div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
<div className="flex items-center justify-between gap-3">
<span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
{label}
</span>

    <span
      className={`h-2 w-2 rounded-full ${accent}`}
    />
  </div>

  <div className="mt-4 text-3xl font-black tracking-tight">
    {value}
  </div>

  <div className="mt-2 text-xs leading-5 text-slate-500">
    {description}
  </div>
</div>


);
}

export function OverviewStats({
players,
staff,
groupXp,
targetXp,
}: OverviewStatsProps) {
const progress =
targetXp > 0
? Math.min(100, (groupXp / targetXp) * 100)
: 0;

return (
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
<StatCard label="Players" value={players.toString()} description="Anonymous participant accounts currently in the programme." accent="bg-cyan-400" />

  <StatCard
    label="Staff"
    value={staff.toString()}
    description="Authorised staff accounts with access to programme controls."
    accent="bg-violet-400"
  />

  <StatCard
    label="Group XP"
    value={formatXp(groupXp)}
    description="Current collective XP contributed by the cohort."
    accent="bg-emerald-400"
  />

  <StatCard
    label="Target"
    value={`${progress.toFixed(0)}%`}
    description={`${formatXp(
      Math.max(0, targetXp - groupXp)
    )} XP remains before the current jackpot target.`}
    accent="bg-amber-400"
  />
</div>


);
}
export function LiveActivity() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="font-bold">
            Live activity
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Recent programme events will appear here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-xs font-medium text-emerald-300">
            Monitoring
          </span>
        </div>
      </div>

      <div className="flex min-h-48 items-center justify-center px-6 py-10 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
            ◌
          </div>

          <p className="mt-4 text-sm font-medium text-slate-300">
            Activity stream ready
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            Once the audit/activity endpoint is exposed by
            the backend, this panel can show XP awards,
            challenge completions, community nominations,
            attendance and other authorised events.
          </p>
        </div>
      </div>
    </section>
  );
}