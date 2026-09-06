import {
  useEffect,
  useState,
} from "react";

import {
  getApiErrorMessage,
  getPlayerRewardGames,
  playRewardGame,
  type PlayerRewardGame,
} from "../../api/client";


type RewardGamesProps = {
  onXpAwarded?: () => void;
};


function formatDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}


function ScratchCard({
  game,
  onComplete,
}: {
  game: PlayerRewardGame;
  onComplete: () => void;
}) {
  const [scratched, setScratched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  async function reveal() {
    if (
      scratched ||
      loading
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await playRewardGame(
          game.play_id,
        );

      setResult(
        response.data.awarded_xp,
      );

      setScratched(true);

      onComplete();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "This reward could not be revealed.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            Scratch drop
          </div>

          <h3 className="mt-1 text-xl font-black text-white">
            {game.name}
          </h3>
        </div>

        <div className="text-3xl">
          ✨
        </div>
      </div>

      {game.description && (
        <p className="mb-5 text-sm text-slate-300">
          {game.description}
        </p>
      )}

      <button
        type="button"
        disabled={
          scratched ||
          loading
        }
        onClick={reveal}
        className={[
          "group relative flex min-h-[190px] w-full items-center justify-center overflow-hidden rounded-2xl border-2 transition",
          scratched
            ? "cursor-default border-emerald-300/30 bg-emerald-400/10"
            : "border-slate-500/30 bg-gradient-to-br from-slate-300 via-slate-500 to-slate-300 hover:scale-[1.01] hover:border-amber-300/70",
        ].join(" ")}
      >
        {!scratched ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_25%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,.2),transparent_20%)]" />

            <div className="relative text-center text-slate-900">
              <div className="text-5xl">
                🪙
              </div>

              <div className="mt-3 text-lg font-black">
                {loading
                  ? "Revealing..."
                  : "SCRATCH TO REVEAL"}
              </div>

              <div className="mt-1 text-xs font-semibold uppercase tracking-widest opacity-70">
                Tap to uncover
              </div>
            </div>
          </>
        ) : (
          <div className="relative text-center">
            <div className="text-sm font-bold uppercase tracking-widest text-emerald-300">
              Reward unlocked
            </div>

            <div className="mt-2 text-5xl font-black text-white">
              +{result?.toLocaleString()} XP
            </div>
          </div>
        )}
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}


