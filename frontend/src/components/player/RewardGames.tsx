import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getApiErrorMessage,
  getPlayerRewardGames,
  playRewardGame,
  type PlayerRewardGame,
} from "../../api/client";
import RewardWheel from "../RewardWheel";

type RewardGamesProps = {
  onXpAwarded?: () => void;
};

function formatDate(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const WHEEL_COLOURS = [
  "#7c3aed",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
];

function Wheel({
  prizes,
  rotation,
  spinning,
}: {
  prizes: number[];
  rotation: number;
  spinning: boolean;
}) {
  const segmentAngle = 360 / prizes.length;

  const background = useMemo(() => {
    const stops = prizes.map((_, index) => {
      const colour = WHEEL_COLOURS[index % WHEEL_COLOURS.length];
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;

      return `${colour} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [prizes, segmentAngle]);

  return (
    <div className="reward-wheel-stage">
      <div className="reward-wheel-pointer">
        <div className="reward-wheel-pointer__triangle" />
        <div className="reward-wheel-pointer__glow" />
      </div>

      <div
        className={`reward-wheel ${
          spinning ? "reward-wheel--spinning" : ""
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          background,
        }}
      >
        <div className="reward-wheel__outer-ring" />

        {prizes.map((value, index) => {
          const angle =
            index * segmentAngle +
            segmentAngle / 2;

          return (
            <div
              key={`${value}-${index}`}
              className="reward-wheel__label"
              style={{
                transform: `rotate(${angle}deg)`,
              }}
            >
              <span
                style={{
                  transform: `translateY(-118px) rotate(${-angle}deg)`,
                }}
              >
                {value.toLocaleString()}
              </span>
            </div>
          );
        })}

        <div className="reward-wheel__hub">
          <div className="reward-wheel__hub-star">
            ★
          </div>
        </div>
      </div>

      <div className="reward-wheel-shadow" />
    </div>
  );
}

function Celebration({
  amount,
}: {
  amount: number;
}) {
  return (
    <div className="reward-celebration">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className="reward-confetti"
          style={{
            left: `${8 + ((index * 17) % 84)}%`,
            animationDelay: `${(index % 6) * 70}ms`,
            background:
              WHEEL_COLOURS[
                index % WHEEL_COLOURS.length
              ],
          }}
        />
      ))}

      <div className="reward-celebration__icon">
        ★
      </div>

      <div className="reward-celebration__eyebrow">
        REWARD UNLOCKED
      </div>

      <div className="reward-celebration__amount">
        +{amount.toLocaleString()}
      </div>

      <div className="reward-celebration__xp">
        XP
      </div>

      <div className="reward-celebration__message">
        Nice one! Your reward has been added to
        your XP total.
      </div>
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
  const [spinning, setSpinning] = useState(false);
  const [winningPrize, setWinningPrize] =
    useState<number | null>(null);
  const [result, setResult] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  async function spin() {
    if (spinning || finished) {
      return;
    }

    try {
      setError("");
      setResult(null);
      setWinningPrize(null);
      setSpinning(true);

      const response =
        await playRewardGame(game.play_id);

      const awardedXp =
        response.data.awarded_xp;

      setWinningPrize(awardedXp);
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

  function handleWheelFinished() {
    if (winningPrize === null) {
      return;
    }

    setSpinning(false);
    setResult(winningPrize);
    setFinished(true);

    onComplete();
  }

  return (
    <article className="reward-game-card reward-game-card--wheel overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-950 via-slate-950 to-slate-900 p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
            Loot wheel
          </div>

          <h3 className="mt-1 text-2xl font-black text-white">
            {game.name}
          </h3>

          {game.description && (
            <p className="mt-2 text-sm text-slate-300">
              {game.description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-400/10 text-2xl">
          🎡
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-2xl">
        <RewardWheel
          prizes={game.prize_values}
          winningPrize={winningPrize}
          spinning={spinning}
          onSpinRequest={spin}
          onFinished={handleWheelFinished}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {finished && result !== null && (
        <div
          className="reward-xp-modal"
          role="dialog"
          aria-modal="true"
          aria-label="XP reward"
        >
          <div className="reward-xp-modal__backdrop" />

          <div className="reward-xp-modal__content">
            <div className="reward-xp-modal__spark">
              ★
            </div>

            <div className="reward-xp-modal__eyebrow">
              REWARD UNLOCKED
            </div>

            <div className="reward-xp-modal__amount">
              +{result.toLocaleString()}
            </div>

            <div className="reward-xp-modal__xp">
              XP
            </div>

            <p>
              Nice one! Your reward has been
              added to your XP total.
            </p>

            <button
              type="button"
              onClick={() => {
                setResult(null);
              }}
            >
              AWESOME!
            </button>
          </div>
        </div>
      )}

      {!finished && !error && (
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-violet-300/70">
          One spin available
        </p>
      )}
    </article>
  );
}

function ScratchCard({
  game,
  onComplete,
}: {
  game: PlayerRewardGame;
  onComplete: () => void;
}) {
  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  async function reveal() {
    if (loading || result !== null) {
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
    <article className="reward-game-card reward-game-card--scratch">
      <div className="reward-game-header">
        <div>
          <div className="reward-game-kicker">
            SPECIAL DROP
          </div>

          <h3 className="reward-game-title">
            {game.name}
          </h3>

          {game.description && (
            <p className="reward-game-description">
              {game.description}
            </p>
          )}
        </div>

        <div className="reward-game-badge">
          SCRATCH
        </div>
      </div>

      {result === null ? (
        <>
          <button
            type="button"
            className="scratch-surface"
            disabled={loading}
            onClick={reveal}
          >
            <span className="scratch-surface__shine" />
            <span className="scratch-surface__coin">
              ★
            </span>

            <strong>
              {loading
                ? "REVEALING..."
                : "TAP TO REVEAL"}
            </strong>

            <small>
              Your reward is waiting
            </small>
          </button>

          {error && (
            <div className="reward-game-error">
              {error}
            </div>
          )}
        </>
      ) : (
        <Celebration amount={result} />
      )}
    </article>
  );
}

export default function RewardGames({
  onXpAwarded,
}: RewardGamesProps) {
  const [available, setAvailable] =
    useState<PlayerRewardGame[]>([]);

  const [upcoming, setUpcoming] =
    useState<PlayerRewardGame[]>([]);

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
    <section className="reward-games">
      <div className="reward-games__heading">
        <div>
          <div className="reward-games__eyebrow">
            REWARDS
          </div>

          <h2>
            Your reward drops
          </h2>

          <p>
            You've earned a chance to unlock
            something special.
          </p>
        </div>

        <div className="reward-games__spark">
          ✦
        </div>
      </div>

      {error && (
        <div
          className="reward-games__error"
          role="alert"
        >
          {error}
        </div>
      )}

      {available.length > 0 && (
        <div className="reward-games__available">
          {available.map((game) =>
            game.game_type === "scratch" ? (
              <ScratchCard
                key={game.play_id}
                game={game}
                onComplete={refresh}
              />
            ) : (
              <SpinWheel
                key={game.play_id}
                game={game}
                onComplete={refresh}
              />
            ),
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="reward-upcoming">
          <div className="reward-upcoming__heading">
            <span className="reward-upcoming__lock">
              ◈
            </span>

            <div>
              <strong>
                More rewards coming
              </strong>

              <span>
                Keep going — these drops unlock
                soon.
              </span>
            </div>
          </div>

          <div className="reward-upcoming__grid">
            {upcoming.map((game) => (
              <div
                key={game.play_id}
                className="reward-upcoming__card"
              >
                <div>
                  <strong>
                    {game.name}
                  </strong>

                  <span>
                    {game.game_type ===
                    "scratch"
                      ? "Scratch"
                      : "Wheel"}
                  </span>
                </div>

                {game.starts_at && (
                  <small>
                    Opens{" "}
                    {formatDate(
                      game.starts_at,
                    )}
                  </small>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
