import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function parseFilters(url: URL) {
  const search = String(url.searchParams.get("search") || "").trim();
  const provider = String(url.searchParams.get("provider") || "").trim();
  const modelId = String(url.searchParams.get("modelId") || "").trim();
  const favoriteOnlyRaw = String(url.searchParams.get("favoriteOnly") || "").trim();
  const favoriteOnly = favoriteOnlyRaw === "1" || favoriteOnlyRaw === "true";
  const sort = String(url.searchParams.get("sort") || "favorites_newest").trim();
  const deleted = String(url.searchParams.get("deleted") || "without").trim();
  return { search, provider, modelId, favoriteOnly, sort, deleted };
}

function parseBodyFilters(body: Record<string, unknown>) {
  const filters = (body?.filters || {}) as Record<string, unknown>;
  return {
    search: String(filters.search || "").trim(),
    provider: String(filters.provider || "").trim(),
    modelId: String(filters.modelId || "").trim(),
    favoriteOnly: !!filters.favoriteOnly,
  };
}

function buildWhere(
  userId: string,
  filters: {
    search?: string;
    provider?: string;
    modelId?: string;
    favoriteOnly?: boolean;
  },
  deletedMode: "without" | "only" | "with" = "without"
) {
  return {
    userId,
    ...(deletedMode === "without"
      ? { deletedAt: null as null }
      : deletedMode === "only"
      ? { deletedAt: { not: null } }
      : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.modelId ? { modelId: filters.modelId } : {}),
    ...(filters.favoriteOnly ? { isFavorite: true } : {}),
    ...(filters.search
      ? {
          OR: [
            { prompt: { contains: filters.search } },
            { model: { name: { contains: filters.search } } },
          ],
        }
      : {}),
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") || 12);
    const pageRaw = Number(url.searchParams.get("page") || 1);
    const { search, provider, modelId, favoriteOnly, sort, deleted } = parseFilters(url);

    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(60, Math.floor(limitRaw)))
      : 12;
    const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
    const skip = (page - 1) * limit;

    const deletedMode =
      deleted === "only" ? "only" : deleted === "with" ? "with" : "without";
    const where = buildWhere(
      session.user.id,
      {
        search,
        provider,
        modelId,
        favoriteOnly,
      },
      deletedMode
    );

    const orderBy =
      sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : sort === "oldest"
        ? [{ createdAt: "asc" as const }]
        : sort === "provider"
        ? [{ provider: "asc" as const }, { createdAt: "desc" as const }]
        : [{ isFavorite: "desc" as const }, { createdAt: "desc" as const }];

    const [items, total] = await Promise.all([
      prisma.generatedImage.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          modelId: true,
          prompt: true,
          category: true,
          imageUrl: true,
          provider: true,
          adapterUrl: true,
          isFavorite: true,
          deletedAt: true,
          createdAt: true,
          model: {
            select: {
              name: true,
              latestVersion: true,
            },
          },
        },
      }),
      prisma.generatedImage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      page,
      limit,
      total,
      sort,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("[TRAIN_AI_GENERATIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body?.action || "favorite").trim();
    const id = String(body?.id || "");
    const ids = Array.isArray(body?.ids)
      ? body.ids
          .map((v: unknown) => String(v || "").trim())
          .filter(Boolean)
      : [];
    const isFavorite = !!body?.isFavorite;
    const selectAllMatching = !!body?.selectAllMatching;

    if (action === "restore") {
      const selectAllMatching = !!body?.selectAllMatching;
      let restoreWhere: Record<string, unknown>;
      if (selectAllMatching) {
        const filters = parseBodyFilters(body);
        restoreWhere = buildWhere(session.user.id, filters, "only");
      } else {
        const restoreIds = ids.length ? ids : id ? [id] : [];
        if (!restoreIds.length) {
          return NextResponse.json(
            { error: "id or ids is required for restore." },
            { status: 400 }
          );
        }
        restoreWhere = { id: { in: restoreIds }, userId: session.user.id };
      }
      const restored = await prisma.generatedImage.updateMany({
        where: restoreWhere,
        data: { deletedAt: null },
      });
      return NextResponse.json({ success: true, restoredCount: restored.count });
    }

    const targetIds = ids.length ? ids : id ? [id] : [];
    let where: Record<string, unknown>;
    if (selectAllMatching) {
      const filters = parseBodyFilters(body);
      where = buildWhere(session.user.id, filters);
    } else {
      if (!targetIds.length) {
        return NextResponse.json(
          { error: "id or ids is required." },
          { status: 400 }
        );
      }
      where = { id: { in: targetIds }, userId: session.user.id, deletedAt: null };
    }

    const updated = await prisma.generatedImage.updateMany({
      where,
      data: { isFavorite },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRAIN_AI_GENERATIONS_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") || "").trim();
    const idsFromQuery = String(url.searchParams.get("ids") || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const idsFromBody = Array.isArray(body?.ids)
      ? body.ids
          .map((v: unknown) => String(v || "").trim())
          .filter(Boolean)
      : [];
    const selectAllMatching = !!body?.selectAllMatching;
    const permanent =
      String(url.searchParams.get("permanent") || "").trim() === "true" ||
      !!body?.permanent;
    const targetIds = [
      ...(id ? [id] : []),
      ...idsFromQuery,
      ...idsFromBody,
    ];

    let where: Record<string, unknown>;
    if (selectAllMatching) {
      const filters = parseBodyFilters(body);
      where = buildWhere(session.user.id, filters, permanent ? "only" : "without");
    } else {
      if (!targetIds.length) {
        return NextResponse.json({ error: "id or ids is required." }, { status: 400 });
      }
      where = {
        id: { in: targetIds },
        userId: session.user.id,
        ...(permanent ? { deletedAt: { not: null } } : { deletedAt: null }),
      };
    }

    const rows = await prisma.generatedImage.findMany({
      where,
      select: { id: true },
    });
    const deletedIds = rows.map((row) => row.id);
    if (!deletedIds.length) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const deleted = permanent
      ? await prisma.generatedImage.deleteMany({
          where: { id: { in: deletedIds }, userId: session.user.id },
        })
      : await prisma.generatedImage.updateMany({
          where: { id: { in: deletedIds }, userId: session.user.id },
          data: { deletedAt: new Date() },
        });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedCount: deleted.count, deletedIds });
  } catch (error) {
    console.error("[TRAIN_AI_GENERATIONS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

