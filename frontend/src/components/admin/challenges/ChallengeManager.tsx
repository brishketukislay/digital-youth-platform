import {
  useMemo,
  useState,
} from "react";

import { ChallengeEditor } from "./ChallengeEditor";
import { ChallengeTable } from "./ChallengeTable";

import type { Challenge } from "./challengeTypes";

const initialChallenges: Challenge[] = [];

export function ChallengeManager() {
  const [challenges, setChallenges] =
    useState<Challenge[]>(
      initialChallenges,
    );

  const [editing, setEditing] =
    useState<Challenge | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const filteredChallenges = useMemo(() => {
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
    setSaving(true);

    try {
      /*
       * API boundary.
       *
       * Replace this block with the project's existing
       * challenge create/update mutation.
       *
       * Do not award XP here.
       */

      setChallenges((current) => {
        const exists = current.some(
          (item) =>
            item.id === challenge.id &&
            challenge.id !== "",
        );

        if (exists) {
          return current.map((item) =>
            item.id === challenge.id
              ? {
                  ...challenge,
                  updatedAt:
                    new Date().toISOString(),
                }
              : item,
          );
        }

        return [
          {
            ...challenge,
            id:
              challenge.id ||
              crypto.randomUUID(),
            createdAt:
              new Date().toISOString(),
            updatedAt:
              new Date().toISOString(),
          },
          ...current,
        ];
      });

      setEditing(null);
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Engagement
          </div>

          <h2 className="mt-1 text-xl font-black">
            Time-bound challenges
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Configure short, verifiable activities that
            can be scheduled around programme phases and
            engagement windows.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setEditing({
              id: "",
              title: "",
              description: "",
              phaseId: null,
              status: "draft",
              startsAt: "",
              endsAt: "",
              scoringMode:
                "participation",
              evidenceType: "automatic",
              participationXp: 300,
              eliteXp: 1500,
              winnerIndividualXp: 3000,
              winnerGroupXp: 5000,
              minimumAttempts: 5,
              eliteThreshold: null,
              notificationEnabled: true,
            })
          }
          className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          + New challenge
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search challenges…"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-semibold text-slate-500">
          {filteredChallenges.length}{" "}
          challenge
          {filteredChallenges.length === 1
            ? ""
            : "s"}
        </div>
      </div>

      <ChallengeTable
        challenges={filteredChallenges}
        onEdit={setEditing}
        onDuplicate={
          duplicateChallenge
        }
      />

      <ChallengeEditor
        challenge={editing}
        saving={saving}
        onClose={() =>
          !saving && setEditing(null)
        }
        onSave={saveChallenge}
      />
    </div>
  );
}