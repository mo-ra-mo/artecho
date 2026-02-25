import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLoraPlanLimits, isUnlimited } from "@/lib/lora-plan";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";
import {
  fetchExternalLoraTrainingStatus,
  getLoraProviderName,
  isExternalLoraProviderEnabled,
  startExternalLoraTraining,
} from "@/lib/lora-provider";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const modelId = String(body?.modelId || "");
    if (!modelId) {
      return NextResponse.json({ error: "modelId is required." }, { status: 400 });
    }

    const userId = session.user.id;
    const [tier, model, recentVideos] = await Promise.all([
      getEffectiveUserPlanTier({
        userId,
        role: session.user.role,
      }),
      prisma.loraModel.findFirst({
        where: { id: modelId, userId },
      }),
      prisma.loraTrainingVideo.findMany({
        where: { modelId, userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { url: true },
      }),
    ]);

    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }

    const limits = getLoraPlanLimits(tier);

    if (!isUnlimited(limits.maxTrainRuns) && model.trainRuns >= (limits.maxTrainRuns || 0)) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${limits.maxTrainRuns} training run(s) for this workflow.`,
          code: "TRAIN_RUN_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    if (model.videoCount < limits.minVideosToTrain) {
      return NextResponse.json(
        {
          error: `Please upload at least ${limits.minVideosToTrain} video(s) to train this model.`,
          code: "NOT_ENOUGH_TRAINING_VIDEOS",
        },
        { status: 400 }
      );
    }

    const queued = await prisma.loraTrainingJob.create({
      data: {
        userId,
        modelId,
        status: "QUEUED",
        progress: 0,
        provider: isExternalLoraProviderEnabled()
          ? getLoraProviderName()
          : "mvp",
      },
    });

    if (isExternalLoraProviderEnabled()) {
      const external = await startExternalLoraTraining({
        jobId: queued.id,
        modelId,
        userId,
        videos: recentVideos.map((v) => v.url),
        planTier: tier,
      });

      const runningJob = await prisma.loraTrainingJob.update({
        where: { id: queued.id },
        data: {
          status: "RUNNING",
          progress: 10,
          startedAt: new Date(),
          externalJobId: external.externalJobId,
          providerStatusUrl: external.statusUrl || null,
          providerMeta: external.raw || undefined,
          notes: "External LoRA training started.",
        },
      });

      await prisma.loraModel.update({
        where: { id: modelId },
        data: { status: "TRAINING", planTier: tier },
      });

      return NextResponse.json({
        success: true,
        queued: true,
        provider: getLoraProviderName(),
        job: runningJob,
      });
    }

    const now = new Date();
    const [job, updatedModel] = await prisma.$transaction([
      prisma.loraTrainingJob.update({
        where: { id: queued.id },
        data: {
          status: "SUCCEEDED",
          progress: 100,
          notes: "MVP LoRA-lite training completed successfully.",
          finishedAt: now,
        },
      }),
      prisma.loraModel.update({
        where: { id: modelId },
        data: {
          status: "READY",
          latestVersion: { increment: 1 },
          trainRuns: { increment: 1 },
          lastTrainedAt: now,
          planTier: tier,
          adapterUrl: `mvp://lora/${modelId}/v${model.latestVersion + 1}`,
          styleSummary: {
            videoCount: model.videoCount,
            learnedAt: now.toISOString(),
            note: "Model refined from user uploaded videos.",
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      queued: false,
      provider: "mvp",
      job,
      model: updatedModel,
    });
  } catch (error) {
    console.error("[TRAIN_AI_TRAIN_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const jobId = String(url.searchParams.get("jobId") || "");
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required." }, { status: 400 });
    }

    const job = await prisma.loraTrainingJob.findFirst({
      where: { id: jobId, userId: session.user.id },
      include: { model: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (
      job.provider === "external" &&
      job.externalJobId &&
      (job.status === "QUEUED" || job.status === "RUNNING")
    ) {
      const external = await fetchExternalLoraTrainingStatus({
        externalJobId: job.externalJobId,
        statusUrl: job.providerStatusUrl,
      });

      const updateData: Record<string, unknown> = {
        status: external.status,
        progress: external.progress,
        notes: external.notes || job.notes,
        providerMeta: external.raw || undefined,
      };

      if (external.status === "SUCCEEDED") {
        const now = new Date();
        updateData.finishedAt = now;
        await prisma.$transaction([
          prisma.loraTrainingJob.update({
            where: { id: job.id },
            data: updateData,
          }),
          prisma.loraModel.update({
            where: { id: job.modelId },
            data: {
              status: "READY",
              latestVersion: { increment: 1 },
              trainRuns: { increment: 1 },
              lastTrainedAt: now,
              adapterUrl:
                external.artifactUrl ||
                `external://lora/${job.modelId}/v${job.model.latestVersion + 1}`,
              styleSummary: {
                videoCount: job.model.videoCount,
                learnedAt: now.toISOString(),
                note: "External LoRA provider completed training.",
              },
            },
          }),
        ]);
      } else if (external.status === "FAILED") {
        updateData.finishedAt = new Date();
        await prisma.$transaction([
          prisma.loraTrainingJob.update({
            where: { id: job.id },
            data: updateData,
          }),
          prisma.loraModel.update({
            where: { id: job.modelId },
            data: { status: "FAILED" },
          }),
        ]);
      } else {
        await prisma.loraTrainingJob.update({
          where: { id: job.id },
          data: updateData,
        });
      }

      const fresh = await prisma.loraTrainingJob.findUnique({
        where: { id: job.id },
      });
      return NextResponse.json({ success: true, job: fresh });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("[TRAIN_AI_TRAIN_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

