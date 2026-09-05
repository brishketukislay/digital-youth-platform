import { useCallback, useEffect, useState } from "react";

import {
  adminPlayers,
  awardXP,
  createUser,
  getApiErrorMessage,
  type Player,
} from "../../../api/client";

type CreatePlayerForm = {
  username: string;
  password: string;
  gamertag: string;
  avatar: string;
};

const EMPTY_FORM: CreatePlayerForm = {
  username: "",
  password: "",
  gamertag: "",
  avatar: "default",
};

function formatXP(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function PlayersPanel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] =
    useState<CreatePlayerForm>(EMPTY_FORM);

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [xpAmount, setXpAmount] = useState("");
  const [xpReason, setXpReason] = useState("");

  const loadPlayers = useCallback(async () => {
    try {
      setError(null);

      const response = await adminPlayers();

      setPlayers(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load players.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadPlayers();
  }, [loadPlayers]);

  async function handleCreatePlayer(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (!form.gamertag.trim()) {
      setError("Gamertag is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createUser({
        username: form.username.trim(),
        password: form.password,
        role: "player",
        gamertag: form.gamertag.trim(),
        avatar: form.avatar.trim() || "default",
      });

      setForm(EMPTY_FORM);
      setShowCreate(false);

      await loadPlayers();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to create player.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAwardXP(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedPlayer) {
      return;
    }

    const amount = Number(xpAmount);

    if (!Number.isInteger(amount) || amount === 0) {
      setError(
        "Enter a non-zero whole-number XP adjustment.",
      );
      return;
    }

    if (!xpReason.trim()) {
      setError("A reason is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await awardXP(
        selectedPlayer.id,
        amount,
        xpReason.trim(),
      );

      setXpAmount("");
      setXpReason("");
      setSelectedPlayer(null);

      await loadPlayers();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to adjust player XP.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-white">
        Loading players…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            People
          </div>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Players
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage active players, review XP and make
            authorised staff adjustments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreate(current => !current);
          }}
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          {showCreate
            ? "Close"
            : "Add player"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {showCreate && (
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              New player
            </div>

            <h2 className="mt-1 text-lg font-bold text-white">
              Create player account
            </h2>
          </div>

          <form
            onSubmit={handleCreatePlayer}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </span>

              <input
                value={form.username}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </span>

              <input
                type="password"
                value={form.password}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gamertag
              </span>

              <input
                value={form.gamertag}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    gamertag: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avatar
              </span>

              <input
                value={form.avatar}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    avatar: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating…"
                  : "Create player"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              Player directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {players.length} active{" "}
              {players.length === 1
                ? "player"
                : "players"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadPlayers();
            }}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {players.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-semibold text-slate-300">
              No active players
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Create the first player account to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Player
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Group
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    XP
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {players.map(player => (
                  <tr
                    key={player.id}
                    className="transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-sm font-bold text-cyan-300">
                          {player.avatar
                            ? player.avatar
                                .slice(0, 1)
                                .toUpperCase()
                            : "P"}
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            {player.gamertag}
                          </div>

                          <div className="mt-1 text-xs text-slate-600">
                            Player #{player.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-400">
                      {player.group_id
                        ? `Group #${player.group_id}`
                        : "Unassigned"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-cyan-300">
                        {formatXP(player.xp)} XP
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-emerald-400/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300">
                        Active
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlayer(player);
                          setXpAmount("");
                          setXpReason("");
                          setError(null);
                        }}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                      >
                        Adjust XP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
                  Staff adjustment
                </div>

                <h2 className="mt-1 text-xl font-bold text-white">
                  {selectedPlayer.gamertag}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current balance:{" "}
                  {formatXP(selectedPlayer.xp)} XP
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPlayer(null)
                }
                className="text-slate-500 transition hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAwardXP}
              className="mt-6 space-y-4"
            >
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  XP adjustment
                </span>

                <input
                  type="number"
                  value={xpAmount}
                  onChange={event =>
                    setXpAmount(event.target.value)
                  }
                  placeholder="e.g. 100 or -50"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                />

                <span className="block text-xs text-slate-600">
                  Positive values award XP. Negative values
                  remove XP.
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Reason
                </span>

                <textarea
                  value={xpReason}
                  onChange={event =>
                    setXpReason(event.target.value)
                  }
                  rows={3}
                  placeholder="Explain why this adjustment is being made..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlayer(null)
                  }
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : "Save adjustment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
