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
    title: "Programme overview",
    description:
      "Live view of the cohort, progress and programme health.",
  },
  programme: {
    title: "Programme settings",
    description:
      "Configure the active programme and its jackpot target.",
  },
  phases: {
    title: "Phases",
    description:
      "Control the programme themes, activities and progression.",
  },
  themes: {
    title: "Visual themes",
    description:
      "Configure the visual identity shown to young people.",
  },
  map: {
    title: "Game map",
    description:
      "Configure the Cumbernauld game world and locations.",
  },
  points: {
    title: "Point economy",
    description:
      "Configure XP rules, yields and scoring behaviour.",
  },
  jackpot: {
    title: "Jackpot tracker",
    description:
      "Monitor collective progress against programme milestones.",
  },
  rewards: {
    title: "Rewards",
    description:
      "Configure physical and digital rewards.",
  },
  challenges: {
    title: "Challenges",
    description:
      "Create and monitor time-bound engagement challenges.",
  },
  attempts: {
    title: "Challenge attempts",
    description:
      "Review, verify and reject submitted challenge attempts.",
  },
  players: {
    title: "Players",
    description:
      "Manage anonymous player accounts and individual progress.",
  },
  community: {
    title: "Community awards",
    description:
      "Review and approve positive community nominations.",
  },
  audit: {
    title: "Audit Log",
    description:
      "Review administrative actions and system activity.",
  },
  attendance: {
    title: "Attendance",
    description:
      "Manage session check-ins and attendance rewards.",
  },
};

export function AdminHeader({
  activeSection,
}: AdminHeaderProps) {
  const content = titles[activeSection];

  return (
    <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {content.title}
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            {content.description}
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

          <span className="text-xs font-medium text-emerald-300">
            System online
          </span>
        </div>
      </div>
    </header>
  );
}