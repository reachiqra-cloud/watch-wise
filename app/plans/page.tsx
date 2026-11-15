"use client";

import { useCallback, useEffect, useState } from "react";
import { PLANS, TOKEN_PRICE, TOPUP_OPTIONS } from "@/data/pricing";

type WalletSummary = {
  plan: { id?: string; name: string };
  balance: number;
};

type Notice = { ok: boolean; text: string } | null;

function money(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function fmt(n: number) {
  return String(Math.round(n * 100) / 100);
}

function tokenWord(n: number) {
  return n === 1 ? "token" : "tokens";
}

export default function PlansPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Could not load your wallet.");
      }
      setWallet({ plan: data.plan, balance: data.balance });
      setLoadError(null);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Could not load your wallet."
      );
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function post(path: string, body: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      throw new Error(
        data?.error?.message ?? "Something went wrong. Please try again."
      );
    }
    return data;
  }

  async function switchPlan(planId: string, planName: string) {
    setBusy(`plan-${planId}`);
    setNotice(null);
    try {
      await post("/api/plan", { planId });
      setNotice({ ok: true, text: `You are now on the ${planName} plan.` });
      await loadWallet();
      window.dispatchEvent(new Event("wallet-updated"));
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : "Could not switch plans.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function buyTokens(tokens: number) {
    setBusy(`tokens-${tokens}`);
    setNotice(null);
    try {
      const data = await post("/api/topup", { tokens });
      setNotice({
        ok: true,
        text: `Added ${tokens} ${tokenWord(tokens)} for ${money(data.charged)}. You now have ${fmt(data.balance)} ${tokenWord(data.balance)}.`,
      });
      await loadWallet();
      window.dispatchEvent(new Event("wallet-updated"));
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : "Could not buy tokens.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Plans and tokens</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {wallet
          ? `You are on the ${wallet.plan.name} plan with ${fmt(wallet.balance)} ${tokenWord(wallet.balance)} in your wallet.`
          : "Choose how you want to pay."}
      </p>

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {loadError}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            notice.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const current = wallet?.plan.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border-2 bg-white p-5 dark:bg-neutral-900 ${
                current
                  ? "border-indigo-500"
                  : "border-neutral-200 dark:border-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                {current && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Current plan
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="text-3xl font-bold">
                  {money(plan.pricePerMonth)}
                </span>
                <span className="text-sm text-neutral-500"> / month</span>
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                <li>{plan.tokensPerMonth} tokens a month</li>
                <li>
                  {money(plan.pricePerMonth / plan.tokensPerMonth)} per token
                </li>
                <li>{plan.hasAds ? "Includes ads" : "No ads"}</li>
              </ul>
              <button
                onClick={() => switchPlan(plan.id, plan.name)}
                disabled={current || busy !== null || !wallet}
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === `plan-${plan.id}`
                  ? "Switching…"
                  : current
                    ? "Current plan"
                    : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Need more tokens?</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Buy single tokens any time for {money(TOKEN_PRICE)} each.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {TOPUP_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => buyTokens(n)}
              disabled={busy !== null || !wallet}
              className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
            >
              {busy === `tokens-${n}`
                ? "Buying…"
                : `Buy ${n} ${tokenWord(n)} · ${money(n * TOKEN_PRICE)}`}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          Demo only: no real payments are made.
        </p>
      </section>
    </div>
  );
}