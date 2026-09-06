import {
  useMemo,
} from "react";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

import {
  DashboardCard,
  StatusPill,
} from "./DashboardPrimitives";

import {
  formatXP,
} from "./dashboardUtils";

type ActivityType =
  | "xp"
  | "attendance"
  | "skill"
  | "badge"
  | "challenge"
  | "civic"
  | "reward"
  | "penalty"
  | "group"
  | "system";

interface Activity {
  id?: string | number;

  type?: ActivityType | string;

  title?: string;
  name?: string;
  description?: string;

  xp?: number;
  points?: number;
  amount?: number;

  created_at?: string;
  occurred_at?: string;
  timestamp?: string;

  status?: string;

  icon?: string;
}

interface NormalisedActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  xp: number;
  date: string | null;
  status: string | null;
  icon: string;
}

const TYPE_CONFIG: Record<
  ActivityType,
  {
    icon: string;
    colour: string;
    label: string;
  }
> = {
  xp: {
    icon: "⚡",
    colour: "#22c55e",
    label: "XP",
  },

  attendance: {
    icon: "✓",
    colour: "#38bdf8",
    label: "Attendance",
  },

  skill: {
    icon: "🌱",
    colour: "#a855f7",
    label: "Skill",
  },

  badge: {
    icon: "🏆",
    colour: "#facc15",
    label: "Badge",
  },

  challenge: {
    icon: "⚡",
    colour: "#06b6d4",
    label: "Challenge",
  },

  civic: {
    icon: "⭐",
    colour: "#f59e0b",
    label: "Civic action",
  },

  reward: {
    icon: "🎁",
    colour: "#ec4899",
    label: "Reward",
  },

  penalty: {
    icon: "−",
    colour: "#ef4444",
    label: "Adjustment",
  },

  group: {
    icon: "👥",
    colour: "#6366f1",
    label: "Squad",
  },

  system: {
    icon: "◆",
    colour: "#94a3b8",
    label: "Update",
  },
};

function normaliseType(
  value: unknown,
): ActivityType {
  if (
    typeof value !==
    "string"
  ) {
    return "system";
  }

  const type =
    value.toLowerCase();

  if (
    type === "xp" ||
    type === "points" ||
    type === "point"
  ) {
    return "xp";
  }

  if (
    type === "attendance" ||
    type === "check_in" ||
    type === "checkin"
  ) {
    return "attendance";
  }

  if (
    type === "skill" ||
    type === "skill_tree" ||
    type === "milestone"
  ) {
    return "skill";
  }

  if (
    type === "badge" ||
    type === "achievement"
  ) {
    return "badge";
  }

  if (
    type === "challenge" ||
    type === "game"
  ) {
    return "challenge";
  }

  if (
    type === "civic" ||
    type === "civic_action" ||
    type === "community"
  ) {
    return "civic";
  }

  if (
    type === "reward" ||
    type === "prize"
  ) {
    return "reward";
  }

  if (
    type === "penalty" ||
    type === "deduction" ||
    type === "adjustment"
  ) {
    return "penalty";
  }

  if (
    type === "group" ||
    type === "group_reward" ||
    type === "group_surge"
  ) {
    return "group";
  }

  return "system";
}

function normaliseActivity(
  activity: Activity,
  index: number,
): NormalisedActivity {
  const type =
    normaliseType(
      activity.type,
    );

  const config =
    TYPE_CONFIG[type];

  const xp =
    typeof activity.xp ===
    "number"
      ? activity.xp
      : typeof activity.points ===
          "number"
        ? activity.points
        : typeof activity.amount ===
            "number"
          ? activity.amount
          : 0;

  return {
    id: String(
      activity.id ??
        `activity-${index}`,
    ),

    type,

    title:
      activity.title ??
      activity.name ??
      config.label,

    description:
      activity.description ??
      null,

    xp,

    date:
      activity.created_at ??
      activity.occurred_at ??
      activity.timestamp ??
      null,

    status:
      activity.status ??
      null,

    icon:
      activity.icon ??
      config.icon,
  };
}

function getActivities(
  data: DashboardSectionProps["data"],
): NormalisedActivity[] {
  const source =
    data.recent_activity ??
    data.recentActivity ??
    data.activities ??
    data.activity ??
    [];

  if (
    !Array.isArray(source)
  ) {
    return [];
  }

  return source
    .map(
      (
        activity,
        index,
      ) =>
        normaliseActivity(
          activity as Activity,
          index,
        ),
    )
    .sort(
      (
        first,
        second,
      ) => {
        if (
          !first.date ||
          !second.date
        ) {
          return 0;
        }

        return (
          new Date(
            second.date,
          ).getTime() -
          new Date(
            first.date,
          ).getTime()
        );
      },
    );
}

