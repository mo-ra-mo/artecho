"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

const NAV_LINKS = [
  { href: "/app", label: "Home" },
  { href: "/app", label: "Features" },
  { href: "/learn", label: "Learn" },
  { href: "/train-ai", label: "Train AI" },
  { href: "/marketplace", label: "Marketplace" },
];

export function Navbar({ activePage } = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/i-6-1.png");

  useEffect(() => {
    let mounted = true;
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        const nextLogo = data?.settings?.mainLogoUrl;
        if (typeof nextLogo === "string" && nextLogo.trim()) {
          setLogoSrc(nextLogo);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900"
        >
          <Image
            src={logoSrc}
            alt="ArtEcho"
            width={128}
            height={128}
            className="h-16 w-16 sm:h-18 sm:w-18 object-contain"
            style={{
              filter: "brightness(0.9) invert(0)",
            }}
          />
          {/* <span className="hidden xs:inline">ArtEcho</span> */}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={
                activePage === link.href
                  ? "rounded-lg bg-zinc-100 px-3 py-2 text-zinc-900 font-medium"
                  : "rounded-lg px-3 py-2 text-zinc-700 hover:bg-zinc-100"
              }
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className={
              activePage === "/dashboard"
                ? "rounded-lg bg-zinc-800 px-3 py-2 text-white"
                : "rounded-lg bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-800"
            }
          >
            Dashboard
          </Link>
          <UserMenu variant="light" />
        </nav>

        {/* Mobile: user menu + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <UserMenu variant="light" />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200/60 bg-white/95 backdrop-blur px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={
                  activePage === link.href
                    ? "rounded-lg bg-zinc-100 px-3 py-2.5 text-sm text-zinc-900 font-medium"
                    : "rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100"
                }
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-zinc-900 px-3 py-2.5 text-sm text-white text-center hover:bg-zinc-800 mt-1"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
