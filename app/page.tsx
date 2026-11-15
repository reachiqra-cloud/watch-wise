"use client";

import { useEffect, useMemo, useState } from "react";
import TitleCard from "@/components/TitleCard";
import WatchButton from "@/components/WatchButton";
import type { Title } from "@/data/store";

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CataloguePage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState("all");
  const [provider, setProvider] = useState("all");
  const [type, setType] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error?.message ?? "Could not load the catalogue.",
          );
        }
        setTitles(data.titles);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load the catalogue.",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const genres = useMemo(
    () => [...new Set(titles.flatMap((t) => t.genre))].sort(),
    [titles],
  );
  const providers = useMemo(
    () => [...new Set(titles.map((t) => t.provider))].sort(),
    [titles],
  );

  const filtered = titles.filter(
    (t) =>
      (genre === "all" || t.genre.includes(genre)) &&
      (provider === "all" || t.provider === provider) &&
      (type === "all" || t.type === type),
  );

  function clearFilters() {
    setGenre("all");
    setProvider("all");
    setType("all");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Every service, one wallet. Spend tokens on whatever you want to watch.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Genre"
          value={genre}
          onChange={setGenre}
          options={genres}
        />
        <FilterSelect
          label="Provider"
          value={provider}
          onChange={setProvider}
          options={providers}
        />
        <FilterSelect
          label="Type"
          value={type}
          onChange={setType}
          options={["movie", "episode", "season"]}
        />
        <button
          onClick={clearFilters}
          className="rounded-lg px-3 py-2 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Clear filters
        </button>
      </div>

      {loading && (
        <p className="mt-8 text-sm text-slate-500">Loading catalogue…</p>
      )}

      {error && (
        <p className="mt-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {titles.length} titles
          </p>

          {filtered.length === 0 ? (
            <p className="mt-6 text-sm">No titles match those filters.</p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <TitleCard key={t.id} title={t}>
                  <WatchButton titleId={t.id} />
                </TitleCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
