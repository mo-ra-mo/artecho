import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";
import { getLoraPlanLimits, isUnlimited } from "@/lib/lora-plan";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getEffectiveUserPlanTier({
      userId: session.user.id,
      role: session.user.role,
    });
    const loraLimits = getLoraPlanLimits(tier);

    return NextResponse.json({
      success: true,
      tier,
      isAdminOverride: session.user.role === "ADMIN",
      limits: {
        loraModels: {
          limit: loraLimits.maxModels,
          unlimited: isUnlimited(loraLimits.maxModels),
        },
        loraVideosPerModel: {
          limit: loraLimits.maxVideosPerModel,
          unlimited: isUnlimited(loraLimits.maxVideosPerModel),
        },
        loraTrainRuns: {
          limit: loraLimits.maxTrainRuns,
          unlimited: isUnlimited(loraLimits.maxTrainRuns),
        },
      },
    });
  } catch (error) {
    console.error("[USER_PLAN_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

