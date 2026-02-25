import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runProvisionJob } from "@/lib/provisioning/queue";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const infraProvisionDelegate = (prisma as any).infraProvision;
    const provisions =
      infraProvisionDelegate && typeof infraProvisionDelegate.findMany === "function"
        ? await infraProvisionDelegate.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : [];
    return NextResponse.json({ provisions });
  } catch (error) {
    console.error("[ADMIN_PROVISIONING_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const provisionId = String(body?.provisionId || "");
    if (!provisionId) {
      return NextResponse.json({ error: "provisionId is required." }, { status: 400 });
    }
    const provision = await runProvisionJob(provisionId);
    return NextResponse.json({ success: true, provision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[ADMIN_PROVISIONING_POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

