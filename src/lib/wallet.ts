import { prisma } from "@/lib/prisma";

type WalletReason = "TOPUP" | "UPLOAD_USAGE" | "PROVISIONING" | "ADJUSTMENT";

export async function getWalletBalanceCents(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalanceCents: true },
  });
  return user?.walletBalanceCents || 0;
}

export async function creditWallet(params: {
  userId: string;
  amountCents: number;
  reason: WalletReason;
  note?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
}) {
  if (params.amountCents <= 0) return;

  if (params.externalRef) {
    const existing = await (prisma as any).walletLedger?.findFirst?.({
      where: { externalRef: params.externalRef },
      select: { id: true },
    });
    if (existing?.id) return;
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: params.userId },
      data: { walletBalanceCents: { increment: params.amountCents } },
      select: { walletBalanceCents: true },
    });
    await (tx as any).walletLedger.create({
      data: {
        userId: params.userId,
        entryType: "CREDIT",
        reason: params.reason,
        amountCents: params.amountCents,
        balanceAfter: user.walletBalanceCents,
        externalRef: params.externalRef || null,
        note: params.note || null,
        metadata: params.metadata || null,
      },
    });
  });
}

export async function debitWalletIfPossible(params: {
  userId: string;
  amountCents: number;
  reason: WalletReason;
  note?: string;
  externalRef?: string;
  metadata?: Record<string, unknown>;
}) {
  if (params.amountCents <= 0) return { ok: true, balanceAfter: await getWalletBalanceCents(params.userId) };

  const reserved = await prisma.user.updateMany({
    where: {
      id: params.userId,
      walletBalanceCents: { gte: params.amountCents },
    },
    data: {
      walletBalanceCents: { decrement: params.amountCents },
    },
  });

  if (reserved.count === 0) {
    return { ok: false, balanceAfter: await getWalletBalanceCents(params.userId) };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { walletBalanceCents: true },
  });

  await (prisma as any).walletLedger.create({
    data: {
      userId: params.userId,
      entryType: "DEBIT",
      reason: params.reason,
      amountCents: params.amountCents,
      balanceAfter: user?.walletBalanceCents || 0,
      externalRef: params.externalRef || null,
      note: params.note || null,
      metadata: params.metadata || null,
    },
  });

  return { ok: true, balanceAfter: user?.walletBalanceCents || 0 };
}

