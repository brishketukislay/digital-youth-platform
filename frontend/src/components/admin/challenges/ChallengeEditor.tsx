import {
  useEffect,
  useState,
} from "react";

import type {
  Challenge,
  ChallengeEvidenceType,
  ChallengeScoringMode,
} from "./challengeTypes";

type ChallengeEditorProps = {
  challenge: Challenge | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    challenge: Challenge,
  ) => Promise<void> | void;
};

const emptyChallenge = (): Challenge => ({
  id: "",
  title: "",
  description: "",
  phaseId: null,
  status: "draft",

  startsAt: "",
  endsAt: "",

  scoringMode: "participation",
  evidenceType: "automatic",

  participationXp: 300,
  eliteXp: 1500,
  winnerIndividualXp: 3000,
  winnerGroupXp: 5000,

  minimumAttempts: 5,
  eliteThreshold: null,

  notificationEnabled: true,
});

export function ChallengeEditor({
  challenge,
  saving = false,
  onClose,
  onSave,
}: ChallengeEditorProps) {
  const [form, setForm] =
    useState<Challenge>(
      emptyChallenge(),
    );

  useEffect(() => {
    setForm(
      challenge
        ? { ...challenge }
        : emptyChallenge(),
    );
  }, [challenge]);

  if (challenge === null) {
    return null;
  }

  const update = <
    K extends keyof Challenge
  >(
    key: K,
    value: Challenge[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    if (!form.startsAt || !form.endsAt) {
      return;
    }

    const start = new Date(
      form.startsAt,
    ).getTime();

    const end = new Date(
      form.endsAt,
    ).getTime();

    if (end <= start) {
      return;
    }

    await onSave({
      ...form,
      title: form.title.trim(),
      description:
        form.description.trim(),
      participationXp: Math.max(
        0,
        Math.round(form.participationXp),
      ),
      eliteXp: Math.max(
        0,
        Math.round(form.eliteXp),
      ),
      winnerIndividualXp: Math.max(
        0,
        Math.round(form.winnerIndividualXp),
      ),
      winnerGroupXp: Math.max(
        0,
        Math.round(form.winnerGroupXp),
      ),
      minimumAttempts:
        form.minimumAttempts == null
          ? null
          : Math.max(
              0,
              Math.round(form.minimumAttempts),
            ),
      eliteThreshold:
        form.eliteThreshold == null
          ? null
          : Math.max(
              0,
              form.eliteThreshold,
            ),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
        <div className="w-full max-w-3xl overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-2xl">
          <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
                {form.id
                  ? "Edit challenge"
                  : "New challenge"}
              </div>

              <h2 className="mt-1 text-xl font-black">
                Time-bound activity
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="max-h-[75vh] space-y-7 overflow-y-auto px-6 py-6">
              <section>
                <SectionTitle>
                  Challenge details
                </SectionTitle>

                <div className="mt-4 grid gap-4">
                  <Field label="Title">
                    <input
                      required
                      value={form.title}
                      onChange={(event) =>
                        update(
                          "title",
                          event.target.value,
                        )
                      }
                      placeholder="Friday Night Flash"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        update(
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="Describe what players need to do."
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section>
                <SectionTitle>
                  Schedule
                </SectionTitle>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Starts">
                    <input
                      required
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) =>
                        update(
                          "startsAt",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Ends">
                    <input
                      required
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(event) =>
                        update(
                          "endsAt",
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section>
                <SectionTitle>
                  Verification
                </SectionTitle>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Scoring mode">
                    <select
                      value={form.scoringMode}
                      onChange={(event) =>
                        update(
                          "scoringMode",
                          event.target
                            .value as ChallengeScoringMode,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="participation">
                        Participation
                      </option>

                      <option value="ranked">
                        Ranked score
                      </option>

                      <option value="threshold">
                        Threshold
                      </option>

                      <option value="custom">
                        Custom
                      </option>
                    </select>
                  </Field>

                  <Field label="Evidence method">
                    <select
                      value={form.evidenceType}
                      onChange={(event) =>
                        update(
                          "evidenceType",
                          event.target
                            .value as ChallengeEvidenceType,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="automatic">
                        Automatic
                      </option>

                      <option value="score_submission">
                        Score submission
                      </option>

                      <option value="staff_verified">
                        Staff verified
                      </option>

                      <option value="qr_scan">
                        QR scan
                      </option>

                      <option value="attendance">
                        Attendance
                      </option>

                      <option value="photo">
                        Photo
                      </option>
                    </select>
                  </Field>
                </div>
              </section>

              <section>
                <SectionTitle>
                  XP configuration
                </SectionTitle>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Participation XP"
                    value={form.participationXp}
                    onChange={(value) =>
                      update(
                        "participationXp",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Elite XP"
                    value={form.eliteXp}
                    onChange={(value) =>
                      update(
                        "eliteXp",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Winner individual XP"
                    value={
                      form.winnerIndividualXp
                    }
                    onChange={(value) =>
                      update(
                        "winnerIndividualXp",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Winner group XP"
                    value={
                      form.winnerGroupXp
                    }
                    onChange={(value) =>
                      update(
                        "winnerGroupXp",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Minimum attempts"
                    value={
                      form.minimumAttempts ?? 0
                    }
                    onChange={(value) =>
                      update(
                        "minimumAttempts",
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Elite threshold"
                    value={
                      form.eliteThreshold ?? 0
                    }
                    onChange={(value) =>
                      update(
                        "eliteThreshold",
                        value,
                      )
                    }
                    suffix="%"
                  />
                </div>
              </section>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Send browser notification
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Players must have granted notification
                    permission on their device.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={
                    form.notificationEnabled
                  }
                  onChange={(event) =>
                    update(
                      "notificationEnabled",
                      event.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-cyan-400"
                />
              </label>

              <div className="rounded-xl border border-amber-400/10 bg-amber-400/5 p-4 text-xs leading-5 text-amber-200/60">
                XP values configure the challenge
                definition only. The server must verify
                participation, scores and eligibility
                before issuing any XP.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving…"
                  : "Save challenge"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
      {children}
    </h3>
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

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(event) =>
            onChange(
              Number(event.target.value),
            )
          }
          className={inputClass}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/50";