function SpinWheel({
  game,
  onComplete,
}: {
  game: PlayerRewardGame;
  onComplete: () => void;
}) {
  const [spinning, setSpinning] =
    useState(false);

  const [rotation, setRotation] =
    useState(0);

  const [result, setResult] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [finished, setFinished] =
    useState(false);

  async function spin() {
    if (
      spinning ||
      finished
    ) {
      return;
    }

    try {
      setSpinning(true);
      setError("");

      const response =
        await playRewardGame(
          game.play_id,
        );

      const winningXp =
        response.data.awarded_xp;

      const index =
        Math.max(
          0,
          game.prize_values.indexOf(
            winningXp,
          ),
        );

      const segments =
        game.prize_values.length;

      const segmentAngle =
        360 / segments;

      const targetAngle =
        360 -
        index *
          segmentAngle -
        segmentAngle / 2;

      const spins =
        5 * 360;

      setRotation(
        rotation +
          spins +
          targetAngle,
      );

      window.setTimeout(
        () => {
          setResult(winningXp);
          setSpinning(false);
          setFinished(true);
          onComplete();
        },
        3800,
      );
    } catch (err) {
      setSpinning(false);

      setError(
        getApiErrorMessage(
          err,
          "The wheel could not be spun.",
        ),
      );
    }
  }

  const colours = [
    "bg-cyan-400",
    "bg-violet-400",
    "bg-pink-400",
    "bg-amber-300",
    "bg-emerald-400",
    "bg-blue-400",
  ];

  return (
    <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
            Loot wheel
          </div>

          <h3 className="mt-1 text-xl font-black text-white">
            {game.name}
          </h3>
        </div>

        <div className="text-3xl">
          🎡
        </div>
      </div>

      {game.description && (
        <p className="mb-5 text-sm text-slate-300">
          {game.description}
        </p>
      )}

      <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
        <div className="absolute -top-1 z-20 text-3xl">
          ▼
        </div>

        <div
          className="relative h-56 w-56 overflow-hidden rounded-full border-8 border-slate-700 shadow-2xl transition-transform ease-out"
          style={{
            transform:
              `rotate(${rotation}deg)`,
            transitionDuration:
              spinning
                ? "3800ms"
                : "0ms",
          }}
        >
          {game.prize_values.map(
            (value, index) => {
              const angle =
                360 /
                game.prize_values.length;

              return (
                <div
                  key={`${value}-${index}`}
                  className={[
                    "absolute inset-0 origin-center",
                    colours[
                      index %
                        colours.length
                    ],
                  ].join(" ")}
                  style={{
                    clipPath:
                      `polygon(50% 50%, 50% 0%, ${
                        50 +
                        50 *
                          Math.sin(
                            ((angle *
                              (index +
                                1)) *
                              Math.PI) /
                              180,
                          )
                      }% ${
                        50 -
                        50 *
                          Math.cos(
                            ((angle *
                              (index +
                                1)) *
                              Math.PI) /
                              180,
                          )
                      }%)`,
                  }}
                >
                  <span className="absolute left-1/2 top-5 -translate-x-1/2 text-xs font-black text-slate-950">
                    {value.toLocaleString()}
                  </span>
                </div>
              );
            },
          )}

          <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white/50 bg-slate-950 text-xl shadow-xl">
            ✦
          </div>
        </div>
      </div>

      {!finished ? (
        <button
          type="button"
          disabled={spinning}
          onClick={spin}
          className="mt-3 w-full rounded-xl bg-violet-400 px-5 py-3 font-black text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {spinning
            ? "Spinning..."
            : "SPIN THE WHEEL"}
        </button>
      ) : (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
            Reward unlocked
          </div>

          <div className="mt-1 text-4xl font-black text-white">
            +{result?.toLocaleString()} XP
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}


export default function RewardGames({
  onXpAwarded,
}: RewardGamesProps) {
  const [available, setAvailable] =
    useState<PlayerRewardGame[]>(
      [],
    );

  const [upcoming, setUpcoming] =
    useState<PlayerRewardGame[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {
    try {
      setError("");

      const response =
        await getPlayerRewardGames();

      setAvailable(
        response.data.available,
      );

      setUpcoming(
        response.data.upcoming,
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load reward drops.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function refresh() {
    await load();
    onXpAwarded?.();
  }

  if (
    loading ||
    (
      available.length === 0 &&
      upcoming.length === 0 &&
      !error
    )
  ) {
    return null;
  }

  return (
    <section className="mt-8 space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
          Reward drops
        </div>

        <h2 className="mt-1 text-2xl font-black text-white">
          Your unlocks
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Special rewards from your youth work team.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {available.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {available.map(
            (game) =>
              game.game_type ===
              "scratch" ? (
                <ScratchCard
                  key={game.play_id}
                  game={game}
                  onComplete={
                    refresh
                  }
                />
              ) : (
                <SpinWheel
                  key={game.play_id}
                  game={game}
                  onComplete={
                    refresh
                  }
                />
              ),
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xl">
              🔒
            </span>

            <div>
              <h3 className="font-bold text-white">
                Coming up
              </h3>

              <p className="text-xs text-slate-400">
                These drops will become playable when they open.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((game) => (
              <div
                key={game.play_id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {game.name}
                  </span>

                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-400">
                    {game.game_type ===
                    "scratch"
                      ? "Scratch"
                      : "Wheel"}
                  </span>
                </div>

                {game.starts_at && (
                  <p className="mt-2 text-xs text-cyan-300">
                    Opens{" "}
                    {formatDate(
                      game.starts_at,
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
