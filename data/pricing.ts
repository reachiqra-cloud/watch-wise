// Single place for every price. Change a number here and the whole app follows.

export const TOKEN_PRICE = 1.5; // dollars per single token bought on its own

export type PlanId = "standard" | "premium";

export type PlanInfo = {
  id: PlanId;
  name: string;
  pricePerMonth: number;
  tokensPerMonth: number;
  hasAds: boolean;
  blurb: string;
};

export const PLANS: PlanInfo[] = [
  {
    id: "standard",
    name: "Standard",
    pricePerMonth: 25,
    tokensPerMonth: 20,
    hasAds: true,
    blurb: "20 tokens a month. Includes ads.",
  },
  {
    id: "premium",
    name: "Premium",
    pricePerMonth: 30,
    tokensPerMonth: 20,
    hasAds: false,
    blurb: "20 tokens a month. No ads.",
  },
];

// Quick-buy buttons on the plans page, and the most anyone can buy at once.
export const TOPUP_OPTIONS = [1, 5, 10];
export const MAX_TOPUP = 50;

export function findPlan(id: string): PlanInfo | undefined {
  return PLANS.find((p) => p.id === id);
}