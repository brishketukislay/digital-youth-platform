import { useEffect, useMemo, useState } from "react";
import { Wheel } from "react-custom-roulette";

type RewardWheelProps = {
  prizes: number[];
  winningPrize: number | null;
  spinning: boolean;
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
  onFinished,
}: RewardWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);

  const data = useMemo(
    () =>
      prizes.map((value, index) => ({
        option: `${value.toLocaleString()} XP`,
        style: {
          backgroundColor: COLORS[index % COLORS.length],
          textColor: "#FFFFFF",
        },
      })),
    [prizes],
  );

  const prizeNumber = useMemo(() => {
    if (winningPrize === null) {
      return 0;
    }

    const index = prizes.findIndex((value) => value === winningPrize);

    return index >= 0 ? index : 0;
  }, [prizes, winningPrize]);

  useEffect(() => {
    if (spinning && winningPrize !== null) {
      setMustSpin(true);
    }
  }, [spinning, winningPrize]);

  if (!prizes.length) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <p className="text-slate-500">No prizes configured.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={data}
          backgroundColors={COLORS}
          textColors={["#FFFFFF"]}
          outerBorderColor="#111827"
          outerBorderWidth={8}
          innerBorderColor="#FFFFFF"
          innerBorderWidth={4}
          radiusLineColor="#FFFFFF"
          radiusLineWidth={2}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={18}
          fontWeight="700"
          spinDuration={1.4}
          perpendicularText={false}
          textDistance={58}
          onStopSpinning={() => {
            setMustSpin(false);
            onFinished?.();
          }}
        />
      </div>

      <div className="text-center">
        {mustSpin ? (
          <p className="text-lg font-semibold text-slate-700">
            Spinning...
          </p>
        ) : winningPrize !== null ? (
          <div className="rounded-2xl bg-emerald-50 px-8 py-5 ring-1 ring-emerald-200">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              Award granted
            </p>

            <p className="mt-1 text-4xl font-black text-emerald-900">
              +{winningPrize.toLocaleString()} XP
            </p>
          </div>
        ) : (
          <p className="text-slate-500">
            Spin to win an award
          </p>
        )}
      </div>
    </div>
  );
}
