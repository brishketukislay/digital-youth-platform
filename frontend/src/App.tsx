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
} from "react-router-dom";

import { createContext, useContext } from "react";
import { AuthUser, me } from "./api/client";

const Login = lazy(() => import("./pages/Login"));
const PlayerDashboard = lazy(
  () => import("./pages/PlayerDashboard"),
);
const Leaderboard = lazy(
  () => import("./pages/Leaderboard"),
);
const PublicDashboard = lazy(
  () => import("./pages/PublicDashboard"),
);
const YouthWorkerDashboard = lazy(
  () => import("./pages/youth-worker/YouthWorkerDashboard"),
);
const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard"),
);

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

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
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
  const [user, setUser] =
    useState<AuthUser | null>(null);

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

  const value = useMemo(
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

function PageLoader() {
  return <AppLoading message="Loading..." />;
}

/**
 * Public pages never require authentication.
 */
function PublicRoute() {
  return <Outlet />;
}

/**
 * Authenticated route guard.
 */
function RequireAuth({
  allowedRoles,
}: {
  allowedRoles?: string[];
}) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (!user) {
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

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "player":
      return <Navigate to="/player" replace />;

    case "youth_worker":
      return (
        <Navigate
          to="/youth-worker"
          replace
        />
      );

    case "admin":
      return <Navigate to="/admin" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

function RootRoute() {
  return <PublicDashboard />;
}

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

function AppRoutes() {
  const [routeError, setRouteError] =
    useState<string | null>(null);

  const retry = useCallback(() => {
    setRouteError(null);
    window.location.reload();
  }, []);

  if (routeError) {
    return (
      <AppError
        message={routeError}
        onRetry={retry}
      />
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* PUBLIC */}

        <Route element={<PublicRoute />}>
          <Route
            path="/"
            element={<RootRoute />}
          />

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          <Route
            path="/public"
            element={<PublicDashboard />}
          />
        </Route>

        {/* AUTH */}

        <Route
          path="/login"
          element={<LoginRoute />}
        />

        {/* PLAYER */}

        <Route
          element={
            <RequireAuth
              allowedRoles={["player"]}
            />
          }
        >
          <Route
            path="/player"
            element={<PlayerDashboard />}
          />
        </Route>

        {/* YOUTH WORKER */}

        <Route
          element={
            <RequireAuth
              allowedRoles={["youth_worker"]}
            />
          }
        >
          <Route
            path="/youth-worker"
            element={
              <YouthWorkerDashboard />
            }
          />
        </Route>

        {/* ADMIN */}

        <Route
          element={
            <RequireAuth
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        <Route
          path="*"
          element={
            <NotFound />
          }
        />
      </Routes>
    </Suspense>
  );
}

function NotFound() {
  return (
    <main className="app-error">
      <div className="app-error__card">
        <div className="app-error__code">
          404
        </div>

        <h1>Page not found</h1>

        <p>
          That part of the platform does not
          exist yet.
        </p>

        <a
          className="button button--primary"
          href="/"
        >
          Back to platform
        </a>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}