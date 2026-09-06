import type { AdminSection } from "./adminTypes";

type AdminSidebarProps = {
  activeSection: AdminSection;
  onSectionChange: (
    section: AdminSection
  ) => void;
  onSignOut: () => void;
  signingOut: boolean;
};

type NavigationItem = {
  id: AdminSection;
  label: string;
  icon: string;
  group: string;
};

const navigation: NavigationItem[] = [
  {
    id: "overview",
    label: "Admin Dashboard",
    icon: "▦",
    group: "Dashboard",
  },

  {
    id: "programme",
    label: "Programme",
    icon: "⚙",
    group: "Programme",
  },
  {
    id: "phases",
    label: "Phases",
    icon: "◈",
    group: "Programme",
  },
  {
    id: "themes",
    label: "Themes",
    icon: "✦",
    group: "Programme",
  },
  {
    id: "map",
    label: "Game Map",
    icon: "⌖",
    group: "Programme",
  },

  {
    id: "points",
    label: "Point Economy",
    icon: "✧",
    group: "Scoring",
  },
  {
    id: "jackpot",
    label: "Jackpot",
    icon: "◆",
    group: "Scoring",
  },
  {
    id: "rewards",
    label: "Rewards",
    icon: "★",
    group: "Scoring",
  },
  {
    id: "reward-games",
    label: "Scratch & Wheel",
    icon: "🎁",
    group: "Scoring",
  },

  {
    id: "challenges",
    label: "Challenges",
    icon: "⚡",
    group: "Engagement",
  },
  {
    id: "attempts",
    label: "Attempts",
    icon: "✓",
    group: "Engagement",
  },

  {
    id: "players",
    label: "Players",
    icon: "♙",
    group: "People",
  },
  {
    id: "community",
    label: "Community Awards",
    icon: "♥",
    group: "People",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: "✓",
    group: "People",
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: "◷",
    group: "People",
  },
];

const groups = [
  "Dashboard",
  "Programme",
  "Scoring",
  "Engagement",
  "People",
];

export function AdminSidebar({
  activeSection,
  onSectionChange,
  onSignOut,
  signingOut,
}: AdminSidebarProps) {
  return (
    <>
      <aside className="admin-proto-sidebar">
        <div className="admin-proto-sidebar__inner">
          <div className="admin-proto-brand">
            <div className="admin-proto-brand__mark">
              D
            </div>

            <div>
              <strong>
                Digital Youth
              </strong>

              <span>
                Administration
              </span>
            </div>
          </div>

          <nav className="admin-proto-nav">
            {groups.map(group => {
              const items =
                navigation.filter(
                  item =>
                    item.group === group,
                );

              return (
                <div
                  className="admin-proto-nav-group"
                  key={group}
                >
                  <div className="admin-proto-nav-label">
                    {group}
                  </div>

                  <div className="admin-proto-nav-items">
                    {items.map(item => {
                      const active =
                        item.id ===
                        activeSection;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={[
                            "admin-proto-nav-item",
                            active
                              ? "admin-proto-nav-item--active"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            onSectionChange(
                              item.id,
                            )
                          }
                        >
                          <span className="admin-proto-nav-icon">
                            {item.icon}
                          </span>

                          <span>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="admin-proto-sidebar-footer">
            <div className="admin-proto-access-card">
              <span>
                STAFF ACCESS
              </span>

              <strong>
                Authorised dashboard
              </strong>

              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
              >
                <span>↪</span>

                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <nav className="admin-proto-mobile-nav">
        {[
          {
            id: "overview" as AdminSection,
            label: "Home",
            icon: "▦",
          },
          {
            id: "challenges" as AdminSection,
            label: "Games",
            icon: "⚡",
          },
          {
            id: "players" as AdminSection,
            label: "Players",
            icon: "♙",
          },
          {
            id: "programme" as AdminSection,
            label: "Setup",
            icon: "⚙",
          },
          {
            id: "audit" as AdminSection,
            label: "Audit",
            icon: "◷",
          },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === activeSection
                ? "active"
                : ""
            }
            onClick={() =>
              onSectionChange(item.id)
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
