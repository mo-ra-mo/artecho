import { prisma } from "@/lib/prisma";
import { getUploadPlanLimits } from "@/lib/upload-plan";
import { debitWalletIfPossible } from "@/lib/wallet";
import { provisionPhysicalDatabase } from "@/lib/provisioning/provider";

export async function ensureProvisionForTier(params: {
  userId: string;
  tier: "FREE" | "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR";
}) {
  const limits = getUploadPlanLimits(params.tier);
  if (!limits.requiresPhysicalProvision) {
    return { required: false };
  }

  const latest = await (prisma as any).infraProvision.findFirst({
    where: { userId: params.userId, status: { in: ["QUEUED", "RUNNING", "SUCCEEDED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (latest?.status === "SUCCEEDED") {
    return { required: true, alreadyProvisioned: true, provision: latest };
  }
  if (latest?.status === "QUEUED" || latest?.status === "RUNNING") {
    return { required: true, inProgress: true, provision: latest };
  }

  const idempotencyKey = `prov-${params.userId}-${params.tier}-${Date.now()}`;
  const provision = await (prisma as any).infraProvision.create({
    data: {
      userId: params.userId,
      tier: params.tier,
      status: "QUEUED",
      provider: "supabase",
      targetKind: "database",
      costCents: limits.provisioningOneTimeCostCents,
      idempotencyKey,
    },
  });

  return { required: true, queued: true, provision };
}

export async function runProvisionJob(provisionId: string) {
  const provision = await (prisma as any).infraProvision.findUnique({
    where: { id: provisionId },
  });
  if (!provision) throw new Error("Provision job not found.");
  if (provision.status === "SUCCEEDED") return provision;

  await (prisma as any).infraProvision.update({
    where: { id: provision.id },
    data: { status: "RUNNING", startedAt: new Date(), errorMessage: null },
  });

  const tier = String(provision.tier) as "PRO_PLUS" | "CREATOR";
  const limits = getUploadPlanLimits(tier);
  const debit = await debitWalletIfPossible({
    userId: provision.userId,
    amountCents: limits.provisioningOneTimeCostCents,
    reason: "PROVISIONING",
    note: "Automatic physical DB provisioning",
    externalRef: `provision:${provision.id}`,
    metadata: { provisionId: provision.id, tier },
  });

  if (!debit.ok) {
    await (prisma as any).infraProvision.update({
      where: { id: provision.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: "Insufficient wallet balance for provisioning.",
      },
    });
    throw new Error("Insufficient wallet balance for provisioning.");
  }

  try {
    const out = await provisionPhysicalDatabase({
      userId: provision.userId,
      tier,
      idempotencyKey: provision.idempotencyKey || `prov-${provision.id}`,
    });

    return await (prisma as any).infraProvision.update({
      where: { id: provision.id },
      data: {
        status: "SUCCEEDED",
        externalId: out.externalId,
        endpoint: out.endpoint || null,
        metadata: out.raw || null,
        finishedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provision failed.";
    await (prisma as any).infraProvision.update({
      where: { id: provision.id },
      data: { status: "FAILED", errorMessage: message, finishedAt: new Date() },
    });
    throw error;
  }
}

