/**
 * GET /api/admin/stats
 *
 * Dashboard statistics — admin only.
 * Returns: totalUsers, activeUsers, paidPlans, todaySessions, charts data
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    recentActiveUsers,
    paidPlans,
    todaySessions,
    totalSessions,
    plansByTier,
    last7DaysSessions,
  ] = await Promise.all([
    prisma.user.count(),

    // Users active in last 30 days
    prisma.user.count({
      where: { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),

    // Paid active plans (non-FREE)
    prisma.plan.count({
      where: { status: "ACTIVE", tier: { not: "FREE" } },
    }),

    // Learning sessions created today
    prisma.learningSession.count({
      where: { createdAt: { gte: todayStart } },
    }),

    prisma.learningSession.count(),

    // Plans grouped by tier
    prisma.plan.groupBy({
      by: ["tier"],
      where: { status: "ACTIVE" },
      _count: true,
    }),

    // Sessions per day for last 7 days
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now);
        day.setDate(day.getDate() - (6 - i));
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return prisma.learningSession.count({
          where: { createdAt: { gte: start, lt: end } },
        }).then((count) => ({
          date: start.toISOString().slice(5, 10),
          sessions: count,
        }));
      })
    ),
  ]);

  const tierMap: Record<string, number> = {};
  for (const g of plansByTier) {
    tierMap[g.tier] = g._count;
  }

  return NextResponse.json({
    totalUsers,
    activeUsers: recentActiveUsers,
    paidPlans,
    todaySessions,
    totalSessions,
    plansByTier: [
      { name: "Free", value: tierMap["FREE"] || 0 },
      { name: "Basic", value: tierMap["BASIC"] || 0 },
      { name: "Pro", value: tierMap["PRO"] || 0 },
      { name: "Pro+", value: tierMap["PRO_PLUS"] || 0 },
      { name: "Creator", value: tierMap["CREATOR"] || 0 },
    ],
    sessionsPerDay: last7DaysSessions,
  });
}
