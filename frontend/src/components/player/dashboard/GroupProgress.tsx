import type { DashboardSectionProps } from "./dashboardTypes";
import {
  DashboardCard,
  ProgressBar,
  DashboardStat,
} from "./DashboardPrimitives";
import {
  calculatePercentage,
  formatXP,
  getGroupTargetXP,
  getRemainingXP,
} from "./dashboardUtils";

const GROUP_MILESTONES = [
  {
    xp: 500_000,
    label: "First Prize",
    icon: "🥉",
  },
  {
    xp: 1_000_000,
    label: "Mid Prize",
    icon: "🥈",
  },
  {
    xp: 1_500_000,
    label: "Jackpot",
    icon: "🏆",
  },
] as const;

function getMilestoneState(
  currentXP: number,
  milestoneXP: number,
  previousXP?: number,
) {
  if (currentXP >= milestoneXP) {
    return "completed";
  }

  if (
    previousXP !== undefined &&
    currentXP >= previousXP
  ) {
    return "current";
  }

  return "locked";
}

export function GroupProgress({
  data,
}: DashboardSectionProps) {
  const groupXP =
    typeof data.group_xp === "number"
      ? data.group_xp
      : 0;

  const targetXP =
    getGroupTargetXP(data);

  const percentage =
    calculatePercentage(
      groupXP,
      targetXP,
    );

  const remainingXP =
    getRemainingXP(
      groupXP,
      targetXP,
    );

  const completedMilestones =
    GROUP_MILESTONES.filter(
      milestone =>
        groupXP >= milestone.xp,
    ).length;

  const nextMilestone =
    GROUP_MILESTONES.find(
      milestone =>
        groupXP < milestone.xp,
    );

  return (
    <DashboardCard
      className="group-progress"
      eyebrow="THE SQUAD"
      title="Our Collective Journey"
      variant="accent"
    >
      <div className="group-progress__top">
        <div className="group-progress__headline">
          <span className="group-progress__label">
            Collective XP
          </span>

          <strong className="group-progress__xp">
            {formatXP(groupXP)}
          </strong>

          <span className="group-progress__target">
            / {formatXP(targetXP)} XP
          </span>
        </div>

        <div className="group-progress__percentage">
          {Math.round(percentage)}%
        </div>
      </div>

      <ProgressBar
        value={percentage}
        colour="var(--player-accent, #facc15)"
        height="large"
      />

      <div className="group-progress__message">
        {nextMilestone ? (
          <>
            <span
              className="group-progress__message-icon"
              aria-hidden="true"
            >
              {nextMilestone.icon}
            </span>

            <div>
              <strong>
                {formatXP(
                  getRemainingXP(
                    groupXP,
                    nextMilestone.xp,
                  ),
                )}{" "}
                XP to{" "}
                {nextMilestone.label}
              </strong>

              <span>
                Every positive action helps
                move the whole squad forward.
              </span>
            </div>
          </>
        ) : (
          <>
            <span
              className="group-progress__message-icon"
              aria-hidden="true"
            >
              🏆
            </span>

            <div>
              <strong>
                Jackpot target reached!
              </strong>

              <span>
                The squad has completed the
                collective progression target.
              </span>
            </div>
          </>
        )}
      </div>

      <div className="group-progress__stats">
        <DashboardStat
          label="Squad XP"
          value={formatXP(groupXP)}
          icon="⚡"
        />

        <DashboardStat
          label="Completed"
          value={`${completedMilestones}/3`}
          description="group milestones"
          icon="🎯"
        />

        <DashboardStat
          label="Remaining"
          value={formatXP(
            remainingXP,
          )}
          description="to final target"
          icon="🚀"
        />
      </div>

      <div
        className="group-progress__milestones"
        aria-label="Group prize milestones"
      >
        {GROUP_MILESTONES.map(
          (milestone, index) => {
            const previousMilestone =
              GROUP_MILESTONES[
                index - 1
              ];

            const state =
              getMilestoneState(
                groupXP,
                milestone.xp,
                previousMilestone?.xp,
              );

            return (
              <div
                key={milestone.xp}
                className={[
                  "group-milestone",
                  `group-milestone--${state}`,
                ].join(" ")}
              >
                <div className="group-milestone__icon">
                  {state ===
                  "completed"
                    ? "✓"
                    : milestone.icon}
                </div>

                <div className="group-milestone__content">
                  <span className="group-milestone__label">
                    {milestone.label}
                  </span>

                  <strong>
                    {formatXP(
                      milestone.xp,
                    )}{" "}
                    XP
                  </strong>
                </div>
              </div>
            );
          },
        )}
      </div>

      <p className="group-progress__privacy">
        Your squad's collective score is
        public. Individual XP and player
        journeys remain private.
      </p>
    </DashboardCard>
  );
}