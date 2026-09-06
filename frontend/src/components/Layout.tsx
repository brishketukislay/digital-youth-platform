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
  getApiErrorMessage,
  logout,
} from "../api/client";

import { useAuth } from "../App";

/* ============================================================
   TYPES
============================================================ */

interface LayoutProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  showNavigation?: boolean;
  fullWidth?: boolean;
}

/* ============================================================
   ICON
============================================================ */

function Icon({
  name,
  size = 20,
}: {
  name:
    | "home"
    | "trophy"
    | "map"
    | "target"
    | "settings"
    | "users"
    | "game"
    | "gift"
    | "logout"
    | "menu"
    | "close"
    | "bell"
    | "chevron";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );

    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
          <path d="M7 6H4v2a4 4 0 0 0 4 4" />
          <path d="M17 6h3v2a4 4 0 0 1-4 4" />
        </svg>
      );

    case "map":
      return (
        <svg {...common}>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.5h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.4V14h-.4a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "game":
      return (
        <svg {...common}>
          <path d="M6 9h12a5 5 0 0 1 4.7 6.7l-1.1 3A3 3 0 0 1 16 20l-4-4-4 4a3 3 0 0 1-5.6-1.3l-1.1-3A5 5 0 0 1 6 9Z" />
          <path d="M7 13v4" />
          <path d="M5 15h4" />
          <circle cx="16.5" cy="14" r=".8" />
          <circle cx="19" cy="16.5" r=".8" />
        </svg>
      );

    case "gift":
      return (
        <svg {...common}>
          <path d="M20 12v9H4v-9" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 7v14" />
          <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
          <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    default:
      return null;
  }
}

/* ============================================================
   NAVIGATION
============================================================ */

interface NavigationItem {
  label: string;
  path: string;
  icon: Parameters<typeof Icon>[0]["name"];
  exact?: boolean;
}

