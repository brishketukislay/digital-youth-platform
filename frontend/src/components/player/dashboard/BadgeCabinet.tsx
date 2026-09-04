import {
  EmptyState,
  SectionHeading,
} from "./DashboardPrimitives";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

export function BadgeCabinet({
  data,
}: DashboardSectionProps) {
  const badges =
    data.badges ?? [];

  return (
    <section className="card">
      <SectionHeading
        eyebrow="ACHIEVEMENTS"
        title="Badge cabinet"
      />

      {badges.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Your cabinet is empty"
          description="Complete your first achievement to start building your collection."
        />
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
                    {
                      badge.description
                    }
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