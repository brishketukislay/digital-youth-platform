import {
  ReactNode,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AuthUser, getApiErrorMessage, me } from "./api/client";

/* ============================================================
   LAZY ROUTES
============================================================ */

const Login = lazy(() => import("./pages/Login"));
const PlayerDashboard = lazy(
  () => import("./pages/PlayerDashboard"),
);
const Leaderboard = lazy(
  () => import("./pages/Leaderboard"),
);
const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard"),
);

/* ============================================================
   TYPES
============================================================ */

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refresh: () => Promise<AuthUser | null>;
  clear: () => void;
}

/* ============================================================
   AUTH CONTEXT
============================================================ */

import { createContext, useContext } from "react";

const AuthContext =
  createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    setStatus("loading");

    try {
      const response = await me();

      setUser(response.data);
      setStatus("authenticated");

      return response.data;
    } catch {
      setUser(null);
      setStatus("unauthenticated");

      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clear();
    };

    window.addEventListener(
      "dyp:auth-expired",
      handleAuthExpired,
    );

    return () => {
      window.removeEventListener(
        "dyp:auth-expired",
        handleAuthExpired,
      );
    };
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      refresh,
      clear,
    }),
    [user, status, refresh, clear],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   LOADING SCREEN
============================================================ */

function AppLoading({
  message = "Loading your game...",
}: {
  message?: string;
}) {
  return (
    <main className="app-loading" aria-live="polite">
      <div className="app-loading__inner">
        <div className="app-loading__mark">
          <span />
          <span />
          <span />
        </div>

        <p>{message}</p>
      </div>
    </main>
  );
}

/* ============================================================
   ERROR FALLBACK
============================================================ */

function AppError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <main className="app-error">
      <div className="app-error__card">
        <div className="app-error__icon">!</div>

        <h1>Something went wrong</h1>

        <p>{message}</p>

        {onRetry && (
          <button
            type="button"
            className="button button--primary"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}

/* ============================================================
   SUSPENSE FALLBACK
============================================================ */

function PageLoader() {
  return (
    <AppLoading message="Loading..." />
  );
}

/* ============================================================
   ROOT REDIRECT
============================================================ */

function RootRedirect() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "player") {
    return <Navigate to="/player" replace />;
  }

  if (
    user.role === "admin" ||
    user.role === "youth_worker"
  ) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}

/* ============================================================
   AUTHENTICATED ROUTE
============================================================ */

function RequireAuth({
  allowedRoles,
}: {
  allowedRoles?: AuthUser["role"][];
}) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (status === "unauthenticated" || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <RoleRedirect />;
  }

  return <Outlet />;
}

/* ============================================================
   ROLE REDIRECT
============================================================ */

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "player":
      return <Navigate to="/player" replace />;

    case "admin":
    case "youth_worker":
      return <Navigate to="/admin" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

/* ============================================================
   LOGIN ROUTE GUARD
============================================================ */

function LoginRoute() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (user) {
    return <RoleRedirect />;
  }

  return <Login />;
}

/* ============================================================
   PLAYER SHELL
============================================================ */

function PlayerRoute() {
  return (
    <RequireAuth allowedRoles={["player"]} />
  );
}

/* ============================================================
   STAFF SHELL
============================================================ */

function StaffRoute() {
  return (
    <RequireAuth
      allowedRoles={["admin", "youth_worker"]}
    />
  );
}

/* ============================================================
   PUBLIC ROUTES
============================================================ */

function PublicLeaderboardRoute() {
  return <Leaderboard />;
}

/* ============================================================
   NOT FOUND
============================================================ */

function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="app-error">
      <div className="app-error__card">
        <div className="app-error__code">404</div>

        <h1>Page not found</h1>

        <p>
          That part of the platform does not exist.
        </p>

        <button
          type="button"
          className="button button--primary"
          onClick={() => navigate("/")}
        >
          Back to platform
        </button>
      </div>
    </main>
  );
}

/* ============================================================
   APP ROUTES
============================================================ */

function AppRoutes() {
  const [routeError, setRouteError] =
    useState<string | null>(null);

  const handleRetry = useCallback(() => {
    setRouteError(null);
    window.location.reload();
  }, []);

  if (routeError) {
    return (
      <AppError
        message={routeError}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ----------------------------------------------------
            PUBLIC
        ---------------------------------------------------- */}

        <Route
          path="/"
          element={<RootRedirect />}
        />

        <Route
          path="/login"
          element={<LoginRoute />}
        />

        <Route
          path="/leaderboard"
          element={<PublicLeaderboardRoute />}
        />

        {/* ----------------------------------------------------
            PLAYER
        ---------------------------------------------------- */}

        <Route element={<PlayerRoute />}>
          <Route
            path="/player"
            element={<PlayerDashboard />}
          />
        </Route>

        {/* ----------------------------------------------------
            ADMIN / YOUTH WORKER
        ---------------------------------------------------- */}

        <Route element={<StaffRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        {/* ----------------------------------------------------
            FUTURE ROUTES
        ---------------------------------------------------- */}

        {/*
          These are intentionally not implemented yet.

          The platform is going to grow into:

          /admin/programme
          /admin/themes
          /admin/phases
          /admin/maps
          /admin/points
          /admin/rewards
          /admin/challenges
          /admin/community
          /admin/players

          We will add them once the admin shell is replaced.
        */}

        {/* ----------------------------------------------------
            FALLBACK
        ---------------------------------------------------- */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </Suspense>
  );
}

/* ============================================================
   APPLICATION
============================================================ */

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

/* ============================================================
   EXPORT AUTH HOOK
============================================================ */

export { useAuth };