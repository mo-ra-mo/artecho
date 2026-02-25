import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncLearningVideosFromPlaylistUrl } from "@/lib/learning-video-sync";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const playlistUrl = (body?.playlistUrl || "").trim();
    const result = await syncLearningVideosFromPlaylistUrl(playlistUrl);
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Failed to sync playlist videos:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message.includes("Invalid YouTube playlist") ||
      message.includes("No videos found")
        ? 400
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
