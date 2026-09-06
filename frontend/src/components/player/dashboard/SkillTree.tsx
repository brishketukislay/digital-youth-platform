import type {
  PlayerDashboard,
  PlayerSkillTree,
  CompletedSkillTree,
  SkillMilestone,
} from "../../../api/client";

type Props = {
  data: PlayerDashboard;
};

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

function getMilestoneProgress(
  skillTree: PlayerSkillTree,
) {
  const milestones = skillTree.milestones ?? [];

  if (!milestones.length) {
    return 0;
  }

  const completed = milestones.filter(
    milestone => milestone.completed,
  ).length;

  return Math.min(
    100,
    Math.max(
      0,
      (completed / milestones.length) * 100,
    ),
  );
}

function getXPProgress(
  skillTree: PlayerSkillTree,
) {
  const milestones = skillTree.milestones ?? [];

  const targetXP =
    milestones[milestones.length - 1]?.required_xp ?? 0;

  if (targetXP <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (skillTree.xp / targetXP) * 100,
    ),
  );
}

function getMilestoneState(
  milestones: SkillMilestone[],
  index: number,
) {
  const milestone = milestones[index];

  if (milestone.completed) {
    return "completed";
  }

  const previousMilestones =
    milestones.slice(0, index);

  const previousCompleted =
    previousMilestones.every(
      item => item.completed,
    );

  return previousCompleted
    ? "current"
    : "locked";
}

function CompletedSkillTreeHistory({
  trees,
}: {
  trees: CompletedSkillTree[];
}) {
  if (!trees.length) {
    return null;
  }

  return (
    <div className="skill-tree-history">
      <div className="skill-tree-history__heading">
        <div>
          <div className="eyebrow">
            YOUR JOURNEY
          </div>

          <h3>
            Completed skill trees
          </h3>
        </div>

        <span className="percentage-badge">
          {trees.length}
        </span>
      </div>

      <div className="skill-tree-history__list">
        {trees.map(tree => (
          <details
            key={tree.id}
            className="skill-tree-history__item"
          >
            <summary>
              <span className="skill-tree-history__icon">
                ✓
              </span>

              <span className="skill-tree-history__title">
                <strong>
                  {tree.name}
                </strong>

                <small>
                  {tree.completed_at
                    ? new Date(
                        tree.completed_at,
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "Completed"}
                </small>
              </span>

              <span className="skill-tree-history__xp">
                {formatXP(tree.xp)} XP
              </span>
            </summary>

            {tree.description && (
              <p className="muted">
                {tree.description}
              </p>
            )}

            {tree.milestones.length > 0 && (
              <div className="skill-tree-history__milestones">
                {tree.milestones.map(
                  milestone => (
                    <div
                      key={milestone.id}
                      className="skill-tree-history__milestone"
                    >
                      <span aria-hidden="true">
                        ✓
                      </span>

                      <div>
                        <strong>
                          {milestone.name}
                        </strong>

                        <small>
                          {formatXP(
                            milestone.required_xp,
                          )}{" "}
                          XP
                        </small>

                        {milestone.reward && (
                          <small>
                            {milestone.reward}
                          </small>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}

export function SkillTree({
  data,
}: Props) {
  const skillTree =
    data.skill_tree;

  const completedTrees =
    data.completed_skill_trees ?? [];

  if (!skillTree) {
    return (
      <section className="card skill-tree-card">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PERSONAL PROGRESSION
            </div>

            <h2>
              Skill tree
            </h2>
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
            Your youth worker will help
            you choose a personal skill
            goal.
          </p>
        </div>

        <CompletedSkillTreeHistory
          trees={completedTrees}
        />
      </section>
    );
  }

  const milestones =
    skillTree.milestones ?? [];

  const milestoneProgress =
    getMilestoneProgress(
      skillTree,
    );

  const xpProgress =
    getXPProgress(
      skillTree,
    );

  /*
   * XP is the progress indicator because the
   * SkillTree model stores current_xp as the
   * tree's actual progression.
   *
   * Milestone.completed remains authoritative
   * for whether a milestone has formally been
   * completed/unlocked.
   */
  const progress =
    milestones.length > 0
      ? xpProgress
      : milestoneProgress;

  const completed =
    milestones.filter(
      milestone =>
        milestone.completed,
    ).length;

  const targetXP =
    milestones[
      milestones.length - 1
    ]?.required_xp ?? 0;

  const nextMilestone =
    milestones.find(
      milestone =>
        !milestone.completed &&
        skillTree.xp <
          milestone.required_xp,
    );

  const treeComplete =
    milestones.length > 0 &&
    completed ===
      milestones.length;

  return (
    <section className="card skill-tree-card">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            PERSONAL PROGRESSION
          </div>

          <h2>
            Skill tree
          </h2>
        </div>

        <span className="percentage-badge">
          {Math.round(progress)}%
        </span>
      </div>

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

      <div className="skill-tree-progress-summary">
        <div>
          <span>
            Skill XP
          </span>

          <strong>
            {formatXP(skillTree.xp)}
          </strong>
        </div>

        <div>
          <span>
            Milestones
          </span>

          <strong>
            {completed}/
            {milestones.length}
          </strong>
        </div>

        <div>
          <span>
            Target
          </span>

          <strong>
            {targetXP > 0
              ? formatXP(targetXP)
              : "—"}
          </strong>
        </div>
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
          {nextMilestone
            ? `Next: ${nextMilestone.name}`
            : treeComplete
              ? "All milestones complete"
              : "Skill tree progress"}
        </span>

        <strong>
          {targetXP > 0
            ? `${formatXP(skillTree.xp)} / ${formatXP(
                targetXP,
              )} XP`
            : `${Math.round(progress)}%`}
        </strong>
      </div>

      <div
        className="skill-tree"
        aria-label="Skill tree milestones"
      >
        {milestones.map(
          (
            milestone,
            index,
          ) => {
            const state =
              getMilestoneState(
                milestones,
                index,
              );

            return (
              <div
                key={`${milestone.name}-${index}`}
                className={`skill-node ${state}`}
              >
                <div
                  className="skill-node-icon"
                  aria-hidden="true"
                >
                  {state ===
                  "completed"
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
                    state ===
                    "completed"
                      ? "Completed"
                      : state ===
                        "current"
                        ? "Current milestone"
                        : "Locked"
                  }
                >
                  {state ===
                  "completed"
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

      {treeComplete && (
        <div className="skill-tree-complete">
          <span
            aria-hidden="true"
          >
            🏆
          </span>

          <div>
            <strong>
              Skill tree complete!
            </strong>

            <p>
              Your youth worker can help
              you choose your next goal.
            </p>
          </div>
        </div>
      )}

      {!treeComplete &&
        nextMilestone && (
          <div className="skill-tree-next">
            <span
              aria-hidden="true"
            >
              🎯
            </span>

            <div>
              <strong>
                Next milestone
              </strong>

              <p>
                Reach{" "}
                {formatXP(
                  nextMilestone.required_xp,
                )}{" "}
                XP to complete{" "}
                {nextMilestone.name}.
              </p>
            </div>
          </div>
        )}

      <CompletedSkillTreeHistory
        trees={completedTrees}
      />
    </section>
  );
}
