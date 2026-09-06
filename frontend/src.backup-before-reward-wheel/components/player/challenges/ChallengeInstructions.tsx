import type {
  PlayerChallenge,
} from "./challengeRuntimeTypes";

type ChallengeInstructionsProps = {
  challenge: PlayerChallenge;
};

export function ChallengeInstructions({
  challenge,
}: ChallengeInstructionsProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
        Challenge
      </div>

      <h1 className="mt-2 text-2xl font-black text-white">
        {challenge.title}
      </h1>

      {challenge.description && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {challenge.description}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info
          label="Participation"
          value={`${challenge.participationXp} XP`}
        />

        <Info
          label="Elite"
          value={`${challenge.eliteXp} XP`}
        />

        <Info
          label="Winner"
          value={`${challenge.winnerIndividualXp} XP`}
        />
      </div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {value}
      </div>
    </div>
  );
}
