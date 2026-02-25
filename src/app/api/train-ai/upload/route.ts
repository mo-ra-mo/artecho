import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLoraPlanLimits, isUnlimited } from "@/lib/lora-plan";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";
import {
  calculateUploadDebitCents,
  getUploadPlanLimits,
  isUnlimitedBytes,
} from "@/lib/upload-plan";
import { debitWalletIfPossible } from "@/lib/wallet";
import { isSupabaseStorageEnabled, uploadToSupabaseStorage } from "@/lib/supabase-storage";
import { resetMonthlyUsageIfNeeded } from "@/lib/upload-usage";
import { rateLimitApi } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtFromType(type: string, fallbackName: string) {
  const direct: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/quicktime": "mov",
  };
  if (direct[type]) return direct[type];
  const parts = fallbackName.split(".");
  return parts.length > 1 ? parts.pop() || "bin" : "bin";
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const form = await request.formData();
    const modelId = String(form.get("modelId") || "");
    const file = form.get("file");

    if (!modelId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "modelId and file are required." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only video files are allowed for training." },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "Empty file is not allowed." }, { status: 400 });
    }

    await resetMonthlyUsageIfNeeded(userId);

    const [tier, model, userUsage] = await Promise.all([
      getEffectiveUserPlanTier({
        userId,
        role: session.user.role,
      }),
      prisma.loraModel.findFirst({
        where: { id: modelId, userId },
        select: { id: true, videoCount: true, status: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          monthlyUploadUsedBytes: true,
          storageUsedBytes: true,
          walletBalanceCents: true,
          freeVideoUploadsUsed: true,
        },
      }),
    ]);

    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }
    if (model.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "Archived model cannot receive new videos." },
        { status: 400 }
      );
    }

    const limits = getLoraPlanLimits(tier);
    const uploadLimits = getUploadPlanLimits(tier);
    const maxFileSize = uploadLimits.maxFileBytes || DEFAULT_MAX_FILE_SIZE;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          error: `File is too large for your plan. Max allowed is ${Math.floor(
            maxFileSize / (1024 * 1024)
          )}MB.`,
          code: "UPLOAD_FILE_SIZE_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    const monthlyUsed = Number(userUsage?.monthlyUploadUsedBytes || 0);
    const storageUsed = Number(userUsage?.storageUsedBytes || 0);
    const projectedMonthly = monthlyUsed + file.size;
    const projectedStorage = storageUsed + file.size;

    if (
      !isUnlimitedBytes(uploadLimits.monthlyUploadBytes) &&
      projectedMonthly > (uploadLimits.monthlyUploadBytes || 0)
    ) {
      return NextResponse.json(
        {
          error: "Monthly upload quota exceeded for your plan.",
          code: "MONTHLY_UPLOAD_BYTES_LIMIT_REACHED",
          quota: {
            usedBytes: monthlyUsed,
            limitBytes: uploadLimits.monthlyUploadBytes,
            remainingBytes: Math.max(0, (uploadLimits.monthlyUploadBytes || 0) - monthlyUsed),
          },
        },
        { status: 403 }
      );
    }

    if (
      !isUnlimitedBytes(uploadLimits.totalStorageBytes) &&
      projectedStorage > (uploadLimits.totalStorageBytes || 0)
    ) {
      return NextResponse.json(
        {
          error: "Total storage quota exceeded for your plan.",
          code: "TOTAL_STORAGE_BYTES_LIMIT_REACHED",
          quota: {
            usedBytes: storageUsed,
            limitBytes: uploadLimits.totalStorageBytes,
            remainingBytes: Math.max(0, (uploadLimits.totalStorageBytes || 0) - storageUsed),
          },
        },
        { status: 403 }
      );
    }

    if (
      !isUnlimited(limits.maxVideosPerModel) &&
      model.videoCount >= (limits.maxVideosPerModel || 0)
    ) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${limits.maxVideosPerModel} training video(s) per model.`,
          code: "MODEL_VIDEO_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    if (tier === "FREE") {
      const reserved = await prisma.user.updateMany({
        where: { id: userId, freeVideoUploadsUsed: { lt: 3 } },
        data: { freeVideoUploadsUsed: { increment: 1 } },
      });
      if (reserved.count === 0) {
        return NextResponse.json(
          {
            error: "Free plan limit reached: only 3 video uploads are allowed.",
            code: "FREE_VIDEO_UPLOAD_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }

    const uploadDebitCents = calculateUploadDebitCents(
      file.size,
      uploadLimits.uploadCostPerMbCents
    );

    if (uploadDebitCents > 0) {
      const reserve = await debitWalletIfPossible({
        userId,
        amountCents: uploadDebitCents,
        reason: "UPLOAD_USAGE",
        note: "Training video upload usage debit",
        externalRef: `upload:${userId}:${Date.now()}:${modelId}`,
        metadata: { modelId, bytes: file.size, tier },
      });
      if (!reserve.ok) {
        return NextResponse.json(
          {
            error: "Insufficient wallet balance for this upload.",
            code: "INSUFFICIENT_WALLET_BALANCE",
            requiredCents: uploadDebitCents,
            balanceCents: userUsage?.walletBalanceCents || 0,
          },
          { status: 402 }
        );
      }
    }

    const ext = getExtFromType(file.type, file.name || "video.bin");
    const safeBase = sanitizeFilename(
      path.basename(file.name || `video.${ext}`, path.extname(file.name || ""))
    );
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safeBase}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `train-ai/${userId}/${filename}`;

    let url = "";
    if (isSupabaseStorageEnabled()) {
      const uploaded = await uploadToSupabaseStorage({
        path: storagePath,
        body: buffer,
        contentType: file.type || "application/octet-stream",
      });
      url = uploaded.publicUrl;
    } else {
      const dir = path.join(process.cwd(), "public", "uploads", "train-ai", userId);
      await mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, filename);
      await writeFile(fullPath, buffer);
      url = `/uploads/train-ai/${userId}/${filename}`;
    }

    const [video] = await prisma.$transaction([
      prisma.loraTrainingVideo.create({
        data: {
          userId,
          modelId,
          url,
          mimeType: file.type || null,
          sizeBytes: file.size,
        },
      }),
      prisma.loraModel.update({
        where: { id: modelId },
        data: { videoCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          storageUsedBytes: { increment: BigInt(file.size) },
          monthlyUploadUsedBytes: { increment: BigInt(file.size) },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      video,
      usage: {
        monthlyUploadUsedBytes: projectedMonthly,
        monthlyUploadLimitBytes: uploadLimits.monthlyUploadBytes,
        storageUsedBytes: projectedStorage,
        storageLimitBytes: uploadLimits.totalStorageBytes,
        uploadDebitCents,
      },
    });
  } catch (error) {
    console.error("[TRAIN_AI_UPLOAD_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

