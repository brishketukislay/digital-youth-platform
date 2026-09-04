import {
  ReactNode,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
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

import {
  AuthUser,
  getApiErrorMessage,
  me,
} from "./api/client";

/* ============================================================
   LAZY ROUTES
============================================================ */

const Login = lazy(
  () => import("./pages/Login"),
);

const PlayerDashboard = lazy(
  () => import("./pages/PlayerDashboard"),
);

const PlayerChallengePage = lazy(
  () => import("./pages/player/PlayerChallengePage"),
);

const YouthWorkerDashboard = lazy(
  () =>
    import(
      "./pages/youth-worker/YouthWorkerDashboard"
    ),
);

const AdminDashboard = lazy(
  () =>
    import(
      "./pages/admin/AdminDashboard"
    ),
);

const AdminProgramme = lazy(
  () =>
    import(
      "./pages/admin/AdminProgramme"
    ),
);

const PublicDashboard = lazy(
  () =>
    import(
      "./pages/PublicDashboard"
    ),
);

const Leaderboard = lazy(
  () => import("./pages/Leaderboard"),
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

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

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

  const refresh = useCallback(
    async () => {
      setStatus("loading");

      try {
        const response =
          await me();

        setUser(response.data);
        setStatus("authenticated");

        return response.data;
      } catch {
        setUser(null);
        setStatus("unauthenticated");

        return null;
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleAuthExpired =
      () => {
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

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        status,
        refresh,
        clear,
      }),
      [
        user,
        status,
        refresh,
        clear,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   LOADING
============================================================ */

function AppLoading({
  message = "Loading your game...",
}: {
  message?: string;
}) {
  return (
    <main
      className="app-loading"
      aria-live="polite"
    >
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
   ERROR
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
        <div className="app-error__icon">
          !
        </div>

        <h1>
          Something went wrong
        </h1>

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
   PAGE LOADER
============================================================ */

function PageLoader() {
  return (
    <AppLoading message="Loading..." />
  );
}

/* ============================================================
   ROLE HOME
============================================================ */

function roleHome(
  role: AuthUser["role"],
) {
  switch (role) {
    case "player":
      return "/player";

    case "youth_worker":
      return "/youth-worker";

    case "admin":
      return "/admin";

    default:
      return "/login";
  }
}

/* ============================================================
   ROOT REDIRECT
============================================================ */

function RootRedirect() {
  const { user, status } =
    useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to={roleHome(user.role)}
      replace
    />
  );
}

/* ============================================================
   AUTH GUARD
============================================================ */

function RequireAuth({
  allowedRoles,
}: {
  allowedRoles?: AuthUser["role"][];
}) {
  const {
    user,
    status,
  } = useAuth();

  const location =
    useLocation();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (
    status ===
      "unauthenticated" ||
    !user
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role,
    )
  ) {
    return <RoleRedirect />;
  }

  return <Outlet />;
}

/* ============================================================
   ROLE REDIRECT
============================================================ */

function RoleRedirect() {
  const { user } =
    useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to={roleHome(user.role)}
      replace
    />
  );
}

/* ============================================================
   LOGIN GUARD
============================================================ */

function LoginRoute() {
  const {
    user,
    status,
  } = useAuth();

  if (status === "loading") {
    return <AppLoading />;
  }

  if (user) {
    return <RoleRedirect />;
  }

  return <Login />;
}

/* ============================================================
   NOT FOUND
============================================================ */

function NotFound() {
  const navigate =
    useNavigate();

  return (
    <main className="app-error">
      <div className="app-error__card">
        <div className="app-error__code">
          404
        </div>

        <h1>
          Page not found
        </h1>

        <p>
          That part of the
          platform does not
          exist.
        </p>

        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            navigate("/")
          }
        >
          Back to platform
        </button>
      </div>
    </main>
  );
}

/* ============================================================
   ROUTES
============================================================ */

function AppRoutes() {
  const [
    routeError,
    setRouteError,
  ] = useState<string | null>(
    null,
  );

  const handleRetry =
    useCallback(() => {
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
    <Suspense
      fallback={
        <PageLoader />
      }
    >
      <Routes>

        {/* ====================================================
            ENTRY
        ==================================================== */}

        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />

        <Route
          path="/login"
          element={
            <LoginRoute />
          }
        />

        {/* ====================================================
            PUBLIC
        ==================================================== */}

        <Route
          path="/public"
          element={
            <PublicDashboard />
          }
        />

        <Route
          path="/leaderboard"
          element={
            <Leaderboard />
          }
        />

        {/* ====================================================
            PLAYER
        ==================================================== */}

        <Route
          element={
            <RequireAuth
              allowedRoles={[
                "player",
              ]}
            />
          }
        >
          <Route
            path="/player"
            element={
              <PlayerDashboard />
            }
          />

          <Route
            path="/player/challenges/:challengeId"
            element={
              <PlayerChallengePage />
            }
          />
        </Route>

        {/* ====================================================
            YOUTH WORKER
        ==================================================== */}

        <Route
          element={
            <RequireAuth
              allowedRoles={[
                "youth_worker",
              ]}
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

        {/* ====================================================
            ADMIN
        ==================================================== */}

        <Route
          element={
            <RequireAuth
              allowedRoles={[
                "admin",
              ]}
            />
          }
        >
          <Route
            path="/admin"
            element={
              <AdminDashboard />
            }
          />

          <Route
            path="/admin/programme"
            element={
              <AdminProgramme />
            }
          />
        </Route>

        {/* ====================================================
            FALLBACK
        ==================================================== */}

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