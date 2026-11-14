import { Type } from "@google/genai";
import catalogData from "@/data/catalog.json";

// ---------- Types (match CONTRACT.md) ----------
export type Title = {
  id: string;
  title: string;
  provider: string;
  type: "episode" | "movie" | "season";
  genre: string[];
  runtimeMinutes: number;
  isNewRelease: boolean;
  tokenCost: number;
  episodeCount: number | null;
};

export type HistoryEntry = {
  titleId: string;
  title: string;
  tokensSpent: number;
  watchedAt: string;
};

// ---------- Real catalogue (Person A's data/catalog.json) ----------
export const CATALOG = catalogData as unknown as Title[];

// ---------- STUB wallet + history ----------
// TODO: replace with the real state from Person A's /api/wallet route.
const WALLET = { balance: 14.5 };
const HISTORY: HistoryEntry[] = [
  {
    titleId: "t003",
    title: "The Bear S1E1",
    tokensSpent: 0.5,
    watchedAt: "2026-11-02T20:15:00Z",
  },
];

// ---------- Tool implementations ----------
export function searchCatalog(args: {
  genre?: string;
  provider?: string;
  type?: string;
  titleContains?: string;
  maxTokenCost?: number;
  maxRuntimeMinutes?: number;
  newReleasesOnly?: boolean;
}): { titles: Title[] } {
  let results = CATALOG;

  if (args.genre) {
    const g = args.genre.toLowerCase();
    results = results.filter((t) => t.genre.some((x) => x.toLowerCase() === g));
  }
  if (args.provider) {
    const p = args.provider.toLowerCase();
    results = results.filter((t) => t.provider.toLowerCase() === p);
  }
  if (args.type) {
    results = results.filter((t) => t.type === args.type);
  }
  if (args.titleContains) {
    const q = args.titleContains.toLowerCase();
    results = results.filter((t) => t.title.toLowerCase().includes(q));
  }
  if (typeof args.maxTokenCost === "number") {
    results = results.filter((t) => t.tokenCost <= args.maxTokenCost!);
  }
  if (typeof args.maxRuntimeMinutes === "number") {
    results = results.filter(
      (t) => t.runtimeMinutes <= args.maxRuntimeMinutes!,
    );
  }
  if (args.newReleasesOnly) {
    results = results.filter((t) => t.isNewRelease);
  }

  return { titles: results.slice(0, 12) }; // cap so we don't flood the model
}

export function getWallet() {
  return { balance: WALLET.balance };
}

export function getHistory() {
  return { history: HISTORY };
}

// ---------- Tool declarations Gemini sees ----------
export const toolDeclarations = [
  {
    name: "search_catalog",
    description:
      "Search the WatchWise catalogue. Returns up to 12 matching titles with their token cost. Use this before recommending anything. All filters are optional and combine together.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        genre: {
          type: Type.STRING,
          description:
            "One lowercase genre, e.g. comedy, drama, sci-fi, horror, thriller, action, animation, family, romance, mystery, fantasy, musical, adventure, history",
        },
        provider: {
          type: Type.STRING,
          description: "Netflix, Prime Video, Disney+, or Hulu",
        },
        type: {
          type: Type.STRING,
          description: "episode, movie, or season",
        },
        titleContains: {
          type: Type.STRING,
          description: "Text the title must contain, e.g. 'Bear' or 'Stranger'",
        },
        maxTokenCost: {
          type: Type.NUMBER,
          description: "Only titles costing at most this many tokens",
        },
        maxRuntimeMinutes: {
          type: Type.NUMBER,
          description: "Only titles up to this length in minutes",
        },
        newReleasesOnly: {
          type: Type.BOOLEAN,
          description: "Only new releases",
        },
      },
    },
  },
  {
    name: "get_wallet",
    description:
      "Get the user's current token balance. Always check this before recommending.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_history",
    description:
      "Get the user's watch history, to learn their tastes and avoid repeating titles.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

// ---------- Dispatcher: runs whichever tool Gemini asks for ----------
export function runTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "search_catalog":
      return searchCatalog(args as Parameters<typeof searchCatalog>[0]);
    case "get_wallet":
      return getWallet();
    case "get_history":
      return getHistory();
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
