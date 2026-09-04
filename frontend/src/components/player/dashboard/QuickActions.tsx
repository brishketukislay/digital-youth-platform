import type { ReactNode } from "react";

interface QuickAction {
  key: string;
  label: string;
  description: string;
  icon: ReactNode;
  accent: string;
  disabled?: boolean;
  onClick: () => void;
}

interface QuickActionsProps {
  onCommunityAward?: () => void;
  onMysteryReward?: () => void;
  onLootDrop?: () => void;
  onChallenges?: () => void;
  communityAwardAvailable?: boolean;
  mysteryRewardAvailable?: boolean;
  lootDropAvailable?: boolean;
  challengesAvailable?: boolean;
}

export function QuickActions({
  onCommunityAward,
  onMysteryReward,
  onLootDrop,
  onChallenges,
  communityAwardAvailable = true,
  mysteryRewardAvailable = false,
  lootDropAvailable = false,
  challengesAvailable = false,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      key: "community",
      label: "Community Kudos",
      description:
        "Show your QR code when someone wants to recognise a positive action.",
      icon: "🤝",
      accent: "#22c55e",
      disabled:
        !communityAwardAvailable ||
        !onCommunityAward,
      onClick:
        onCommunityAward ??
        (() => undefined),
    },
    {
      key: "mystery",
      label: "Mystery Rewards",
      description:
        "Check your lifetime XP journey for unlocked surprises.",
      icon: "🎁",
      accent: "#a855f7",
      disabled:
        !mysteryRewardAvailable ||
        !onMysteryReward,
      onClick:
        onMysteryReward ??
        (() => undefined),
    },
    {
      key: "loot",
      label: "Loot Drop",
      description:
        "A limited reward drop may appear after exceptional progress.",
      icon: "🎡",
      accent: "#f59e0b",
      disabled:
        !lootDropAvailable ||
        !onLootDrop,
      onClick:
        onLootDrop ??
        (() => undefined),
    },
    {
      key: "challenges",
      label: "Flash Challenges",
      description:
        "Take part in a live time-bound challenge.",
      icon: "⚡",
      accent: "#06b6d4",
      disabled:
        !challengesAvailable ||
        !onChallenges,
      onClick:
        onChallenges ??
        (() => undefined),
    },
  ];

  return (
    <section
      className="quick-actions"
      aria-labelledby="quick-actions-title"
    >
      <div className="quick-actions__header">
        <div>
          <span className="quick-actions__eyebrow">
            WHAT CAN YOU DO?
          </span>

          <h2
            id="quick-actions-title"
            className="quick-actions__title"
          >
            Quick Actions
          </h2>
        </div>
      </div>

      <div className="quick-actions__grid">
        {actions.map(action => (
          <button
            key={action.key}
            type="button"
            className={[
              "quick-action",
              action.disabled
                ? "quick-action--disabled"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              "--quick-action-accent":
                action.accent,
            } as React.CSSProperties}
          >
            <span
              className="quick-action__icon"
              aria-hidden="true"
            >
              {action.icon}
            </span>

            <span className="quick-action__content">
              <strong>
                {action.label}
              </strong>

              <span>
                {action.description}
              </span>
            </span>

            <span
              className="quick-action__arrow"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}