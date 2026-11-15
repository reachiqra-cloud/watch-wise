import { NextRequest, NextResponse } from "next/server";
import { MAX_TOPUP, TOKEN_PRICE } from "@/data/pricing";
import { getWalletState } from "@/data/store";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Mock payment: no real money moves. It just adds tokens to the balance.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(
      "BAD_REQUEST",
      'Please send JSON like { "tokens": 5 }.',
      400
    );
  }

  const tokens = (body as { tokens?: unknown } | null)?.tokens;
  if (
    typeof tokens !== "number" ||
    !Number.isInteger(tokens) ||
    tokens < 1 ||
    tokens > MAX_TOPUP
  ) {
    return apiError(
      "BAD_REQUEST",
      `Please choose a whole number of tokens from 1 to ${MAX_TOPUP}.`,
      400
    );
  }

  const wallet = getWalletState();
  wallet.balance = Math.round((wallet.balance + tokens) * 100) / 100;
  const charged = Math.round(tokens * TOKEN_PRICE * 100) / 100;

  return NextResponse.json({
    balance: wallet.balance,
    tokensAdded: tokens,
    charged,
  });
}