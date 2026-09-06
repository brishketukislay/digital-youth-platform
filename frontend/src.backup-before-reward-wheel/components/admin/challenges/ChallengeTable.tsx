import type { Challenge } from "./challengeTypes";
import { ChallengeStatusBadge } from "./ChallengeStatusBadge";

type ChallengeTableProps = {
  challenges: Challenge[];
  onEdit: (challenge: Challenge) => void;
  onDuplicate: (challenge: Challenge) => void;
  onToggle: (challenge: Challenge) => void;
  busyId: string | null;
};

function formatDate(value: string) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export function ChallengeTable({
  challenges,
  onEdit,
  onDuplicate,
  onToggle,
  busyId,
}: ChallengeTableProps) {
  return (
    <div className="admin-challenge-table-wrap">
      <div className="admin-challenge-table-scroll">
        <table className="admin-challenge-table">
          <thead>
            <tr>
              <th>Challenge</th>
              <th>Window</th>
              <th>Rewards</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>

          <tbody>
            {challenges.map((challenge) => {
              const disabled =
                challenge.status ===
                "cancelled";

              const busy =
                busyId === challenge.id;

              return (
                <tr key={challenge.id}>
                  <td>
                    <div className="admin-challenge-table__title">
                      {challenge.title}
                    </div>

                    <div className="admin-challenge-table__description">
                      {challenge.description ||
                        "No description provided."}
                    </div>
                  </td>

                  <td>
                    <div className="admin-challenge-table__dates">
                      <span>
                        {formatDate(
                          challenge.startsAt,
                        )}
                      </span>

                      <span>
                        →
                      </span>

                      <span>
                        {formatDate(
                          challenge.endsAt,
                        )}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="admin-challenge-table__rewards">
                      <span>
                        +{challenge.participationXp} XP
                      </span>

                      <span>
                        Elite +{challenge.eliteXp}
                      </span>

                      <span>
                        Winner +{challenge.winnerIndividualXp}
                      </span>

                      <span>
                        Group +{challenge.winnerGroupXp}
                      </span>
                    </div>
                  </td>

                  <td>
                    <ChallengeStatusBadge
                      status={
                        disabled
                          ? "cancelled"
                          : challenge.status
                      }
                    />
                  </td>

                  <td>
                    <div className="admin-challenge-table__actions">
                      <button
                        type="button"
                        className="button button--small button--secondary"
                        onClick={() =>
                          onEdit(challenge)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="button button--small button--secondary"
                        onClick={() =>
                          onDuplicate(challenge)
                        }
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        className={
                          disabled
                            ? "button button--small button--primary"
                            : "button button--small button--danger"
                        }
                        disabled={busy}
                        onClick={() =>
                          onToggle(challenge)
                        }
                      >
                        {busy
                          ? "Saving…"
                          : disabled
                            ? "Enable"
                            : "Disable"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
