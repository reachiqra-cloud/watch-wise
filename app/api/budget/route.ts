import { NextResponse, connection } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";
import { CATALOG, getHistory, getWallet } from "@/lib/tools";
import { getWalletState } from "@/data/store";
import { PLANS, TOKEN_PRICE, findPlan } from "@/data/pricing";

const SINGLE_TOKEN_PRICE = TOKEN_PRICE;
const DAY = 24 * 60 * 60 * 1000;
const round = (n: number) => Math.round(n * 100) / 100;

// Monthly cost of a plan for a given usage, buying singles for any overage.
function costOnPlan(plan: (typeof PLANS)[number], tokens: number) {
  const extra = Math.max(0, tokens - plan.tokensPerMonth);
  return round(plan.pricePerMonth + extra * SINGLE_TOKEN_PRICE);
}

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

  const weekTotals = [0, 0, 0, 0]; // index 0 = oldest week, 3 = newest
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

  // Plan the user is on now (falls back to Standard)
  const walletPlan = getWalletState().plan as { id?: string } | undefined;
  const currentPlan = findPlan(walletPlan?.id ?? "") ?? PLANS[0];
  const currentCost = costOnPlan(currentPlan, projectedMonthlyTokens);

  // Suggest the plan with the lowest real monthly cost
  const costs = PLANS.map((p) => ({
    plan: p,
    cost: costOnPlan(p, projectedMonthlyTokens),
  }));
  costs.sort((a, b) => a.cost - b.cost);
  const best = costs[0];

  const suggestedTier = {
    id: best.plan.id,
    name: best.plan.name,
    pricePerMonth: best.plan.pricePerMonth,
    tokensPerMonth: best.plan.tokensPerMonth,
    hasAds: best.plan.hasAds,
    monthlySavings: round(Math.max(0, currentCost - best.cost)),
  };

  // Pay-as-you-go comparison (singles only, no subscription)
  const singlesCost = round(projectedMonthlyTokens * SINGLE_TOKEN_PRICE);
  const payAsYouGo = {
    pricePerToken: SINGLE_TOKEN_PRICE,
    monthlyCost: singlesCost,
    cheaperThanSuggested: singlesCost < best.cost,
    savingsVsSuggested: round(Math.max(0, best.cost - singlesCost)),
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

  // ---- 2. Fallback wording (used if Gemini fails) ----
  let summary =
    watched.length === 0
      ? "No viewing history yet, so there's nothing to analyze."
      : `You've used about ${projectedMonthlyTokens} tokens in the last four weeks, mostly ${topGenres.join(" and ")}.`;
  const tips: string[] = [];
  if (payAsYouGo.cheaperThanSuggested) {
    tips.push(
      `At ${projectedMonthlyTokens} tokens a month, buying singles costs $${singlesCost} versus $${best.cost} for ${best.plan.name}, saving $${payAsYouGo.savingsVsSuggested}.`,
    );
  } else {
    tips.push(
      `${best.plan.name} is your cheapest option at $${best.cost} a month.`,
    );
  }
  tips.push(
    `Premium costs $${PLANS[1].pricePerMonth - PLANS[0].pricePerMonth} more than Standard and only removes the ads.`,
  );

  // ---- 3. Gemini writes the summary and tips ----
  let finalTips = tips;
  if (watched.length > 0) {
    try {
      const ai = getGeminiClient();
      const prompt = `You are WatchWise, an entertainment budgeting assistant. Using ONLY the facts below, write a personalized monthly plan. Do not invent or change any numbers or prices.

Facts:
- Tokens used in the last 4 weeks: ${projectedMonthlyTokens}
- Weekly usage: ${JSON.stringify(projectedUsage)}
- Top genres: ${topGenres.join(", ")}
- Top streaming services: ${topProviders.join(", ")}
- Plans: Standard $25/month = 20 tokens (with ads); Premium $30/month = 20 tokens (no ads). Single tokens cost $${SINGLE_TOKEN_PRICE} each.
- Current plan: ${currentPlan.name}, estimated monthly cost $${currentCost}
- Cheapest plan for this usage: ${best.plan.name}, estimated monthly cost $${best.cost}
- Pay-as-you-go (singles only) would cost $${singlesCost} a month; cheaper than the best plan: ${payAsYouGo.cheaperThanSuggested}
- Singles beat Standard when usage is below about 17 tokens a month
- Current token balance: ${getWallet().balance}

Respond with ONLY JSON in this exact shape:
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
        finalTips = parsed.tips
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
    payAsYouGo,
    tips: finalTips,
  });
}
