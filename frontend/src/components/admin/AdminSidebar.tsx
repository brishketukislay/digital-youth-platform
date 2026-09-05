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
    label: "Overview",
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
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-900 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Digital Youth
          </div>

          <div className="mt-1 text-lg font-bold">
            Admin Centre
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => {
            const items = navigation.filter(
              (item) => item.group === group
            );

            return (
              <div
                key={group}
                className="mb-6"
              >
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {group}
                </div>

                <div className="space-y-1">
                  {items.map((item) => {
                    const active =
                      item.id === activeSection;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          onSectionChange(item.id)
                        }
                        className={[
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                          active
                            ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <span className="w-5 text-center">
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

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-slate-500">
              Staff access
            </div>

            <div className="mt-1 text-sm font-medium">
              Authorised dashboard
            </div>

            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>↪</span>
              <span>
                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
