import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createReward,
  disableReward,
  getApiErrorMessage,
  getRewards,
  updateReward,
  type Reward,
  type RewardRequest,
} from "../../api/client";

const EMPTY_FORM: RewardRequest = {
  name: "",
  description: "",
  xp_threshold: null,
  reward_type: "physical",
  value: 0,
  active: true,
};

export default function RewardsManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [form, setForm] = useState<RewardRequest>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRewards() {
    try {
      setLoading(true);
      setError("");

      const response = await getRewards();
      setRewards(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load rewards."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function editReward(reward: Reward) {
    setEditingId(reward.id);

    setForm({
      name: reward.name,
      description: reward.description,
      xp_threshold: reward.xp_threshold,
      reward_type: reward.reward_type,
      value: reward.value,
      active: reward.active,
    });

    setMessage("");
    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload: RewardRequest = {
        name: form.name.trim(),
        description:
          form.description?.trim() || null,
        xp_threshold:
          form.xp_threshold === null ||
          form.xp_threshold === undefined
            ? null
            : Number(form.xp_threshold),
        reward_type:
          form.reward_type?.trim() || "physical",
        value: Number(form.value ?? 0),
        active: form.active ?? true,
      };

      if (editingId !== null) {
        await updateReward(
          editingId,
          payload
        );

        setMessage("Reward updated successfully.");
      } else {
        await createReward(payload);

        setMessage("Reward created successfully.");
      }

      resetForm();
      await loadRewards();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to save reward."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(id: number) {
    if (
      !window.confirm(
        "Disable this reward?"
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await disableReward(id);

      setMessage("Reward disabled successfully.");
      await loadRewards();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to disable reward."
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Rewards
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Create and manage rewards available
          through the programme.
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold">
            {editingId !== null
              ? "Edit Reward"
              : "Add Reward"}
          </h3>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2"
        >
          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Name
            </span>

            <input
              required
              minLength={2}
              maxLength={200}
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              placeholder="£5 Love2shop voucher"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Reward type
            </span>

            <select
              value={form.reward_type}
              onChange={(event) =>
                setForm({
                  ...form,
                  reward_type: event.target.value,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
            >
              <option value="physical">
                Physical
              </option>
              <option value="voucher">
                Voucher
              </option>
              <option value="individual">
                Individual
              </option>
              <option value="group">
                Group
              </option>
              <option value="mystery">
                Mystery
              </option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              XP threshold
            </span>

            <input
              type="number"
              min={0}
              value={
                form.xp_threshold ?? ""
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  xp_threshold:
                    event.target.value === ""
                      ? null
                      : Number(
                          event.target.value
                        ),
                })
              }
              placeholder="1000"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-slate-300">
              Value (£)
            </span>

            <input
              type="number"
              min={0}
              step="0.01"
              value={form.value ?? 0}
              onChange={(event) =>
                setForm({
                  ...form,
                  value: Number(
                    event.target.value
                  ),
                })
              }
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-slate-300">
              Description
            </span>

            <textarea
              maxLength={2000}
              rows={3}
              value={
                form.description ?? ""
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              placeholder="Describe what the young person receives."
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={
                form.active ?? true
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  active:
                    event.target.checked,
                })
              }
            />

            <span className="text-sm text-slate-300">
              Active reward
            </span>
          </label>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Reward"
                  : "Create Reward"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="font-semibold">
            Configured Rewards
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-400">
            Loading rewards...
          </div>
        ) : rewards.length === 0 ? (
          <div className="p-6 text-sm text-slate-400">
            No rewards configured yet.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {reward.name}
                  </div>

                  <div className="mt-1 text-sm text-slate-400">
                    {reward.description ||
                      "No description"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                      {reward.reward_type}
                    </span>

                    <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                      XP:{" "}
                      {reward.xp_threshold ??
                        "Any"}
                    </span>

                    <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                      £{reward.value.toFixed(2)}
                    </span>

                    <span
                      className={[
                        "rounded-full px-2 py-1",
                        reward.active
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-400/10 text-slate-400",
                      ].join(" ")}
                    >
                      {reward.active
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      editReward(reward)
                    }
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Edit
                  </button>

                  {reward.active && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDisable(
                          reward.id
                        )
                      }
                      className="rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"
                    >
                      Disable
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
