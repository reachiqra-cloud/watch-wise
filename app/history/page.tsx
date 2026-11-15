"use client";

import { useEffect, useState } from "react";
import type { HistoryEntry } from "@/data/store";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/wallet", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error?.message ?? "Could not load your history.",
          );
        }
        setHistory(data.history);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load your history.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSpent = history.reduce((sum, h) => sum + h.tokensSpent, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Watch history</h1>

      {!loading && !error && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {history.length} {history.length === 1 ? "title" : "titles"} watched ·{" "}
          {totalSpent} tokens spent
        </p>
      )}

      {loading && (
        <p className="mt-6 text-sm text-slate-500">Loading history…</p>
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="mt-6 text-sm">
          You have not watched anything yet. Head to the catalogue to get
          started.
        </p>
      )}

      {!loading && !error && history.length > 0 && (
        <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {history.map((h, i) => (
            <li
              key={`${h.titleId}-${h.watchedAt}-${i}`}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="font-medium">{h.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatWhen(h.watchedAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                -{h.tokensSpent} {h.tokensSpent === 1 ? "token" : "tokens"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
