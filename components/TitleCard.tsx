import type { ReactNode } from "react";
import type { Title } from "@/data/store";

const PROVIDER_STYLES: Record<string, string> = {
  Netflix: "bg-red-600 text-white",
  "Prime Video": "bg-sky-600 text-white",
  "Disney+": "bg-blue-700 text-white",
  Hulu: "bg-emerald-500 text-black",
};

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  episode: "Episode",
  season: "Season bundle",
};

function formatRuntime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function TitleCard({
  title,
  children,
}: {
  title: Title;
  children?: ReactNode;
}) {
  const providerStyle =
    PROVIDER_STYLES[title.provider] ?? "bg-slate-600 text-white";
  const tokenLabel = `${title.tokenCost} ${title.tokenCost === 1 ? "token" : "tokens"}`;

  return (
    <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${providerStyle}`}
          >
            {title.provider}
          </span>
          {title.isNewRelease && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-black">
              New
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold leading-snug">{title.title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {TYPE_LABELS[title.type] ?? title.type} ·{" "}
          {formatRuntime(title.runtimeMinutes)}
          {title.episodeCount ? ` · ${title.episodeCount} episodes` : ""}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {title.genre.map((g) => (
            <span
              key={g}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
          {tokenLabel}
        </span>
        {children}
      </div>
    </article>
  );
}
