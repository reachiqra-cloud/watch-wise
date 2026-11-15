import Link from "next/link";

const TOKEN_PRICES = [
  { label: "Short episode", cost: "0.5 tokens" },
  { label: "Standard movie", cost: "1 token" },
  { label: "New release", cost: "2 tokens" },
  { label: "Season bundle", cost: "Cheaper than the episodes" },
];

const AI_FEATURES = [
  {
    title: "Assistant",
    href: "/assistant",
    body: "Ask for a recommendation in plain English. Gemini checks the catalogue, your wallet and your watch history with function calling before it answers, and only suggests what you can afford.",
  },
  {
    title: "Token optimizer",
    href: "/optimizer",
    body: "Pick a wishlist and get the cheapest way to watch it, such as a season bundle instead of single episodes. The math is done in code. Gemini chooses the strategy and explains it.",
  },
  {
    title: "Budget plan",
    href: "/budget",
    body: "Gemini reads your viewing history, projects your weekly usage and suggests the plan that fits how you really watch.",
  },
];

const PILLARS = [
  {
    title: "Build",
    body: "Two people, two days. We agreed on an API contract first, so the frontend and the AI backend could be built at the same time.",
  },
  {
    title: "Secure",
    body: "The Gemini key stays on the server and never reaches the browser. Prices and token math live in code, so the AI cannot invent them. Chat input is length-limited and every error comes back in one friendly shape.",
  },
  {
    title: "Scalable",
    body: "The API routes are stateless apart from one small wallet module. Swapping it for a database such as Firestore does not change the API.",
  },
];

const CARD =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-8">
      <section className="pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          UCSC GDG DevFest 2026
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          One subscription. Every streaming service.
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
          WatchWise is an AI-powered wallet for streaming: one monthly plan,
          shared tokens, and Gemini to help you get the most out of them.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/assistant"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Try the assistant
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Browse the catalogue
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">The problem</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          We pay for Netflix, Prime Video, Disney+ and Hulu. That is $60+ a
          month, and most of us only watch a few things on each one.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">
          One wallet, shared tokens
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Plans start at $25 a month for 20 tokens with ads, or $30 with no ads. Tokens work on every service, and you can top up with single tokens for $1.50 each.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TOKEN_PRICES.map((p) => (
            <div key={p.label} className={CARD}>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {p.label}
              </p>
              <p className="mt-1 font-semibold text-indigo-600 dark:text-indigo-400">
                {p.cost}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Prices are fixed in code. The AI never decides what something costs.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">How Gemini helps</h2>
        <div className="mt-4 space-y-3">
          {AI_FEATURES.map((f) => (
            <div key={f.title} className={CARD}>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {f.body}
              </p>
              <Link
                href={f.href}
                className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Try it →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">
          Build. Secure. Scalable.
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className={CARD}>
              <h3 className="font-semibold text-indigo-600 dark:text-indigo-400">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">
          What is real, what is mock
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          The AI layer is real. The streaming catalogue and billing are mock
          data, because there are no public streaming APIs and real content
          needs licensing. Watching a title simply spends tokens.
        </p>
      </section>
    </div>
  );
}
