import type { PlayerDashboard } from "../../../api/client";

type Props = {
  data: PlayerDashboard;
};

const AVATARS: Record<string, string> = {
  "avatar-1": "🦊",
  "avatar-2": "🐼",
  "avatar-3": "🐸",
  "avatar-4": "🐯",
  "avatar-5": "🐺",
  "avatar-6": "🤖",
  "avatar-7": "👾",
  "avatar-8": "🐙",
  "avatar-9": "🦉",
  "avatar-10": "🐻",
  "avatar-11": "🐨",
  "avatar-12": "🦁",
};

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

function getAvatar(value: string) {
  return AVATARS[value] ?? "⭐";
}

export function PlayerHero({
  data,
}: Props) {
  return (
    <section className="hero player-hero">
      <div className="player-identity">
        <div
          className="large-avatar"
          aria-hidden="true"
        >
          {getAvatar(data.player.avatar)}
        </div>

        <div>
          <div className="hero-eyebrow">
            YOUR PROFILE
          </div>

          <h1>{data.player.gamertag}</h1>

          <p className="hero-subtitle">
            Your journey, your goals, your squad.
          </p>
        </div>
      </div>

      <div className="player-xp-block">
        <div className="xp">
          {formatXP(data.player.xp)}
          <span> XP</span>
        </div>

        <div className="hero-muted">
          Lifetime XP
        </div>
      </div>
    </section>
  );
}