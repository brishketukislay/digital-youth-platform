import {
  DEFAULT_TARGET_XP,
} from "./dashboardConstants";

import {
  ProgressBar,
  SectionHeading,
} from "./DashboardPrimitives";

import {
  formatXP,
  getRemainingXP,
  percentage,
} from "./dashboardUtils";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

export function GroupProgress({
  data,
}: DashboardSectionProps) {
  const target =
    data.target_xp ||
    DEFAULT_TARGET_XP;

  const progress =
    percentage(
      data.group_xp,
      target,
    );

  const remaining =
    getRemainingXP(
      data.group_xp,
      target,
    );

  return (
    <section className="card featured-progress">
      <SectionHeading
        eyebrow="SQUAD PROGRESS"
        title={`${formatXP(data.group_xp)} XP`}
        action={
          <div className="progress-number">
            {Math.round(
              progress,
            )}
            %
          </div>
        }
      />

      <p className="muted progress-description">
        Every player's positive
        progress contributes towards
        the shared squad goal.
      </p>

      <ProgressBar
        value={progress}
        className="large-progress"
        ariaLabel="Squad progress towards the group goal"
      />

      <div className="progress-footer">
        <span>
          Goal:{" "}
          {formatXP(target)} XP
        </span>

        <strong>
          {formatXP(
            remaining,
          )}{" "}
          XP to go
        </strong>
      </div>
    </section>
  );
}