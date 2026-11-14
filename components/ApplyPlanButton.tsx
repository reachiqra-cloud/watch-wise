"use client";

import { useState } from "react";

type PlanItem = {
  action: string;
  titleId: string;
  title: string;
  tokenCost: number;
};

function fmt(n: number) {
  return String(Math.round(n * 100) / 100);
}

export default function ApplyPlanButton({ plan }: { plan: PlanItem[] }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const steps = plan.filter((p) => p.action !== "skip");
  if (steps.length === 0) return null;

  async function apply() {
    setBusy(true);
    setMessage(null);
    let count = 0;
    let spent = 0;
    try {
      for (const step of steps) {
        const res = await fetch("/api/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleId: step.titleId }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            data?.error?.message ?? `Could not buy ${step.title}.`
          );
        }
        count += 1;
        spent += data?.entry?.tokensSpent ?? step.tokenCost;
      }
      setDone(true);
      setMessage({
        ok: true,
        text: `Done! ${count} ${count === 1 ? "purchase" : "purchases"} made, ${fmt(spent)} tokens spent.`,
      });
    } catch (e) {
      const base =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setMessage({
        ok: false,
        text:
          count > 0
            ? `${base} The first ${count} ${count === 1 ? "item was" : "items were"} already bought.`
            : base,
      });
    } finally {
      // Tells the wallet bar at the top to refresh the balance.
      window.dispatchEvent(new Event("wallet-updated"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={apply}
        disabled={busy || done}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {busy ? "Buying…" : done ? "Plan applied" : "Buy this plan"}
      </button>
      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${
            message.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}