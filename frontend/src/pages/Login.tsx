import {
  FormEvent,
  useEffect,
  useId,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getApiErrorMessage,
  login,
} from "../api/client";

import { useAuth } from "../App";

/* ============================================================
   TYPES
============================================================ */

interface LoginLocationState {
  from?: string;
}

/* ============================================================
   LOGIN
============================================================ */

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, refresh } = useAuth();

  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [showPassword, setShowPassword] =
    useState(false);

  /*
   * If an already authenticated user reaches /login,
   * send them directly to the appropriate experience.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === "player") {
      navigate("/player", { replace: true });
      return;
    }

    navigate("/admin", { replace: true });
  }, [user, navigate]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      /*
       * Authentication is handled by the backend session/cookie.
       * We deliberately do not persist credentials or tokens in
       * localStorage.
       */
      await login(cleanUsername, password);

      /*
       * Re-query /auth/me so AuthProvider becomes the single
       * source of truth for the authenticated user.
       */
      const authenticatedUser = await refresh();

      if (!authenticatedUser) {
        throw new Error(
          "Your account was authenticated, but we could not load your profile.",
        );
      }

      const state =
        location.state as LoginLocationState | null;

      /*
       * Only honour an internal application route.
       * Never blindly redirect to arbitrary external URLs.
       */
      const requestedPath =
        typeof state?.from === "string" &&
        state.from.startsWith("/")
          ? state.from
          : null;

      if (requestedPath && requestedPath !== "/login") {
        navigate(requestedPath, {
          replace: true,
        });

        return;
      }

      if (authenticatedUser.role === "player") {
        navigate("/player", {
          replace: true,
        });

        return;
      }

      if (
        authenticatedUser.role === "admin" ||
        authenticatedUser.role === "youth_worker"
      ) {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      throw new Error(
        "Your account has an unsupported role. Please contact an administrator.",
      );
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "We couldn't sign you in. Please check your username and password.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="login">
      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        {/* ----------------------------------------------------
            BRAND
        ---------------------------------------------------- */}

        <div className="login-brand">
          <div
            className="login-brand__mark"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>

          <span className="login-brand__eyebrow">
            Cumbernauld Youth Platform
          </span>
        </div>

        {/* ----------------------------------------------------
            INTRO
        ---------------------------------------------------- */}

        <header className="login-header">
          <h1 id="login-title">
            Welcome back
          </h1>

          <p>
            Sign in to continue your journey.
          </p>
        </header>

        {/* ----------------------------------------------------
            ERROR
        ---------------------------------------------------- */}

        {error && (
          <div
            id={errorId}
            className="login-alert"
            role="alert"
            aria-live="assertive"
          >
            <span
              className="login-alert__icon"
              aria-hidden="true"
            >
              !
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* ----------------------------------------------------
            FORM
        ---------------------------------------------------- */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Username */}

          <div className="form-field">
            <label htmlFor={usernameId}>
              Username
            </label>

            <input
              id={usernameId}
              name="username"
              type="text"
              value={username}
              onChange={event => {
                setUsername(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={isSubmitting}
              aria-invalid={
                error ? "true" : undefined
              }
              aria-describedby={
                error ? errorId : undefined
              }
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Password */}

          <div className="form-field">
            <div className="form-field__label-row">
              <label htmlFor={passwordId}>
                Password
              </label>
            </div>

            <div className="password-field">
              <input
                id={passwordId}
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={event => {
                  setPassword(event.target.value);

                  if (error) {
                    setError(null);
                  }
                }}
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={
                  error ? "true" : undefined
                }
                aria-describedby={
                  error ? errorId : undefined
                }
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                className="password-field__toggle"
                onClick={() =>
                  setShowPassword(
                    current => !current,
                  )
                }
                disabled={isSubmitting}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            className="button button--primary login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="button__spinner"
                  aria-hidden="true"
                />

                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>

                <span
                  aria-hidden="true"
                  className="login-submit__arrow"
                >
                  →
                </span>
              </>
            )}
          </button>
        </form>

        {/* ----------------------------------------------------
            ACCOUNT INFORMATION
        ---------------------------------------------------- */}

        <footer className="login-footer">
          <div
            className="login-footer__icon"
            aria-hidden="true"
          >
            ✓
          </div>

          <p>
            Accounts are created and managed by
            authorised youth work staff.
          </p>
        </footer>
      </section>
    </main>
  );
}