import type { PlanTier, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getEffectiveUserPlanTier(params: {
  userId: string;
  role?: Role | string | null;
}): Promise<PlanTier> {
  const role = params.role || null;
  if (role === "ADMIN") return "CREATOR";

  const activePlan = await prisma.plan.findFirst({
    where: {
      userId: params.userId,
      status: "ACTIVE",
    },
    orderBy: { startDate: "desc" },
    select: { tier: true },
  });

  return activePlan?.tier || "FREE";
}

