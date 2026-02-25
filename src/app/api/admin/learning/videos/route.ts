import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncLearningVideosFromPlaylistUrl } from "@/lib/learning-video-sync";
import { extractYouTubeVideoId } from "@/lib/youtube-playlist";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let config = await prisma.learningVideoConfig.findUnique({
      where: { id: "default" },
    });

    const now = Date.now();
    const lastSyncedAtMs = config?.lastSyncedAt
      ? new Date(config.lastSyncedAt).getTime()
      : 0;
    const autoSyncIntervalMs = 6 * 60 * 60 * 1000;
    const shouldAutoSync =
      Boolean(config?.playlistUrl) &&
      (!lastSyncedAtMs || now - lastSyncedAtMs >= autoSyncIntervalMs);

    if (shouldAutoSync && config?.playlistUrl) {
      try {
        await syncLearningVideosFromPlaylistUrl(config.playlistUrl);
        config = await prisma.learningVideoConfig.findUnique({
          where: { id: "default" },
        });
      } catch (error) {
        console.error("[LEARNING_VIDEOS_AUTO_SYNC]", error);
      }
    }

    const videos = await prisma.learningVideo.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      playlistUrl: config?.playlistUrl || "",
      lastSyncedAt: config?.lastSyncedAt || null,
      videos,
    });
  } catch (error) {
    console.error("Failed to fetch learning videos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const title = (body?.title || "").trim();
    const videoUrl = (body?.videoUrl || "").trim();
    const requestedInsertAt = Number(body?.insertAt);

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!videoUrl) {
      return NextResponse.json(
        { error: "YouTube video link is required." },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube video link." },
        { status: 400 }
      );
    }

    const totalCount = await prisma.learningVideo.count();
    const normalizedIndex = Number.isFinite(requestedInsertAt)
      ? Math.min(Math.max(Math.floor(requestedInsertAt) - 1, 0), totalCount)
      : totalCount;

    const created = await prisma.$transaction(async (tx) => {
      await tx.learningVideo.updateMany({
        where: { sortOrder: { gte: normalizedIndex } },
        data: { sortOrder: { increment: 1 } },
      });

      return tx.learningVideo.create({
        data: {
          title,
          videoId,
          sourceUrl: videoUrl,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          sortOrder: normalizedIndex,
          isActive: true,
        },
      });
    });

    return NextResponse.json({ success: true, video: created });
  } catch (error) {
    const err = error as { code?: string };
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "This video already exists." },
        { status: 409 }
      );
    }
    console.error("Failed to add learning video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const id = body?.id as string | undefined;
    const title = (body?.title || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Video id is required." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const updated = await prisma.learningVideo.update({
      where: { id },
      data: { title },
      select: { id: true, title: true },
    });

    return NextResponse.json({ success: true, video: updated });
  } catch (error) {
    console.error("Failed to update learning video title:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const orderedIds = Array.isArray(body?.orderedIds) ? body.orderedIds : null;
    if (!orderedIds || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds is required." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      orderedIds.map((id: string, idx: number) =>
        prisma.learningVideo.update({
          where: { id },
          data: { sortOrder: idx },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update learning videos order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Video id is required." }, { status: 400 });
    }

    await prisma.learningVideo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete learning video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
