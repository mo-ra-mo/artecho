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

function escapeCsv(value: unknown) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsv(row[header])).join(",")
  );
  return [headerLine, ...lines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const table = request.nextUrl.searchParams.get("table") as AllowedTable | null;
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: "Invalid table. Use a supported table." },
        { status: 400 }
      );
    }

    let rows: Record<string, unknown>[] = [];

    const loraModelDelegate = (prisma as any).loraModel;
    const loraTrainingVideoDelegate = (prisma as any).loraTrainingVideo;
    const loraTrainingJobDelegate = (prisma as any).loraTrainingJob;
    const generatedImageDelegate = (prisma as any).generatedImage;

    if (table === "users") {
      rows = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else if (table === "plans") {
      rows = await prisma.plan.findMany({
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          userId: true,
          tier: true,
          status: true,
          startDate: true,
          endDate: true,
          stripeSubscriptionId: true,
        },
      });
    } else if (table === "learning_sessions") {
      rows = await prisma.learningSession.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          content: true,
          createdAt: true,
        },
      });
    } else if (table === "ai_inputs") {
      rows = await prisma.aiInput.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          sessionId: true,
          input: true,
          output: true,
          createdAt: true,
        },
      });
    } else if (table === "learning_videos") {
      rows = await prisma.learningVideo.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          videoId: true,
          sortOrder: true,
          sourceUrl: true,
          createdAt: true,
        },
      });
    } else if (table === "lora_models") {
      rows =
        (await loraModelDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
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
        })) || [];
    } else if (table === "lora_training_videos") {
      rows =
        (await loraTrainingVideoDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            modelId: true,
            url: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        })) || [];
    } else if (table === "lora_training_jobs") {
      rows =
        (await loraTrainingJobDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
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
        })) || [];
    } else if (table === "generated_images") {
      rows =
        (await generatedImageDelegate?.findMany?.({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            modelId: true,
            prompt: true,
            category: true,
            imageUrl: true,
            provider: true,
            adapterUrl: true,
            isFavorite: true,
            createdAt: true,
          },
        })) || [];
    } else if (table === "wallet_ledger") {
      const walletLedgerDelegate = (prisma as any).walletLedger;
      rows = walletLedgerDelegate
        ? await walletLedgerDelegate.findMany({
            orderBy: { createdAt: "desc" },
          })
        : [];
    } else if (table === "infra_provisions") {
      const infraProvisionDelegate = (prisma as any).infraProvision;
      rows = infraProvisionDelegate
        ? await infraProvisionDelegate.findMany({
            orderBy: { createdAt: "desc" },
          })
        : [];
    }

    const csv = toCsv(rows);
    const filename = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export table CSV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

