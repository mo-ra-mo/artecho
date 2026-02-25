import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runProvisionJob } from "@/lib/provisioning/queue";

function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function isAuthorized(request: Request) {
  const secret =
    process.env.USAGE_CRON_SECRET ||
    process.env.CRON_SECRET ||
    "";
  if (!secret) return false;
  const bearer = request.headers.get("authorization") || "";
  const direct = request.headers.get("x-cron-secret") || "";
  if (direct && direct === secret) return true;
  if (bearer.startsWith("Bearer ") && bearer.slice(7) === secret) return true;
  return false;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthStart = getMonthStart();
    const resetResult = await prisma.user.updateMany({
      where: {
        monthlyUsageResetAt: { lt: monthStart },
      },
      data: {
        monthlyUploadUsedBytes: BigInt(0),
        monthlyUsageResetAt: monthStart,
      },
    });

    const infraProvisionDelegate = (prisma as any).infraProvision;
    if (!infraProvisionDelegate || typeof infraProvisionDelegate.findMany !== "function") {
      return NextResponse.json({
        success: true,
        resetUsers: resetResult.count,
        reconciledProvisionJobs: 0,
      });
    }

    const queuedJobs = await infraProvisionDelegate.findMany({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { id: true },
    });

    let reconciled = 0;
    let failed = 0;
    for (const job of queuedJobs) {
      try {
        await runProvisionJob(job.id);
        reconciled += 1;
      } catch {
        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      resetUsers: resetResult.count,
      queuedJobsProcessed: queuedJobs.length,
      reconciledProvisionJobs: reconciled,
      failedProvisionJobs: failed,
    });
  } catch (error) {
    console.error("[USAGE_RECONCILE_CRON_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
