import {
  useEffect,
  useState,
} from "react";

import {
  addPlayerToStaffGroup,
  createStaffGroup,
  updateStaffGroup,
  getApiErrorMessage,
  getStaffGroups,
  removePlayerFromStaffGroup,
  type Player,
  type StaffGroup,
} from "../../api/client";

type Props = {
  players: Player[];
};

export default function YouthWorkerGroups({
  players,
}: Props) {
  const [groups, setGroups] =
    useState<StaffGroup[]>([]);

  const [groupName, setGroupName] =
    useState("");

  const [selectedPlayerIds, setSelectedPlayerIds] =
    useState<number[]>([]);

  const [addingPlayerTo, setAddingPlayerTo] =
    useState<number | null>(null);

  const [newMemberByGroup, setNewMemberByGroup] =
    useState<Record<number, string>>({});

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadGroups() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await getStaffGroups();

      setGroups(response.data);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load groups.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGroups();
  }, []);

  function togglePlayer(
    playerId: number,
  ) {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter(
            (id) => id !== playerId,
          )
        : [...current, playerId],
    );
  }

  async function handleCreateGroup() {
    const name = groupName.trim();

    if (!name) {
      setError(
        "Enter a group name.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createStaffGroup({
        name,
        player_ids: selectedPlayerIds,
      });

      setGroupName("");
      setSelectedPlayerIds([]);

      await loadGroups();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to create group.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember(
    groupId: number,
  ) {
    const value =
      newMemberByGroup[groupId];

    const playerId = Number(value);

    if (!Number.isInteger(playerId)) {
      setError(
        "Select a young person first.",
      );
      return;
    }

    setAddingPlayerTo(groupId);
    setError(null);

    try {
      await addPlayerToStaffGroup(
        groupId,
        playerId,
      );

      setNewMemberByGroup((current) => ({
        ...current,
        [groupId]: "",
      }));

      await loadGroups();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to add young person to group.",
        ),
      );
    } finally {
      setAddingPlayerTo(null);
    }
  }

  async function handleRemoveMember(
    groupId: number,
    playerId: number,
  ) {
    if (
      !window.confirm(
        "Remove this young person from the group?",
      )
    ) {
      return;
    }

    setAddingPlayerTo(groupId);
    setError(null);

    try {
      await removePlayerFromStaffGroup(
        groupId,
        playerId,
      );

      await loadGroups();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to remove young person from group.",
        ),
      );
    } finally {
      setAddingPlayerTo(null);
    }
  }

  async function handleDeactivateGroup(
    groupId: number,
    name: string,
  ) {
    if (
      !window.confirm(
        `Deactivate "${name}"? Its history will be retained.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const group = groups.find((g) => g.id === groupId);

      if (!group) {
        throw new Error("Group not found.");
      }

      await updateStaffGroup(groupId, {
        name: group.name,
        active: false,
      });

      await loadGroups();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to deactivate group.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const availablePlayers = (
    group: StaffGroup,
  ) =>
    players.filter(
      (player) =>
        player.active !== false &&
        !group.players.some(
          (member) =>
            member.id === player.id,
        ),
    );

  return (
    <section className="staff-card staff-groups">
      <div className="staff-card__heading">
        <div>
          <span>
            GROUPS
          </span>

          <h2>
            Young people & groups
          </h2>

          <p className="staff-section-copy">
            Create delivery groups and assign
            young people to them.
          </p>
        </div>

        <span className="staff-count">
          {groups.length}
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
            Group name

            <input
              value={groupName}
              maxLength={100}
              onChange={(event) =>
                setGroupName(
                  event.target.value,
                )
              }
              placeholder="e.g. Tuesday Youth Group"
              disabled={saving}
            />
          </label>

          <div>
            <span className="staff-form-label">
              Add young people
            </span>

            <div className="staff-group-player-picker">
              {players.map((player) => (
                <label
                  className="staff-group-player-option"
                  key={player.id}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayerIds.includes(
                      player.id,
                    )}
                    onChange={() =>
                      togglePlayer(
                        player.id,
                      )
                    }
                    disabled={saving}
                  />

                  <span>
                    {player.avatar || "★"}{" "}
                    {player.gamertag}
                  </span>
                </label>
              ))}
            </div>

            {!players.length && (
              <div className="staff-empty">
                No active young people available.
              </div>
            )}
          </div>

          <button
            type="button"
            className="button button--primary"
            disabled={
              saving ||
              !groupName.trim()
            }
            onClick={() =>
              void handleCreateGroup()
            }
          >
            {saving
              ? "Creating..."
              : "Create group"}
          </button>
        </div>
      </div>

      <div className="staff-group-list">
        {loading ? (
          <div className="staff-empty">
            Loading groups...
          </div>
        ) : groups.length === 0 ? (
          <div className="staff-empty">
            No groups created yet.
          </div>
        ) : (
          groups.map((group) => (
            <article
              className="staff-group"
              key={group.id}
            >
              <div className="staff-group__header">
                <div>
                  <strong>
                    {group.name}
                  </strong>

                  <small>
                    {group.player_count}{" "}
                    {group.player_count === 1
                      ? "young person"
                      : "young people"}
                  </small>
                </div>

                <button
                  type="button"
                  className="button button--danger button--small"
                  disabled={saving}
                  onClick={() =>
                    void handleDeactivateGroup(
                      group.id,
                      group.name,
                    )
                  }
                >
                  Deactivate
                </button>
              </div>

              <div className="staff-group__members">
                {group.players.map(
                  (player) => (
                    <div
                      className="staff-group-member"
                      key={player.id}
                    >
                      <span>
                        {player.avatar ||
                          "★"}
                      </span>

                      <div>
                        <strong>
                          {player.gamertag}
                        </strong>

                        <small>
                          {player.xp.toLocaleString(
                            "en-GB",
                          )}{" "}
                          XP
                        </small>
                      </div>

                      <button
                        type="button"
                        className="button button--secondary button--small"
                        disabled={
                          addingPlayerTo ===
                          group.id
                        }
                        onClick={() =>
                          void handleRemoveMember(
                            group.id,
                            player.id,
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}

                {!group.players.length && (
                  <div className="staff-empty">
                    No young people assigned.
                  </div>
                )}
              </div>

              <div className="staff-group__add">
                <select
                  value={
                    newMemberByGroup[
                      group.id
                    ] ?? ""
                  }
                  onChange={(event) =>
                    setNewMemberByGroup(
                      (current) => ({
                        ...current,
                        [group.id]:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={
                    addingPlayerTo ===
                    group.id
                  }
                >
                  <option value="">
                    Add young person...
                  </option>

                  {availablePlayers(
                    group,
                  ).map((player) => (
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
                  className="button button--primary button--small"
                  disabled={
                    addingPlayerTo ===
                      group.id ||
                    !newMemberByGroup[
                      group.id
                    ]
                  }
                  onClick={() =>
                    void handleAddMember(
                      group.id,
                    )
                  }
                >
                  {addingPlayerTo ===
                  group.id
                    ? "Adding..."
                    : "Add"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
