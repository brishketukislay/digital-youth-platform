import { UserRound } from "lucide-react";
import type { PlayerDashboard } from "../../../api/client";

type Props = {
  data: PlayerDashboard;
};

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

export function PlayerHero({ data }: Props) {
  return (
    <section className="hero player-hero">
      <div className="player-hero__main">
        <div className="player-hero__avatar" aria-hidden="true">
          <UserRound size={30} strokeWidth={1.8} />
        </div>

        <div className="player-hero__identity">
          <div className="hero-eyebrow">
            YOUR JOURNEY
          </div>

          <h1>{data.player.gamertag}</h1>

          <p className="hero-subtitle">
            Keep building your skills, completing challenges
            and progressing with your squad.
          </p>
        </div>
      </div>

      <div className="player-hero__stats">
        <div className="player-hero__stat">
          <span>Lifetime XP</span>
          <strong>{formatXP(data.player.xp)}</strong>
        </div>

        <div className="player-hero__divider" />

        <div className="player-hero__stat">
          <span>Programme</span>
          <strong>
            {data.programme?.name || "Your programme"}
          </strong>
        </div>
      </div>
    </section>
  );
}
