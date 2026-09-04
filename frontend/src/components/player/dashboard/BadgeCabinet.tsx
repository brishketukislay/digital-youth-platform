import type { PlayerDashboard } from "../../api/client";

type Props = {
  data: PlayerDashboard;
};

export function BadgeCabinet({
  data,
}: Props) {
  const badges =
    data.badges ?? [];

  return (
    <section className="card">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            ACHIEVEMENTS
          </div>

          <h2>Badge cabinet</h2>
        </div>
      </div>

      {badges.length === 0 ? (
        <div className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🏆
          </span>

          <strong>
            Your cabinet is empty
          </strong>

          <p>
            Complete your first achievement
            to start building your collection.
          </p>
        </div>
      ) : (
        <div className="badge-grid">
          {badges.map(
            (
              badge,
              index,
            ) => (
              <article
                className="badge"
                key={`${badge.name}-${index}`}
                style={{
                  background:
                    badge.colour ||
                    "var(--primary)",
                }}
              >
                <span
                  className="badge__icon"
                  aria-hidden="true"
                >
                  🏆
                </span>

                <strong>
                  {badge.name}
                </strong>

                {badge.description && (
                  <small>
                    {badge.description}
                  </small>
                )}
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}