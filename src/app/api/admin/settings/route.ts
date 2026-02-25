import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mergeSiteSettings } from "@/lib/site-settings";
import { getSiteSettingsRow, saveSiteSettingsRow } from "@/lib/site-settings-store";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const row = await getSiteSettingsRow();

    const settings = mergeSiteSettings(row);
    return NextResponse.json({ settings, updatedAt: row?.updatedAt || null });
  } catch (error) {
    console.error("Failed to fetch admin settings:", error);
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
    const mainLogoUrl = (body?.mainLogoUrl || "").trim();
    const landingVideoUrl = (body?.landingVideoUrl || "").trim();
    const ctaVideos = Array.isArray(body?.ctaVideos) ? body.ctaVideos : null;
    const plans = Array.isArray(body?.plans) ? body.plans : null;

    const saved = await saveSiteSettingsRow({
      mainLogoUrl: mainLogoUrl || null,
      landingVideoUrl: landingVideoUrl || null,
      ctaVideos,
      plans,
    });

    return NextResponse.json({
      success: true,
      settings: mergeSiteSettings(saved),
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update admin settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

