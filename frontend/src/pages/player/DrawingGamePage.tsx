import {
  useEffect,
  useState,
} from "react";

import {
  getPlayerDrawingGames,
  type DrawingAssignment,
} from "../../api/client";

import DrawingGame from "../../components/player/DrawingGame";

export default function DrawingGamePage() {
  const [games, setGames] =
    useState<DrawingAssignment[]>([]);

  const [selected, setSelected] =
    useState<DrawingAssignment | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    getPlayerDrawingGames()
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading games...</p>;
  }

  if (selected) {
    return (
      <main style={{ padding: 24 }}>
        <button
          type="button"
          className="button"
          onClick={() => {
            setSelected(null);
            window.location.reload();
          }}
        >
          ← Back to games
        </button>

        <div style={{ marginTop: 24 }}>
          <DrawingGame
            assignment={selected}
          />
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Your games</h1>

      {games.length === 0 ? (
        <p>
          You have no drawing games assigned.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            marginTop: 24,
          }}
        >
          {games.map((game) => (
            <button
              key={game.assignment_id}
              type="button"
              onClick={() =>
                setSelected(game)
              }
              style={{
                textAlign: "left",
                padding: 24,
                borderRadius: 16,
                border:
                  "1px solid #E2E8F0",
                background: "white",
                cursor: "pointer",
              }}
            >
              <strong>{game.name}</strong>
              <p>
                Draw a{" "}
                {game.shape}.
              </p>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
