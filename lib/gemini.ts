import { GoogleGenAI } from "@google/genai";

// Server-side only: never import this file from a component or page.
// Put the main model first, then fallbacks. Copy valid names from Google AI Studio.
export const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
];

export const MODEL = MODELS[0];

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart npm run dev.",
    );
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

// Use this instead of calling the API directly. It retries with a short
// pause, and moves to the next model in MODELS if one stays busy.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`503 UNAVAILABLE: timed out after ${ms / 1000}s`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export async function generateWithRetry(
  buildRequest: (model: string) => Promise<unknown>,
  timeoutMs = 12000,
): Promise<any> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await withTimeout(buildRequest(model), timeoutMs);
      } catch (err) {
        lastError = err;
        if (!isRetryable(err)) throw err;
        await sleep(500);
      }
    }
  }
  throw lastError;
}
