import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncLearningVideosFromPlaylistUrl } from "@/lib/learning-video-sync";

function isAuthorizedCronRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow local/dev testing when secret is not configured.
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";
  return token === secret;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.learningVideoConfig.findUnique({
      where: { id: "default" },
      select: { playlistUrl: true },
    });

    if (!config?.playlistUrl) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No playlist configured.",
      });
    }

    const result = await syncLearningVideosFromPlaylistUrl(config.playlistUrl);
    return NextResponse.json({
      success: true,
      syncedCount: result.count,
    });
  } catch (error) {
    console.error("[CRON_LEARNING_VIDEOS_SYNC]", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

