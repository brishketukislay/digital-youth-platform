import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createAdminRewardGame,
  getAdminRewardGames,
  grantRewardGame,
  getApiErrorMessage,
  adminPlayers,
  type AdminRewardGame,
  type Player,
  type RewardGameCreateRequest,
} from "../../api/client";


const EMPTY: RewardGameCreateRequest = {
  name: "",
  description: "",
  game_type: "scratch",
  prize_values: [
    500,
    1000,
    1500,
    2500,
  ],
  starts_at: null,
  ends_at: null,
  active: true,
  show_upcoming: true,
};


export default function RewardGamesManager() {
  const [games, setGames] =
    useState<AdminRewardGame[]>(
      [],
    );

  const [players, setPlayers] =
    useState<Player[]>(
      [],
    );

  const [form, setForm] =
    useState<RewardGameCreateRequest>(
      EMPTY,
    );

  const [prizes, setPrizes] =
    useState(
      "500, 1000, 1500, 2500",
    );

  const [selectedGame, setSelectedGame] =
    useState<number | null>(
      null,
    );

  const [selectedPlayer, setSelectedPlayer] =
    useState<number | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  async function load() {
    try {
      setLoading(true);
      setError("");

      const [
        gamesResponse,
        playersResponse,
      ] = await Promise.all([
        getAdminRewardGames(),
        adminPlayers(),
      ]);

      setGames(
        gamesResponse.data,
      );

      setPlayers(
        playersResponse.data,
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load reward games.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    void load();
  }, []);


  function parsePrizes() {
    const values = prizes
      .split(",")
      .map((value) =>
        Number(value.trim()),
      )
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 0,
      );

    return [
      ...new Set(values),
    ];
  }


  async function createGame(
    event: FormEvent,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const prizeValues =
        parsePrizes();

      if (!prizeValues.length) {
        throw new Error(
          "Enter at least one XP prize.",
        );
      }

      await createAdminRewardGame({
        ...form,
        prize_values:
          prizeValues,
      });

      setMessage(
        "Reward game created.",
      );

      setForm(EMPTY);

      setPrizes(
        "500, 1000, 1500, 2500",
      );

      await load();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to create reward game.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }


  async function grant() {
    if (
      selectedGame === null ||
      selectedPlayer === null
    ) {
      setError(
        "Choose a game and player.",
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await grantRewardGame(
        selectedGame,
        selectedPlayer,
      );

      setMessage(
        "Reward play granted to player.",
      );

      await load();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to grant reward game.",
        ),
      );
    }
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">
          Reward Games
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Configure scratch cards and loot wheels,
          then grant individual plays to young people.
        </p>
      </div>


      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}


      <form
        onSubmit={createGame}
        className="rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-bold">
          Create reward game
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Name
            </span>

            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name:
                    event.target.value,
                })
              }
              placeholder="Friday Night Loot Drop"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>


          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Game
            </span>

            <select
              value={
                form.game_type
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  game_type:
                    event.target.value as
                    "scratch" |
                    "wheel",
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            >
              <option value="scratch">
                Scratch Card
              </option>

              <option value="wheel">
                Spin Wheel
              </option>
            </select>
          </label>


          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-300">
              XP prize values
            </span>

            <input
              required
              value={prizes}
              onChange={(event) =>
                setPrizes(
                  event.target.value,
                )
              }
              placeholder="500, 1000, 1500, 2500"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />

            <span className="text-xs text-slate-500">
              Comma separated. The server randomly selects one
              of these values when the player plays.
            </span>
          </label>


          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Opens
            </span>

            <input
              type="datetime-local"
              value={
                form.starts_at
                  ? form.starts_at.slice(
                      0,
                      16,
                    )
                  : ""
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  starts_at:
                    event.target.value
                      ? new Date(
                          event.target.value,
                        ).toISOString()
                      : null,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>


          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Closes
            </span>

            <input
              type="datetime-local"
              value={
                form.ends_at
                  ? form.ends_at.slice(
                      0,
                      16,
                    )
                  : ""
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  ends_at:
                    event.target.value
                      ? new Date(
                          event.target.value,
                        ).toISOString()
                      : null,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
            />
          </label>


          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={
                form.show_upcoming ??
                true
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  show_upcoming:
                    event.target.checked,
                })
              }
            />

            <span className="text-sm text-slate-300">
              Show to young people before opening
            </span>
          </label>


          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50 md:col-span-2"
          >
            {saving
              ? "Creating..."
              : "Create Reward Game"}
          </button>
        </div>
      </form>


      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-bold">
          Grant a play
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          A game only appears on a young person's dashboard
          after an individual entitlement has been granted.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <select
            value={
              selectedGame ?? ""
            }
            onChange={(event) =>
              setSelectedGame(
                event.target.value
                  ? Number(
                      event.target.value,
                    )
                  : null,
              )
            }
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
          >
            <option value="">
              Select game
            </option>

            {games.map((game) => (
              <option
                key={game.id}
                value={game.id}
              >
                {game.name}
              </option>
            ))}
          </select>


          <select
            value={
              selectedPlayer ?? ""
            }
            onChange={(event) =>
              setSelectedPlayer(
                event.target.value
                  ? Number(
                      event.target.value,
                    )
                  : null,
              )
            }
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
          >
            <option value="">
              Select player
            </option>

            {players.map((player) => (
              <option
                key={player.id}
                value={player.id}
              >
                {player.gamertag}
              </option>
            ))}
          </select>


          <button
            type="button"
            onClick={() =>
              void grant()
            }
            className="rounded-xl bg-violet-400 px-5 py-2.5 font-bold text-slate-950"
          >
            Grant Play
          </button>
        </div>
      </div>


      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-bold">
            Configured games
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-bold">
                    {game.name}
                  </div>

                  <div className="mt-1 text-sm text-slate-400">
                    {game.game_type ===
                    "scratch"
                      ? "Scratch Card"
                      : "Spin Wheel"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {game.prize_values.map(
                      (value) => (
                        <span
                          key={value}
                          className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300"
                        >
                          {value.toLocaleString()} XP
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-400">
                  <div>
                    Available:
                    {" "}
                    {game.available_entitlements}
                  </div>

                  <div>
                    Played:
                    {" "}
                    {game.played_entitlements}
                  </div>
                </div>
              </div>
            ))}

            {!games.length && (
              <div className="p-6 text-sm text-slate-400">
                No reward games configured.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
