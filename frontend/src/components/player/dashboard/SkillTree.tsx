import {
  EmptyState,
  ProgressBar,
  SectionHeading,
} from "./DashboardPrimitives";

import {
  formatXP,
  getCompletedMilestones,
  getMilestonePercentage,
} from "./dashboardUtils";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

export function SkillTree({
  data,
}: DashboardSectionProps) {
  const skillTree =
    data.skill_tree;

  if (!skillTree) {
    return (
      <section className="card">
        <SectionHeading
          eyebrow="PERSONAL PROGRESSION"
          title="Skill tree"
        />

        <EmptyState
          icon="🌱"
          title="Your next goal is coming"
          description="Your youth worker will help you choose a personal skill goal."
        />
      </section>
    );
  }

  const milestones =
    skillTree.milestones ?? [];

  const completed =
    getCompletedMilestones(
      milestones,
    );

  const progress =
    getMilestonePercentage(
      milestones,
    );

  return (
    <section className="card skill-tree-card">
      <SectionHeading
        eyebrow="PERSONAL PROGRESSION"
        title="Skill tree"
        action={
          <span className="percentage-badge">
            {Math.round(
              progress,
            )}
            %
          </span>
        }
      />

      <div className="skill-tree-heading">
        <h3>
          {skillTree.name}
        </h3>

        {skillTree.description && (
          <p className="muted">
            {skillTree.description}
          </p>
        )}
      </div>

      <ProgressBar
        value={progress}
        className="skill-progress"
        ariaLabel="Skill tree completion"
      />

      <div className="skill-progress-meta">
        <span>
          {completed} of{" "}
          {milestones.length}{" "}
          milestones complete
        </span>

        <strong>
          {Math.round(
            progress,
          )}
          %
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
                .slice(
                  0,
                  index,
                )
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
                    {
                      milestone.name
                    }
                  </strong>

                  <span>
                    {formatXP(
                      milestone.required_xp,
                    )}{" "}
                    XP
                  </span>

                  {milestone.reward && (
                    <small>
                      {
                        milestone.reward
                      }
                    </small>
                  )}
                </div>

                <div
                  className="skill-node-status"
                  aria-label={
                    milestone.completed
                      ? "Completed"
                      : state ===
                          "current"
                        ? "Current milestone"
                        : "Locked"
                  }
                >
                  {milestone.completed
                    ? "DONE"
                    : state ===
                        "current"
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