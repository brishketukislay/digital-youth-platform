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
    <div className="admin-jackpot-page">

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
    <section className="admin-jackpot-warning">
      <div className="flex items-start gap-4">
        <div className="admin-jackpot-warning__icon">
          !
        </div>

        <div>
          <h3 className="admin-jackpot-warning__title">
            Exceptional group point loss
          </h3>

          <p className="admin-jackpot-warning__text">
            Group XP should only be reduced where the
            programme's exceptional group-loss protocol has
            been satisfied. Isolated individual behaviour
            must never reduce the collective jackpot.
          </p>

          <div className="admin-jackpot-warning__requirements">
            <Requirement text="Collective complicity" />
            <Requirement text="Severe shared impact" />
            <Requirement text="Passive group endorsement" />
          </div>

          <div className="admin-jackpot-warning__guardrail">
            <div className="admin-jackpot-warning__guardrail-label">
              Administrative guardrail
            </div>

            <div className="admin-jackpot-warning__guardrail-text">
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
    <div className="admin-jackpot-warning__requirement">
      {text}
    </div>
  );
}