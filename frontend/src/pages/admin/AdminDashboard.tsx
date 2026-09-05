import { useState } from "react";

import { AdminShell } from "../../components/admin/AdminShell";
import { OverviewPanel } from "../../components/admin/overview/OverviewPanel";
import { JackpotPage } from "../../components/admin/scoring/JackpotPage";
import { ChallengeManager } from "../../components/admin/challenges/ChallengeManager";
import { ChallengeAttemptReview } from "../../components/admin/challenges/ChallengeAttemptReview";
import { PointEconomy } from "../../lib/admin/PointEconomy";
import type { AdminSection } from "../../components/admin/adminTypes";
import AdminProgramme from "./AdminProgramme";

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

      {section === "points" && (
        <PointEconomy />
      )}

      {section === "jackpot" && (
        <JackpotPage />
      )}

      {section === "challenges" && (
        <ChallengeManager />
      )}

      {section === "attempts" && (
        <ChallengeAttemptReview />
      )}
    </AdminShell>
  );
}
