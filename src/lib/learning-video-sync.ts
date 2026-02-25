import { prisma } from "@/lib/prisma";
import { extractPlaylistId, fetchPlaylistVideos } from "@/lib/youtube-playlist";

export async function syncLearningVideosFromPlaylistUrl(playlistUrl: string) {
  const normalizedUrl = (playlistUrl || "").trim();
  const playlistId = extractPlaylistId(normalizedUrl);

  if (!playlistId) {
    throw new Error("Invalid YouTube playlist link.");
  }

  const videos = await fetchPlaylistVideos(playlistId);
  if (videos.length === 0) {
    throw new Error("No videos found in the playlist.");
  }

  await prisma.$transaction([
    prisma.learningVideo.deleteMany({}),
    prisma.learningVideo.createMany({
      data: videos.map((video, index) => ({
        title: video.title,
        videoId: video.videoId,
        sourceUrl: video.sourceUrl,
        embedUrl: video.embedUrl,
        sortOrder: index,
        isActive: true,
      })),
    }),
    prisma.learningVideoConfig.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        playlistUrl: normalizedUrl,
        lastSyncedAt: new Date(),
      },
      update: {
        playlistUrl: normalizedUrl,
        lastSyncedAt: new Date(),
      },
    }),
  ]);

  return { count: videos.length };
}

