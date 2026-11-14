import catalog from "@/data/catalog.json";
import user from "@/data/user.json";
 
export type Title = {
  id: string;
  title: string;
  provider: string;
  type: string;
  genre: string[];
  runtimeMinutes: number;
  isNewRelease: boolean;
  tokenCost: number;
  episodeCount: number | null;
};
 
export type HistoryEntry = {
  titleId: string;
  title: string;
  tokensSpent: number;
  watchedAt: string;
};
 
export type Wallet = {
  userId: string;
  plan: {
    name: string;
    pricePerMonth: number;
    tokensPerMonth: number;
  };
  balance: number;
  history: HistoryEntry[];
};
 
// Next.js dev mode can reload modules, which would reset a normal variable.
// Keeping the wallet on globalThis means the balance survives those reloads.
const globalForWallet = globalThis as unknown as {
  __watchwiseWallet?: Wallet;
};
 
export function getWalletState(): Wallet {
  if (!globalForWallet.__watchwiseWallet) {
    globalForWallet.__watchwiseWallet = structuredClone(user) as Wallet;
  }
  return globalForWallet.__watchwiseWallet;
}
 
export function findTitle(id: string): Title | undefined {
  return (catalog as Title[]).find((t) => t.id === id);
}
 
