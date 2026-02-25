/**
 * POST /api/auth/register
 *
 * ثبت‌نام کاربر جدید:
 *   1. Validate input with Zod
 *   2. Check duplicate email
 *   3. Hash password with bcrypt (12 rounds)
 *   4. Create user with FREE plan
 *   5. Return user (without passwordHash)
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { rateLimitRegister } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = await rateLimitRegister(request);
    if (limited) return limited;

    const body = await request.json();

    // ① Zod validation
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // ② Duplicate check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ③ Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // ④ Create user + FREE plan
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        plans: {
          create: {
            tier: "FREE",
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
