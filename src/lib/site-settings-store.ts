import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const FALLBACK_FILE = path.join(
  process.cwd(),
  ".data",
  "site-settings-fallback.json"
);

type SiteSettingsLike = {
  id?: string;
  mainLogoUrl?: string | null;
  landingVideoUrl?: string | null;
  ctaVideos?: unknown;
  plans?: unknown;
  updatedAt?: string | Date | null;
};

function hasSiteSettingsDelegate() {
  const delegate = (prisma as any).siteSettings;
  return (
    delegate &&
    typeof delegate.findUnique === "function" &&
    typeof delegate.upsert === "function"
  );
}

async function readFallbackFile(): Promise<SiteSettingsLike | null> {
  try {
    const raw = await readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as SiteSettingsLike;
  } catch {
    return null;
  }
}

async function writeFallbackFile(value: SiteSettingsLike) {
  const dir = path.dirname(FALLBACK_FILE);
  await mkdir(dir, { recursive: true });
  await writeFile(FALLBACK_FILE, JSON.stringify(value, null, 2), "utf8");
}

export async function getSiteSettingsRow(): Promise<SiteSettingsLike | null> {
  if (hasSiteSettingsDelegate()) {
    return (prisma as any).siteSettings.findUnique({
      where: { id: "default" },
    });
  }
  return readFallbackFile();
}

export async function saveSiteSettingsRow(input: {
  mainLogoUrl: string | null;
  landingVideoUrl: string | null;
  ctaVideos: unknown[] | null;
  plans: unknown[] | null;
}): Promise<SiteSettingsLike> {
  if (hasSiteSettingsDelegate()) {
    return (prisma as any).siteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        mainLogoUrl: input.mainLogoUrl,
        landingVideoUrl: input.landingVideoUrl,
        ctaVideos: input.ctaVideos ?? undefined,
        plans: input.plans ?? undefined,
      },
      update: {
        mainLogoUrl: input.mainLogoUrl,
        landingVideoUrl: input.landingVideoUrl,
        ...(input.ctaVideos ? { ctaVideos: input.ctaVideos } : {}),
        ...(input.plans ? { plans: input.plans } : {}),
      },
    });
  }

  const previous = (await readFallbackFile()) || {};
  const next: SiteSettingsLike = {
    id: "default",
    mainLogoUrl: input.mainLogoUrl,
    landingVideoUrl: input.landingVideoUrl,
    ctaVideos: input.ctaVideos ?? previous.ctaVideos ?? [],
    plans: input.plans ?? previous.plans ?? [],
    updatedAt: new Date().toISOString(),
  };
  await writeFallbackFile(next);
  return next;
}
