import {
  type ReactNode,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import type { AdminSection } from "./adminTypes";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { logout } from "../../api/client";
import { useAuth } from "../../App";

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
  const navigate = useNavigate();
  const { clear } = useAuth();

  const [signingOut, setSigningOut] =
    useState(false);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await logout();
    } catch {
      /*
       * Even if the server logout fails, clear the
       * local authentication state.
       */
    } finally {
      clear();

      navigate("/login", {
        replace: true,
      });

      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onSignOut={handleSignOut}
          signingOut={signingOut}
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
