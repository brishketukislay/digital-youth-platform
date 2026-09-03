import { ReactNode } from "react";
import { logout } from "../api/client";

export default function Layout({
  children,
  title = "Digital Youth Platform",
}: {
  children: ReactNode;
  title?: string;
}) {
  async function signOut() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">{title}</div>
        <button
          className="btn secondary"
          onClick={signOut}
        >
          Sign out
        </button>
      </header>

      <main className="container">{children}</main>
    </div>
  );
}
