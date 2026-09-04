import {
  ChallengeStatusBadge,
} from "./ChallengeStatusBadge";

import type { Challenge } from "./challengeTypes";

type ChallengeTableProps = {
  challenges: Challenge[];
  onEdit: (challenge: Challenge) => void;
  onDuplicate: (challenge: Challenge) => void;
};

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(
  startsAt: string,
  endsAt: string,
) {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return "—";
  }

  const minutes = Math.round(
    (end - start) / 60_000,
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder
    ? `${hours}h ${remainder}m`
    : `${hours}h`;
}

export function ChallengeTable({
  challenges,
  onEdit,
  onDuplicate,
}: ChallengeTableProps) {
  if (challenges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900 px-6 py-14 text-center">
        <div className="text-3xl">⚡</div>

        <h3 className="mt-3 font-bold text-white">
          No challenges yet
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Create a time-bound challenge to give the
          cohort another route to earn XP.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Challenge
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Schedule
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Scoring
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Notification
              </th>

              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-5 py-4" />
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {challenges.map((challenge) => (
              <tr
                key={challenge.id}
                className="transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-white">
                    {challenge.title}
                  </div>

                  <div className="mt-1 max-w-sm truncate text-xs text-slate-500">
                    {challenge.description}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="text-sm text-slate-300">
                    {formatDate(
                      challenge.startsAt,
                    )}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {formatDuration(
                      challenge.startsAt,
                      challenge.endsAt,
                    )}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="text-sm font-semibold text-cyan-300">
                    +{challenge.participationXp} XP
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {challenge.scoringMode}
                  </div>
                </td>

                <td className="px-5 py-4">
                  {challenge.notificationEnabled ? (
                    <span className="text-sm text-emerald-300">
                      Enabled
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600">
                      Off
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <ChallengeStatusBadge
                    status={challenge.status}
                  />
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onDuplicate(challenge)
                      }
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(challenge)
                      }
                      className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      Configure
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}