function formatActivityDate(
  value: string | null,
): string {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  const now =
    Date.now();

  const difference =
    Math.max(
      0,
      now -
        date.getTime(),
    );

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (
    difference <
    minute
  ) {
    return "Just now";
  }

  if (
    difference <
    hour
  ) {
    const minutes =
      Math.floor(
        difference /
          minute,
      );

    return `${minutes}m ago`;
  }

  if (
    difference <
    day
  ) {
    const hours =
      Math.floor(
        difference /
          hour,
      );

    return `${hours}h ago`;
  }

  if (
    difference <
    7 * day
  ) {
    const days =
      Math.floor(
        difference /
          day,
      );

    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
}

function formatSignedXP(
  value: number,
): string {
  if (value > 0) {
    return `+${formatXP(
      value,
    )}`;
  }

  if (value < 0) {
    return `−${formatXP(
      Math.abs(value),
    )}`;
  }

  return "0";
}

function getActivityStatus(
  activity: NormalisedActivity,
) {
  if (
    activity.status
  ) {
    return activity.status;
  }

  if (
    activity.type ===
    "penalty"
  ) {
    return "Adjustment";
  }

  if (
    activity.type ===
    "reward"
  ) {
    return "Unlocked";
  }

  return null;
}

export function RecentActivity({
  data,
}: DashboardSectionProps) {
  const activities =
    useMemo(
      () =>
        getActivities(
          data,
        ),
      [data],
    );

  const totalXP =
    activities.reduce(
      (
        total,
        activity,
      ) =>
        total +
        activity.xp,
      0,
    );

  return (
    <DashboardCard
      className="recent-activity"
      eyebrow="YOUR JOURNEY"
      title="Recent Activity"
      action={
        activities.length >
        0 ? (
          <span className="recent-activity__total">
            {totalXP >= 0
              ? "+"
              : ""}
            {formatXP(
              Math.abs(
                totalXP,
              ),
            )}{" "}
            XP
          </span>
        ) : undefined
      }
    >
      {activities.length ===
      0 ? (
        <div className="recent-activity__empty">
          <div
            className="recent-activity__empty-icon"
            aria-hidden="true"
          >
            ✨
          </div>

          <div>
            <h3>
              Your journey starts
              here
            </h3>

            <p className="muted">
              Your recent achievements,
              challenges and XP changes
              will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="recent-activity__list"
          aria-label="Recent activity"
        >
          {activities.map(
            activity => {
              const config =
                TYPE_CONFIG[
                  activity.type
                ];

              const status =
                getActivityStatus(
                  activity,
                );

              const isPositive =
                activity.xp >
                0;

              const isNegative =
                activity.xp <
                0;

              return (
                <article
                  key={
                    activity.id
                  }
                  className={[
                    "activity-item",
                    isPositive
                      ? "activity-item--positive"
                      : "",
                    isNegative
                      ? "activity-item--negative"
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(" ")}
                >
                  <div
                    className="activity-item__icon"
                    style={
                      {
                        "--activity-colour":
                          config.colour,
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  >
                    {
                      activity.icon
                    }
                  </div>

                  <div className="activity-item__content">
                    <div className="activity-item__heading">
                      <h3>
                        {
                          activity.title
                        }
                      </h3>

                      {status && (
                        <StatusPill
                          status={
                            status
                          }
                          tone={
                            isNegative
                              ? "warning"
                              : isPositive
                                ? "success"
                                : "neutral"
                          }
                        />
                      )}
                    </div>

                    {activity.description && (
                      <p>
                        {
                          activity.description
                        }
                      </p>
                    )}

                    <time
                      dateTime={
                        activity.date ??
                        undefined
                      }
                    >
                      {formatActivityDate(
                        activity.date,
                      )}
                    </time>
                  </div>

                  {activity.xp !==
                    0 && (
                    <div
                      className={[
                        "activity-item__xp",
                        isPositive
                          ? "activity-item__xp--positive"
                          : "",
                        isNegative
                          ? "activity-item__xp--negative"
                          : "",
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          " ",
                        )}
                    >
                      {formatSignedXP(
                        activity.xp,
                      )}{" "}
                      XP
                    </div>
                  )}
                </article>
              );
            },
          )}
        </div>
      )}

      {activities.length >
        0 && (
        <div className="recent-activity__footer">
          <span>
            Showing your latest{" "}
            {activities.length}{" "}
            activities
          </span>
        </div>
      )}
    </DashboardCard>
  );
}