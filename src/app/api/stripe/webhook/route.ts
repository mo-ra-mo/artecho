/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint — receives events after payment.
 *
 * Handled events:
 *   • checkout.session.completed   → create/activate plan
 *   • invoice.payment_succeeded    → renew plan
 *   • customer.subscription.updated → update tier/status
 *   • customer.subscription.deleted → expire plan
 *
 * Setup:
 *   Stripe Dashboard → Developers → Webhooks → Add endpoint
 *   URL: https://yourdomain.com/api/stripe/webhook
 *   Events: checkout.session.completed, invoice.payment_succeeded,
 *           customer.subscription.updated, customer.subscription.deleted
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, tierFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { creditWallet } from "@/lib/wallet";
import { ensureProvisionForTier } from "@/lib/provisioning/queue";

function resolvePeriodEndDate(
  subscription: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
) {
  const periodEnd = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof periodEnd === "number" && Number.isFinite(periodEnd)) {
    return new Date(periodEnd * 1000);
  }
  // Fallback to keep the plan valid if provider response is missing this field.
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[STRIPE_WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── New subscription created via Checkout ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const kind = session.metadata?.kind;

        if (kind === "wallet_topup") {
          const amountCents = Number(session.metadata?.topupAmountCents || 0);
          if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) break;

          await creditWallet({
            userId,
            amountCents,
            reason: "TOPUP",
            note: "Stripe wallet top-up",
            externalRef: session.id,
            metadata: {
              checkoutSessionId: session.id,
              paymentIntentId: String(session.payment_intent || ""),
            },
          });
          console.log(`[STRIPE] Wallet top-up credited ${amountCents} cents for user ${userId}`);
          break;
        }

        const tier = session.metadata?.tier;
        const subscriptionId = session.subscription as string;

        if (!userId || !tier) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        // Expire any existing active plans
        await prisma.plan.updateMany({
          where: { userId, status: "ACTIVE" },
          data: { status: "EXPIRED", endDate: new Date() },
        });

        // Create new active plan
        await prisma.plan.create({
          data: {
            userId,
            tier: tier as "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR",
            status: "ACTIVE",
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId || null,
            startDate: new Date(),
            endDate: resolvePeriodEndDate(subscription),
          },
        });

        await ensureProvisionForTier({
          userId,
          tier: tier as "FREE" | "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR",
        });

        console.log(`[STRIPE] Plan ${tier} activated for user ${userId}`);
        break;
      }

      // ── Recurring payment succeeded → renew ──
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = String(
          (invoice as unknown as { subscription?: string | null }).subscription || ""
        );
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.plan.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            status: "ACTIVE",
            endDate: resolvePeriodEndDate(subscription),
          },
        });

        console.log(`[STRIPE] Subscription ${subscriptionId} renewed`);
        break;
      }

      // ── Plan changed (upgrade/downgrade) ──
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const newTier = priceId ? tierFromPriceId(priceId) : null;

        if (newTier) {
          await prisma.plan.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              tier: newTier as "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR",
              status: subscription.status === "active" ? "ACTIVE" : "SUSPENDED",
              endDate: resolvePeriodEndDate(subscription),
              stripePriceId: priceId,
            },
          });
          const planUser = await prisma.plan.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            select: { userId: true },
          });
          if (planUser?.userId) {
            await ensureProvisionForTier({
              userId: planUser.userId,
              tier: newTier as "FREE" | "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR",
            });
          }
          console.log(`[STRIPE] Subscription ${subscription.id} updated to ${newTier}`);
        }
        break;
      }

      // ── Subscription canceled ──
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.plan.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "EXPIRED",
            endDate: new Date(),
          },
        });

        console.log(`[STRIPE] Subscription ${subscription.id} canceled`);
        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event: ${event.type}`);
    }
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
