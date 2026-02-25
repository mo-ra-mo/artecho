import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import {
  isSupabaseStorageEnabled,
  uploadToSupabaseStorage,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtFromType(type: string, fallbackName: string) {
  const direct: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
  };
  if (direct[type]) return direct[type];
  const parts = fallbackName.split(".");
  return parts.length > 1 ? parts.pop() || "bin" : "bin";
}

function validateMime(target: string, mimeType: string) {
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  if (target === "logo") return isImage;
  if (target === "landing" || target === "cta") return isVideo;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const form = await request.formData();
    const target = String(form.get("target") || "").trim();
    const file = form.get("file");

    if (!target || !(file instanceof File)) {
      return NextResponse.json(
        { error: "target and file are required." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Invalid file size (max 50MB)." },
        { status: 400 }
      );
    }

    if (!validateMime(target, file.type)) {
      return NextResponse.json(
        { error: "Invalid file type for selected target." },
        { status: 400 }
      );
    }

    const ext = getExtFromType(file.type, file.name || "upload.bin");
    const safeBase = sanitizeFilename(
      path.basename(file.name || `${target}.${ext}`, path.extname(file.name || ""))
    );
    const filename = `${target}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safeBase}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    // On Vercel/serverless, local filesystem is ephemeral.
    // Prefer durable object storage when configured.
    if (isSupabaseStorageEnabled()) {
      const uploaded = await uploadToSupabaseStorage({
        path: `site-settings/${filename}`,
        body: bytes,
        contentType: file.type || "application/octet-stream",
      });
      return NextResponse.json({ success: true, url: uploaded.publicUrl });
    }

    const isVercel = Boolean(process.env.VERCEL);
    if (isVercel) {
      return NextResponse.json(
        {
          error:
            "Supabase Storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET to enable durable uploads on Vercel.",
        },
        { status: 503 }
      );
    }

    // Local dev fallback.
    const dir = path.join(process.cwd(), "public", "uploads", "site-settings");
    await mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    await writeFile(fullPath, bytes);
    return NextResponse.json({
      success: true,
      url: `/uploads/site-settings/${filename}`,
    });
  } catch (error) {
    console.error("Failed to upload admin settings file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

