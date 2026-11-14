"use client";

import { useEffect, useMemo, useState } from "react";
import type { Title } from "@/data/store";
import ApplyPlanButton from "@/components/ApplyPlanButton";

type PlanItem = {
  action: string;
  titleId: string;
  title: string;
  tokenCost: number;
  replaces: string[];
  tokensSaved: number;
};

type OptimizeResult = {
  plan: PlanItem[];
  totalCost: number;
  costIfBoughtIndividually: number;
  tokensSaved: number;
  canAfford: boolean;
  balanceAfter: number;
  explanation: string;
};

// The Bear Season 1 episodes (t003-t010) plus Dune: Part Two (t031)
const EXAMPLE_WISHLIST = [
  "t003", "t004", "t005", "t006", "t007", "t008", "t009", "t010", "t031",
];

const ACTION_BADGES: Record<string, { label: string; style: string }> = {
  buy_season_bundle: {
    label: "Season bundle",
    style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  watch_single: {
    label: "Watch individually",
    style: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  },
  skip: {
    label: "Skip",
    style: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
};

function fmt(n: number) {
  return String(Math.round(n * 100) / 100);
}

function tokenWord(n: number) {
  return n === 1 ? "token" : "tokens";
}

export default function OptimizerPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message ?? "Could not load the catalogue.");
        }
        // Seasons are left out: the optimizer finds bundles for you.
        setTitles((data.titles as Title[]).filter((t) => t.type !== "season"));
      } catch (e) {
        setCatalogError(
          e instanceof Error ? e.message : "Could not load the catalogue."
        );
      } finally {
        setLoadingCatalog(false);
      }
    }
    load();
  }, []);

  const byId = useMemo(
    () => Object.fromEntries(titles.map((t) => [t.id, t])) as Record<string, Title>,
    [titles]
  );

  const visible = titles.filter((t) =>
    t.title.toLowerCase().includes(search.trim().toLowerCase())
  );
  const selectedTitles = selected
    .map((id) => byId[id])
    .filter((t): t is Title => Boolean(t));
  const individualCost = selectedTitles.reduce((sum, t) => sum + t.tokenCost, 0);

  function changeSelection(next: string[]) {
    setSelected(next);
    setResult(null);
    setError(null);
  }

  function toggle(id: string) {
    changeSelection(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  async function optimize() {
    if (selected.length === 0 || optimizing) return;
    setOptimizing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlist: selected }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(
          data?.error?.message ??
            "The optimizer ran into a problem. Please try again."
        );
      }
      if (!Array.isArray(data.plan)) {
        throw new Error("The optimizer sent back something unexpected.");
      }
      setResult(data as OptimizeResult);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The optimizer ran into a problem. Please try again."
      );
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Token optimizer</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Pick what you want to watch. We find the cheapest way to spend your
        tokens, like a season bundle instead of single episodes.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">1. Pick titles</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies and episodes..."
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />

          {loadingCatalog && (
            <p className="mt-4 text-sm text-neutral-500">Loading catalogue…</p>
          )}
          {catalogError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {catalogError}
            </p>
          )}

          {!loadingCatalog && !catalogError && (
            <ul className="mt-3 max-h-96 divide-y divide-neutral-200 overflow-y-auto rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
              {visible.length === 0 && (
                <li className="px-3 py-3 text-sm text-neutral-500">
                  No titles match that search.
                </li>
              )}
              {visible.map((t) => {
                const chosen = selected.includes(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {t.provider} · {fmt(t.tokenCost)} {tokenWord(t.tokenCost)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(t.id)}
                      className={
                        chosen
                          ? "shrink-0 rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold dark:border-neutral-700"
                          : "shrink-0 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                      }
                    >
                      {chosen ? "Remove" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Your wishlist</h2>

          {selectedTitles.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">
              Nothing picked yet. Add a few titles, or try the example.
            </p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTitles.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    {t.title}
                    <button
                      onClick={() => toggle(t.id)}
                      aria-label={`Remove ${t.title}`}
                      className="font-bold hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                {selectedTitles.length}{" "}
                {selectedTitles.length === 1 ? "title" : "titles"} · {fmt(individualCost)}{" "}
                {tokenWord(individualCost)} if bought one by one
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={optimize}
              disabled={selected.length === 0 || optimizing}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {optimizing && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {optimizing ? "Optimizing…" : "Optimize"}
            </button>
            <button
              onClick={() => changeSelection(EXAMPLE_WISHLIST)}
              disabled={optimizing}
              className="text-sm text-indigo-600 hover:underline disabled:opacity-60 dark:text-indigo-400"
            >
              Try an example
            </button>
            {selected.length > 0 && (
              <button
                onClick={() => changeSelection([])}
                disabled={optimizing}
                className="text-sm text-neutral-500 hover:underline disabled:opacity-60"
              >
                Clear
              </button>
            )}
          </div>

          {optimizing && (
            <p className="mt-4 animate-pulse text-sm text-neutral-500">
              Working out the cheapest plan…
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-lg font-bold">
                {result.tokensSaved > 0
                  ? `You save ${fmt(result.tokensSaved)} ${tokenWord(result.tokensSaved)}`
                  : "No savings on this list"}
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Total {fmt(result.totalCost)} {tokenWord(result.totalCost)} instead of{" "}
                {fmt(result.costIfBoughtIndividually)} one by one.
              </p>

              <ul className="mt-4 space-y-2">
                {result.plan.map((item, i) => {
                  const badge = ACTION_BADGES[item.action] ?? {
                    label: item.action,
                    style: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                  };
                  const replaces = item.replaces ?? [];
                  return (
                    <li
                      key={`${item.titleId}-${i}`}
                      className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="shrink-0 text-sm font-semibold">
                          {fmt(item.tokenCost)} {tokenWord(item.tokenCost)}
                        </p>
                      </div>
                      {replaces.length > 0 && (
                        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                          Replaces {replaces.length}{" "}
                          {replaces.length === 1 ? "title" : "titles"}
                          {item.tokensSaved > 0
                            ? ` and saves ${fmt(item.tokensSaved)} ${tokenWord(item.tokensSaved)}`
                            : ""}
                          .
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-4 text-sm">{result.explanation}</p>

              {result.canAfford && (
                <ApplyPlanButton
                  key={JSON.stringify(result.plan)}
                  plan={result.plan}
                />
              )}

              <p
                className={`mt-3 text-sm font-medium ${
                  result.canAfford
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {result.canAfford
                  ? `You can afford this. Balance after: ${fmt(result.balanceAfter)} ${tokenWord(result.balanceAfter)}.`
                  : "You do not have enough tokens for this plan."}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}