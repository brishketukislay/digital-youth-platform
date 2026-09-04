import type { DashboardSectionProps } from "./dashboardTypes";
import {
  DashboardCard,
  PlayerAvatar,
  ProgressBar,
  XPBadge,
} from "./DashboardPrimitives";
import {
  calculatePercentage,
  formatXP,
  getAvatar,
} from "./dashboardUtils";

export function PlayerHero({
  data,
}: DashboardSectionProps) {
  const player = data.player;

  if (!player) {
    return null;
  }

  const lifetimeXP =
    typeof player.lifetime_xp === "number"
      ? player.lifetime_xp
      : typeof player.xp === "number"
        ? player.xp
        : 0;

  const currentXP =
    typeof player.xp === "number"
      ? player.xp
      : 0;

  const level =
    typeof player.level === "number"
      ? player.level
      : 1;

  const nextLevelXP =
    typeof player.next_level_xp ===
      "number"
      ? player.next_level_xp
      : null;

  const levelProgress =
    nextLevelXP !== null
      ? calculatePercentage(
          currentXP,
          nextLevelXP,
        )
      : 0;

  const gamertag =
    player.gamertag ||
    player.username ||
    "Player";

  const avatar =
    getAvatar(player.avatar);

  const frame =
    player.profile_frame ||
    player.frame ||
    null;

  return (
    <DashboardCard
      className="player-hero"
      variant="dark"
    >
      <div className="player-hero__layout">
        <div className="player-hero__identity">
          <PlayerAvatar
            avatar={avatar}
            gamertag={gamertag}
            frame={frame}
            size="xlarge"
          />

          <div className="player-hero__identity-content">
            <span className="player-hero__eyebrow">
              YOUR JOURNEY
            </span>

            <h1 className="player-hero__gamertag">
              {gamertag}
            </h1>

            <div className="player-hero__level">
              <span>
                Level
              </span>

              <strong>
                {level}
              </strong>
            </div>
          </div>
        </div>

        <div className="player-hero__stats">
          <XPBadge
            xp={currentXP}
            size="large"
          />

          <div className="player-hero__lifetime">
            <span className="player-hero__stat-label">
              Lifetime XP
            </span>

            <strong>
              {formatXP(lifetimeXP)}
            </strong>
          </div>
        </div>
      </div>

      {nextLevelXP !== null && (
        <div className="player-hero__progress">
          <ProgressBar
            label={`Level ${level + 1}`}
            valueLabel={`${formatXP(
              nextLevelXP -
                currentXP >
                0
                ? nextLevelXP -
                    currentXP
                : 0,
            )} XP to go`}
            value={levelProgress}
            showPercentage
            colour="var(--player-accent, #facc15)"
            height="medium"
          />
        </div>
      )}
    </DashboardCard>
  );
}