import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const loraModelDelegate = (prisma as any).loraModel;
    const loraTrainingVideoDelegate = (prisma as any).loraTrainingVideo;
    const loraTrainingJobDelegate = (prisma as any).loraTrainingJob;
    const generatedImageDelegate = (prisma as any).generatedImage;

    const [
      users,
      plans,
      learningSessions,
      aiInputs,
      learningVideos,
      loraModels,
      loraTrainingVideos,
      loraTrainingJobs,
      generatedImages,
      walletLedgers,
      infraProvisions,
      activePlans,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.plan.count(),
      prisma.learningSession.count(),
      prisma.aiInput.count(),
      prisma.learningVideo.count(),
      loraModelDelegate?.count?.() ?? Promise.resolve(0),
      loraTrainingVideoDelegate?.count?.() ?? Promise.resolve(0),
      loraTrainingJobDelegate?.count?.() ?? Promise.resolve(0),
      generatedImageDelegate?.count?.() ?? Promise.resolve(0),
      (prisma as any).walletLedger?.count?.() ?? Promise.resolve(0),
      (prisma as any).infraProvision?.count?.() ?? Promise.resolve(0),
      prisma.plan.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({
      users,
      plans,
      activePlans,
      learningSessions,
      aiInputs,
      learningVideos,
      loraModels,
      loraTrainingVideos,
      loraTrainingJobs,
      generatedImages,
      walletLedgers,
      infraProvisions,
      recentSignups,
    });
  } catch (error) {
    console.error("Failed to fetch database overview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

