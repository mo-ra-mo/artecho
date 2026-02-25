import { prisma } from "@/lib/prisma";

export function getStartOfCurrentMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export async function resetMonthlyUsageIfNeeded(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyUsageResetAt: true },
  });
  if (!user) return;
  const monthStart = getStartOfCurrentMonth();
  if (!user.monthlyUsageResetAt || user.monthlyUsageResetAt < monthStart) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        monthlyUploadUsedBytes: BigInt(0),
        monthlyUsageResetAt: monthStart,
      },
      select: { id: true },
    });
  }
}

