import type {
  PlayerChallengeState,
} from "./challengeRuntimeTypes";

type ChallengeStatePanelProps = {
  state: PlayerChallengeState;
  onStart?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
};

export function ChallengeStatePanel({
  state,
  onStart,
  onSubmit,
  submitting = false,
}: ChallengeStatePanelProps) {
  if (state === "scheduled") {
    return (
      <StatusPanel
        icon="◷"
        title="Not live yet"
        description="This challenge will become available when the scheduled start time is reached."
      />
    );
  }

  if (state === "ended") {
    return (
      <StatusPanel
        icon="—"
        title="Challenge ended"
        description="The submission window for this challenge has closed."
      />
    );
  }

  if (state === "submitted") {
    return (
      <StatusPanel
        icon="✓"
        title="Submitted"
        description="Your result has been sent for processing."
      />
    );
  }

  if (
    state ===
    "awaiting_verification"
  ) {
    return (
      <StatusPanel
        icon="◌"
        title="Awaiting verification"
        description="A youth worker or the platform verification system needs to confirm your result before XP is awarded."
      />
    );
  }

  if (state === "completed") {
    return (
      <StatusPanel
        icon="★"
        title="Challenge complete"
        description="Your result has been verified and your rewards have been processed."
        positive
      />
    );
  }

  if (state === "rejected") {
    return (
      <StatusPanel
        icon="!"
        title="Submission needs attention"
        description="Your submission was not verified. Speak with your youth worker if you think this is incorrect."
        negative
      />
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Challenge live
          </div>

          <h2 className="mt-1 text-lg font-black">
            Ready when you are?
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Start your attempt when you are ready.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
        >
          Start challenge
        </button>
      </div>
    </div>
  );
}

function StatusPanel({
  icon,
  title,
  description,
  positive = false,
  negative = false,
}: {
  icon: string;
  title: string;
  description: string;
  positive?: boolean;
  negative?: boolean;
}) {
  const colour = positive
    ? "border-emerald-400/20 bg-emerald-400/5"
    : negative
      ? "border-red-400/20 bg-red-400/5"
      : "border-white/10 bg-slate-900";

  return (
    <div
      className={`rounded-2xl border p-6 ${colour}`}
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}