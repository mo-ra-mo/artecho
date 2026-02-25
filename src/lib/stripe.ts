/**
 * Stripe Client — server-side singleton
 *
 * Usage:
 *   import { stripe } from "@/lib/stripe";
 *   const session = await stripe.checkout.sessions.create({ ... });
 */

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

/**
 * Mapping: PlanTier → Stripe Price ID
 * Price IDs are created in Stripe Dashboard under Products.
 */
export const PLAN_PRICES: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC!,
  PRO: process.env.STRIPE_PRICE_PRO!,
  PRO_PLUS: process.env.STRIPE_PRICE_PRO_PLUS!,
  CREATOR: process.env.STRIPE_PRICE_CREATOR!,
};

/**
 * Reverse mapping: Stripe Price ID → PlanTier
 */
export function tierFromPriceId(priceId: string): string | null {
  for (const [tier, id] of Object.entries(PLAN_PRICES)) {
    if (id === priceId) return tier;
  }
  return null;
}
