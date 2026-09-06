import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../components/Layout";

import {
  getApiErrorMessage,
  playerDashboard,
  type PlayerDashboard as PlayerDashboardData,
} from "../api/client";

import {
  PlayerHero,
  GroupProgress,
  CurrentPhase,
  SkillTree,
  BadgeCabinet,
  MysteryProgress,
  Challenges,
  GameMap,
  PrivacyNotice,
} from "../components/player";

import RecognitionQR from "../components/player/RecognitionQR";

/* -------------------------------------------------------------------------- */
/* Player Dashboard                                                           */
/* -------------------------------------------------------------------------- */

export default function PlayerDashboard() {
  const [
    data,
    setData,
  ] = useState<PlayerDashboardData | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  /* ------------------------------------------------------------------------ */
  /* Load                                                                     */
  /* ------------------------------------------------------------------------ */

  const loadDashboard =
    useCallback(
      async (
        background = false,
      ) => {
        try {
          if (background) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError(null);

          const response =
            await playerDashboard();

          setData(
            response.data,
          );
        } catch (loadError) {
          setError(
            getApiErrorMessage(
              loadError,
              "Unable to load your dashboard.",
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* Initial load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* Background refresh                                                       */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          void loadDashboard(
            true,
          );
        },
        60_000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* Theme                                                                    */
  /* ------------------------------------------------------------------------ */

  const themeStyle =
    useMemo(() => {
      if (!data?.theme) {
        return undefined;
      }

      return {
        "--player-primary":
          data.theme.primary,
        "--player-secondary":
          data.theme.secondary,
        "--player-accent":
          data.theme.accent,
        "--player-background":
          data.theme.background,
        "--player-surface":
          data.theme.surface,
        "--player-text":
          data.theme.text,
      } as React.CSSProperties;
    }, [data?.theme]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading && !data) {
    return (
      <Layout>
        <div
          className="card dashboard-loading"
          aria-live="polite"
        >
          <div
            className="loading-orb"
            aria-hidden="true"
          >
            ✦
          </div>

          <h2>
            Loading your journey...
          </h2>

          <p className="muted">
            Getting your latest progress.
          </p>
        </div>
      </Layout>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Fatal error                                                              */
  /* ------------------------------------------------------------------------ */

  if (error && !data) {
    return (
      <Layout>
        <div
          className="card dashboard-error"
          role="alert"
        >
          <div
            className="dashboard-error__icon"
            aria-hidden="true"
          >
            !
          </div>

          <h2>
            We couldn't load your
            journey
          </h2>

          <p className="muted">
            {error}
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              void loadDashboard()
            }
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Defensive state                                                          */
  /* ------------------------------------------------------------------------ */

  if (!data?.player) {
    return (
      <Layout>
        <div className="card">
          <div className="empty-state">
            <span
              className="empty-state__icon"
              aria-hidden="true"
            >
              👤
            </span>

            <strong>
              Player profile not found
            </strong>

            <p>
              Please speak to your youth
              worker.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Dashboard                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <Layout
      title={
        data.programme?.name ||
        "Digital Youth Platform"
      }
    >
      <div
        className="player-dashboard"
        style={themeStyle}
      >
        <RecognitionQR
          playerId={data.player.id}
          gamertag={data.player.gamertag}
        />

        <PlayerHero
          data={data}
        />

        {refreshing && (
          <div
            className="dashboard-sync"
            aria-live="polite"
          >
            Updating your progress...
          </div>
        )}

        <GroupProgress
          data={data}
        />

        <div className="grid player-core-grid">
          <CurrentPhase
            data={data}
          />

          <MysteryProgress
            xp={data.player.xp}
          />
        </div>

        <div className="grid player-progression-grid">
          <SkillTree
            data={data}
          />

          <BadgeCabinet
            data={data}
          />
        </div>

        <Challenges
          data={data}
        />

        <GameMap
          data={data}
        />

        <PrivacyNotice />

        {error && (
          <div
            className="notice notice--error section-gap"
            role="status"
          >
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}
