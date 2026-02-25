import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15, // 5 attempts per 15 minutes
  blockDuration: 60 * 15,
});

const registerLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60, // 3 registrations per hour per IP
  blockDuration: 60 * 30,
});

const apiLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60, // 30 requests per minute
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "127.0.0.1";
}

export async function rateLimitLogin(request: Request) {
  const ip = getClientIp(request);
  try {
    await loginLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }
}

export async function rateLimitRegister(request: Request) {
  const ip = getClientIp(request);
  try {
    await registerLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }
}

export async function rateLimitApi(request: Request) {
  const ip = getClientIp(request);
  try {
    await apiLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429 }
    );
  }
}
