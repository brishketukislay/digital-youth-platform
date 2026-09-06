import type { AdminSection } from "./adminTypes";

type AdminHeaderProps = {
  activeSection: AdminSection;
};

const titles: Record<
  AdminSection,
  {
    title: string;
    description: string;
  }
> = {
  overview: {
    title: "Admin Dashboard",
    description:
      "Programme operations, progress and configuration.",
  },
  programme: {
    title: "Programme Configuration",
    description:
      "Configure the active programme and its target.",
  },
  phases: {
    title: "Programme Phases",
    description:
      "Control progression through the programme.",
  },
  themes: {
    title: "Visual Themes",
    description:
      "Configure the identity shown to young people.",
  },
  map: {
    title: "Game Map",
    description:
      "Configure the programme map and locations.",
  },
  points: {
    title: "Point Economy",
    description:
      "Configure XP rules, yields and scoring behaviour.",
  },
  jackpot: {
    title: "Jackpot",
    description:
      "Monitor collective progress and milestones.",
  },
  rewards: {
    title: "Rewards",
    description:
      "Configure physical and digital rewards.",
  },
  "reward-games": {
    title: "Reward Games",
    description:
      "Configure scratch cards and spin-the-wheel rewards.",
  },
  challenges: {
    title: "Challenges",
    description:
      "Create, schedule and manage engagement challenges.",
  },
  attempts: {
    title: "Challenge Attempts",
    description:
      "Review and verify submitted challenge attempts.",
  },
  players: {
    title: "Players",
    description:
      "Manage participant accounts and individual progress.",
  },
  community: {
    title: "Community Awards",
    description:
      "Review positive community recognition nominations.",
  },
  attendance: {
    title: "Attendance",
    description:
      "Manage session attendance and rewards.",
  },
  audit: {
    title: "Audit Log",
    description:
      "Review administrative actions and system activity.",
  },
};

export function AdminHeader({
  activeSection,
}: AdminHeaderProps) {
  const content =
    titles[activeSection];

  return (
    <header className="admin-proto-topbar">
      <div className="admin-proto-topbar__brand">
        <div className="admin-proto-topbar__mark">
          D
        </div>

        <div>
          <strong>
            Digital Youth Platform
          </strong>

          <span>
            Staff Administration
          </span>
        </div>
      </div>

      <div className="admin-proto-topbar__centre">
        <div className="admin-proto-topbar__eyebrow">
          ADMINISTRATION
        </div>

        <strong>{content.title}</strong>
      </div>

      <div className="admin-proto-system-status">
        <span />
        System online
      </div>
    </header>
  );
}
