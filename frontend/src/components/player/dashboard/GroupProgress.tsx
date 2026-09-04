import type { PlayerDashboard } from "../../../api/client";

type Props = {
  data: PlayerDashboard;
};

const DEFAULT_TARGET_XP = 1_500_000;

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

function percentage(
  current: number,
  target: number,
) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (Math.max(0, current) / target) * 100,
    ),
  );
}

function ProgressBar({
  value,
}: {
  value: number;
}) {
  return (
    <div
      className="progress large-progress"
      role="progressbar"
      aria-label="Squad progress towards the group goal"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="progress__fill"
        style={{
          width: `${value}%`,
        }}
      />
    </div>
  );
}

export function GroupProgress({
  data,
}: Props) {
  const target =
    data.target_xp ||
    DEFAULT_TARGET_XP;

  const current =
    Math.max(
      0,
      data.group_xp,
    );

  const progress =
    percentage(
      current,
      target,
    );

  const remaining =
    Math.max(
      0,
      target - current,
    );

  return (
    <section className="card featured-progress">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            SQUAD PROGRESS
          </div>

          <h2>
            {formatXP(current)} XP
          </h2>
        </div>

        <div className="progress-number">
          {Math.round(progress)}%
        </div>
      </div>

      <p className="muted progress-description">
        Every player's positive progress
        contributes towards the shared squad
        goal.
      </p>

      <ProgressBar value={progress} />

      <div className="progress-footer">
        <span>
          Goal: {formatXP(target)} XP
        </span>

        <strong>
          {formatXP(remaining)} XP to go
        </strong>
      </div>
    </section>
  );
}