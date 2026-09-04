import { useEffect, useMemo, useState } from "react";

import {
  adminOverview,
  getApiErrorMessage,
  type AdminOverview,
} from "../../../api/client";

import { ProgrammeProgress } from "./ProgrammeProgress";
import { OverviewStats } from "./OverviewStats";

export function OverviewPanel() {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setError(null);

      const response = await adminOverview();

      setOverview(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load programme overview."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();

    /*
     * The public leaderboard is intended to feel live.
     * Until websocket/SSE support is introduced, polling keeps
     * the staff dashboard reasonably fresh without complicating
     * the architecture.
     */
    const interval = window.setInterval(() => {
      void loadOverview();
    }, 15_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const progress = useMemo(() => {
    if (!overview || overview.target_xp <= 0) {
      return 0;
    }

    return Math.min(
      100,
      (overview.group_xp / overview.target_xp) * 100
    );
  }, [overview]);

  if (loading && !overview) {
    return <OverviewSkeleton />;
  }

  if (error && !overview) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
        <div className="text-sm font-semibold text-red-300">
          Unable to load overview
        </div>

        <p className="mt-2 text-sm text-slate-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadOverview();
          }}
          className="mt-4 rounded-lg bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          Live update failed. Showing the last successful
          snapshot.
        </div>
      )}

      <ProgrammeProgress
        programmeName={overview.programme}
        currentXp={overview.group_xp}
        targetXp={overview.target_xp}
        progress={progress}
      />

      <OverviewStats
        players={overview.players}
        staff={overview.staff}
        groupXp={overview.group_xp}
        targetXp={overview.target_xp}
      />

    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-56 rounded-2xl bg-white/5" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 rounded-2xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
      </div>

      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  );
}