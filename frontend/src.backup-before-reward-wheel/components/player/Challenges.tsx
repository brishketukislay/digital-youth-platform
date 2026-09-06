import { Zap } from "lucide-react";
import type { PlayerDashboard } from "../../api/client";

type Props = {
  data: PlayerDashboard;
};

function formatXP(value: number) {
  return Math.max(0, value).toLocaleString("en-GB");
}

export function Challenges({ data }: Props) {
  const challenges = data.challenges ?? [];

  return (
    <section className="card section-gap">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">GAMEPLAY</div>
          <h2>Challenges</h2>
        </div>

        {challenges.length > 0 && (
          <span className="live-dot">LIVE</span>
        )}
      </div>

      {challenges.length === 0 ? (
        <div className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            <Zap size={20} strokeWidth={1.8} />
          </span>

          <strong>No live challenges</strong>

          <p>
            New challenges will appear here when
            your youth work team activates them.
          </p>
        </div>
      ) : (
        <div className="challenge-grid">
          {challenges.map((challenge) => (
            <article
              className="challenge-card"
              key={challenge.id}
            >
              <div
                className="challenge-icon"
                aria-hidden="true"
              >
                <Zap size={19} strokeWidth={1.8} />
              </div>

              <div className="challenge-card__content">
                <h3>{challenge.title}</h3>

                {challenge.description && (
                  <p className="muted">
                    {challenge.description}
                  </p>
                )}
              </div>

              <div className="challenge-rewards">
                <div>
                  <small>Participation</small>
                  <strong>
                    +{formatXP(challenge.participation_xp)}
                  </strong>
                </div>

                <div>
                  <small>Elite</small>
                  <strong>
                    +{formatXP(challenge.elite_xp)}
                  </strong>
                </div>

                <div>
                  <small>Winner</small>
                  <strong>
                    +{formatXP(challenge.winner_xp)}
                  </strong>
                </div>
              </div>

              <div className="challenge-card__footer">
                Complete the challenge to have your
                result verified by the game.
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}