import { NextResponse } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";

export async function GET() {
  try {
    const ai = getGeminiClient();
    const response = await generateWithRetry((model) =>
      ai.models.generateContent({
        model,
        contents: "Say hello in one sentence.",
      }),
    );
    return NextResponse.json({ reply: response.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 },
    );
  }
}
