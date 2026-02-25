import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_TABLES = [
  "users",
  "plans",
  "learning_sessions",
  "ai_inputs",
  "learning_videos",
  "lora_models",
  "lora_training_videos",
  "lora_training_jobs",
  "generated_images",
  "wallet_ledger",
  "infra_provisions",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

const PAGE_SIZE_MAX = 50;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const table = request.nextUrl.searchParams.get("table") as AllowedTable | null;
    const pageRaw = Number(request.nextUrl.searchParams.get("page") || 1);
    const pageSizeRaw = Number(request.nextUrl.searchParams.get("pageSize") || 20);

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Invalid table. Use a supported table." },
        { status: 400 }
      );
    }

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(Math.floor(pageSizeRaw), PAGE_SIZE_MAX)
        : 20;
    const skip = (page - 1) * pageSize;

    let rows: unknown[] = [];
    let total = 0;

    const loraModelDelegate = (prisma as any).loraModel;
    const loraTrainingVideoDelegate = (prisma as any).loraTrainingVideo;
    const loraTrainingJobDelegate = (prisma as any).loraTrainingJob;
    const generatedImageDelegate = (prisma as any).generatedImage;

    if (table === "users") {
      const [count, data] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);
      total = count;
      rows = data;
    } else if (table === "plans") {
      const [count, data] = await Promise.all([
        prisma.plan.count(),
        prisma.plan.findMany({
          orderBy: { startDate: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            tier: true,
            status: true,
            startDate: true,
            endDate: true,
            stripeSubscriptionId: true,
          },
        }),
      ]);
      total = count;
      rows = data;
    } else if (table === "learning_sessions") {
      const [count, data] = await Promise.all([
        prisma.learningSession.count(),
        prisma.learningSession.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            content: true,
            createdAt: true,
          },
        }),
      ]);
      total = count;
      rows = data;
    } else if (table === "ai_inputs") {
      const [count, data] = await Promise.all([
        prisma.aiInput.count(),
        prisma.aiInput.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            sessionId: true,
            input: true,
            output: true,
            createdAt: true,
          },
        }),
      ]);
      total = count;
      rows = data;
    } else if (table === "learning_videos") {
      const [count, data] = await Promise.all([
        prisma.learningVideo.count(),
        prisma.learningVideo.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          skip,
          take: pageSize,
          select: {
            id: true,
            title: true,
            videoId: true,
            sortOrder: true,
            sourceUrl: true,
            createdAt: true,
          },
        }),
      ]);
      total = count;
      rows = data;
    } else if (table === "lora_models") {
      const [count, data] = await Promise.all([
        loraModelDelegate?.count?.() ?? Promise.resolve(0),
        loraModelDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            name: true,
            status: true,
            planTier: true,
            latestVersion: true,
            videoCount: true,
            trainRuns: true,
            createdAt: true,
          },
        }) ?? Promise.resolve([]),
      ]);
      total = count;
      rows = data;
    } else if (table === "lora_training_videos") {
      const [count, data] = await Promise.all([
        loraTrainingVideoDelegate?.count?.() ?? Promise.resolve(0),
        loraTrainingVideoDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            modelId: true,
            url: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        }) ?? Promise.resolve([]),
      ]);
      total = count;
      rows = data;
    } else if (table === "lora_training_jobs") {
      const [count, data] = await Promise.all([
        loraTrainingJobDelegate?.count?.() ?? Promise.resolve(0),
        loraTrainingJobDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            modelId: true,
            status: true,
            progress: true,
            notes: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
          },
        }) ?? Promise.resolve([]),
      ]);
      total = count;
      rows = data;
    } else if (table === "generated_images") {
      const [count, data] = await Promise.all([
        generatedImageDelegate?.count?.() ?? Promise.resolve(0),
        generatedImageDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            userId: true,
            modelId: true,
            prompt: true,
            category: true,
            provider: true,
            isFavorite: true,
            createdAt: true,
          },
        }) ?? Promise.resolve([]),
      ]);
      total = count;
      rows = data;
    } else if (table === "wallet_ledger") {
      const walletLedgerDelegate = (prisma as any).walletLedger;
      if (!walletLedgerDelegate) {
        total = 0;
        rows = [];
      } else {
        const [count, data] = await Promise.all([
          walletLedgerDelegate.count(),
          walletLedgerDelegate.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          }),
        ]);
        total = count;
        rows = data;
      }
    } else if (table === "infra_provisions") {
      const infraProvisionDelegate = (prisma as any).infraProvision;
      if (!infraProvisionDelegate) {
        total = 0;
        rows = [];
      } else {
        const [count, data] = await Promise.all([
          infraProvisionDelegate.count(),
          infraProvisionDelegate.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          }),
        ]);
        total = count;
        rows = data;
      }
    }

    return NextResponse.json({
      table,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      rows,
    });
  } catch (error) {
    console.error("Failed to fetch table rows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

