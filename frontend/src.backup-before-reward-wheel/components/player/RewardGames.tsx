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
  const [spinning, setSpinning] =
    useState(false);

  const [rotation, setRotation] =
    useState(0);

  const [result, setResult] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  async function spin() {
    if (spinning || result !== null) {
      return;
    }

    try {
      setSpinning(true);
      setError("");

      /*
       * The server chooses the prize.
       *
       * We deliberately wait for the server response before calculating
       * the final wheel position. This means the animation always lands
       * on the reward that was actually granted.
       */
      const response =
        await playRewardGame(game.play_id);

      const winningXp =
        response.data.awarded_xp;

      const index =
        game.prize_values.indexOf(
          winningXp,
        );

      const winningIndex =
        index >= 0 ? index : 0;

      const segmentAngle =
        360 / game.prize_values.length;

      /*
       * The pointer is at the top (0 degrees).
       * Aim the centre of the winning segment at the pointer.
       */
      const target =
        360 -
        (
          winningIndex *
            segmentAngle +
          segmentAngle / 2
        );

      const current =
        rotation % 360;

      const normalisedTarget =
        ((target % 360) + 360) % 360;

      let delta =
        normalisedTarget -
        ((current % 360) + 360) % 360;

      if (delta < 0) {
        delta += 360;
      }

      const finalRotation =
        rotation +
        360 * 7 +
        delta;

      setRotation(finalRotation);

      /*
       * Give the CSS animation enough time to finish before revealing
       * the result.
       */
      window.setTimeout(() => {
        setResult(winningXp);
        setSpinning(false);
        onComplete();
      }, 4800);
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

  return (
    <article className="reward-game-card reward-game-card--wheel">
      <div className="reward-game-card__shine" />

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
          <span>★</span>
          WHEEL
        </div>
      </div>

      <div className="reward-game-divider" />

      {result === null ? (
        <>
          <div className="reward-wheel-copy">
            <strong>
              Spin for XP
            </strong>

            <span>
              One spin. One reward.
            </span>
          </div>

          <Wheel
            prizes={game.prize_values}
            rotation={rotation}
            spinning={spinning}
          />

          <div className="reward-prize-preview">
            {game.prize_values.map(
              (value, index) => (
                <span
                  key={`${value}-${index}`}
                  style={{
                    "--prize-colour":
                      WHEEL_COLOURS[
                        index %
                          WHEEL_COLOURS.length
                      ],
                  } as React.CSSProperties}
                >
                  +{value.toLocaleString()}
                </span>
              ),
            )}
          </div>

          <button
            type="button"
            className="reward-spin-button"
            disabled={spinning}
            onClick={spin}
          >
            <span className="reward-spin-button__icon">
              {spinning ? "↻" : "▶"}
            </span>

            <span>
              {spinning
                ? "THE WHEEL IS SPINNING..."
                : "SPIN THE WHEEL"}
            </span>
          </button>

          <p className="reward-game-footnote">
            Your reward is selected securely when
            you spin.
          </p>
        </>
      ) : (
        <Celebration amount={result} />
      )}

      {error && (
        <div
          className="reward-game-error"
          role="alert"
        >
          {error}
        </div>
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
