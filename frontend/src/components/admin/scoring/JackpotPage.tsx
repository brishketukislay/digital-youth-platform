import { JackpotTracker } from "./JackpotTracker";

const milestones = [
  {
    id: "tier-1",
    label: "Tier 1",
    xp: 500_000,
    rewardAmount: 250,
    rewardLabel: "£250 group prize",
    achieved: false,
  },
  {
    id: "tier-2",
    label: "Tier 2",
    xp: 1_000_000,
    rewardAmount: 750,
    rewardLabel: "£750 group prize",
    achieved: false,
  },
  {
    id: "tier-3",
    label: "Grand jackpot",
    xp: 1_500_000,
    rewardAmount: 2_200,
    rewardLabel: "£2,200 finale prize",
    achieved: false,
  },
];

export function JackpotPage() {
  /*
   * Temporary values until this page is wired to the
   * existing programme endpoint.
   *
   * Do not persist these values from the frontend.
   * The backend remains authoritative for group XP.
   */

  const currentXp = 0;
  const targetXp = 1_500_000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">
          Jackpot
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monitor collective progression and programme
          reward milestones.
        </p>
      </div>

      <JackpotTracker
        currentXp={currentXp}
        targetXp={targetXp}
        milestones={milestones}
      />

      <ExceptionalGroupLoss />
    </div>
  );
}

function ExceptionalGroupLoss() {
  return (
    <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-300">
          !
        </div>

        <div>
          <h3 className="font-bold text-red-200">
            Exceptional group point loss
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-red-200/60">
            Group XP should only be reduced where the
            programme's exceptional group-loss protocol has
            been satisfied. Isolated individual behaviour
            must never reduce the collective jackpot.
          </p>

          <div className="mt-4 grid gap-2 text-xs text-red-200/60 sm:grid-cols-3">
            <Requirement text="Collective complicity" />
            <Requirement text="Severe shared impact" />
            <Requirement text="Passive group endorsement" />
          </div>

          <div className="mt-5 rounded-xl border border-red-400/10 bg-black/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-red-300/70">
              Administrative guardrail
            </div>

            <div className="mt-2 text-sm text-red-200/70">
              Maximum single deduction: 10% of the current
              programme target.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Requirement({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-lg border border-red-400/10 bg-black/10 px-3 py-2">
      {text}
    </div>
  );
}