import {
  Bell,
  Menu,
  UserRound,
} from "lucide-react";

import { useAuth } from "../App";

export function UserAvatar({
  role,
  size = "normal",
}: {
  role?: string;
  size?: "normal" | "large";
}) {
  return (
    <span
      className={`dyp-avatar dyp-avatar--${size}`}
      aria-hidden="true"
    >
      <UserRound size={size === "large" ? 19 : 16} />
    </span>
  );
}

export default function AppHeader({
  title,
  eyebrow,
  onMenu,
  user,
}: {
  title: string;
  eyebrow?: string;
  onMenu: () => void;
  user: ReturnType<typeof useAuth>["user"];
}) {
  return (
    <header className="dyp-topbar">
      <div className="dyp-topbar-left">
        <button
          type="button"
          className="dyp-menu-button"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="dyp-topbar-heading">
          {eyebrow && (
            <span>{eyebrow}</span>
          )}

          <h1>{title}</h1>
        </div>
      </div>

      <div className="dyp-topbar-right">
        <div className="dyp-live">
          <span />
          Live
        </div>

        <button
          type="button"
          className="dyp-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        {user && (
          <div className="dyp-top-user">
            <UserAvatar role={user.role} />

            <div>
              <strong>{user.username}</strong>
              <span>
                {user.role === "player"
                  ? "Player"
                  : "Staff"}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
