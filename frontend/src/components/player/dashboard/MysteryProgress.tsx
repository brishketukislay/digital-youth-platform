import type { PlayerDashboard } from "../../../api/client";

type Props = {
  xp: number;
};

const MYSTERY_THRESHOLDS = [
  {
    xp: 15_000,
    label: "Early Hook",
  },
  {
    xp: 45_000,
    label: "Midway",
  },
  {
    xp: 85_000,
    label: "Legendary",
  },
] as const;

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

export function MysteryProgress({
  xp,
}: Props) {
  const next =
    MYSTERY_THRESHOLDS.find(
      milestone =>
        xp < milestone.xp,
    );

  const unlocked =
    MYSTERY_THRESHOLDS.filter(
      milestone =>
        xp >= milestone.xp,
    );

  return (
    <section className="card">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            MYSTERY CONTENT
          </div>

          <h2>Hidden rewards</h2>
        </div>
      </div>

      <p className="muted">
        Your lifetime XP unlocks mystery
        milestones. Rewards are revealed by
        the platform when they are genuinely
        earned.
      </p>

      <div className="mystery-track">
        {MYSTERY_THRESHOLDS.map(
          milestone => {
            const complete =
              xp >= milestone.xp;

            return (
              <div
                key={milestone.xp}
                className={`mystery-node ${
                  complete
                    ? "completed"
                    : ""
                }`}
              >
                <div
                  className="mystery-node__icon"
                  aria-hidden="true"
                >
                  {complete
                    ? "🎁"
                    : "?"}
                </div>

                <strong>
                  {milestone.label}
                </strong>

                <span>
                  {formatXP(
                    milestone.xp,
                  )}{" "}
                  XP
                </span>
              </div>
            );
          },
        )}
      </div>

      {next ? (
        <div className="mystery-next">
          <span>
            Next unlock
          </span>

          <strong>
            {formatXP(
              Math.max(
                0,
                next.xp - xp,
              ),
            )}{" "}
            XP to go
          </strong>
        </div>
      ) : (
        <div className="notice notice--success">
          All current mystery
          milestones unlocked.
        </div>
      )}

      {unlocked.length > 0 && (
        <p className="small-muted">
          {unlocked.length} of{" "}
          {MYSTERY_THRESHOLDS.length}{" "}
          mystery milestones reached.
        </p>
      )}
    </section>
  );
}