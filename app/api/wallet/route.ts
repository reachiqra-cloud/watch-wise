import { NextResponse, connection } from "next/server";
import { getWalletState } from "@/data/store";

export async function GET() {
  // Tells Next.js this answer changes over time, so it must never be
  // frozen at build time (matters when we deploy).
  await connection();
  return NextResponse.json(getWalletState());
}