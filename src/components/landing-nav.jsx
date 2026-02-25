"use client";

import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export function LandingNav() {
  return (
    <nav className="fixed top-0 bg-black/60 backdrop-blur-sm left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-tight text-white">
        <span className="truncate">SchoolKids Ai Project</span>
        <span className="hidden sm:inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-400 text-[10px] leading-none">
          &amp;
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-medium tracking-[0.15em] sm:tracking-[0.25em] uppercase text-neutral-200">
        <button className="hidden sm:inline hover:text-white transition-colors cursor-pointer">
          FEATURES
        </button>
        <Link
          href="/admin/login"
          className="rounded-full bg-neutral-900 px-3 sm:px-5 py-1.5 sm:py-2 font-semibold text-neutral-50 uppercase hover:bg-neutral-800 transition-colors"
        >
          LAUNCH
        </Link>
        <UserMenu variant="dark" />
      </div>
    </nav>
  );
}
