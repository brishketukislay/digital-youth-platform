import {
  useState,
} from "react";

import type {
  ChallengeAttempt,
  PlayerChallenge,
} from "./challengeRuntimeTypes";

type ChallengeEvidenceFormProps = {
  challenge: PlayerChallenge;
  attempt: ChallengeAttempt;
  submitting?: boolean;
  onSubmit: (payload: {
    attemptId: string;
    score?: number;
    attempts?: number;
    evidence?: string;
  }) => Promise<void> | void;
};

export function ChallengeEvidenceForm({
  challenge,
  attempt,
  submitting = false,
  onSubmit,
}: ChallengeEvidenceFormProps) {
  const [score, setScore] =
    useState(
      attempt.score != null
        ? String(attempt.score)
        : "",
    );

  const [attempts, setAttempts] =
    useState(
      attempt.attempts != null
        ? String(attempt.attempts)
        : "",
    );

  const [evidence, setEvidence] =
    useState("");

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await onSubmit({
      attemptId: attempt.id,
      score:
        score === ""
          ? undefined
          : Number(score),
      attempts:
        attempts === ""
          ? undefined
          : Number(attempts),
      evidence:
        evidence.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6"
    >
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
          Submit result
        </div>

        <h2 className="mt-1 text-lg font-bold">
          Record your performance
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your submission is sent to the platform for
          validation. XP is only awarded after the
          server confirms eligibility.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Score">
          <input
            type="number"
            min={0}
            step="any"
            value={score}
            onChange={(event) =>
              setScore(
                event.target.value,
              )
            }
            className={inputClass}
            placeholder="Optional"
          />
        </Field>

        <Field label="Attempts">
          <input
            type="number"
            min={0}
            step={1}
            value={attempts}
            onChange={(event) =>
              setAttempts(
                event.target.value,
              )
            }
            className={inputClass}
            placeholder="Optional"
          />
        </Field>
      </div>

      {challenge.evidenceType ===
        "staff_verified" && (
        <div className="mt-4 rounded-xl border border-blue-400/10 bg-blue-400/5 p-4 text-sm text-blue-200/70">
          A youth worker will verify this challenge
          before any XP is issued.
        </div>
      )}

      <Field label="Optional note">
        <textarea
          rows={3}
          value={evidence}
          onChange={(event) =>
            setEvidence(
              event.target.value,
            )
          }
          className={inputClass}
          placeholder="Anything the youth worker should know?"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Submitting…"
          : "Submit challenge"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50";