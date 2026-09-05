import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createChallenge,
  disableChallenge,
  enableChallenge,
  getApiErrorMessage,
  getStaffChallenges,
  updateChallenge,
  type ChallengeRequest,
  type PlayerChallenge,
} from "../../../api/client";

import { ChallengeEditor } from "./ChallengeEditor";
import { ChallengeTable } from "./ChallengeTable";

import type { Challenge } from "./challengeTypes";

function toFrontendChallenge(
  challenge: PlayerChallenge,
): Challenge {
  const now = new Date().toISOString();

  return {
    id: String(challenge.id),
    title: challenge.title,
    description: challenge.description ?? "",
    phaseId:
      challenge.phase_id == null
        ? null
        : String(challenge.phase_id),

    status: challenge.state === "live"
      ? "live"
      : challenge.state === "scheduled"
        ? "scheduled"
        : challenge.active
          ? "completed"
          : "cancelled",

    startsAt: challenge.start_at ?? "",
    endsAt: challenge.end_at ?? "",

    scoringMode: "participation",
    evidenceType: "staff_verified",

    participationXp: challenge.participation_xp,
    eliteXp: challenge.elite_xp,
    winnerIndividualXp: challenge.winner_xp,
    winnerGroupXp: challenge.group_xp,

    minimumAttempts: null,
    eliteThreshold: null,

    notificationEnabled: true,

    createdAt: now,
    updatedAt: now,
  };
}

function toApiPayload(
  challenge: Challenge,
): ChallengeRequest {
  return {
    phase_id:
      challenge.phaseId == null ||
      challenge.phaseId === ""
        ? null
        : Number(challenge.phaseId),

    title: challenge.title.trim(),

    description:
      challenge.description.trim() || null,

    start_at:
      challenge.startsAt || null,

    end_at:
      challenge.endsAt || null,

    participation_xp: Math.max(
      0,
      Math.round(challenge.participationXp),
    ),

    elite_xp: Math.max(
      0,
      Math.round(challenge.eliteXp),
    ),

    winner_xp: Math.max(
      0,
      Math.round(challenge.winnerIndividualXp),
    ),

    group_xp: Math.max(
      0,
      Math.round(challenge.winnerGroupXp),
    ),

    active:
      challenge.status !== "cancelled",
  };
}

function emptyChallenge(): Challenge {
  return {
    id: "",
    title: "",
    description: "",
    phaseId: null,

    status: "draft",

    startsAt: "",
    endsAt: "",

    scoringMode: "participation",
    evidenceType: "staff_verified",

    participationXp: 300,
    eliteXp: 1500,
    winnerIndividualXp: 3000,
    winnerGroupXp: 5000,

    minimumAttempts: 5,
    eliteThreshold: null,

    notificationEnabled: true,
  };
}

export function ChallengeManager() {
  const [challenges, setChallenges] =
    useState<Challenge[]>([]);

  const [editing, setEditing] =
    useState<Challenge | null>(null);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadChallenges = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await getStaffChallenges();

        setChallenges(
          response.data.map(
            toFrontendChallenge,
          ),
        );
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Unable to load challenges.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  const filteredChallenges =
    useMemo(() => {
      const normalized =
        query.trim().toLowerCase();

      if (!normalized) {
        return challenges;
      }

      return challenges.filter(
        (challenge) =>
          challenge.title
            .toLowerCase()
            .includes(normalized) ||
          challenge.description
            .toLowerCase()
            .includes(normalized),
      );
    }, [challenges, query]);

  const saveChallenge = async (
    challenge: Challenge,
  ) => {
    if (!challenge.title.trim()) {
      setError("Challenge title is required.");
      return;
    }

    if (
      challenge.startsAt &&
      challenge.endsAt &&
      new Date(challenge.endsAt) <=
        new Date(challenge.startsAt)
    ) {
      setError(
        "Challenge end time must be after its start time.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload =
        toApiPayload(challenge);

      if (challenge.id) {
        await updateChallenge(
          Number(challenge.id),
          payload,
        );
      } else {
        await createChallenge(payload);
      }

      setEditing(null);

      await loadChallenges();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to save challenge.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleChallenge = async (
    challenge: Challenge,
  ) => {
    if (!challenge.id) {
      return;
    }

    setBusyId(challenge.id);
    setError(null);

    try {
      if (
        challenge.status === "cancelled"
      ) {
        await enableChallenge(
          Number(challenge.id),
        );
      } else {
        await disableChallenge(
          Number(challenge.id),
        );
      }

      await loadChallenges();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update challenge status.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const duplicateChallenge = (
    challenge: Challenge,
  ) => {
    setEditing({
      ...challenge,
      id: "",
      title: `${challenge.title} — copy`,
      status: "draft",
      startsAt: "",
      endsAt: "",
      createdAt: undefined,
      updatedAt: undefined,
    });
  };

  return (
    <section className="admin-challenge-manager">
      <header className="admin-challenge-manager__header">
        <div>
          <div className="admin-eyebrow">
            Engagement
          </div>

          <h2 className="admin-challenge-manager__title">
            Challenge operations
          </h2>

          <p className="admin-challenge-manager__description">
            Create, schedule and manage
            verifiable activities for the
            programme.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            setEditing(emptyChallenge())
          }
          disabled={saving}
        >
          + New challenge
        </button>
      </header>

      <div className="admin-challenge-manager__toolbar">
        <label className="admin-challenge-manager__search">
          <span>Search challenges</span>

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search by title or description…"
          />
        </label>

        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            void loadChallenges()
          }
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          className="admin-challenge-manager__alert"
          role="alert"
        >
          <strong>Something went wrong</strong>
          <span>{error}</span>

          <button
            type="button"
            className="button button--secondary"
            onClick={() =>
              void loadChallenges()
            }
          >
            Try again
          </button>
        </div>
      )}

      <div className="admin-challenge-manager__meta">
        <span>
          {filteredChallenges.length}{" "}
          {filteredChallenges.length === 1
            ? "challenge"
            : "challenges"}
        </span>

        {!loading && (
          <span>
            Changes are saved to the server.
          </span>
        )}
      </div>

      {loading ? (
        <div className="admin-challenge-manager__state">
          <div className="admin-loading-dot" />
          <strong>Loading challenges…</strong>
          <span>
            Getting the latest challenge catalogue.
          </span>
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="admin-challenge-manager__state">
          <div className="admin-challenge-manager__state-icon">
            ⚡
          </div>

          <strong>
            {query
              ? "No matching challenges"
              : "No challenges yet"}
          </strong>

          <span>
            {query
              ? "Try a different search."
              : "Create your first time-bound challenge to give the cohort another route to earn XP."}
          </span>

          {!query && (
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                setEditing(emptyChallenge())
              }
            >
              Create challenge
            </button>
          )}
        </div>
      ) : (
        <ChallengeTable
          challenges={filteredChallenges}
          onEdit={setEditing}
          onDuplicate={duplicateChallenge}
          onToggle={toggleChallenge}
          busyId={busyId}
        />
      )}

      <ChallengeEditor
        challenge={editing}
        saving={saving}
        onClose={() =>
          setEditing(null)
        }
        onSave={saveChallenge}
      />
    </section>
  );
}
