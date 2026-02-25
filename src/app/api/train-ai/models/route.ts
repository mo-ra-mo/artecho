import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLoraPlanLimits, isUnlimited } from "@/lib/lora-plan";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const loraModelDelegate = (prisma as any).loraModel;
    const modelsPromise =
      loraModelDelegate && typeof loraModelDelegate.findMany === "function"
        ? loraModelDelegate.findMany({
            where: { userId, status: { not: "ARCHIVED" } },
            orderBy: { createdAt: "desc" },
            include: {
              jobs: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  provider: true,
                  status: true,
                  progress: true,
                  createdAt: true,
                  finishedAt: true,
                  notes: true,
                },
              },
            },
          })
        : Promise.resolve([]);
    const [tier, models] = await Promise.all([
      getEffectiveUserPlanTier({
        userId,
        role: session.user.role,
      }),
      modelsPromise,
    ]);

    const limits = getLoraPlanLimits(tier);

    return NextResponse.json({
      tier,
      limits: {
        ...limits,
        maxModelsUnlimited: isUnlimited(limits.maxModels),
        maxVideosPerModelUnlimited: isUnlimited(limits.maxVideosPerModel),
        maxTrainRunsUnlimited: isUnlimited(limits.maxTrainRuns),
      },
      usage: {
        modelsUsed: models.length,
      },
      models: models.map((model: { jobs: unknown[] } & Record<string, unknown>) => ({
        ...model,
        latestJob: model.jobs[0] || null,
      })),
    });
  } catch (error) {
    console.error("[TRAIN_AI_MODELS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const modelName = String(body?.name || "").trim();
    const name = modelName || `My Style Model ${new Date().toLocaleDateString("en-CA")}`;

    const userId = session.user.id;
    const tier = await getEffectiveUserPlanTier({
      userId,
      role: session.user.role,
    });
    const limits = getLoraPlanLimits(tier);

    const loraModelDelegate = (prisma as any).loraModel;
    const currentCount =
      loraModelDelegate && typeof loraModelDelegate.count === "function"
        ? await loraModelDelegate.count({
            where: { userId, status: { not: "ARCHIVED" } },
          })
        : 0;

    if (!isUnlimited(limits.maxModels) && currentCount >= (limits.maxModels || 0)) {
      return NextResponse.json(
        {
          error: `Your plan allows up to ${limits.maxModels} model(s).`,
          code: "MODEL_SLOT_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    if (!loraModelDelegate || typeof loraModelDelegate.create !== "function") {
      return NextResponse.json(
        { error: "LoRA models are not enabled in the current database schema." },
        { status: 503 }
      );
    }

    const created = await loraModelDelegate.create({
      data: {
        userId,
        name,
        status: "READY",
        planTier: tier,
      },
    });

    return NextResponse.json({ success: true, model: created }, { status: 201 });
  } catch (error) {
    console.error("[TRAIN_AI_MODELS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

