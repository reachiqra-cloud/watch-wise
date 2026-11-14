import { NextRequest, NextResponse } from "next/server";
import catalog from "@/data/catalog.json";
 
const VALID_TYPES = ["episode", "movie", "season"];
 
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const genre = searchParams.get("genre")?.toLowerCase();
  const provider = searchParams.get("provider")?.toLowerCase();
  const type = searchParams.get("type")?.toLowerCase();
 
  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: `Type must be one of: ${VALID_TYPES.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }
 
  const titles = catalog.filter((t) => {
    if (genre && !t.genre.includes(genre)) return false;
    if (provider && t.provider.toLowerCase() !== provider) return false;
    if (type && t.type !== type) return false;
    return true;
  });
 
  return NextResponse.json({ titles });
}
 

