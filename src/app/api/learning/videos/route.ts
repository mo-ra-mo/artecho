import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.learningVideo.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        videoId: true,
        embedUrl: true,
        sortOrder: true,
      },
    });

    const withThumbnails = videos.map((video) => ({
      ...video,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
      thumbnailFallbackUrl: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
    }));

    return NextResponse.json({ videos: withThumbnails });
  } catch (error) {
    console.error("Failed to fetch learning videos for learn page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
