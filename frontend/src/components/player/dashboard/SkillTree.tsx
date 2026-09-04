import type {
  PlayerDashboard,
  SkillMilestone,
} from "../../../api/client";

type Props = {
  data: PlayerDashboard;
};

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

function milestonePercentage(
  milestones: SkillMilestone[],
) {
  if (!milestones.length) {
    return 0;
  }

  const completed =
    milestones.filter(
      milestone =>
        milestone.completed,
    ).length;

  return Math.min(
    100,
    Math.max(
      0,
      (completed /
        milestones.length) *
        100,
    ),
  );
}

export function SkillTree({
  data,
}: Props) {
  const skillTree =
    data.skill_tree;

  if (!skillTree) {
    return (
      <section className="card">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PERSONAL PROGRESSION
            </div>

            <h2>Skill tree</h2>
          </div>
        </div>

        <div className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🌱
          </span>

          <strong>
            Your next goal is coming
          </strong>

          <p>
            Your youth worker will help you
            choose a personal skill goal.
          </p>
        </div>
      </section>
    );
  }

  const milestones =
    skillTree.milestones ?? [];

  const completed =
    milestones.filter(
      milestone =>
        milestone.completed,
    ).length;

  const progress =
    milestonePercentage(
      milestones,
    );

  return (
    <section className="card skill-tree-card">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            PERSONAL PROGRESSION
          </div>

          <h2>Skill tree</h2>
        </div>

        <span className="percentage-badge">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="skill-tree-heading">
        <h3>{skillTree.name}</h3>

        {skillTree.description && (
          <p className="muted">
            {skillTree.description}
          </p>
        )}
      </div>

      <div
        className="progress skill-progress"
        role="progressbar"
        aria-label="Skill tree completion"
        aria-valuenow={Math.round(
          progress,
        )}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="progress__fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="skill-progress-meta">
        <span>
          {completed} of{" "}
          {milestones.length}{" "}
          milestones complete
        </span>

        <strong>
          {Math.round(progress)}%
        </strong>
      </div>

      <div className="skill-tree">
        {milestones.map(
          (
            milestone,
            index,
          ) => {
            const previousCompleted =
              milestones
                .slice(0, index)
                .every(
                  item =>
                    item.completed,
                );

            const state =
              milestone.completed
                ? "completed"
                : previousCompleted
                ? "current"
                : "locked";

            return (
              <div
                key={`${milestone.name}-${index}`}
                className={`skill-node ${state}`}
              >
                <div
                  className="skill-node-icon"
                  aria-hidden="true"
                >
                  {milestone.completed
                    ? "✓"
                    : index + 1}
                </div>

                <div className="skill-node-content">
                  <strong>
                    {milestone.name}
                  </strong>

                  <span>
                    {formatXP(
                      milestone.required_xp,
                    )}{" "}
                    XP
                  </span>

                  {milestone.reward && (
                    <small>
                      {milestone.reward}
                    </small>
                  )}
                </div>

                <div
                  className="skill-node-status"
                  aria-label={
                    milestone.completed
                      ? "Completed"
                      : state === "current"
                      ? "Current milestone"
                      : "Locked"
                  }
                >
                  {milestone.completed
                    ? "DONE"
                    : state === "current"
                    ? "NEXT"
                    : "LOCKED"}
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}