"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setAvailable(false);
      setReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setError("");
      setReady(true);
    });
    return unsubscribe;
  }, []);

  async function handleSignIn() {
    if (busy) return; // ignore double clicks
    setBusy(true);
    setError("");
    const auth = getFirebaseAuth();
    if (!auth) {
      setBusy(false);
      return;
    }
    try {
      await signInWithPopup(auth, getGoogleProvider());
    } catch (err) {
      console.error("Google sign-in error:", err);
      const code = (err as { code?: string }).code ?? "";
      const ignorable = [
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
      ];
      if (!ignorable.includes(code)) {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !available) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
        >
          Sign in with Google
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.photoURL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="h-7 w-7 rounded-full"
        />
      )}
      <span className="hidden text-sm sm:inline">
        {user.displayName?.split(" ")[0] ?? "You"}
      </span>
      <button
        onClick={() => {
          const auth = getFirebaseAuth();
          if (auth) signOut(auth);
        }}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
      >
        Sign out
      </button>
    </div>
  );
}
