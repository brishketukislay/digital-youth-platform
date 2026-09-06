import { useState } from "react";

import { AdminShell } from "../../components/admin/AdminShell";
import { OverviewPanel } from "../../components/admin/overview/OverviewPanel";
import { JackpotPage } from "../../components/admin/scoring/JackpotPage";
import { ChallengeManager } from "../../components/admin/challenges/ChallengeManager";
import { ChallengeAttemptReview } from "../../components/admin/challenges/ChallengeAttemptReview";
import { PointEconomy } from "../../lib/admin/PointEconomy";
import type { AdminSection } from "../../components/admin/adminTypes";
import AdminProgramme from "./AdminProgramme";
import AdminMap from "./AdminMap";
import AdminThemes from "./AdminThemes";
import AdminPhases from "./AdminPhases";
import RewardsManager from "../../components/admin/RewardsManager";
import RewardGamesManager from "../../components/admin/RewardGamesManager";
import PhaseManager from "../../components/admin/phases/PhaseManager";
import { AuditLogPanel } from "../../components/admin/audit/AuditLogPanel";
import { PlayersPanel } from "../../components/admin/people/PlayersPanel";

export default function AdminDashboard() {
  const [section, setSection] =
    useState<AdminSection>("overview");

  return (
    <AdminShell
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "overview" && (
        <OverviewPanel />
      )}

      {section === "programme" && (
        <AdminProgramme />
      )}

      {section === "themes" && (
        <AdminThemes />
      )}

      {section === "phases" && (
        <AdminPhases />
      )}

      {section === "map" && (
        <AdminMap />
      )}

      {section === "points" && (
        <PointEconomy />
      )}

      {section === "jackpot" && (
        <JackpotPage />
      )}

      {section === "rewards" && (
        <RewardsManager />
      )}

      {section === "reward-games" && (
        <RewardGamesManager />
      )}

      {section === "challenges" && (
        <ChallengeManager />
      )}

      {section === "attempts" && (
        <ChallengeAttemptReview />
      )}

      {section === "players" && (
        <PlayersPanel />
      )}

      {section === "audit" && (
        <AuditLogPanel />
      )}
    </AdminShell>
  );
}
