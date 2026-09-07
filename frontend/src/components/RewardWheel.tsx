import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import WheelComponent from "react-wheel-of-prizes";

type RewardWheelProps = {
  prizes: number[];
  winningPrize: number | null;
  spinning: boolean;
  onSpinRequest?: () => void | Promise<void>;
  onFinished?: () => void;
};

const COLORS = [
  "#7C3AED",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#14B8A6",
  "#8B5CF6",
];

export default function RewardWheel({
  prizes,
  winningPrize,
  spinning,
  onSpinRequest,
  onFinished,
}: RewardWheelProps) {
  const [wheelKey, setWheelKey] = useState(0);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const segments = useMemo(
    () =>
      prizes.map(
        (value) => `${value.toLocaleString()} XP`,
      ),
    [prizes],
  );

  const winningSegment = useMemo(() => {
    if (winningPrize === null) {
      return segments[0] ?? "";
    }

    const index = prizes.findIndex(
      (value) => value === winningPrize,
    );

    return (
      segments[index >= 0 ? index : 0] ??
      segments[0] ??
      ""
    );
  }, [prizes, segments, winningPrize]);

  /*
   * Reset the auto-start guard whenever a new spin begins.
   */
  useEffect(() => {
    if (!spinning) {
      hasStartedRef.current = false;
    }
  }, [spinning]);

  /*
   * Once the backend has returned the winning XP, create a fresh
   * wheel and then click its canvas programmatically.
   *
   * react-wheel-of-prizes starts its animation from a canvas click.
   */
  useEffect(() => {
    if (
      !spinning ||
      winningPrize === null ||
      !winningSegment ||
      hasStartedRef.current
    ) {
      return;
    }

    hasStartedRef.current = true;
    setWheelKey((value) => value + 1);
  }, [spinning, winningPrize, winningSegment]);

  /*
   * The new WheelComponent needs to mount before its canvas can
   * receive the synthetic click.
   */
  useEffect(() => {
    if (
      !spinning ||
      winningPrize === null ||
      !hasStartedRef.current
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const canvas =
        wheelContainerRef.current?.querySelector(
          "canvas",
        ) as HTMLCanvasElement | null;

      if (canvas) {
        canvas.click();
      }
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [wheelKey, spinning, winningPrize]);

  if (!prizes.length) {
    return (
      <div className="reward-wheel-container reward-wheel-container--empty">
        <p>No prizes configured.</p>
      </div>
    );
  }

  return (
    <div className="reward-wheel-container">
      <div className="reward-wheel-container__pointer">
        <span>▼</span>
      </div>

      <div
        ref={wheelContainerRef}
        className="reward-wheel-container__wheel"
        onClick={() => {
          if (
            !spinning &&
            winningPrize === null
          ) {
            void onSpinRequest?.();
          }
        }}
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" ||
              event.key === " ") &&
            !spinning &&
            winningPrize === null
          ) {
            event.preventDefault();
            void onSpinRequest?.();
          }
        }}
        role="button"
        tabIndex={
          spinning || winningPrize !== null
            ? -1
            : 0
        }
        aria-label="Spin the reward wheel"
      >
        <WheelComponent
          key={wheelKey}
          segments={segments}
          segColors={COLORS}
          winningSegment={winningSegment}
          onFinished={() => {
            onFinished?.();
          }}
          primaryColor="#111827"
          contrastColor="#FFFFFF"
          buttonText="SPIN"
          isOnlyOnce={true}
          upDuration={150}
          downDuration={4000}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="18px"
          size={300}
          outlineWidth={10}
        />
      </div>

      <div className="reward-wheel-container__hint">
        {spinning ? (
          <>
            <span className="reward-wheel-container__hint-icon">
              ✦
            </span>
            The wheel is spinning...
          </>
        ) : winningPrize !== null ? (
          <>
            <span className="reward-wheel-container__hint-icon">
              🎉
            </span>
            You won XP!
          </>
        ) : (
          <>
            <span className="reward-wheel-container__hint-icon">
              ✨
            </span>
            Click the wheel to spin!
          </>
        )}
      </div>
    </div>
  );
}
