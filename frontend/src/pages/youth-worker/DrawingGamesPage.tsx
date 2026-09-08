import {
  useEffect,
  useState,
} from "react";

import {
  assignDrawingGame,
  createDrawingGame,
  getDrawingGames,
  type DrawingGame,
  type DrawingXPBracket,
} from "../../api/client";

const DEFAULT_BRACKETS:
  DrawingXPBracket[] = [
    { min: 0, max: 49, xp: 10 },
    { min: 50, max: 69, xp: 25 },
    { min: 70, max: 84, xp: 50 },
    { min: 85, max: 94, xp: 75 },
    { min: 95, max: 100, xp: 100 },
  ];

export default function DrawingGamesPage() {
  const [games, setGames] =
    useState<DrawingGame[]>([]);

  const [name, setName] =
    useState("Shape Challenge");

  const [description, setDescription] =
    useState(
      "Trace the shape as accurately as you can.",
    );

  const [shape, setShape] =
    useState<
      DrawingGame["shape"]
    >("circle");

  const [brackets, setBrackets] =
    useState(DEFAULT_BRACKETS);

  const [assignGameId, setAssignGameId] =
    useState<number | null>(null);

  const [playerIds, setPlayerIds] =
    useState("");

  const [groupId, setGroupId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const loadGames = async () => {
    const response =
      await getDrawingGames();

    setGames(response);
  };

  useEffect(() => {
    void loadGames();
  }, []);

  const updateBracket = (
    index: number,
    field:
      | "min"
      | "max"
      | "xp",
    value: number,
  ) => {
    setBrackets((previous) =>
      previous.map(
        (bracket, bracketIndex) =>
          bracketIndex === index
            ? {
                ...bracket,
                [field]: value,
              }
            : bracket,
      ),
    );
  };

  const create = async () => {
    setMessage("");

    try {
      await createDrawingGame({
        name,
        description,
        shape,
        xp_brackets: brackets,
      });

      setMessage(
        "Game created successfully.",
      );

      await loadGames();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create game.",
      );
    }
  };

  const assign = async () => {
    if (!assignGameId) return;

    try {
      if (groupId.trim()) {
        const response =
          await assignDrawingGame(
            assignGameId,
            {
              group_id:
                Number(groupId),
            },
          );

        setMessage(
          `${response.assigned_count} young people assigned.`,
        );
      } else {
        const ids =
          playerIds
            .split(",")
            .map((value) =>
              Number(value.trim()),
            )
            .filter(
              (value) =>
                Number.isInteger(value) &&
                value > 0,
            );

        const response =
          await assignDrawingGame(
            assignGameId,
            {
              player_ids: ids,
            },
          );

        setMessage(
          `${response.assigned_count} young people assigned.`,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not assign game.",
      );
    }
  };

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <h1>Drawing games</h1>

      <p>
        Create simple shape-tracing games and
        configure the XP earned at each accuracy
        level.
      </p>

      {message && (
        <div
          style={{
            padding: 12,
            margin: "16px 0",
            background: "#F0FDF4",
            borderRadius: 8,
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          background: "white",
          border:
            "1px solid #E2E8F0",
          borderRadius: 16,
          padding: 24,
          marginTop: 24,
        }}
      >
        <h2>Create game</h2>

        <label>
          Game name
          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />
        </label>

        <br />

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
          />
        </label>

        <br />

        <label>
          Shape{" "}
          <select
            value={shape}
            onChange={(event) =>
              setShape(
                event.target.value as DrawingGame["shape"],
              )
            }
          >
            <option value="circle">
              Circle
            </option>
            <option value="square">
              Square
            </option>
            <option value="triangle">
              Triangle
            </option>
          </select>
        </label>

        <h3>XP by accuracy</h3>

        {brackets.map(
          (bracket, index) => (
            <div
              key={`${bracket.min}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "100px 100px 120px",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <input
                type="number"
                value={bracket.min}
                onChange={(event) =>
                  updateBracket(
                    index,
                    "min",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />

              <input
                type="number"
                value={bracket.max}
                onChange={(event) =>
                  updateBracket(
                    index,
                    "max",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />

              <input
                type="number"
                value={bracket.xp}
                onChange={(event) =>
                  updateBracket(
                    index,
                    "xp",
                    Number(
                      event.target.value,
                    ),
                  )
                }
              />
            </div>
          ),
        )}

        <button
          type="button"
          className="button button--primary"
          onClick={create}
        >
          Create drawing game
        </button>
      </section>

      <section
        style={{
          marginTop: 32,
        }}
      >
        <h2>Games</h2>

        {games.map((game) => (
          <article
            key={game.id}
            style={{
              padding: 20,
              marginBottom: 12,
              background: "white",
              border:
                "1px solid #E2E8F0",
              borderRadius: 12,
            }}
          >
            <strong>
              {game.name}
            </strong>

            <span>
              {" "}
              · {game.shape}
            </span>

            <p>
              {game.xp_brackets
                .map(
                  (bracket) =>
                    `${bracket.min}-${bracket.max}% = ${bracket.xp} XP`,
                )
                .join(" · ")}
            </p>

            <button
              type="button"
              className="button"
              onClick={() =>
                setAssignGameId(
                  game.id,
                )
              }
            >
              Assign
            </button>
          </article>
        ))}
      </section>

      {assignGameId && (
        <section
          style={{
            padding: 24,
            marginTop: 24,
            background: "#F8FAFC",
            borderRadius: 16,
          }}
        >
          <h2>Assign game</h2>

          <p>
            Enter a group ID or comma-separated
            player IDs.
          </p>

          <input
            placeholder="Group ID"
            value={groupId}
            onChange={(event) =>
              setGroupId(
                event.target.value,
              )
            }
          />

          <p>or</p>

          <input
            placeholder="Player IDs e.g. 1,2,3"
            value={playerIds}
            onChange={(event) =>
              setPlayerIds(
                event.target.value,
              )
            }
          />

          <div
            style={{
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="button button--primary"
              onClick={assign}
            >
              Assign game
            </button>

            <button
              type="button"
              className="button"
              style={{
                marginLeft: 8,
              }}
              onClick={() =>
                setAssignGameId(null)
              }
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