const PLAYER_NAVIGATION: NavigationItem[] = [
  {
    label: "My Journey",
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

/* ============================================================
   BRAND
============================================================ */

function Brand({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <NavLink
      to="/"
      className={`brand ${
        compact ? "brand--compact" : ""
      }`}
      aria-label="Digital Youth Platform home"
    >
      <span
        className="brand-mark"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </span>

      <span className="brand-copy">
        <strong>Digital Youth</strong>
        <small>Platform</small>
      </span>
    </NavLink>
  );
}

/* ============================================================
   USER IDENTITY
============================================================ */

function UserIdentity({
  user,
}: {
  user: ReturnType<typeof useAuth>["user"];
}) {
  if (!user) {
    return null;
  }

  const isPlayer = user.role === "player";

  return (
    <div className="user-identity">
      <div
        className={`user-avatar ${
          isPlayer
            ? "user-avatar--player"
            : "user-avatar--staff"
        }`}
        aria-hidden="true"
      >
        {isPlayer ? "P" : "S"}
      </div>

      <div className="user-identity__copy">
        <strong>{user.username}</strong>

        <span>
          {isPlayer
            ? "Player"
            : user.role === "admin"
            ? "Administrator"
            : "Youth Worker"}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   NAV ITEM
============================================================ */

function NavigationLink({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onNavigate}
      className={({ isActive }) =>
        `side-nav__link ${
          isActive ? "is-active" : ""
        }`
      }
    >
      <Icon
        name={item.icon}
        size={19}
      />

      <span>{item.label}</span>

      <Icon
        name="chevron"
        size={15}
      />
    </NavLink>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

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
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          open ? "sidebar--open" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="sidebar__top">
          <Brand />

          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon
              name="close"
              size={20}
            />
          </button>
        </div>

        <div className="sidebar__profile">
          <UserIdentity user={user} />
        </div>

        <nav className="side-nav">
          <div className="side-nav__label">
            Navigate
          </div>

          {items.map(item => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={onClose}
            />
          ))}
        </nav>

        <div className="sidebar__bottom">
          <div className="sidebar-status">
            <span className="sidebar-status__dot" />

            <div>
              <strong>Platform online</strong>
              <small>Connected</small>
            </div>
          </div>

          <button
            type="button"
            className="side-nav__link side-nav__logout"
            onClick={onSignOut}
            disabled={signingOut}
          >
            <Icon
              name="logout"
              size={19}
            />

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

/* ============================================================
   TOP BAR
============================================================ */

function TopBar({
  title,
  eyebrow,
  onMenu,
  user,
  onSignOut,
  signingOut,
}: {
  title: string;
  eyebrow?: string;
  onMenu: () => void;
  user: ReturnType<typeof useAuth>["user"];
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }

    function closeMenu(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (
        !target.closest(
          ".topbar-user-menu",
        )
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeMenu,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeMenu,
      );
    };
  }, [userMenuOpen]);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Icon
            name="menu"
            size={22}
          />
        </button>

        <div className="topbar-heading">
          {eyebrow && (
            <span>{eyebrow}</span>
          )}

          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar__right">
        <div
          className="connection-indicator"
          title="Connected to the platform"
        >
          <span />
          <span>Live</span>
        </div>

        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Icon
            name="bell"
            size={19}
          />
        </button>

        <div className="topbar-user-menu">
          <button
            type="button"
            className="topbar-user"
            onClick={() =>
              setUserMenuOpen(
                current => !current,
              )
            }
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <div className="topbar-user__avatar">
              {user?.role === "player"
                ? "★"
                : "◆"}
            </div>

            <div className="topbar-user__copy">
              <strong>
                {user?.username}
              </strong>

              <span>
                {user?.role === "player"
                  ? "Player"
                  : "Staff"}
              </span>
            </div>

            <span className="topbar-user__chevron">
              ▾
            </span>
          </button>

          {userMenuOpen && (
            <div
              className="topbar-user-dropdown"
              role="menu"
            >
              <div className="topbar-user-dropdown__identity">
                <strong>
                  {user?.username}
                </strong>

                <span>
                  {user?.role}
                </span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  onSignOut();
                }}
                disabled={signingOut}
              >
                <Icon
                  name="logout"
                  size={17}
                />

                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   MOBILE BRAND
============================================================ */

function MobileBrand() {
  return (
    <div className="mobile-brand">
      <Brand compact />
    </div>
  );
}

/* ============================================================
   SIGN OUT ERROR
============================================================ */

function SignOutNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="layout-notice layout-notice--error"
      role="alert"
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
}

/* ============================================================
   LAYOUT
============================================================ */

export default function Layout({
  children,
  title = "Digital Youth Platform",
  eyebrow,
  showNavigation = true,
  fullWidth = false,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    clear,
  } = useAuth();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const [signOutError, setSignOutError] =
    useState<string | null>(null);

  /*
   * Close the mobile sidebar whenever navigation
   * occurs.
   */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /*
   * Prevent body scrolling while the mobile navigation
   * drawer is open.
   */
  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [sidebarOpen]);

  const navigation = useMemo(() => {
    if (!user) {
      return [];
    }

    if (user.role === "player") {
      return PLAYER_NAVIGATION;
    }

    return STAFF_NAVIGATION;
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
      /*
       * Even if the server logout fails, clear the local
       * authentication state. The session may already be
       * invalid server-side.
       */
      clear();

      setSignOutError(
        getApiErrorMessage(
          error,
          "We couldn't contact the server, but your local session has been cleared.",
        ),
      );

      navigate("/login", {
        replace: true,
      });
    } finally {
      setSigningOut(false);
    }
  }

  const mainClassName = [
    "app-main",
    fullWidth ? "app-main--full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell">
      {showNavigation && user && (
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

      <div className="app-content">
        {showNavigation && user ? (
          <TopBar
            title={title}
            eyebrow={eyebrow}
            onMenu={() =>
              setSidebarOpen(true)
            }
            user={user}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
        ) : (
          <MobileBrand />
        )}

        {signOutError && (
          <SignOutNotice
            message={signOutError}
            onDismiss={() =>
              setSignOutError(null)
            }
          />
        )}

        <main className={mainClassName}>
          <div className="app-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
