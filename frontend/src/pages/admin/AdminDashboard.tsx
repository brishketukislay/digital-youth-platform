import { useState } from "react";

import { AdminShell } from "../../components/admin/AdminShell";
import { OverviewPanel } from "../../components/admin/overview/OverviewPanel";
import { ProgrammeSettings } from "../../components/admin/programme/ProgrammeSettings";
import { PhaseManager } from "../../components/admin/programme/PhaseManager";
import { ThemeManager } from "../../components/admin/programme/ThemeManager";
import { MapManager } from "../../components/admin/programme/MapManager";
import { PointEconomy } from "../../components/admin/scoring/PointEconomy";
import { JackpotPage } from "../../components/admin/scoring/JackpotPage";
import { RewardManager } from "../../components/admin/rewards/RewardManager";
import { ChallengeManager } from "../../components/admin/challenges/ChallengeManager";
import { PlayerManager } from "../../components/admin/players/PlayerManager";
import { CommunityAwardQueue } from "../../components/admin/community/CommunityAwardQueue";
import { AttendanceManager } from "../../components/admin/attendance/AttendanceManager";

export type AdminSection =
  | "overview"
  | "programme"
  | "phases"
  | "themes"
  | "map"
  | "points"
  | "jackpot"
  | "rewards"
  | "challenges"
  | "players"
  | "community"
  | "attendance";

export default function AdminDashboard() {
  const [section, setSection] =
    useState<AdminSection>("overview");

  return (
    <AdminShell
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "overview" && <OverviewPanel />}

      {section === "programme" && (
        <ProgrammeSettings />
      )}

      {section === "phases" && (
        <PhaseManager />
      )}

      {section === "themes" && (
        <ThemeManager />
      )}

      {section === "map" && (
        <MapManager />
      )}

      {section === "points" && (
        <PointEconomy />
      )}

      {section === "jackpot" && (
        <JackpotPage />
      )}

      {section === "rewards" && (
        <RewardManager />
      )}

      {section === "challenges" && (
        <ChallengeManager />
      )}

      {section === "players" && (
        <PlayerManager />
      )}

      {section === "community" && (
        <CommunityAwardQueue />
      )}

      {section === "attendance" && (
        <AttendanceManager />
      )}
    </AdminShell>
  );
}