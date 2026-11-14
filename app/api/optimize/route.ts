import { NextResponse } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";
import { CATALOG, getWallet, type Title } from "@/lib/tools";

type PlanItem = {
  action: "buy_season_bundle" | "watch_single";
  titleId: string;
  title: string;
  tokenCost: number;
  replaces: string[];
  tokensSaved: number;
};

const round = (n: number) => Math.round(n * 100) / 100;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  // ---- 1. Validate input ----
  let body: { wishlist?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Request body must be JSON.", 400);
  }

  if (
    !Array.isArray(body.wishlist) ||
    body.wishlist.length === 0 ||
    body.wishlist.length > 30 ||
    !body.wishlist.every((id) => typeof id === "string")
  ) {
    return errorResponse(
      "BAD_REQUEST",
      "wishlist must be a list of 1 to 30 title ids.",
      400,
    );
  }

  const byId = new Map(CATALOG.map((t) => [t.id, t]));
  const ids = Array.from(new Set(body.wishlist as string[]));
  const items: Title[] = [];
  for (const id of ids) {
    const t = byId.get(id);
    if (!t) return errorResponse("NOT_FOUND", `Unknown title id: ${id}`, 404);
    items.push(t);
  }

  // ---- 2. Compute the plan IN CODE ----
  // Group episodes by season, e.g. "The Bear S1E3" -> "The Bear Season 1"
  const groups = new Map<string, Title[]>();
  const singles: Title[] = [];
  for (const t of items) {
    const m = t.type === "episode" ? t.title.match(/^(.*) S(\d+)E\d+$/) : null;
    if (m) {
      const key = `${m[1]} Season ${m[2]}`;
      groups.set(key, [...(groups.get(key) ?? []), t]);
    } else {
      singles.push(t);
    }
  }

  const plan: PlanItem[] = [];
  for (const [key, eps] of groups) {
    const bundle = CATALOG.find((t) => t.type === "season" && t.title === key);
    const epTotal = round(eps.reduce((s, e) => s + e.tokenCost, 0));
    if (bundle && bundle.tokenCost < epTotal) {
      plan.push({
        action: "buy_season_bundle",
        titleId: bundle.id,
        title: bundle.title,
        tokenCost: bundle.tokenCost,
        replaces: eps.map((e) => e.id),
        tokensSaved: round(epTotal - bundle.tokenCost),
      });
    } else {
      singles.push(...eps); // bundle not cheaper: watch individually
    }
  }
  for (const t of singles) {
    plan.push({
      action: "watch_single",
      titleId: t.id,
      title: t.title,
      tokenCost: t.tokenCost,
      replaces: [],
      tokensSaved: 0,
    });
  }

  const totalCost = round(plan.reduce((s, p) => s + p.tokenCost, 0));
  const costIfBoughtIndividually = round(
    items.reduce((s, t) => s + t.tokenCost, 0),
  );
  const tokensSaved = round(costIfBoughtIndividually - totalCost);

  // TODO: replace with the real wallet balance once Person A's route is wired in.
  const balance = getWallet().balance;
  const canAfford = totalCost <= balance;
  const balanceAfter = round(balance - totalCost);

  // ---- 3. Gemini writes the explanation (fallback if it fails) ----
  let explanation =
    tokensSaved > 0
      ? `This plan costs ${totalCost} tokens instead of ${costIfBoughtIndividually}, saving you ${tokensSaved}.`
      : `Buying these individually is already the cheapest option at ${totalCost} tokens.`;
  if (!canAfford) {
    explanation += ` You'd need ${round(totalCost - balance)} more tokens than your balance of ${balance}.`;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are WatchWise, an entertainment budgeting assistant. Explain this token plan to the user in 1 to 2 friendly sentences. Use ONLY the numbers given. Do not change or add numbers.

Plan: ${JSON.stringify(plan)}
Total cost: ${totalCost} tokens
Cost if bought individually: ${costIfBoughtIndividually} tokens
Tokens saved: ${tokensSaved}
User balance: ${balance} tokens
Can afford: ${canAfford}
Balance after: ${balanceAfter}`;

    const response = await generateWithRetry(
      (model) => ai.models.generateContent({ model, contents: prompt }),
      12000,
    );
    if (response?.text?.trim()) explanation = response.text.trim();
  } catch (err) {
    console.error("optimize explanation failed, using fallback:", err);
  }

  return NextResponse.json({
    plan,
    totalCost,
    costIfBoughtIndividually,
    tokensSaved,
    canAfford,
    balanceAfter,
    explanation,
  });
}
