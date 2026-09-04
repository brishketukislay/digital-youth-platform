import {
  EmptyState,
  SectionHeading,
} from "./DashboardPrimitives";

import {
  getCurrentPhaseColour,
} from "./dashboardUtils";

import type {
  DashboardSectionProps,
} from "./dashboardTypes";

export function CurrentPhase({
  data,
}: DashboardSectionProps) {
  const phase = data.phase;

  if (!phase) {
    return (
      <section className="card">
        <SectionHeading
          eyebrow="PROGRAMME"
          title="Current phase"
        />

        <EmptyState
          icon="🗺️"
          title="No active phase"
          description="Your youth worker will let you know when the next phase is ready."
        />
      </section>
    );
  }

  const colour =
    getCurrentPhaseColour(data);

  return (
    <section className="card">
      <SectionHeading
        eyebrow="CURRENT PHASE"
        title={phase.name}
        action={
          <span
            className="phase-pill"
            style={{
              background:
                colour,
            }}
          >
            ACTIVE
          </span>
        }
      />

      <div
        className="phase-display"
        style={{
          borderColor:
            colour,
        }}
      >
        <div
          className="phase-icon"
          style={{
            background:
              colour,
          }}
          aria-hidden="true"
        >
          {phase.icon || "⭐"}
        </div>

        <div>
          <h3>
            {phase.name}
          </h3>

          <p className="muted">
            {phase.description ||
              "Your current programme phase."}
          </p>
        </div>
      </div>
    </section>
  );
}