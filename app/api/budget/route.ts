import { NextResponse, connection } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";
import { CATALOG, getHistory, getWallet } from "@/lib/tools";

const TIERS = [
  { name: "Lite", pricePerMonth: 18, tokensPerMonth: 15 },
  { name: "Standard", pricePerMonth: 25, tokensPerMonth: 20 },
  { name: "Plus", pricePerMonth: 35, tokensPerMonth: 30 },
];
const CURRENT_TIER = TIERS[1]; // user is on Standard ($25, 20 tokens)
const DAY = 24 * 60 * 60 * 1000;
const round = (n: number) => Math.round(n * 100) / 100;

function topCounts(values: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

export async function GET() {
  await connection(); // always compute fresh (uses the current time)

  // ---- 1. Compute everything in code ----
  const { history } = getHistory();
  const now = Date.now();

  // Last 28 days in 4 weekly buckets: index 0 = oldest, 3 = newest
  const weekTotals = [0, 0, 0, 0];
  for (const h of history) {
    const daysAgo = (now - new Date(h.watchedAt).getTime()) / DAY;
    if (daysAgo < 0 || daysAgo >= 28) continue;
    weekTotals[3 - Math.floor(daysAgo / 7)] += h.tokensSpent;
  }
  const projectedUsage = weekTotals.map((t, i) => ({
    week: `Week ${i + 1}`,
    tokens: round(t),
  }));
  const projectedMonthlyTokens = round(weekTotals.reduce((a, b) => a + b, 0));

  // Cheapest tier that covers usage with a 10% cushion
  const tier =
    TIERS.find((t) => t.tokensPerMonth >= projectedMonthlyTokens * 1.1) ??
    TIERS[TIERS.length - 1];
  const suggestedTier = {
    ...tier,
    monthlySavings: Math.max(
      0,
      CURRENT_TIER.pricePerMonth - tier.pricePerMonth,
    ),
  };

  const watched = history
    .map((h) => CATALOG.find((t) => t.id === h.titleId))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const topGenres = topCounts(
    watched.flatMap((t) => t.genre),
    3,
  );
  const topProviders = topCounts(
    watched.map((t) => t.provider),
    2,
  );
  const episodeShare = watched.length
    ? Math.round(
        (watched.filter((t) => t.type === "episode").length / watched.length) *
          100,
      )
    : 0;

  // ---- 2. Fallback wording (used if Gemini fails) ----
  let summary =
    watched.length === 0
      ? "No viewing history yet, so there's nothing to analyze."
      : `You've used about ${projectedMonthlyTokens} tokens this month, mostly ${topGenres.join(" and ")}.`;
  let tips: string[] =
    suggestedTier.monthlySavings > 0
      ? [
          `Your usage fits the ${tier.name} tier (${tier.tokensPerMonth} tokens), saving $${suggestedTier.monthlySavings} a month.`,
        ]
      : [`Your usage fits your current ${CURRENT_TIER.name} tier.`];

  // ---- 3. Gemini writes the summary and tips ----
  if (watched.length > 0) {
    try {
      const ai = getGeminiClient();
      const prompt = `You are WatchWise, an entertainment budgeting assistant. Using ONLY the facts below, write a personalized monthly plan.

Facts:
- Tokens used in the last 4 weeks: ${projectedMonthlyTokens}
- Weekly usage: ${JSON.stringify(projectedUsage)}
- Top genres: ${topGenres.join(", ")}
- Top streaming services: ${topProviders.join(", ")}
- Share of watches that were single episodes: ${episodeShare}%
- Current plan: ${CURRENT_TIER.name}, $${CURRENT_TIER.pricePerMonth}/month, ${CURRENT_TIER.tokensPerMonth} tokens
- Suggested plan: ${tier.name}, $${tier.pricePerMonth}/month, ${tier.tokensPerMonth} tokens
- Monthly savings from switching: $${suggestedTier.monthlySavings}
- Current token balance: ${getWallet().balance}

Do not invent or change any numbers. Respond with ONLY JSON in this exact shape:
{"summary": "1-2 friendly sentences about their habits", "tips": ["tip 1", "tip 2"]}`;

      const response = await generateWithRetry(
        (model) =>
          ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" },
          }),
        15000,
      );
      const text = (response?.text ?? "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      if (typeof parsed.summary === "string" && parsed.summary.trim()) {
        summary = parsed.summary.trim();
      }
      if (Array.isArray(parsed.tips) && parsed.tips.length > 0) {
        tips = parsed.tips
          .filter((t: unknown) => typeof t === "string")
          .slice(0, 4);
      }
    } catch (err) {
      console.error("budget wording failed, using fallback:", err);
    }
  }

  return NextResponse.json({
    summary,
    projectedUsage,
    projectedMonthlyTokens,
    suggestedTier,
    tips,
  });
}
