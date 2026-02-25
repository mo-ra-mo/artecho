import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { rateLimitApi } from "@/lib/rate-limit";

const MIN_TOPUP_CENTS = 500;
const MAX_TOPUP_CENTS = 200000;

export async function POST(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const amountCents = Number(body?.amountCents || 0);
    if (!Number.isFinite(amountCents)) {
      return NextResponse.json({ error: "Invalid top-up amount." }, { status: 400 });
    }
    const normalizedAmount = Math.floor(amountCents);
    if (normalizedAmount < MIN_TOPUP_CENTS || normalizedAmount > MAX_TOPUP_CENTS) {
      return NextResponse.json(
        {
          error: `Top-up amount must be between ${MIN_TOPUP_CENTS} and ${MAX_TOPUP_CENTS} cents.`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

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
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "ArtEcho Wallet Top-up" },
            unit_amount: normalizedAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH_URL}/billing?success=true`,
      cancel_url: `${process.env.AUTH_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        kind: "wallet_topup",
        topupAmountCents: String(normalizedAmount),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[WALLET_TOPUP_POST]", error);
    return NextResponse.json(
      { error: "Failed to create wallet top-up session." },
      { status: 500 }
    );
  }
}

