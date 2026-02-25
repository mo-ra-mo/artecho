import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";

const FREE_LIMITS = {
  video_upload: 3,
  educational_video: 2,
} as const;

type UsageKind = keyof typeof FREE_LIMITS;

function getPlanAwareQuota(tier: string, used: number, limit: number) {
  if (tier !== "FREE") {
    return {
      tier,
      used: null,
      limit: null,
      remaining: null,
      unlimited: true,
    };
  }

  return {
    tier,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    unlimited: false,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [tier, user] = await Promise.all([
      getEffectiveUserPlanTier({
        userId: session.user.id,
        role: session.user.role,
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          freeVideoUploadsUsed: true,
          freeEducationalVideosUsed: true,
        },
      }),
    ]);

    const videoUploadsUsed = user?.freeVideoUploadsUsed || 0;
    const educationalVideosUsed = user?.freeEducationalVideosUsed || 0;

    return NextResponse.json({
      videoUploads: getPlanAwareQuota(
        tier,
        videoUploadsUsed,
        FREE_LIMITS.video_upload
      ),
      educationalVideos: getPlanAwareQuota(
        tier,
        educationalVideosUsed,
        FREE_LIMITS.educational_video
      ),
    });
  } catch (error) {
    console.error("[USER_USAGE_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const kind = body?.kind as UsageKind;

    if (!kind || !(kind in FREE_LIMITS)) {
      return NextResponse.json(
        {
          error:
            "Invalid usage kind. Allowed: video_upload, educational_video.",
        },
        { status: 400 }
      );
    }

    const tier = await getEffectiveUserPlanTier({
      userId: session.user.id,
      role: session.user.role,
    });

    if (tier !== "FREE") {
      if (kind === "educational_video") {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { freeEducationalVideosUsed: { increment: 1 } },
          select: { id: true },
        });
      }
      return NextResponse.json({
        success: true,
        quota: getPlanAwareQuota(tier, 0, FREE_LIMITS[kind]),
      });
    }

    const limit = FREE_LIMITS[kind];
    const reserved =
      kind === "video_upload"
        ? await prisma.user.updateMany({
            where: {
              id: session.user.id,
              freeVideoUploadsUsed: { lt: limit },
            },
            data: {
              freeVideoUploadsUsed: { increment: 1 },
            },
          })
        : await prisma.user.updateMany({
            where: {
              id: session.user.id,
              freeEducationalVideosUsed: { lt: limit },
            },
            data: {
              freeEducationalVideosUsed: { increment: 1 },
            },
          });

    if (reserved.count === 0) {
      return NextResponse.json(
        {
          error:
            kind === "video_upload"
              ? "Free plan limit reached: only 3 video uploads are allowed."
              : "Free plan limit reached: only 2 educational videos can be watched.",
          code:
            kind === "video_upload"
              ? "FREE_VIDEO_UPLOAD_LIMIT_REACHED"
              : "FREE_EDUCATIONAL_VIDEO_LIMIT_REACHED",
          quota: getPlanAwareQuota("FREE", limit, limit),
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        freeVideoUploadsUsed: true,
        freeEducationalVideosUsed: true,
      },
    });

    const used =
      kind === "video_upload"
        ? user?.freeVideoUploadsUsed || 0
        : user?.freeEducationalVideosUsed || 0;

    return NextResponse.json({
      success: true,
      quota: getPlanAwareQuota("FREE", used, limit),
    });
  } catch (error) {
    console.error("[USER_USAGE_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
