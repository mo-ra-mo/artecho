import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = req.nextUrl.searchParams.get("userId");

    const sessions = await prisma.learningSession.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inputs: {
          select: { id: true, input: true, output: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch learning sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
