import { useCallback, useEffect, useState } from "react";

import {
  getAdminAuditLogs,
  getApiErrorMessage,
  type AdminAuditLog,
} from "../../../api/client";

const PAGE_SIZE = 50;

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [action, setAction] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await getAdminAuditLogs({
        limit: PAGE_SIZE,
        offset,
        action: action.trim() || undefined,
      });

      setLogs(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load audit history.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [action, offset]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  const canGoBack = offset > 0;
  const canGoForward = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
          Administration
        </div>

        <h1 className="mt-1 text-2xl font-black text-white">
          Audit history
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Read-only history of administrative actions across
          the programme.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Filter by action
            </span>

            <input
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setOffset(0);
              }}
              placeholder="e.g. point_rule.updated"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 sm:w-80"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Time
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  User
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Action
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Entity
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Details
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-400">
                    {formatDate(log.created_at)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-300">
                    {log.username ?? (
                      log.user_id
                        ? `User #${log.user_id}`
                        : "System"
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-cyan-400/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-cyan-300">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-400">
                    {log.entity_type
                      ? `${log.entity_type}${
                          log.entity_id
                            ? ` #${log.entity_id}`
                            : ""
                        }`
                      : "—"}
                  </td>

                  <td className="max-w-xl px-5 py-4 text-xs leading-5 text-slate-500">
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    No audit events found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Loading audit history…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <div className="text-xs text-slate-500">
            {total === 0
              ? "0 events"
              : `${offset + 1}–${Math.min(
                  offset + PAGE_SIZE,
                  total,
                )} of ${total}`}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canGoBack || loading}
              onClick={() =>
                setOffset(
                  Math.max(0, offset - PAGE_SIZE),
                )
              }
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={!canGoForward || loading}
              onClick={() =>
                setOffset(offset + PAGE_SIZE)
              }
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
