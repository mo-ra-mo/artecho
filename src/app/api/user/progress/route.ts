import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getLoraPlanLimits, isUnlimited } from "@/lib/lora-plan";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";
import { getUploadPlanLimits, isUnlimitedBytes } from "@/lib/upload-plan";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const loraModelDelegate = (prisma as any).loraModel;
    const loraTrainingVideoDelegate = (prisma as any).loraTrainingVideo;
    const loraModelsCountPromise =
      loraModelDelegate && typeof loraModelDelegate.count === "function"
        ? loraModelDelegate.count({
            where: { userId, status: { not: "ARCHIVED" } },
          })
        : Promise.resolve(0);
    const uploadedVideosCountPromise =
      loraTrainingVideoDelegate &&
      typeof loraTrainingVideoDelegate.count === "function"
        ? loraTrainingVideoDelegate.count({
            where: { userId },
          })
        : Promise.resolve(0);

    const latestPlanPromise = prisma.plan.findFirst({
      where: { userId },
      orderBy: { startDate: "desc" },
      select: { status: true },
    });

    const latestProvisionPromise = (prisma as any).infraProvision
      ? (prisma as any).infraProvision.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            tier: true,
            provider: true,
            endpoint: true,
            costCents: true,
            errorMessage: true,
            updatedAt: true,
          },
        })
      : Promise.resolve(null);

    const [totalSessions, sessions, userUsage, loraModelsCount, uploadedVideosCount, planTier, latestPlan, latestProvision] = await Promise.all([
      prisma.learningSession.count({ where: { userId } }),
      prisma.learningSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, content: true, aiFeedback: true, createdAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          freeAiTrainingUsed: true,
          freeVideoUploadsUsed: true,
          freeEducationalVideosUsed: true,
          walletBalanceCents: true,
          storageUsedBytes: true,
          monthlyUploadUsedBytes: true,
          monthlyUsageResetAt: true,
        },
      }),
      loraModelsCountPromise,
      uploadedVideosCountPromise,
      getEffectiveUserPlanTier({
        userId,
        role: session.user.role,
      }),
      latestPlanPromise,
      latestProvisionPromise,
    ]);

    const lastSession = sessions[0] || null;

    const uniqueDays = new Set(
      sessions.map((s) => new Date(s.createdAt).toISOString().slice(0, 10))
    ).size;

    const totalLessons = 6;
    const progressPercent = Math.min(
      100,
      Math.round((totalSessions / totalLessons) * 100)
    );

    const loraLimits = getLoraPlanLimits(planTier);
    const uploadLimits = getUploadPlanLimits(planTier);
    const storageUsedBytes = Number(userUsage?.storageUsedBytes || 0);
    const monthlyUploadUsedBytes = Number(userUsage?.monthlyUploadUsedBytes || 0);

    return NextResponse.json({
      totalSessions,
      progressPercent,
      uniqueDays,
      lastSession,
      plan: planTier,
      planStatus: session.user.role === "ADMIN" ? "ACTIVE" : latestPlan?.status || "ACTIVE",
      wallet: {
        balanceCents: userUsage?.walletBalanceCents || 0,
      },
      activity: {
        watchedVideosCount: userUsage?.freeEducationalVideosUsed || 0,
        uploadedVideosCount,
      },
      storage: {
        usedBytes: storageUsedBytes,
        totalLimitBytes: uploadLimits.totalStorageBytes,
        totalRemainingBytes: isUnlimitedBytes(uploadLimits.totalStorageBytes)
          ? null
          : Math.max(0, (uploadLimits.totalStorageBytes || 0) - storageUsedBytes),
        monthlyUsedBytes: monthlyUploadUsedBytes,
        monthlyLimitBytes: uploadLimits.monthlyUploadBytes,
        monthlyRemainingBytes: isUnlimitedBytes(uploadLimits.monthlyUploadBytes)
          ? null
          : Math.max(0, (uploadLimits.monthlyUploadBytes || 0) - monthlyUploadUsedBytes),
        maxFileBytes: uploadLimits.maxFileBytes,
        uploadCostPerMbCents: uploadLimits.uploadCostPerMbCents,
        requiresPhysicalProvision: uploadLimits.requiresPhysicalProvision,
        monthlyUsageResetAt: userUsage?.monthlyUsageResetAt || null,
      },
      provisioning: latestProvision || null,
      recentSessions: sessions,
      limits: {
        aiTraining:
          planTier === "FREE"
            ? {
                used: userUsage?.freeAiTrainingUsed || 0,
                limit: 3,
                remaining: Math.max(0, 3 - (userUsage?.freeAiTrainingUsed || 0)),
              }
            : { used: null, limit: null, remaining: null },
        videoUploads:
          planTier === "FREE"
            ? {
                used: userUsage?.freeVideoUploadsUsed || 0,
                limit: 3,
                remaining: Math.max(0, 3 - (userUsage?.freeVideoUploadsUsed || 0)),
              }
            : { used: null, limit: null, remaining: null },
        educationalVideos:
          planTier === "FREE"
            ? {
                used: userUsage?.freeEducationalVideosUsed || 0,
                limit: 2,
                remaining: Math.max(
                  0,
                  2 - (userUsage?.freeEducationalVideosUsed || 0)
                ),
              }
            : { used: null, limit: null, remaining: null },
        loraModels: {
          used: loraModelsCount,
          limit: loraLimits.maxModels,
          remaining: isUnlimited(loraLimits.maxModels)
            ? null
            : Math.max(0, (loraLimits.maxModels || 0) - loraModelsCount),
          unlimited: isUnlimited(loraLimits.maxModels),
        },
        loraVideosPerModel: {
          limit: loraLimits.maxVideosPerModel,
          unlimited: isUnlimited(loraLimits.maxVideosPerModel),
        },
        loraTrainRuns: {
          limit: loraLimits.maxTrainRuns,
          unlimited: isUnlimited(loraLimits.maxTrainRuns),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
