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

const GENRE_GRADIENTS: Record<string, [string, string]> = {
  comedy: ["#FF9E8B", "#FFD6A5"],
  drama: ["#3B6FA0", "#8ECAE6"],
  "sci-fi": ["#0B5C8C", "#4FD1C5"],
  horror: ["#5B1A2B", "#B23A48"],
  action: ["#E4572E", "#FFB347"],
  romance: ["#E5738E", "#FFC2D1"],
  animation: ["#2BB3A3", "#A8E6CF"],
  family: ["#F4A261", "#FFE29A"],
  mystery: ["#3D3B8E", "#8E7CC3"],
  thriller: ["#1F3A5F", "#C0392B"],
  fantasy: ["#7B4FB5", "#E0A3FF"],
  history: ["#8A6A3F", "#E3C48F"],
  musical: ["#C2418A", "#FFB3D9"],
  adventure: ["#2E8B57", "#F2D16B"],
};

const DEFAULT_GRADIENT: [string, string] = ["#15506E", "#8ECAE6"];

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
    PROVIDER_STYLES[title.provider] ?? "bg-neutral-600 text-white";
  const tokenLabel = `${title.tokenCost} ${title.tokenCost === 1 ? "token" : "tokens"}`;
  const [from, to] = GENRE_GRADIENTS[title.genre[0]] ?? DEFAULT_GRADIENT;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div
        className="relative h-20"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${providerStyle}`}
        >
          {title.provider}
        </span>
        {title.isNewRelease && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-black">
            New
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-3 text-5xl font-bold leading-none text-white/40"
        >
          {title.title.charAt(0)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-base font-semibold leading-snug">
            {title.title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {TYPE_LABELS[title.type] ?? title.type} ·{" "}
            {formatRuntime(title.runtimeMinutes)}
            {title.episodeCount ? ` · ${title.episodeCount} episodes` : ""}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {title.genre.map((g) => (
              <span
                key={g}
                className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
      </div>
    </article>
  );
}