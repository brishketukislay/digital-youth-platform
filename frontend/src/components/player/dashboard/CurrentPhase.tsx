import type { PlayerDashboard } from "../../api/client";

type Props = {
  data: PlayerDashboard;
};

export function CurrentPhase({
  data,
}: Props) {
  const phase = data.phase;

  if (!phase) {
    return (
      <section className="card">
        <div className="card-title-row">
          <div>
            <div className="eyebrow">
              PROGRAMME
            </div>

            <h2>Current phase</h2>
          </div>
        </div>

        <div className="empty-state">
          <span
            className="empty-state__icon"
            aria-hidden="true"
          >
            🗺️
          </span>

          <strong>
            No active phase
          </strong>

          <p>
            Your youth worker will let you
            know when the next phase is ready.
          </p>
        </div>
      </section>
    );
  }

  const colour =
    phase.colour ||
    data.theme?.primary ||
    "#22c55e";

  return (
    <section className="card">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">
            CURRENT PHASE
          </div>

          <h2>{phase.name}</h2>
        </div>

        <span
          className="phase-pill"
          style={{
            background: colour,
          }}
        >
          ACTIVE
        </span>
      </div>

      <div
        className="phase-display"
        style={{
          borderColor: colour,
        }}
      >
        <div
          className="phase-icon"
          style={{
            background: colour,
          }}
          aria-hidden="true"
        >
          {phase.icon || "⭐"}
        </div>

        <div>
          <h3>{phase.name}</h3>

          <p className="muted">
            {phase.description ||
              "Your current programme phase."}
          </p>
        </div>
      </div>
    </section>
  );
}