/**
 * POST /api/admin/plans/cancel
 *
 * Cancel a Stripe subscription and expire the plan in DB — admin only.
 * Body: { planId: string }
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { planId } = await request.json();
  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Cancel in Stripe if subscription exists
  if (plan.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(plan.stripeSubscriptionId);
    } catch (err) {
      console.error("[ADMIN_CANCEL] Stripe error:", err);
    }
  }

  // Expire in DB
  await prisma.plan.update({
    where: { id: planId },
    data: { status: "EXPIRED", endDate: new Date() },
  });

  return NextResponse.json({ success: true });
}
