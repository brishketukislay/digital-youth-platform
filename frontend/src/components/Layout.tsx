import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ChevronRight,
  Gamepad2,
  Gift,
  Home,
  LogOut,
  Map,
  Settings,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  getApiErrorMessage,
  logout,
} from "../api/client";

import { useAuth } from "../App";
import AppHeader, {
  UserAvatar,
} from "./AppHeader";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  showNavigation?: boolean;
  fullWidth?: boolean;
}

type IconName =
  | "home"
  | "trophy"
  | "map"
  | "target"
  | "settings"
  | "users"
  | "game"
  | "gift";

function NavIcon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const props = {
    size,
    strokeWidth: 1.9,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return <Home {...props} />;
    case "trophy":
      return <Trophy {...props} />;
    case "map":
      return <Map {...props} />;
    case "target":
      return <Target {...props} />;
    case "settings":
      return <Settings {...props} />;
    case "users":
      return <Users {...props} />;
    case "game":
      return <Gamepad2 {...props} />;
    case "gift":
      return <Gift {...props} />;
  }
}

interface NavigationItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

const PLAYER_NAVIGATION: NavigationItem[] = [
  {
    label: "My journey",
    path: "/player",
    icon: "home",
    exact: true,
  },
  {
    label: "Leaderboard",
    path: "/leaderboard",
    icon: "trophy",
  },
];

const STAFF_NAVIGATION: NavigationItem[] = [
  {
    label: "Overview",
    path: "/admin",
    icon: "home",
    exact: true,
  },
  {
    label: "Players",
    path: "/admin/players",
    icon: "users",
  },
  {
    label: "Challenges",
    path: "/admin/challenges",
    icon: "game",
  },
  {
    label: "Programme",
    path: "/admin/programme",
    icon: "target",
  },
  {
    label: "Rewards",
    path: "/admin/rewards",
    icon: "gift",
  },
  {
    label: "Configuration",
    path: "/admin/configuration",
    icon: "settings",
  },
];

function Brand() {
  return (
    <NavLink
      to="/"
      className="dyp-brand"
      aria-label="Digital Youth Platform home"
    >
      <span className="dyp-brand-mark">
        D
      </span>

      <span className="dyp-brand-copy">
        <strong>Digital Youth</strong>
        <small>Platform</small>
      </span>
    </NavLink>
  );
}

function Sidebar({
  open,
  onClose,
  items,
  user,
  onSignOut,
  signingOut,
}: {
  open: boolean;
  onClose: () => void;
  items: NavigationItem[];
  user: ReturnType<typeof useAuth>["user"];
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="dyp-sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`dyp-sidebar ${
          open ? "dyp-sidebar--open" : ""
        }`}
      >
        <div className="dyp-sidebar-brand">
          <Brand />

          <button
            type="button"
            className="dyp-mobile-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="dyp-sidebar-profile">
            <UserAvatar role={user.role} size="large" />

            <div>
              <strong>{user.username}</strong>

              <span>
                {user.role === "player"
                  ? "Player"
                  : user.role === "admin"
                  ? "Administrator"
                  : "Youth worker"}
              </span>
            </div>
          </div>
        )}

        <nav className="dyp-sidebar-nav">
          <div className="dyp-sidebar-label">
            Navigate
          </div>

          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `dyp-nav-link ${
                  isActive ? "is-active" : ""
                }`
              }
            >
              <NavIcon name={item.icon} />

              <span>{item.label}</span>

              <ChevronRight
                className="dyp-nav-chevron"
                size={15}
              />
            </NavLink>
          ))}
        </nav>

        <div className="dyp-sidebar-bottom">
          <div className="dyp-platform-status">
            <span className="dyp-status-dot" />

            <div>
              <strong>Platform online</strong>
              <small>Connected</small>
            </div>
          </div>

          <button
            type="button"
            className="dyp-nav-link dyp-logout"
            onClick={onSignOut}
            disabled={signingOut}
          >
            <LogOut size={18} />

            <span>
              {signingOut
                ? "Signing out..."
                : "Sign out"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function Layout({
  children,
  title = "Digital Youth Platform",
  eyebrow,
  showNavigation = true,
  fullWidth = false,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, clear } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const [signOutError, setSignOutError] =
    useState<string | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const original =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        original;
    };
  }, [sidebarOpen]);

  const navigation = useMemo(() => {
    if (!user) {
      return [];
    }

    return user.role === "player"
      ? PLAYER_NAVIGATION
      : STAFF_NAVIGATION;
  }, [user]);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError(null);

    try {
      await logout();

      clear();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      clear();

      setSignOutError(
        getApiErrorMessage(
          error,
          "Your local session has been cleared.",
        ),
      );

      navigate("/login", {
        replace: true,
      });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="dyp-app">
      {showNavigation && (
        <AppHeader
          title={title}
          eyebrow={eyebrow}
          onMenu={() =>
            setSidebarOpen(true)
          }
          user={user}
        />
      )}

      {showNavigation && (
        <Sidebar
          open={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
          items={navigation}
          user={user}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
      )}

      <main
        className={`dyp-main ${
          showNavigation
            ? "dyp-main--with-nav"
            : "dyp-main--standalone"
        }`}
      >
        {signOutError && (
          <div
            className="dyp-notice dyp-notice--error"
            role="alert"
          >
            <span>{signOutError}</span>

            <button
              type="button"
              onClick={() =>
                setSignOutError(null)
              }
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div
          className={
            fullWidth
              ? "dyp-content dyp-content--full"
              : "dyp-content"
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
