"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdBanner() {
  const [hasAds, setHasAds] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setHasAds(Boolean(data.plan?.hasAds));
    } catch {
      // Keep whatever we showed before.
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("wallet-updated", load);
    return () => window.removeEventListener("wallet-updated", load);
  }, [load]);

  if (!hasAds) return null;

  return (
    <aside className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:text-sm">
        <p>
          <span className="mr-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            Ad
          </span>
          <strong>SnackBox</strong>: movie-night snacks delivered in 30 minutes.
        </p>
        <Link href="/plans" className="font-semibold underline">
          Remove ads with Premium
        </Link>
      </div>
    </aside>
  );
}