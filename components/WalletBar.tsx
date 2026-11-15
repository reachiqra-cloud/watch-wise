"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";

// Any other component can tell this bar to refresh the balance by running:
//   window.dispatchEvent(new Event("wallet-updated"));

const NAV_LINKS = [
  { href: "/", label: "Catalogue" },
  { href: "/assistant", label: "Assistant" },
  { href: "/optimizer", label: "Optimizer" },
  { href: "/budget", label: "Analysis" },
  { href: "/history", label: "History" },
  { href: "/plans", label: "Plans" },
  { href: "/about", label: "About" },
];

function formatTokens(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function NavLinks({ className }: { className: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-2 py-1 ${
              active
                ? "bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
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
  const pillText = failed
    ? "Wallet unavailable"
    : balance === null
      ? "Loading…"
      : `${formatTokens(balance)} ${balance === 1 ? "token" : "tokens"}`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-[#1b2a41]/90">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            WatchWise
          </Link>

          <NavLinks className="hidden items-center gap-1 text-sm lg:flex" />

          <div className="flex items-center gap-3">
            <div
              aria-live="polite"
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                low ? "bg-amber-500 text-black" : "bg-indigo-600 text-white"
              }`}
            >
              {pillText}
            </div>
            <AuthButton />
          </div>
        </div>

        <NavLinks className="-mx-1 flex gap-1 overflow-x-auto pb-2 text-sm lg:hidden" />
      </div>
    </header>
  );
}
