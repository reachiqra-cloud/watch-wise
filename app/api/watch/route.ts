import { NextRequest, NextResponse } from "next/server";
import { findTitle, getWalletState, type HistoryEntry } from "@/data/store";
 
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
      'Please send JSON like { "titleId": "t014" }.',
      400
    );
  }
 
  const titleId = (body as { titleId?: unknown } | null)?.titleId;
  if (typeof titleId !== "string" || titleId.trim() === "") {
    return apiError(
      "BAD_REQUEST",
      'Please send a titleId, for example { "titleId": "t014" }.',
      400
    );
  }
 
  const title = findTitle(titleId);
  if (!title) {
    return apiError(
      "NOT_FOUND",
      `We couldn't find a title with id "${titleId}".`,
      404
    );
  }
 
  const wallet = getWalletState();
  if (wallet.balance < title.tokenCost) {
    return apiError(
      "INSUFFICIENT_TOKENS",
      `You need ${title.tokenCost} tokens but only have ${wallet.balance}.`,
      400
    );
  }
 
  wallet.balance = Math.round((wallet.balance - title.tokenCost) * 100) / 100;
 
  const entry: HistoryEntry = {
    titleId: title.id,
    title: title.title,
    tokensSpent: title.tokenCost,
    watchedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
  wallet.history.unshift(entry);
 
  return NextResponse.json({ balance: wallet.balance, entry });
}
 




