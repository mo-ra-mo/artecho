/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for subscription plans.
 *
 * Body: { tier: "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR" }
 * Returns: { url: string } — Stripe hosted checkout page URL
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLAN_PRICES } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { tier } = await request.json();

    if (!tier || !PLAN_PRICES[tier]) {
      return NextResponse.json(
        { error: "Invalid plan tier. Must be BASIC, PRO, PRO_PLUS, or CREATOR." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reuse existing Stripe customer or create new one
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        ...(user.email ? { email: user.email } : {}),
        ...(user.name ? { name: user.name } : {}),
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: PLAN_PRICES[tier],
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH_URL}/billing?success=true`,
      cancel_url: `${process.env.AUTH_URL}/billing?canceled=true`,
      subscription_data: {
        metadata: { userId: user.id, tier },
      },
      metadata: { userId: user.id, tier },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
