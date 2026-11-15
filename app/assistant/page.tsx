"use client";

import { useEffect, useRef, useState } from "react";
import TitleCard from "@/components/TitleCard";
import WatchButton from "@/components/WatchButton";
import type { Title } from "@/data/store";

type Msg = {
  id: number;
  role: "user" | "assistant";
  text: string;
  titleIds?: string[];
  isError?: boolean;
  skip?: boolean; // left out of the history we send to the server
};

const STARTERS = [
  "Something funny for date night, under 2 hours",
  "I only have 5 tokens left. What should I watch?",
  "What is the cheapest way to binge a sci-fi show?",
];

function bubbleClass(m: Msg) {
  const base = "whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm";
  if (m.role === "user") {
    return `${base} rounded-br-sm bg-indigo-600 text-white`;
  }
  if (m.isError) {
    return `${base} rounded-bl-sm border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300`;
  }
  return `${base} rounded-bl-sm bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100`;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [catalog, setCatalog] = useState<Record<string, Title>>({});
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        const map: Record<string, Title> = {};
        for (const t of data.titles as Title[]) map[t.id] = t;
        setCatalog(map);
      } catch {
        // If this fails, recommended titles just will not show as cards.
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);
    useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      window.history.replaceState(null, "", "/assistant");
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    // Earlier turns only (not the new message), skipping failed ones.
    const history = messages
      .filter((m) => !m.skip)
      .map((m) => ({ role: m.role, text: m.text }));

    const userMsg: Msg = { id: nextId.current++, role: "user", text: message };
    const replyId = nextId.current++;

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        throw new Error(
          data?.error?.message ??
            "The assistant ran into a problem. Please try again.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: replyId,
          role: "assistant",
          text: data.reply,
          titleIds: data.recommendedTitles ?? [],
        },
      ]);
    } catch (e) {
      const errText =
        e instanceof Error
          ? e.message
          : "The assistant ran into a problem. Please try again.";
      setMessages((prev) => [
        ...prev.map((m) => (m.id === userMsg.id ? { ...m, skip: true } : m)),
        {
          id: replyId,
          role: "assistant",
          text: errText,
          isError: true,
          skip: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistant</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell me what you are in the mood for. I check the catalogue and your
          wallet before recommending anything.
        </p>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-slate-500">Try one of these:</p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={sending}
                className="rounded-full border border-indigo-300 px-3 py-1.5 text-left text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div className="max-w-[85%]">
              <div className={bubbleClass(m)}>{m.text}</div>
              {m.titleIds && m.titleIds.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {m.titleIds.map((id) =>
                    catalog[id] ? (
                      <TitleCard key={id} title={catalog[id]}>
                        <WatchButton titleId={id} />
                      </TitleCard>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm text-slate-500 shadow-sm dark:bg-slate-800">
              Thinking… checking the catalogue and your wallet
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          disabled={sending}
          placeholder="Ask for a recommendation..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={sending || input.trim() === ""}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
