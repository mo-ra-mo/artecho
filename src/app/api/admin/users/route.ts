/**
 * /api/admin/users — admin only
 *
 * GET  → list all users with active plan
 * POST → update user (id, name, email, role)
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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      freeAiTrainingUsed: true,
      freeVideoUploadsUsed: true,
      freeEducationalVideosUsed: true,
      plans: {
        where: { status: "ACTIVE" },
        orderBy: { startDate: "desc" },
        take: 1,
        select: { tier: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = users.map((u) => ({
    ...u,
    plan: u.role === "ADMIN" ? "CREATOR" : u.plans[0]?.tier || "FREE",
    plans: undefined,
  }));

  return NextResponse.json({ users: mapped });
}

export async function POST(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, name, email, role: newRole } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(newRole && { role: newRole }),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
