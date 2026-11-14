import { NextResponse } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";

const DEFAULT_QUESTION =
  "What movies and shows are new or trending this week on Netflix, Prime Video, Disney+ and Hulu?";

export async function POST(req: Request) {
  let question = DEFAULT_QUESTION;
  try {
    const body = await req.json();
    if (typeof body?.question === "string" && body.question.trim()) {
      question = body.question.trim().slice(0, 300);
    }
  } catch {
    // no body is fine: use the default question
  }

  try {
    const ai = getGeminiClient();
    const response = await generateWithRetry(
      (model) =>
        ai.models.generateContent({
          model,
          contents: `You are WatchWise, an entertainment assistant. Answer using current information from Google Search. Be concise (3 to 5 sentences). Mention which streaming service each title is on. Do not mention token costs.\n\nQuestion: ${question}`,
          config: { tools: [{ googleSearch: {} }] },
        }),
      25000,
    );

    const reply: string = response?.text ?? "";
    if (!reply) {
      return NextResponse.json(
        { error: { code: "AI_ERROR", message: "No answer returned." } },
        { status: 502 },
      );
    }

    const chunks =
      response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    const sources: { title: string; url: string }[] = [];
    for (const c of chunks) {
      const url = c?.web?.uri;
      if (url && !seen.has(url)) {
        seen.add(url);
        sources.push({ title: c.web.title ?? url, url });
      }
    }

    return NextResponse.json({ reply, sources: sources.slice(0, 5) });
  } catch (err) {
    console.error("trending route error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 },
    );
  }
}
