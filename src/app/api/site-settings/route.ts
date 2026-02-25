import { NextResponse } from "next/server";
import { mergeSiteSettings } from "@/lib/site-settings";
import { getSiteSettingsRow } from "@/lib/site-settings-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const row = await getSiteSettingsRow();

    return NextResponse.json(
      { settings: mergeSiteSettings(row) },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch public site settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

