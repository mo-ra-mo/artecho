export const PLAN_MONTHLY_PRICE_CENTS: Record<string, number> = {
  FREE: 0,
  BASIC: 1800,
  PRO: 4800,
  PRO_PLUS: 7800,
  CREATOR: 9800,
};

export function getPlanPriceLabel(tier: string, fallback = "$0") {
  const amount = PLAN_MONTHLY_PRICE_CENTS[tier];
  if (typeof amount !== "number") return fallback;
  return `$${Math.round(amount / 100)}`;
}
