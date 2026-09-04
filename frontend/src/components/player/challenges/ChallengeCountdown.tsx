import { useEffect, useState } from "react";

import {
  formatCountdown,
  getRemainingSeconds,
} from "./challengeRuntimeUtils";

import type { PlayerChallenge } from "./challengeRuntimeTypes";

type ChallengeCountdownProps = {
  challenge: PlayerChallenge;
  onExpired?: () => void;
};

export function ChallengeCountdown({
  challenge,
  onExpired,
}: ChallengeCountdownProps) {
  const [now, setNow] = useState(
    () => Date.now(),
  );

  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      1000,
    );

    return () =>
      window.clearInterval(interval);
  }, []);

  const remaining =
    getRemainingSeconds(
      challenge,
      now,
    );

  useEffect(() => {
    if (remaining === 0) {
      onExpired?.();
    }
  }, [remaining, onExpired]);

  const urgent = remaining <= 60;

  return (
    <div
      className={[
        "rounded-2xl border p-5 text-center",
        urgent
          ? "border-red-400/30 bg-red-400/5"
          : "border-cyan-400/20 bg-cyan-400/5",
      ].join(" ")}
    >
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Time remaining
      </div>

      <div
        className={[
          "mt-2 font-mono text-4xl font-black tracking-tight",
          urgent
            ? "text-red-300"
            : "text-cyan-300",
        ].join(" ")}
        aria-live="polite"
      >
        {formatCountdown(remaining)}
      </div>

      {urgent && remaining > 0 && (
        <div className="mt-2 text-xs font-semibold text-red-300">
          Final minute
        </div>
      )}
    </div>
  );
}