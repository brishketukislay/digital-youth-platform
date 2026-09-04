import { useEffect, useMemo, useState } from "react";

import {
  getPlayerDashboard,
  type PlayerDashboardData,
} from "../api/client";

import {
  ActiveChallenges,
  BadgeCabinet,
  CurrentPhase,
  GroupProgress,
  MysteryRewards,
  PlayerHero,
  QuickActions,
  RecentActivity,
  ResourceLibrary,
  SkillTreeProgress,
} from "../components/player/dashboard";

import {
  getGroupXP,
  getGroupTargetXP,
  getLifetimeXP,
  getSkillTreeProgress,
} from "../components/player/dashboard/dashboardUtils";

import type {
  PlayerDashboardViewData,
} from "../components/player/dashboard/dashboardTypes";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DashboardLoadState =
  | "loading"
  | "success"
  | "error";

type PlayerDashboardProps = {
  /**
   * Optional player id.
   *
   * If the backend derives the player from the authenticated
   * session, this can be omitted.
   */
  playerId?: string | number;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PlayerDashboard({
  playerId,
}: PlayerDashboardProps) {
  const [
    data,
    setData,
  ] = useState<
    PlayerDashboardViewData | null
  >(null);

  const [
    status,
    setStatus,
  ] = useState<DashboardLoadState>(
    "loading",
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  /* ------------------------------------------------------------------------ */
  /* Data loading                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setStatus("loading");
        setError(null);

        /*
         * The generated API client should remain the single
         * transport layer for dashboard data.
         *
         * If your generated client accepts a player id, pass it
         * here. Otherwise the authenticated backend session
         * determines the player.
         */
        const response =
          playerId !== undefined
            ? await getPlayerDashboard(
                playerId,
              )
            : await getPlayerDashboard();

        if (cancelled) {
          return;
        }

        setData(
          response as PlayerDashboardViewData,
        );

        setStatus("success");
      } catch (caught) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load player dashboard:",
          caught,
        );

        setError(
          getDashboardErrorMessage(
            caught,
          ),
        );

        setStatus("error");
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    if (!data) {
      return null;
    }

    const lifetimeXP =
      getLifetimeXP(data);

    const groupXP =
      getGroupXP(data);

    const groupTargetXP =
      getGroupTargetXP(data);

    const skillProgress =
      getSkillTreeProgress(data);

    return {
      lifetimeXP,
      groupXP,
      groupTargetXP,
      skillProgress,
    };
  }, [data]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (
    status === "loading" &&
    !data
  ) {
    return (
      <PlayerDashboardLoading />
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                     */
  /* ------------------------------------------------------------------------ */

  if (
    status === "error" &&
    !data
  ) {
    return (
      <PlayerDashboardError
        message={
          error ??
          "We couldn't load your dashboard."
        }
        onRetry={() => {
          /*
           * Changing this page's key through the browser is not
           * required. A full refresh remains available through
           * the button if the current route needs a clean retry.
           */
          window.location.reload();
        }}
      />
    );
  }

  if (!data || !summary) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Dashboard                                                                 */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      className="min-h-screen bg-slate-950 text-white"
      aria-label="Player dashboard"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="player-dashboard-heading"
          className="mb-6"
        >
          <PlayerHero
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Group progress                                                    */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="group-progress-heading"
          className="mb-6"
        >
          <GroupProgress
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Current phase                                                     */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="current-phase-heading"
          className="mb-6"
        >
          <CurrentPhase
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Individual progression                                            */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="skill-tree-heading"
          className="mb-6"
        >
          <SkillTreeProgress
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Challenges                                                        */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="active-challenges-heading"
          className="mb-6"
        >
          <ActiveChallenges
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Rewards                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="mystery-rewards-heading"
          >
            <MysteryRewards
              data={data}
            />
          </section>

          <section
            aria-labelledby="badge-cabinet-heading"
          >
            <BadgeCabinet
              data={data}
            />
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Activity + resources                                              */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="recent-activity-heading"
          >
            <RecentActivity
              data={data}
            />
          </section>

          <section
            aria-labelledby="resource-library-heading"
          >
            <ResourceLibrary
              data={data}
            />
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Quick actions                                                     */}
        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="quick-actions-heading"
          className="mt-6"
        >
          <QuickActions
            data={data}
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Development-only refresh indicator                                */}
        {/* ---------------------------------------------------------------- */}

        {status === "loading" && (
          <div
            className="pointer-events-none fixed bottom-4 right-4 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 text-xs text-slate-300 shadow-xl backdrop-blur"
            role="status"
            aria-live="polite"
          >
            Updating…
          </div>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

function PlayerDashboardLoading() {
  return (
    <main
      className="min-h-screen bg-slate-950 text-white"
      aria-label="Loading player dashboard"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className="animate-pulse space-y-6"
          aria-hidden="true"
        >
          {/* Hero */}
          <div className="h-48 rounded-3xl bg-slate-900" />

          {/* Group progress */}
          <div className="h-36 rounded-3xl bg-slate-900" />

          {/* Phase */}
          <div className="h-52 rounded-3xl bg-slate-900" />

          {/* Skill tree */}
          <div className="h-64 rounded-3xl bg-slate-900" />

          {/* Challenges */}
          <div className="h-48 rounded-3xl bg-slate-900" />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 rounded-3xl bg-slate-900" />
            <div className="h-64 rounded-3xl bg-slate-900" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-3xl bg-slate-900" />
            <div className="h-72 rounded-3xl bg-slate-900" />
          </div>
        </div>

        <p className="sr-only">
          Loading your dashboard…
        </p>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Error state                                                                */
/* -------------------------------------------------------------------------- */

type PlayerDashboardErrorProps = {
  message: string;
  onRetry: () => void;
};

function PlayerDashboardError({
  message,
  onRetry,
}: PlayerDashboardErrorProps) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"
      aria-label="Player dashboard error"
    >
      <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl"
          aria-hidden="true"
        >
          !
        </div>

        <h1 className="text-xl font-bold">
          Dashboard unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Error normalisation                                                        */
/* -------------------------------------------------------------------------- */

function getDashboardErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  return "Something went wrong while loading your player dashboard.";
}