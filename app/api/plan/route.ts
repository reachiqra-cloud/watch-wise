import { NextRequest, NextResponse } from "next/server";
import { findPlan } from "@/data/pricing";
import { getWalletState } from "@/data/store";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(
      "BAD_REQUEST",
      'Please send JSON like { "planId": "premium" }.',
      400
    );
  }

  const planId = (body as { planId?: unknown } | null)?.planId;
  if (typeof planId !== "string" || planId.trim() === "") {
    return apiError(
      "BAD_REQUEST",
      'Please send a planId, for example { "planId": "premium" }.',
      400
    );
  }

  const plan = findPlan(planId);
  if (!plan) {
    return apiError(
      "NOT_FOUND",
      `We couldn't find a plan called "${planId}".`,
      404
    );
  }

  const wallet = getWalletState();
  wallet.plan = {
    id: plan.id,
    name: plan.name,
    pricePerMonth: plan.pricePerMonth,
    tokensPerMonth: plan.tokensPerMonth,
    hasAds: plan.hasAds,
  };

  return NextResponse.json({ plan: wallet.plan, balance: wallet.balance });
}