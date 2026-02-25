import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";
import { ensureProvisionForTier, runProvisionJob } from "@/lib/provisioning/queue";
import { rateLimitApi } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const infraProvisionDelegate = (prisma as any).infraProvision;
    const provisions =
      infraProvisionDelegate && typeof infraProvisionDelegate.findMany === "function"
        ? await infraProvisionDelegate.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [];

    return NextResponse.json({ provisions });
  } catch (error) {
    console.error("[PROVISIONING_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const runNow = Boolean(body?.runNow);
    const tier = await getEffectiveUserPlanTier({
      userId: session.user.id,
      role: session.user.role,
    });

    const ensure = await ensureProvisionForTier({
      userId: session.user.id,
      tier,
    });

    if (!ensure.required) {
      return NextResponse.json({ success: true, required: false, tier });
    }

    if (runNow && ensure.provision?.id) {
      const result = await runProvisionJob(ensure.provision.id);
      return NextResponse.json({ success: true, required: true, provision: result, tier });
    }

    return NextResponse.json({ success: true, ...ensure, tier });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[PROVISIONING_POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

