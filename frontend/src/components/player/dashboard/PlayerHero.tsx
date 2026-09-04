import {
  SectionHeading,
} from "./DashboardPrimitives";

import {
  formatXP,
  getAvatar,
} from "./dashboardUtils";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

export function PlayerHero({
  data,
}: DashboardSectionProps) {
  return (
    <section className="hero player-hero">
      <div className="player-identity">
        <div
          className="large-avatar"
          aria-hidden="true"
        >
          {getAvatar(
            data.player.avatar,
          )}
        </div>

        <div>
          <div className="hero-eyebrow">
            YOUR PROFILE
          </div>

          <h1>
            {data.player.gamertag}
          </h1>

          <p className="hero-subtitle">
            Your journey, your goals,
            your squad.
          </p>
        </div>
      </div>

      <div className="player-xp-block">
        <div className="xp">
          {formatXP(
            data.player.xp,
          )}
          <span> XP</span>
        </div>

        <div className="hero-muted">
          Lifetime XP
        </div>
      </div>
    </section>
  );
}