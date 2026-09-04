import type { ReactNode } from "react";
import type {
  DashboardSectionProps,
} from "./dashboardTypes";
import {
  DashboardCard,
  StatusPill,
} from "./DashboardPrimitives";

interface Badge {
  id?: string | number;
  name?: string;
  title?: string;
  label?: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  colour?: string;
  tier?: string;
  level?: number;
  earned?: boolean;
  unlocked?: boolean;
  earned_at?: string;
}

interface NormalisedBadge {
  id: string;
  name: string;
  description: string | null;
  icon: ReactNode;
  colour: string;
  tier: string;
  earned: boolean;
  earnedAt: string | null;
}

const DEFAULT_BADGES: NormalisedBadge[] = [
  {
    id: "iron",
    name: "Iron",
    description:
      "Complete your first skill tree.",
    icon: "⚙️",
    colour: "#94a3b8",
    tier: "Iron",
    earned: false,
    earnedAt: null,
  },
  {
    id: "bronze",
    name: "Bronze",
    description:
      "Complete your second skill tree.",
    icon: "🥉",
    colour: "#b87333",
    tier: "Bronze",
    earned: false,
    earnedAt: null,
  },
  {
    id: "silver",
    name: "Silver",
    description:
      "Complete your third skill tree.",
    icon: "🥈",
    colour: "#cbd5e1",
    tier: "Silver",
    earned: false,
    earnedAt: null,
  },
  {
    id: "gold-prestige",
    name: "Gold Prestige",
    description:
      "Complete your fourth skill tree.",
    icon: "🏆",
    colour: "#facc15",
    tier: "Gold Prestige",
    earned: false,
    earnedAt: null,
  },
];

function normaliseBadge(
  badge: Badge,
  index: number,
): NormalisedBadge {
  const fallback =
    DEFAULT_BADGES[index] ??
    DEFAULT_BADGES[
      DEFAULT_BADGES.length - 1
    ];

  return {
    id: String(
      badge.id ??
        fallback.id ??
        `badge-${index}`,
    ),

    name:
      badge.name ??
      badge.title ??
      badge.label ??
      fallback.name,

    description:
      badge.description ??
      fallback.description,

    icon:
      badge.icon ??
      badge.image ??
      fallback.icon,

    colour:
      badge.colour ??
      fallback.colour,

    tier:
      badge.tier ??
      fallback.tier,

    earned:
      Boolean(
        badge.earned ??
          badge.unlocked,
      ),

    earnedAt:
      badge.earned_at ??
      null,
  };
}

function getBadges(
  data: DashboardSectionProps["data"],
): NormalisedBadge[] {
  const badges =
    data.badges ??
    data.achievements ??
    null;

  if (!Array.isArray(badges)) {
    return DEFAULT_BADGES;
  }

  if (badges.length === 0) {
    return DEFAULT_BADGES;
  }

  return badges.map(
    (badge, index) =>
      normaliseBadge(
        badge as Badge,
        index,
      ),
  );
}

function formatEarnedDate(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function BadgeCabinet({
  data,
}: DashboardSectionProps) {
  const badges =
    getBadges(data);

  const earnedCount =
    badges.filter(
      badge => badge.earned,
    ).length;

  return (
    <DashboardCard
      className="badge-cabinet"
      eyebrow="ACHIEVEMENTS"
      title="Badge Cabinet"
    >
      <div className="badge-cabinet__summary">
        <div>
          <span>
            Badges earned
          </span>

          <strong>
            {earnedCount}
            <small>
              /{badges.length}
            </small>
          </strong>
        </div>

        <StatusPill
          status={
            earnedCount ===
            badges.length
              ? "Complete"
              : `${badges.length - earnedCount} to unlock`
          }
          tone={
            earnedCount ===
            badges.length
              ? "success"
              : "info"
          }
        />
      </div>

      <div
        className="badge-cabinet__grid"
        aria-label="Your badges"
      >
        {badges.map(
          badge => {
            const earned =
              badge.earned;

            const earnedDate =
              formatEarnedDate(
                badge.earnedAt,
              );

            return (
              <article
                key={badge.id}
                className={[
                  "badge-card",
                  earned
                    ? "badge-card--earned"
                    : "badge-card--locked",
                ].join(" ")}
              >
                <div
                  className="badge-card__visual"
                  style={{
                    "--badge-colour":
                      badge.colour,
                  } as React.CSSProperties}
                >
                  <span
                    className="badge-card__icon"
                    aria-hidden="true"
                  >
                    {earned
                      ? badge.icon
                      : "🔒"}
                  </span>

                  {!earned && (
                    <span className="badge-card__locked-overlay">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="badge-card__content">
                  <span className="badge-card__tier">
                    {badge.tier}
                  </span>

                  <h3>
                    {badge.name}
                  </h3>

                  {badge.description && (
                    <p>
                      {badge.description}
                    </p>
                  )}

                  {earned ? (
                    <div className="badge-card__earned">
                      <span>
                        ✓ Earned
                      </span>

                      {earnedDate && (
                        <time
                          dateTime={
                            badge.earnedAt ??
                            undefined
                          }
                        >
                          {earnedDate}
                        </time>
                      )}
                    </div>
                  ) : (
                    <span className="badge-card__locked">
                      Keep progressing
                    </span>
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>
    </DashboardCard>
  );
}