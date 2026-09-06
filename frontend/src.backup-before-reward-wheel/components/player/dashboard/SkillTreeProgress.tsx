import type {
  DashboardSectionProps,
} from "./dashboardTypes";
import {
  DashboardCard,
  ProgressBar,
  StatusPill,
} from "./DashboardPrimitives";
import {
  calculatePercentage,
  formatXP,
} from "./dashboardUtils";

interface SkillMilestone {
  id?: string | number;
  name?: string;
  title?: string;
  label?: string;
  xp?: number;
  threshold_xp?: number;
  completed?: boolean;
  unlocked?: boolean;
  reward?: string;
  reward_label?: string;
}

interface NormalisedMilestone {
  id: string;
  label: string;
  xp: number;
  completed: boolean;
  reward: string | null;
}

const DEFAULT_MILESTONES: NormalisedMilestone[] =
  [
    {
      id: "tier-1",
      label: "Tier 1",
      xp: 15_000,
      completed: false,
      reward: "£5 voucher",
    },
    {
      id: "tier-2",
      label: "Tier 2",
      xp: 40_000,
      completed: false,
      reward: "£10 voucher",
    },
    {
      id: "tier-3",
      label: "Tier 3",
      xp: 75_000,
      completed: false,
      reward: "£20 voucher",
    },
  ];

function normaliseMilestones(
  value: unknown,
): NormalisedMilestone[] {
  if (!Array.isArray(value)) {
    return DEFAULT_MILESTONES;
  }

  const milestones = value
    .map(
      (
        item: unknown,
        index,
      ) => {
        if (
          typeof item !==
            "object" ||
          item === null
        ) {
          return null;
        }

        const milestone =
          item as SkillMilestone;

        const xp =
          typeof milestone.xp ===
            "number"
            ? milestone.xp
            : typeof milestone.threshold_xp ===
                "number"
              ? milestone.threshold_xp
              : null;

        if (
          xp === null ||
          xp <= 0
        ) {
          return null;
        }

        return {
          id: String(
            milestone.id ??
              `tier-${index + 1}`,
          ),
          label:
            milestone.label ??
            milestone.name ??
            milestone.title ??
            `Tier ${index + 1}`,
          xp,
          completed:
            Boolean(
              milestone.completed ??
                milestone.unlocked,
            ),
          reward:
            milestone.reward ??
            milestone.reward_label ??
            null,
        };
      },
    )
    .filter(
      (
        item,
      ): item is NormalisedMilestone =>
        item !== null,
    );

  return milestones.length > 0
    ? milestones
    : DEFAULT_MILESTONES;
}

function getSkillTreeXP(
  data: DashboardSectionProps["data"],
): number {
  const skillTree =
    data.skill_tree ??
    data.current_skill_tree ??
    null;

  if (!skillTree) {
    return 0;
  }

  if (
    typeof skillTree.current_xp ===
    "number"
  ) {
    return skillTree.current_xp;
  }

  if (
    typeof skillTree.xp ===
    "number"
  ) {
    return skillTree.xp;
  }

  return 0;
}

function getSkillTreeName(
  data: DashboardSectionProps["data"],
): string {
  const skillTree =
    data.skill_tree ??
    data.current_skill_tree ??
    null;

  if (!skillTree) {
    return "Your current skill";
  }

  return (
    skillTree.name ??
    skillTree.title ??
    skillTree.goal ??
    "Your current skill"
  );
}

function getSkillTreeDescription(
  data: DashboardSectionProps["data"],
): string | null {
  const skillTree =
    data.skill_tree ??
    data.current_skill_tree ??
    null;

  return (
    skillTree?.description ??
    skillTree?.goal_description ??
    null
  );
}

function getMilestoneList(
  data: DashboardSectionProps["data"],
): NormalisedMilestone[] {
  const skillTree =
    data.skill_tree ??
    data.current_skill_tree ??
    null;

  return normaliseMilestones(
    skillTree?.milestones,
  );
}

function getCurrentMilestone(
  milestones: NormalisedMilestone[],
  currentXP: number,
) {
  return milestones.find(
    milestone =>
      !milestone.completed &&
      currentXP < milestone.xp,
  );
}

