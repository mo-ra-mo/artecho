const PLAYLIST_ID_REGEX = /^[A-Za-z0-9_-]{10,}$/;
type PlaylistVideo = {
  title: string;
  videoId: string;
  sourceUrl: string;
  embedUrl: string;
  sortOrder: number;
};

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function getTagValue(block: string, tag: string) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = block.match(regex);
  return match?.[1]?.trim() || "";
}

function getLinkHref(block: string) {
  const match = block.match(/<link[^>]*href="([^"]+)"/);
  return match?.[1] || "";
}

export function extractPlaylistId(input: string) {
  const raw = (input || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const list = url.searchParams.get("list");
    if (list && PLAYLIST_ID_REGEX.test(list)) return list;
  } catch {
    // non-url fallback
  }

  if (raw.includes("list=")) {
    const list = raw.split("list=")[1]?.split("&")[0];
    if (list && PLAYLIST_ID_REGEX.test(list)) return list;
  }

  if (PLAYLIST_ID_REGEX.test(raw)) return raw;
  return null;
}

export function extractYouTubeVideoId(input: string) {
  const raw = (input || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return id && PLAYLIST_ID_REGEX.test(id) ? id : null;
    }

    const v = url.searchParams.get("v");
    if (v && PLAYLIST_ID_REGEX.test(v)) return v;
  } catch {
    // non-url fallback
  }

  if (raw.includes("v=")) {
    const id = raw.split("v=")[1]?.split("&")[0];
    if (id && PLAYLIST_ID_REGEX.test(id)) return id;
  }

  return PLAYLIST_ID_REGEX.test(raw) ? raw : null;
}

export async function fetchPlaylistVideos(playlistId: string) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  const res = await fetch(feedUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch YouTube playlist feed.");
  }

  const xml = await res.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  return entries
    .map<PlaylistVideo | null>((entry, index) => {
      const block = entry[1];
      const videoId = getTagValue(block, "yt:videoId");
      const title = decodeHtml(getTagValue(block, "title"));
      const sourceUrl = getLinkHref(block);
      if (!videoId || !title) return null;

      return {
        title,
        videoId,
        sourceUrl: sourceUrl || `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        sortOrder: index,
      };
    })
    .filter((video): video is PlaylistVideo => Boolean(video));
}
