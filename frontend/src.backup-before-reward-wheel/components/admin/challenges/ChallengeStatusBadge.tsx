import type { ChallengeStatus } from "./challengeTypes";

const statusStyles: Record<
  ChallengeStatus,
  string
> = {
  draft:
    "bg-slate-400/10 text-slate-400 border-slate-400/10",
  scheduled:
    "bg-blue-400/10 text-blue-300 border-blue-400/10",
  live:
    "bg-emerald-400/10 text-emerald-300 border-emerald-400/10",
  completed:
    "bg-violet-400/10 text-violet-300 border-violet-400/10",
  cancelled:
    "bg-red-400/10 text-red-300 border-red-400/10",
};

const labels: Record<
  ChallengeStatus,
  string
> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ChallengeStatusBadge({
  status,
}: {
  status: ChallengeStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1",
        "text-[11px] font-bold uppercase tracking-wider",
        statusStyles[status],
      ].join(" ")}
    >
      {labels[status]}
    </span>
  );
}