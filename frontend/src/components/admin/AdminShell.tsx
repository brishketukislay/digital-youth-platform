import type {
  ReactNode,
} from "react";

import type { AdminSection } from "../../pages/admin/AdminDashboard";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

type AdminShellProps = {
  activeSection: AdminSection;
  onSectionChange: (
    section: AdminSection
  ) => void;
  children: ReactNode;
};

export function AdminShell({
  activeSection,
  onSectionChange,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />

        <main className="min-w-0 flex-1">
          <AdminHeader
            activeSection={activeSection}
          />

          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}