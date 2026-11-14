"use client";

import { useEffect, useState } from "react";

type Notice = { kind: "success" | "error"; text: string } | null;

export default function WatchButton({ titleId }: { titleId: string }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function handleWatch() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotice({
          kind: "error",
          text: data?.error?.message ?? "Something went wrong. Please try again.",
        });
        return;
      }

      const left = data.balance;
      setNotice({
        kind: "success",
        text: `Enjoy! ${left} ${left === 1 ? "token" : "tokens"} left.`,
      });
      // Tells the wallet bar at the top to refresh the balance.
      window.dispatchEvent(new Event("wallet-updated"));
    } catch {
      setNotice({
        kind: "error",
        text: "Could not reach the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleWatch}
        disabled={busy}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Watching…" : "Watch"}
      </button>
      {notice && (
        <p
          role="status"
          className={`max-w-[11rem] text-right text-xs ${
            notice.kind === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}