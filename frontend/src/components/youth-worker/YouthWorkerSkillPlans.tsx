import {
  useEffect,
  useState,
} from "react";

import {
  archiveSkillPlan,
  createSkillPlan,
  getApiErrorMessage,
  getSkillPlans,
  type Player,
  type SkillPlan,
} from "../../api/client";

type Props = {
  players: Player[];
};

type MilestoneDraft = {
  name: string;
  required_xp: string;
  reward_description: string;
};

const DEFAULT_MILESTONES: MilestoneDraft[] = [
  {
    name: "",
    required_xp: "500",
    reward_description: "",
  },
  {
    name: "",
    required_xp: "1500",
    reward_description: "",
  },
  {
    name: "",
    required_xp: "3000",
    reward_description: "",
  },
];

function freshMilestones() {
  return DEFAULT_MILESTONES.map(
    (milestone) => ({
      ...milestone,
    }),
  );
}

export default function YouthWorkerSkillPlans({
  players,
}: Props) {
  const [plans, setPlans] =
    useState<SkillPlan[]>([]);

  const [playerId, setPlayerId] =
    useState<number | "">("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [milestones, setMilestones] =
    useState<MilestoneDraft[]>(
      freshMilestones(),
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadPlans() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await getSkillPlans();

      setPlans(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load skill plans.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlans();
  }, []);

  function updateMilestone(
    index: number,
    field: keyof MilestoneDraft,
    value: string,
  ) {
    setMilestones((current) =>
      current.map(
        (milestone, milestoneIndex) =>
          milestoneIndex === index
            ? {
                ...milestone,
                [field]: value,
              }
            : milestone,
      ),
    );
  }

  function resetForm() {
    setPlayerId("");
    setName("");
    setDescription("");
    setMilestones(
      freshMilestones(),
    );
  }

  async function handleCreate() {
    setError(null);

    if (playerId === "") {
      setError(
        "Select a young person.",
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Enter a skill plan name.",
      );
      return;
    }

    const payloadMilestones =
      milestones.map((milestone) => ({
        name: milestone.name.trim(),
        required_xp: Number(
          milestone.required_xp,
        ),
        reward_description:
          milestone.reward_description.trim() ||
          null,
      }));

    for (
      const milestone of payloadMilestones
    ) {
      if (!milestone.name) {
        setError(
          "Every milestone needs a name.",
        );
        return;
      }

      if (
        !Number.isInteger(
          milestone.required_xp,
        ) ||
        milestone.required_xp < 1
      ) {
        setError(
          "Milestone XP must be a positive whole number.",
        );
        return;
      }
    }

    for (
      let index = 1;
      index < payloadMilestones.length;
      index += 1
    ) {
      if (
        payloadMilestones[index]
          .required_xp <=
        payloadMilestones[index - 1]
          .required_xp
      ) {
        setError(
          "Milestone XP thresholds must increase.",
        );
        return;
      }
    }

    setSaving(true);

    try {
      await createSkillPlan({
        player_id: Number(playerId),
        name: name.trim(),
        description:
          description.trim() || null,
        milestones: payloadMilestones,
      });

      resetForm();
      await loadPlans();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to create skill plan.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(
    plan: SkillPlan,
  ) {
    if (
      !window.confirm(
        `Archive "${plan.name}" for ${plan.gamertag ?? "this young person"}?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await archiveSkillPlan(plan.id);
      await loadPlans();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to archive skill plan.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const activePlans = plans.filter(
    (plan) =>
      plan.active &&
      !plan.completed,
  );

  return (
    <section className="staff-card staff-groups">
      <div className="staff-card__heading">
        <div>
          <span>
            SKILL PROGRESSION
          </span>

          <h2>
            Skill plans
          </h2>

          <p className="staff-section-copy">
            Set a personal progression plan
            for a young person and track
            milestones as they build skills.
          </p>
        </div>

        <span className="staff-count">
          {activePlans.length}
        </span>
      </div>

      {error && (
        <div className="staff-inline-error">
          {error}
        </div>
      )}

      <div className="staff-group-create">
        <div className="staff-form">
          <label>
            Young person

            <select
              value={playerId}
              onChange={(event) =>
                setPlayerId(
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : "",
                )
              }
              disabled={saving}
            >
              <option value="">
                Select a young person...
              </option>

              {players
                .filter(
                  (player) =>
                    player.active !== false,
                )
                .map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                  >
                    {player.gamertag}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Skill plan name

            <input
              value={name}
              maxLength={200}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="e.g. Confidence & Communication"
              disabled={saving}
            />
          </label>

          <label>
            Description

            <textarea
              value={description}
              maxLength={2000}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="What is this young person working towards?"
              disabled={saving}
              rows={3}
            />
          </label>

          <div>
            <span className="staff-form-label">
              Milestones
            </span>

            <div
              style={{
                display: "grid",
                gap: "0.75rem",
              }}
            >
              {milestones.map(
                (milestone, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "1rem",
                      border:
                        "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "12px",
                    }}
                  >
                    <strong>
                      Milestone {index + 1}
                    </strong>

                    <div
                      style={{
                        display: "grid",
                        gap: "0.6rem",
                        marginTop: "0.6rem",
                      }}
                    >
                      <input
                        value={
                          milestone.name
                        }
                        maxLength={200}
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="Milestone name"
                        disabled={saving}
                      />

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={
                          milestone.required_xp
                        }
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "required_xp",
                            event.target.value,
                          )
                        }
                        placeholder="Required XP"
                        disabled={saving}
                      />

                      <input
                        value={
                          milestone.reward_description
                        }
                        maxLength={500}
                        onChange={(event) =>
                          updateMilestone(
                            index,
                            "reward_description",
                            event.target.value,
                          )
                        }
                        placeholder="Recognition / reward (optional)"
                        disabled={saving}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <button
            type="button"
            className="button button--primary"
            disabled={
              saving ||
              !name.trim() ||
              playerId === ""
            }
            onClick={() =>
              void handleCreate()
            }
          >
            {saving
              ? "Saving..."
              : "Create skill plan"}
          </button>
        </div>
      </div>

      <div className="staff-group-list">
        {loading ? (
          <div className="staff-empty">
            Loading skill plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="staff-empty">
            No skill plans created yet.
          </div>
        ) : (
          plans.map((plan) => (
            <article
              className="staff-group"
              key={plan.id}
            >
              <div className="staff-group__header">
                <div>
                  <strong>
                    {plan.gamertag ??
                      "Young person"}
                  </strong>

                  <small>
                    {plan.name}
                    {" · "}
                    {plan.current_xp.toLocaleString(
                      "en-GB",
                    )}{" "}
                    XP
                  </small>
                </div>

                {plan.active &&
                  !plan.completed && (
                    <button
                      type="button"
                      className="button button--danger button--small"
                      disabled={saving}
                      onClick={() =>
                        void handleArchive(
                          plan,
                        )
                      }
                    >
                      Archive
                    </button>
                  )}
              </div>

              {plan.description && (
                <p>
                  {plan.description}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gap: "0.5rem",
                }}
              >
                {plan.milestones.map(
                  (milestone) => (
                    <div
                      key={milestone.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "1rem",
                        padding:
                          "0.65rem 0",
                      }}
                    >
                      <span>
                        {milestone.completed
                          ? "✓ "
                          : "○ "}
                        {milestone.name}
                      </span>

                      <strong>
                        {milestone.required_xp.toLocaleString(
                          "en-GB",
                        )}{" "}
                        XP
                      </strong>
                    </div>
                  ),
                )}
              </div>

              <small>
                {plan.completed
                  ? "Completed"
                  : plan.active
                    ? "Active"
                    : "Archived"}
              </small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