export function SkillTreeProgress({
  data,
}: DashboardSectionProps) {
  const skillTree =
    data.skill_tree ??
    data.current_skill_tree ??
    null;

  if (!skillTree) {
    return (
      <DashboardCard
        className="skill-tree-progress"
        eyebrow="PERSONAL GOAL"
        title="Skill Tree"
      >
        <div className="skill-tree-progress__empty">
          <div
            className="skill-tree-progress__empty-icon"
            aria-hidden="true"
          >
            🌱
          </div>

          <div>
            <h3>
              Your next goal is waiting
            </h3>

            <p className="muted">
              Your youth worker will help
              you choose a skill or goal
              to work towards.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const currentXP =
    getSkillTreeXP(data);

  const skillName =
    getSkillTreeName(data);

  const description =
    getSkillTreeDescription(data);

  const milestones =
    getMilestoneList(data);

  const finalMilestone =
    milestones[
      milestones.length - 1
    ];

  const currentMilestone =
    getCurrentMilestone(
      milestones,
      currentXP,
    );

  const completedCount =
    milestones.filter(
      milestone =>
        milestone.completed ||
        currentXP >= milestone.xp,
    ).length;

  const treeComplete =
    milestones.length > 0 &&
    completedCount ===
      milestones.length;

  const targetXP =
    finalMilestone?.xp ??
    75_000;

  const progress =
    calculatePercentage(
      currentXP,
      targetXP,
    );

  return (
    <DashboardCard
      className="skill-tree-progress"
      eyebrow="PERSONAL GOAL"
      title="Skill Tree"
      variant="default"
    >
      <div className="skill-tree-progress__intro">
        <div className="skill-tree-progress__icon">
          🌱
        </div>

        <div>
          <StatusPill
            status={
              treeComplete
                ? "Complete"
                : "In progress"
            }
            tone={
              treeComplete
                ? "success"
                : "info"
            }
          />

          <h3>
            {skillName}
          </h3>

          {description && (
            <p>
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="skill-tree-progress__summary">
        <div>
          <span>
            Skill XP
          </span>

          <strong>
            {formatXP(currentXP)}
          </strong>
        </div>

        <div>
          <span>
            Milestones
          </span>

          <strong>
            {completedCount}/
            {milestones.length}
          </strong>
        </div>

        <div>
          <span>
            Target
          </span>

          <strong>
            {formatXP(targetXP)}
          </strong>
        </div>
      </div>

      <ProgressBar
        label={
          currentMilestone
            ? `Next: ${currentMilestone.label}`
            : "Skill tree progress"
        }
        value={progress}
        valueLabel={`${formatXP(
          currentXP,
        )} / ${formatXP(targetXP)}`}
        showPercentage
        colour="#a855f7"
        height="large"
      />

      <div
        className="skill-tree-progress__milestones"
        aria-label="Skill tree milestones"
      >
        {milestones.map(
          (
            milestone,
            index,
          ) => {
            const completed =
              milestone.completed ||
              currentXP >=
                milestone.xp;

            const previous =
              milestones[
                index - 1
              ];

            const active =
              !completed &&
              currentXP >=
                (previous?.xp ?? 0);

            const locked =
              !completed &&
              !active;

            return (
              <div
                key={milestone.id}
                className={[
                  "skill-tree-milestone",
                  completed
                    ? "skill-tree-milestone--completed"
                    : "",
                  active
                    ? "skill-tree-milestone--active"
                    : "",
                  locked
                    ? "skill-tree-milestone--locked"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="skill-tree-milestone__marker">
                  {completed
                    ? "✓"
                    : locked
                      ? "🔒"
                      : index + 1}
                </div>

                <div className="skill-tree-milestone__content">
                  <span className="skill-tree-milestone__label">
                    {milestone.label}
                  </span>

                  <strong>
                    {formatXP(
                      milestone.xp,
                    )}{" "}
                    XP
                  </strong>

                  {milestone.reward && (
                    <span className="skill-tree-milestone__reward">
                      {milestone.reward}
                    </span>
                  )}
                </div>

                {completed && (
                  <span className="skill-tree-milestone__complete">
                    Unlocked
                  </span>
                )}

                {active && (
                  <span className="skill-tree-milestone__complete">
                    Next
                  </span>
                )}
              </div>
            );
          },
        )}
      </div>

      {treeComplete && (
        <div className="skill-tree-progress__complete">
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
              Your youth worker can now
              help you choose your next
              goal and start a new tree.
            </p>
          </div>
        </div>
      )}

      {!treeComplete &&
        currentMilestone && (
          <div className="skill-tree-progress__next">
            <span
              aria-hidden="true"
            >
              🎯
            </span>

            <div>
              <strong>
                Your next milestone
              </strong>

              <p>
                {formatXP(
                  Math.max(
                    0,
                    currentMilestone.xp -
                      currentXP,
                  ),
                )}{" "}
                XP to{" "}
                {currentMilestone.label}.
              </p>
            </div>
          </div>
        )}
    </DashboardCard>
  );
}