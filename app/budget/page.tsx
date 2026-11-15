"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Tier = {
  name: string;
  pricePerMonth: number;
  tokensPerMonth: number;
  monthlySavings?: number;
};

type BudgetResult = {
  summary: string;
  projectedUsage: { week: string; tokens: number }[];
  projectedMonthlyTokens: number;
  suggestedTier?: Tier | null;
  tips?: string[];
};

type Plan = {
  name: string;
  pricePerMonth: number;
  tokensPerMonth: number;
};

function fmt(n: number) {
  return String(Math.round(n * 100) / 100);
}

export default function BudgetPage() {
  const [budget, setBudget] = useState<BudgetResult | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [budgetRes, walletRes] = await Promise.all([
        fetch("/api/budget", { cache: "no-store" }),
        fetch("/api/wallet", { cache: "no-store" }).catch(() => null),
      ]);
      const data = await budgetRes.json().catch(() => null);
      if (!budgetRes.ok || !data) {
        throw new Error(
          data?.error?.message ??
            "The budget planner ran into a problem. Please try again.",
        );
      }
      if (!Array.isArray(data.projectedUsage)) {
        throw new Error("The budget planner sent back something unexpected.");
      }
      setBudget(data as BudgetResult);
      if (walletRes && walletRes.ok) {
        const wallet = await walletRes.json();
        setPlan(wallet.plan ?? null);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The budget planner ran into a problem. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tier = budget?.suggestedTier ?? null;
  const tips = budget?.tips ?? [];
  const savings = tier?.monthlySavings ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget plan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            An AI look at your viewing history, with a plan that fits how you
            actually watch.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {loading ? "Analysing…" : "Refresh analysis"}
        </button>
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Analysing your viewing history…
        </div>
      )}

      {error && !loading && (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {budget && !loading && !error && (
        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Your viewing summary</h2>
            <p className="mt-2 text-sm">{budget.summary}</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Projected weekly usage</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              About {fmt(budget.projectedMonthlyTokens)} tokens this month
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={budget.projectedUsage}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#8ECAE6"
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#9FC3D6", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#9FC3D6", fontSize: 12 }} />
                                    <Tooltip
                    formatter={(value) => `${value} tokens`}
                    contentStyle={{
                      background: "#0B3D5A",
                      border: "1px solid #1F5573",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#F5F1EE" }}
                    itemStyle={{ color: "#8ECAE6" }}
                    cursor={{ fill: "rgba(142,202,230,0.1)" }}
                  />
                  <Bar dataKey="tokens" fill="#8ECAE6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {tier && (
            <section>
              <h2 className="text-lg font-semibold">Plan fit</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {plan && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Your plan now
                    </p>
                    <p className="mt-1 text-xl font-bold">{plan.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      ${fmt(plan.pricePerMonth)} per month ·{" "}
                      {fmt(plan.tokensPerMonth)} tokens
                    </p>
                  </div>
                )}
                <div className="rounded-xl border-2 border-indigo-500 bg-white p-4 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    Suggested for you
                  </p>
                  <p className="mt-1 text-xl font-bold">{tier.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    ${fmt(tier.pricePerMonth)} per month ·{" "}
                    {fmt(tier.tokensPerMonth)} tokens
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {savings > 0
                      ? `Saves $${fmt(savings)} per month`
                      : "Your current plan already fits"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {tips.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">Tips</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
