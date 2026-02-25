import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitApi } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletBalanceCents: true,
      },
    });

    const walletLedgerDelegate = (prisma as any).walletLedger;
    const ledger =
      walletLedgerDelegate && typeof walletLedgerDelegate.findMany === "function"
        ? await walletLedgerDelegate.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [];

    return NextResponse.json({
      balanceCents: user?.walletBalanceCents || 0,
      ledger,
    });
  } catch (error) {
    console.error("[WALLET_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

