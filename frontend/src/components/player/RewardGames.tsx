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
      const colour =
        WHEEL_COLOURS[index % WHEEL_COLOURS.length];

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

      const response = await playRewardGame(
        game.play_id,
      );

      setWinningPrize(
        response.data.awarded_xp,
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
              Nice one! Your reward has been added to
              your XP total.
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
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const cardRef =
    useRef<HTMLDivElement | null>(null);

  const [winningPrize, setWinningPrize] =
    useState<number | null>(null);

  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [isScratching, setIsScratching] =
    useState(false);

  const drawingRef = useRef(false);
  const apiRequestRef = useRef(false);
  const rewardReceivedRef = useRef(false);
  const revealTriggeredRef = useRef(false);

  const lastPointRef =
    useRef<{ x: number; y: number } | null>(null);

  const scratchCountRef = useRef(0);

  /*
   * Draw the silver scratch layer.
   *
   * The canvas is deliberately painted BEFORE the reward
   * request completes. This means the user can interact
   * immediately and the component behaves like a real
   * scratch card.
   */
  function drawScratchSurface() {
    const canvas = canvasRef.current;
    const card = cardRef.current;

    if (!canvas || !card) {
      return;
    }

    const rect = card.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return;
    }

    const dpr = Math.min(
      Math.max(
        window.devicePixelRatio || 1,
        1,
      ),
      2,
    );

    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    canvas.width = Math.round(
      width * dpr,
    );

    canvas.height = Math.round(
      height * dpr,
    );

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0,
    );

    /*
     * Main silver metallic gradient.
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
      0.18,
      "#cbd5e1",
    );

    gradient.addColorStop(
      0.38,
      "#94a3b8",
    );

    gradient.addColorStop(
      0.52,
      "#f8fafc",
    );

    gradient.addColorStop(
      0.68,
      "#94a3b8",
    );

    gradient.addColorStop(
      0.86,
      "#cbd5e1",
    );

    gradient.addColorStop(
      1,
      "#475569",
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
     * Metallic diagonal texture.
     */
    ctx.save();

    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;

    for (
      let x = -height;
      x < width + height;
      x += 24
    ) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(
        x + height,
        height,
      );
      ctx.stroke();
    }

    ctx.restore();

    /*
     * Dark edge shading.
     */
    const shade =
      ctx.createLinearGradient(
        0,
        0,
        0,
        height,
      );

    shade.addColorStop(
      0,
      "rgba(15, 23, 42, 0.18)",
    );

    shade.addColorStop(
      0.5,
      "rgba(15, 23, 42, 0)",
    );

    shade.addColorStop(
      1,
      "rgba(15, 23, 42, 0.2)",
    );

    ctx.fillStyle = shade;

    ctx.fillRect(
      0,
      0,
      width,
      height,
    );

    /*
     * Instruction text.
     */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle =
      "rgba(15, 23, 42, 0.72)";

    ctx.font =
      "900 21px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

    ctx.fillText(
      "SCRATCH TO REVEAL",
      width / 2,
      height / 2 - 14,
    );

    ctx.fillStyle =
      "rgba(15, 23, 42, 0.48)";

    ctx.font =
      "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

    ctx.fillText(
      "Your XP reward is underneath",
      width / 2,
      height / 2 + 18,
    );
  }

  /*
   * The scratch layer is painted once when the component
   * appears.
   */
  useEffect(() => {
    drawScratchSurface();
  }, []);

  /*
   * Handle browser resizing without restoring the scratch
   * surface after the user has started interacting.
   */
  useEffect(() => {
    function handleResize() {
      if (
        drawingRef.current ||
        scratchCountRef.current > 0
      ) {
        return;
      }

      drawScratchSurface();
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  /*
   * Start the backend game exactly once.
   */
  async function startGame() {
    if (
      apiRequestRef.current ||
      rewardReceivedRef.current ||
      finished
    ) {
      return;
    }

    apiRequestRef.current = true;
    setLoading(true);
    setError("");

    try {
      const response =
        await playRewardGame(
          game.play_id,
        );

      setWinningPrize(
        response.data.awarded_xp,
      );

      rewardReceivedRef.current = true;
      setStarted(true);
    } catch (err) {
      apiRequestRef.current = false;

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

  function getPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect =
      canvas.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return null;
    }

    return {
      x:
        event.clientX -
        rect.left,
      y:
        event.clientY -
        rect.top,
    };
  }

  /*
   * Calculate how much of the silver surface has been
   * removed.
   *
   * We sample every 8th pixel for performance.
   */
  function getScratchPercentage() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return 0;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return 0;
    }

    const width = canvas.width;
    const height = canvas.height;

    const image =
      ctx.getImageData(
        0,
        0,
        width,
        height,
      );

    const step = 8;

    let total = 0;
    let transparent = 0;

    for (
      let y = 0;
      y < height;
      y += step
    ) {
      for (
        let x = 0;
        x < width;
        x += step
      ) {
        const alpha =
          image.data[
            (y * width + x) * 4 + 3
          ];

        total += 1;

        if (alpha < 100) {
          transparent += 1;
        }
      }
    }

    if (total === 0) {
      return 0;
    }

    return transparent / total;
  }

  function reveal() {
    if (
      revealTriggeredRef.current ||
      winningPrize === null
    ) {
      return;
    }

    revealTriggeredRef.current = true;

    drawingRef.current = false;

    setIsScratching(false);
    setFinished(true);
  }

  function performScratch(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (
      finished ||
      !started ||
      winningPrize === null ||
      revealTriggeredRef.current
    ) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const point = getPoint(event);

    if (!point) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width / rect.width;

    const scaleY =
      canvas.height / rect.height;

    const x = point.x * scaleX;
    const y = point.y * scaleY;

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /*
     * Large brush makes the interaction feel good on both
     * touch screens and mouse/trackpads.
     */
    ctx.lineWidth =
      50 *
      Math.min(
        scaleX,
        scaleY,
      );

    const previous =
      lastPointRef.current;

    ctx.beginPath();

    if (previous) {
      ctx.moveTo(
        previous.x,
        previous.y,
      );

      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);

      ctx.lineTo(
        x + 0.01,
        y + 0.01,
      );
    }

    ctx.stroke();

    lastPointRef.current = {
      x,
      y,
    };

    scratchCountRef.current += 1;

    /*
     * Don't scan the entire canvas for every pointer
     * movement.
     */
    if (
      scratchCountRef.current % 12 !== 0
    ) {
      return;
    }

    /*
     * Only reveal once the backend has supplied the
     * actual reward.
     */
    if (!rewardReceivedRef.current) {
      return;
    }

    const percentage =
      getScratchPercentage();

    /*
     * 42% gives a satisfying amount of scratching while
     * avoiding the need to scrub the entire card.
     */
    if (percentage >= 0.42) {
      reveal();
    }
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (finished) {
      return;
    }

    event.preventDefault();

    drawingRef.current = true;
    lastPointRef.current = null;

    setIsScratching(true);

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    /*
     * The first scratch starts the backend request.
     *
     * If the reward is already available, the scratch is
     * applied immediately.
     */
    if (!started) {
      void startGame();
      return;
    }

    performScratch(event);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    if (
      !drawingRef.current ||
      finished
    ) {
      return;
    }

    event.preventDefault();

    /*
     * If the first API request is still running, we wait.
     * The scratch surface remains visually intact until
     * the reward is known.
     */
    if (!started) {
      return;
    }

    performScratch(event);
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    drawingRef.current = false;
    lastPointRef.current = null;

    setIsScratching(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function handlePointerCancel(
    event: React.PointerEvent<HTMLCanvasElement>,
  ) {
    drawingRef.current = false;
    lastPointRef.current = null;

    setIsScratching(false);

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function closeCard() {
    onComplete();
  }

  return (
    <article className="reward-game-card reward-game-card--scratch overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-900 p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
            Scratch &amp; Win
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
        <div
          ref={cardRef}
          className={`relative mx-auto h-[330px] w-[320px] max-w-full overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 ${
            isScratching
              ? "scale-[1.01]"
              : "scale-100"
          } transition-transform duration-150`}
        >
          {/* Reward underneath the silver layer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-white/70">
              Your reward
            </div>

            <div className="mt-3 text-6xl font-black leading-none">
              {winningPrize !== null
                ? `+${winningPrize.toLocaleString()}`
                : "+???"
              }
            </div>

            <div className="mt-2 text-2xl font-black">
              XP
            </div>

            <div className="mt-5 text-sm font-medium text-white/70">
              {winningPrize !== null
                ? "Keep scratching..."
                : "Scratch to reveal"
              }
            </div>
          </div>

          {/* Actual scratch surface */}
          {!finished && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 h-full w-full touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerCancel
              }
            />
          )}

          {/* Backend loading indicator */}
          {loading && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/25 backdrop-blur-[1px]">
              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-xl">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

                <div className="mt-3 text-xs font-black uppercase tracking-wide text-violet-700">
                  Preparing reward...
                </div>
              </div>
            </div>
          )}

          {/* Final reward presentation */}
          {finished &&
            winningPrize !== null && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 p-6 text-center text-white">
                <div className="animate-bounce text-5xl">
                  🎉
                </div>

                <div className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-white/70">
                  Reward revealed
                </div>

                <div className="mt-3 text-7xl font-black leading-none">
                  +{winningPrize.toLocaleString()}
                </div>

                <div className="mt-2 text-2xl font-black">
                  XP
                </div>

                <p className="mt-4 text-sm font-medium text-white/80">
                  Your reward has been added to
                  your account.
                </p>

                <button
                  type="button"
                  onClick={closeCard}
                  className="mt-6 rounded-xl bg-white px-7 py-3 text-sm font-black uppercase tracking-wide text-violet-700 shadow-lg transition hover:scale-105 hover:bg-slate-50"
                >
                  CLOSE
                </button>
              </div>
            )}
        </div>

        {!loading && !finished && (
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-amber-300/70">
            {isScratching
              ? "Keep scratching..."
              : "Touch and drag across the card to scratch"}
          </p>
        )}

        {loading && !finished && (
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-amber-300/70">
            Preparing your reward...
          </p>
        )}

        {finished && (
          <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-emerald-500">
            Reward revealed — close when you're ready
          </p>
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

      console.log(
        "Reward games response:",
        response.data,
      );

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

  /*
   * Do not render anything while the initial request
   * is loading.
   */
  if (loading) {
    return null;
  }

  if (
    available.length === 0 &&
    upcoming.length === 0 &&
    !error
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

          <h2>Your reward drops</h2>

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
                    {game.game_type === "scratch"
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
