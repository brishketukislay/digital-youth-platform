import {
  MYSTERY_THRESHOLDS,
} from "./dashboardConstants";

import {
  SectionHeading,
} from "./DashboardPrimitives";

import {
  formatXP,
  getNextThreshold,
  isMysteryUnlocked,
} from "./dashboardUtils";

export function MysteryProgress({
  xp,
}: {
  xp: number;
}) {
  const next =
    getNextThreshold(
      xp,
      MYSTERY_THRESHOLDS.map(
        item => item.xp,
      ),
    );

  const unlocked =
    MYSTERY_THRESHOLDS.filter(
      milestone =>
        isMysteryUnlocked(
          xp,
          milestone.xp,
        ),
    );

  return (
    <section className="card">
      <SectionHeading
        eyebrow="MYSTERY CONTENT"
        title="Hidden rewards"
      />

      <p className="muted">
        Your lifetime XP unlocks
        mystery milestones. Rewards
        are revealed by the platform
        when they are genuinely earned.
      </p>

      <div className="mystery-track">
        {MYSTERY_THRESHOLDS.map(
          milestone => {
            const complete =
              isMysteryUnlocked(
                xp,
                milestone.xp,
              );

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
                  {
                    milestone.label
                  }
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
                next - xp,
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
          {
            MYSTERY_THRESHOLDS.length
          }{" "}
          mystery milestones reached.
        </p>
      )}
    </section>
  );
}