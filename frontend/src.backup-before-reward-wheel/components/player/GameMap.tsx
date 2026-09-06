import type { PlayerDashboard } from "../../api/client";

type Props = {
  data: PlayerDashboard;
};

export function GameMap({ data }: Props) {
  const map = data.map;

  if (!map) {
    return null;
  }

  const colour =
    data.phase?.colour ||
    data.theme?.primary ||
    "#22c55e";

  return (
    <section className="card section-gap">
      <div className="card-title-row">
        <div>
          <div className="eyebrow">YOUR WORLD</div>
          <h2>{map.name}</h2>
        </div>

        <span className="map-status">● LIVE</span>
      </div>

      <div
        className="game-map"
        style={{
          backgroundImage: map.background_image
            ? `url("${map.background_image}")`
            : undefined,
        }}
      >
        {!map.background_image && (
          <div className="map-placeholder">
            <span aria-hidden="true">🗺️</span>

            <strong>{map.name}</strong>

            <small>Your squad's current map</small>
          </div>
        )}

        {(map.locations ?? []).map((location) => (
          <div
            key={location.id}
            className="map-pin enhanced-map-pin"
            title={location.name}
            style={{
              left: `${location.x * 100}%`,
              top: `${location.y * 100}%`,
            }}
          >
            <span
              className="map-pin__marker"
              style={{
                borderColor: colour,
                background: colour,
              }}
              aria-hidden="true"
            >
              {location.icon &&
              location.icon.length <= 4
                ? location.icon
                : "📍"}
            </span>

            <small>{location.name}</small>
          </div>
        ))}
      </div>
    </section>
  );
}