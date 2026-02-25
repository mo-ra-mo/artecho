import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function toSvgDataUrl(title: string, subtitle: string) {
  const esc = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <rect x="64" y="64" width="896" height="896" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
  <text x="96" y="170" fill="#ffffff" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="700">MVP Preview</text>
  <foreignObject x="96" y="220" width="832" height="700">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-family:Inter,Arial,sans-serif;line-height:1.45;">
      <p style="font-size:28px;font-weight:700;margin:0 0 20px 0;">${esc(title)}</p>
      <p style="font-size:20px;opacity:0.9;margin:0;">${esc(subtitle)}</p>
    </div>
  </foreignObject>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function pickImageUrl(payload: unknown): string | null {
  const p = payload as Record<string, unknown>;
  const direct = [
    p?.image?.toString?.(),
    p?.imageUrl?.toString?.(),
    p?.url?.toString?.(),
    (p?.images as unknown[] | undefined)?.[0]?.toString?.(),
    (p?.output as unknown[] | undefined)?.[0]?.toString?.(),
    (p?.result as Record<string, unknown> | undefined)?.image?.toString?.(),
    (p?.result as Record<string, unknown> | undefined)?.url?.toString?.(),
  ].filter(Boolean) as string[];
  return direct[0] || null;
}

async function generateWithFal(params: {
  prompt: string;
  category: string;
  adapterUrl: string;
}) {
  const endpoint = (process.env.FAL_GENERATE_ENDPOINT || "").trim();
  const falKey = process.env.FAL_KEY || "";
  if (!endpoint || !falKey) return null;

  const url = `https://fal.run/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${falKey}`,
      "x-fal-key": falKey,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      style: params.category || undefined,
      lora_url: params.adapterUrl,
      adapter_url: params.adapterUrl,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json && (json.error || json.message)) || "fal generate failed."
    );
  }
  const imageUrl = pickImageUrl(json);
  if (!imageUrl) {
    throw new Error("fal generate did not return an image URL.");
  }
  return { imageUrl, provider: "fal" as const, raw: json };
}

async function generateWithExternal(params: {
  prompt: string;
  category: string;
  adapterUrl: string;
}) {
  const url = (process.env.LORA_EXTERNAL_GENERATE_URL || "").trim();
  if (!url) return null;
  const apiKey = process.env.LORA_EXTERNAL_API_KEY || "";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      prompt: params.prompt,
      category: params.category,
      adapterUrl: params.adapterUrl,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json && (json.error || json.message)) || "external generate failed."
    );
  }
  const imageUrl = pickImageUrl(json);
  if (!imageUrl) {
    throw new Error("external generate did not return an image URL.");
  }
  return { imageUrl, provider: "external" as const, raw: json };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim();
    const category = String(body?.category || "").trim();
    const modelId = String(body?.modelId || "").trim();
    if (!prompt || prompt.length < 5) {
      return NextResponse.json(
        { error: "Prompt is required (min 5 chars)." },
        { status: 400 }
      );
    }
    if (!modelId) {
      return NextResponse.json({ error: "modelId is required." }, { status: 400 });
    }

    const model = await prisma.loraModel.findFirst({
      where: {
        id: modelId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
        latestVersion: true,
        adapterUrl: true,
      },
    });
    if (!model) {
      return NextResponse.json({ error: "Model not found." }, { status: 404 });
    }
    if (model.status !== "READY") {
      return NextResponse.json(
        { error: "Model is not ready yet. Train it first." },
        { status: 400 }
      );
    }

    const adapterUrl =
      model.adapterUrl || `mvp://lora/${model.id}/v${model.latestVersion || 1}`;
    const mode = (process.env.LORA_PROVIDER || "mvp").toLowerCase();

    let out:
      | { imageUrl: string; provider: "fal" | "external" | "mvp"; raw?: unknown }
      | null = null;
    if (mode === "fal") {
      out = await generateWithFal({ prompt, category, adapterUrl });
    }
    if (!out && mode === "external") {
      out = await generateWithExternal({ prompt, category, adapterUrl });
    }
    if (!out) {
      out = {
        provider: "mvp",
        imageUrl: toSvgDataUrl(prompt, `${model.name} · ${category || "General"}`),
      };
    }

    const generation = await prisma.generatedImage.create({
      data: {
        userId: session.user.id,
        modelId: model.id,
        prompt,
        category: category || null,
        imageUrl: out.imageUrl,
        provider: out.provider,
        adapterUrl,
      },
      select: {
        id: true,
        modelId: true,
        prompt: true,
        category: true,
        imageUrl: true,
        provider: true,
        adapterUrl: true,
        isFavorite: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      provider: out.provider,
      imageUrl: out.imageUrl,
      model: {
        id: model.id,
        name: model.name,
        version: model.latestVersion,
      },
      adapterUrl,
      generation,
      meta: out.raw || null,
    });
  } catch (error) {
    console.error("[TRAIN_AI_GENERATE_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

