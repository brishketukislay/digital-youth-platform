import { useEffect, useMemo, useRef, useState } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [winningPrize, setWinningPrize] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  const drawingRef = useRef(false);
  const lastPointRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const scratchedRef = useRef(0);
  const revealedRef = useRef(false);

  console.log(
    "[ScratchCard] rendering",
    game.name,
    game.game_type,
    game.play_id,
  );

  async function startScratch() {
    if (loading || started || finished) {
      return;
    }

    try {
      console.log(
        "[ScratchCard] starting play",
        game.play_id,
      );

      setLoading(true);
      setError("");

      const response =
        await playRewardGame(game.play_id);

      console.log(
        "[ScratchCard] play response",
        response.data,
      );

      setWinningPrize(
        response.data.awarded_xp,
      );

      setStarted(true);
    } catch (err) {
      console.error(
        "[ScratchCard] play failed",
        err,
      );

      setError(
        getApiErrorMessage(
          err,
          "The scratch card could not be started.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!started || winningPrize === null) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      console.error(
        "[ScratchCard] canvas not found",
      );
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const dpr =
      Math.max(
        1,
        window.devicePixelRatio || 1,
      );

    canvas.width =
      Math.round(width * dpr);

    canvas.height =
      Math.round(height * dpr);

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      console.error(
        "[ScratchCard] canvas context unavailable",
      );
      return;
    }

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0,
    );

    /*
     * Silver scratch surface.
     */
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        height,
      );

    gradient.addColorStop(
      0,
      "#475569",
    );

    gradient.addColorStop(
      0.5,
      "#cbd5e1",
    );

    gradient.addColorStop(
      1,
      "#64748b",
    );

    ctx.globalCompositeOperation =
      "source-over";

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height,
    );

    /*
     * Scratch card border.
     */
    ctx.strokeStyle =
      "rgba(255,255,255,0.35)";

    ctx.lineWidth = 3;

    ctx.strokeRect(
      2,
      2,
      width - 4,
      height - 4,
    );

    /*
     * Main instruction.
     */
    ctx.fillStyle =
      "rgba(255,255,255,0.95)";

    ctx.font =
      "900 23px system-ui";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      "SCRATCH TO REVEAL",
      width / 2,
      height / 2 - 15,
    );

    ctx.font =
      "700 14px system-ui";

    ctx.fillStyle =
      "rgba(255,255,255,0.75)";

    ctx.fillText(
      "Your XP reward is underneath",
      width / 2,
      height / 2 + 20,
    );

    scratchedRef.current = 0;
    revealedRef.current = false;
    lastPointRef.current = null;

    console.log(
      "[ScratchCard] canvas initialized",
      {
        width,
        height,
        dpr,
      },
    );
  }, [started, winningPrize]);

  function getPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top,
    };
  }

  function reveal() {
    if (
      revealedRef.current ||
      winningPrize === null
    ) {
      return;
    }

    console.log(
      "[ScratchCard] REVEAL",
      winningPrize,
    );

    revealedRef.current = true;

    setFinished(true);

    /*
     * Do NOT immediately reload the games here.
     *
     * The component needs to show the result first.
     */
  }

  function checkScratchProgress() {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    scratchedRef.current += 1;

    /*
     * Don't scan the whole canvas on every
     * pointer event.
     */
    if (
      scratchedRef.current % 15 !== 0
    ) {
      return;
    }

    const image =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

    let transparent = 0;

    for (
      let i = 3;
      i < image.data.length;
      i += 4
    ) {
      if (
        image.data[i] < 80
      ) {
        transparent += 1;
      }
    }

    const total =
      image.data.length / 4;

    const percentage =
      transparent / total;

    console.log(
      "[ScratchCard] scratched",
      Math.round(
        percentage * 100,
      ) + "%",
    );

    if (
      percentage >= 0.35
    ) {
      reveal();
    }
  }

  function scratch(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (
      !started ||
      finished ||
      winningPrize === null ||
      revealedRef.current
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const point =
      getPoint(event);

    if (!point) {
      return;
    }

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 55;

    const previous =
      lastPointRef.current;

    ctx.beginPath();

    if (previous) {
      ctx.moveTo(
        previous.x,
        previous.y,
      );

      ctx.lineTo(
        point.x,
        point.y,
      );
    } else {
      ctx.moveTo(
        point.x,
        point.y,
      );

      ctx.lineTo(
        point.x + 1,
        point.y + 1,
      );
    }

    ctx.stroke();

    lastPointRef.current =
      point;

    checkScratchProgress();
  }

  function finishPointer(
    event?: React.PointerEvent<HTMLCanvasElement>,
  ) {
    drawingRef.current = false;
    lastPointRef.current = null;

    if (
      event &&
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  return (
    <article
      className="reward-game-card reward-game-card--scratch overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-900 p-5 shadow-2xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
            Scratch & Win
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

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 text-2xl">
          🎟️
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-2xl">
        {!started && !finished && (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 p-8 text-center">
            <div className="text-7xl">
              🎟️
            </div>

            <h4 className="mt-5 text-3xl font-black text-white">
              Friday Scratch
            </h4>

            <p className="mt-3 max-w-sm text-sm font-medium text-white/85">
              You have a scratch-card reward waiting.
            </p>

            <div className="mt-4 rounded-full bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
              Scratch & Win
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={startScratch}
              className="mt-7 rounded-xl bg-white px-8 py-4 text-sm font-black uppercase tracking-wide text-violet-700 shadow-xl transition hover:scale-105 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "STARTING..."
                : "START SCRATCHING"}
            </button>
          </div>
        )}

        {started &&
          !finished &&
          winningPrize !== null && (
            <div className="relative mx-auto h-[360px] w-[340px] max-w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 shadow-inner">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/70">
                  YOUR REWARD
                </div>

                <div className="mt-3 text-7xl font-black">
                  +{winningPrize.toLocaleString()}
                </div>

                <div className="mt-1 text-2xl font-bold">
                  XP
                </div>

                <div className="mt-6 text-sm font-bold text-white/70">
                  Keep scratching...
                </div>
              </div>

              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
                onPointerDown={(event) => {
                  drawingRef.current = true;
                  lastPointRef.current = null;

                  event.currentTarget.setPointerCapture(
                    event.pointerId,
                  );

                  scratch(event);
                }}
                onPointerMove={(event) => {
                  if (
                    drawingRef.current
                  ) {
                    scratch(event);
                  }
                }}
                onPointerUp={finishPointer}
                onPointerCancel={() => {
                  drawingRef.current = false;
                  lastPointRef.current = null;
                }}
              />
            </div>
          )}

        {finished &&
          winningPrize !== null && (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-center text-white">
              <div className="text-7xl">
                🎉
              </div>

              <div className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-white/70">
                REWARD UNLOCKED
              </div>

              <div className="mt-3 text-7xl font-black">
                +{winningPrize.toLocaleString()}
              </div>

              <div className="mt-1 text-2xl font-bold">
                XP
              </div>

              <p className="mt-5 text-sm font-medium text-white/80">
                Your reward has been added to your account.
              </p>

              <button
                type="button"
                onClick={onComplete}
                className="mt-7 rounded-xl bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-emerald-700 shadow-xl hover:scale-105"
              >
                AWESOME!
              </button>
            </div>
          )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
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
        console.log("Reward games response:", response.data);
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
