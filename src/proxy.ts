import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await auth();
  const isLoggedIn = !!session?.user;
  const role = (session?.user as { role?: string })?.role;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/admin/login", request.url));
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/train-ai") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/billing")
  ) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/learn/:path*",
    "/train-ai/:path*",
    "/marketplace/:path*",
    "/billing/:path*",
  ],
};
