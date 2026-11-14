import { NextResponse } from "next/server";
import { getGeminiClient, generateWithRetry } from "@/lib/gemini";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { toolDeclarations, runTool, getWallet, CATALOG } from "@/lib/tools";

type ChatTurn = { role: "user" | "assistant"; text: string };

const MAX_TOOL_ROUNDS = 5;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  // ---- 1. Validate input ----
  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Request body must be JSON.", 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return errorResponse("BAD_REQUEST", "Please include a message.", 400);
  }
  if (message.length > 1000) {
    return errorResponse("BAD_REQUEST", "Message is too long.", 400);
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? (body.history as ChatTurn[])
        .filter(
          (t) =>
            t &&
            (t.role === "user" || t.role === "assistant") &&
            typeof t.text === "string",
        )
        .slice(-10)
    : [];

  // ---- 2. Build the conversation for Gemini ----
  const contents: any[] = [
    ...history.map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [{ text: t.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const ai = getGeminiClient();

    // ---- 3. Function-calling loop ----
    let response: any;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      response = await generateWithRetry(
        (model) =>
          ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: CHAT_SYSTEM_PROMPT,
              tools: [{ functionDeclarations: toolDeclarations }],
            },
          }),
        20000,
      );

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) break;

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const toolResults = calls.map((call: any) => ({
        functionResponse: {
          name: call.name,
          response: { output: runTool(call.name, call.args ?? {}) },
        },
      }));
      contents.push({ role: "user", parts: toolResults });
    }

    // ---- 4. Parse the final answer ----
    const rawText: string = response?.text ?? "";
    if (!rawText) {
      return errorResponse(
        "AI_ERROR",
        "The assistant returned no answer.",
        502,
      );
    }

    const match = rawText.match(/IDS:\s*(.*)\s*$/im);
    const reply = rawText.replace(/IDS:.*$/im, "").trim();

    const validIds = new Set(CATALOG.map((t) => t.id));
    const recommendedTitles =
      match && match[1].trim().toLowerCase() !== "none"
        ? match[1]
            .split(",")
            .map((s) => s.trim())
            .filter((id) => validIds.has(id))
            .slice(0, 3)
        : [];

    let tokensAfter: number | null = null;
    if (recommendedTitles.length > 0) {
      const top = CATALOG.find((t) => t.id === recommendedTitles[0]);
      if (top) tokensAfter = getWallet().balance - top.tokenCost;
    }

    return NextResponse.json({ reply, recommendedTitles, tokensAfter });
  } catch (err) {
    console.error("chat route error:", err);
    const msg = err instanceof Error ? err.message : "Something went wrong.";
    return errorResponse("AI_ERROR", msg, 502);
  }
}
