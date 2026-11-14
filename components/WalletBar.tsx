"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Any other component can tell this bar to refresh the balance by running:
//   window.dispatchEvent(new Event("wallet-updated"));

function formatTokens(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function WalletBar() {
  const [balance, setBalance] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      if (!res.ok) throw new Error("Wallet request failed");
      const data = await res.json();
      setBalance(data.balance);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    loadWallet();
    window.addEventListener("wallet-updated", loadWallet);
    return () => window.removeEventListener("wallet-updated", loadWallet);
  }, [loadWallet]);

  const low = balance !== null && balance < 3;

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            WatchWise
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-300">
            <Link
              href="/"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              Catalogue
            </Link>
            <Link
              href="/history"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              History
            </Link>
                        <Link
              href="/assistant"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              Assistant
            </Link>
                        <Link
              href="/optimizer"
              className="hover:text-neutral-900 dark:hover:text-white"
            >
              Optimizer
            </Link>
          </nav>
        </div>

        <div
          aria-live="polite"
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            low ? "bg-amber-500 text-black" : "bg-indigo-600 text-white"
          }`}
        >
          {failed
            ? "Wallet unavailable"
            : balance === null
              ? "Loading…"
              : `${formatTokens(balance)} tokens`}
        </div>
      </div>
    </header>
  );
}