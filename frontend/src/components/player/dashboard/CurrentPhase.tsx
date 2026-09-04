import type { DashboardSectionProps } from "./dashboardTypes";
import {
  DashboardCard,
  ProgressBar,
  StatusPill,
} from "./DashboardPrimitives";
import {
  calculatePercentage,
  hasText,
} from "./dashboardUtils";

function getPhaseName(
  data: Dashboard,
): string {
  return (
    data.phase?.name ??
    data.phase?.title ??
    "Current Phase"
  );
}

function getPhaseDescription(
  data: Dashboard,
): string {
  return (
    data.phase?.description ??
    data.phase?.summary ??
    "Complete activities, support your squad and keep progressing."
  );
}

function getPhaseColour(
  data: Dashboard,
): string {
  const colour =
    data.phase?.colour ??
    data.phase?.primary_colour ??
    data.theme?.primary;

  return hasText(colour)
    ? colour
    : "#22c55e";
}

function getPhaseIcon(
  data: Dashboard,
): string {
  return (
    data.phase?.icon ??
    data.phase?.emoji ??
    "🎯"
  );
}

function getPhaseLocation(
  data: Dashboard,
): string | null {
  return (
    data.phase?.location ??
    data.phase?.map_location ??
    null
  );
}

function getPhaseProgress(
  data: Dashboard,
): number | null {
  const phase = data.phase;

  if (!phase) {
    return null;
  }

  if (
    typeof phase.progress ===
      "number"
  ) {
    return calculatePercentage(
      phase.progress,
      100,
    );
  }

  if (
    typeof phase.progress_percentage ===
      "number"
  ) {
    return Math.min(
      100,
      Math.max(
        0,
        phase.progress_percentage,
      ),
    );
  }

  return null;
}

export function CurrentPhase({
  data,
}: DashboardSectionProps) {
  const phase = data.phase;

  if (!phase) {
    return (
      <DashboardCard
        className="current-phase"
        eyebrow="PROGRAMME"
        title="Current Phase"
      >
        <div className="current-phase__empty">
          <span
            className="current-phase__empty-icon"
            aria-hidden="true"
          >
            🗺️
          </span>

          <div>
            <strong>
              Your next phase is coming soon
            </strong>

            <p className="muted">
              Your youth worker will let you
              know what the squad is working
              towards next.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const name =
    getPhaseName(data);

  const description =
    getPhaseDescription(data);

  const colour =
    getPhaseColour(data);

  const icon =
    getPhaseIcon(data);

  const location =
    getPhaseLocation(data);

  const progress =
    getPhaseProgress(data);

  const status =
    phase.status ??
    "active";

  const activities =
    Array.isArray(
      phase.activities,
    )
      ? phase.activities
      : [];

  const role =
    phase.player_role ??
    phase.role ??
    null;

  return (
    <DashboardCard
      className="current-phase"
      eyebrow="CURRENT PHASE"
      title={name}
      variant="default"
    >
      <div
        className="current-phase__hero"
        style={{
          "--phase-colour":
            colour,
        } as React.CSSProperties}
      >
        <div className="current-phase__icon">
          {icon}
        </div>

        <div className="current-phase__intro">
          <StatusPill
            status={
              status
                .charAt(0)
                .toUpperCase() +
              status.slice(1)
            }
            tone={
              status === "active"
                ? "success"
                : status === "upcoming"
                  ? "info"
                  : "neutral"
            }
          />

          <p>
            {description}
          </p>

          {location && (
            <div className="current-phase__location">
              <span aria-hidden="true">
                📍
              </span>

              <span>
                {location}
              </span>
            </div>
          )}
        </div>
      </div>

      {progress !== null && (
        <div className="current-phase__progress">
          <ProgressBar
            label="Phase progress"
            value={progress}
            showPercentage
            colour={colour}
          />
        </div>
      )}

      {role && (
        <div className="current-phase__role">
          <div className="current-phase__role-icon">
            🏅
          </div>

          <div>
            <span className="current-phase__role-label">
              Your role
            </span>

            <strong>
              {role}
            </strong>
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div className="current-phase__activities">
          <div className="current-phase__activities-header">
            <strong>
              Phase activities
            </strong>

            <span>
              {activities.length}
            </span>
          </div>

          <div className="current-phase__activity-list">
            {activities.map(
              (
                activity,
                index,
              ) => {
                const activityName =
                  typeof activity ===
                  "string"
                    ? activity
                    : activity.name ??
                      activity.title ??
                      `Activity ${index + 1}`;

                const completed =
                  typeof activity ===
                    "object" &&
                  activity !== null &&
                  "completed" in
                    activity
                    ? Boolean(
                        activity.completed,
                      )
                    : false;

                return (
                  <div
                    key={`${activityName}-${index}`}
                    className={[
                      "current-phase__activity",
                      completed
                        ? "current-phase__activity--completed"
                        : "",
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(" ")}
                  >
                    <span
                      className="current-phase__activity-check"
                      aria-hidden="true"
                    >
                      {completed
                        ? "✓"
                        : "○"}
                    </span>

                    <span>
                      {activityName}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}