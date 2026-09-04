import {
  formatXp,
  type EconomyProjection,
} from "./programmeMath";

type EconomyHealthProps = {
  projection: EconomyProjection;
};

const statusConfig = {
  behind: {
    label: "Behind target",
    colour:
      "border-red-400/20 bg-red-400/5 text-red-300",
  },
  "on-track": {
    label: "Exactly on target",
    colour:
      "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
  },
  ahead: {
    label: "Ahead of target",
    colour:
      "border-amber-400/20 bg-amber-400/5 text-amber-300",
  },
} as const;

export function EconomyHealth({
  projection,
}: EconomyHealthProps) {
  const status =
    statusConfig[projection.status];

  return (
    <section
      className={`rounded-2xl border p-5 ${status.colour}`}
    >
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            Economy health
          </div>

          <div className="mt-2 text-xl font-black">
            {status.label}
          </div>

          <p className="mt-1 max-w-xl text-sm opacity-70">
            Based on the configured weekly yield and the
            remaining programme duration.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-right">
          <div>
            <div className="text-xs opacity-60">
              Projected XP
            </div>

            <div className="mt-1 text-lg font-bold">
              {formatXp(projection.projectedXp)}
            </div>
          </div>

          <div>
            <div className="text-xs opacity-60">
              Buffer
            </div>

            <div className="mt-1 text-lg font-bold">
              {formatXp(
                Math.max(0, projection.bufferXp),
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}