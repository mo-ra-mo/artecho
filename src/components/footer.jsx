"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer
      className="relative z-10 w-full"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expandable content — positioned above the bar */}
      <div
        className="absolute bottom-full left-0 right-0 z-50 overflow-hidden border-b border-amber-200/30 transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isExpanded ? "600px" : "0",
          opacity: isExpanded ? 1 : 0,
          backgroundColor: "#f7f0e6",
        }}
      >
        {/* Canvas texture overlay */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <filter id="canvas-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.65 0.65" numOctaves="6" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
          <rect width="100%" height="100%" filter="url(#canvas-texture)" />
        </svg>

        {/* Subtle linen lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(120,90,50,0.4) 3px, rgba(120,90,50,0.4) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(120,90,50,0.3) 3px, rgba(120,90,50,0.3) 4px)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          {/* Vital Quote */}
          <div className="mb-10 text-center">
            <svg className="mx-auto mb-3 opacity-30" width="32" height="32" viewBox="0 0 24 24" fill="#78350f" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <p className="mx-auto max-w-xl text-base italic text-amber-900/70 leading-7 md:text-lg">
              &ldquo;Art is not what you see, but what you make others see.&rdquo;
            </p>
            <p className="mt-2 text-sm font-medium text-amber-900/40">&mdash; Edgar Degas</p>
          </div>

          {/* Decorative graphic illustrations */}
          <div className="mb-10 flex items-center justify-center gap-6 opacity-25">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r="0.5" fill="#78350f" />
              <circle cx="17.5" cy="10.5" r="0.5" fill="#78350f" />
              <circle cx="8.5" cy="7.5" r="0.5" fill="#78350f" />
              <circle cx="6.5" cy="12.5" r="0.5" fill="#78350f" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z" />
              <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
              <path d="M14.5 17.5L4.5 15" />
            </svg>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            {/* Brand + Contact */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <Image src="/i-11.png" alt="ArtEcho" width={36} height={36} className="h-16 w-16 object-contain" />
                <span className="text-lg font-semibold text-amber-950">ArtEcho</span>
              </div>
              <p className="mt-3 text-sm text-amber-900/60 leading-6">
                Where human artistry meets machine learning. Your style, echoed by AI.
              </p>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-amber-900/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  hello@artecho.ai
                </div>
                <div className="flex items-center gap-2.5 text-sm text-amber-900/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  San Francisco, CA
                </div>
                <div className="flex items-center gap-2.5 text-sm text-amber-900/60">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  +1 (555) 123-4567
                </div>
              </div>
            </div>

            {/* Sitemap — Platform */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900/40">Platform</h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: "Home", href: "/app" },
                  { label: "Learn", href: "/learn" },
                  { label: "Marketplace", href: "/marketplace" },
                  { label: "Train AI", href: "/train-ai" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-amber-900/60 transition hover:text-amber-950">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sitemap — Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900/40">Company</h4>
              <ul className="mt-4 space-y-2.5">
                {[
                  { label: "About", href: "/about" },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Press Kit", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-amber-900/60 transition hover:text-amber-950">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect + Sponsors */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900/40">Connect</h4>
              <div className="mt-4 flex gap-3">
                <Link href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/8 text-amber-900/50 transition hover:bg-amber-900/15 hover:text-amber-950">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </Link>
                <Link href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/8 text-amber-900/50 transition hover:bg-amber-900/15 hover:text-amber-950">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </Link>
                <Link href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/8 text-amber-900/50 transition hover:bg-amber-900/15 hover:text-amber-950">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" /></svg>
                </Link>
                <Link href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/8 text-amber-900/50 transition hover:bg-amber-900/15 hover:text-amber-950">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                </Link>
              </div>

              <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-amber-900/40">Sponsors</h4>
              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex h-10 w-20 items-center justify-center rounded-lg bg-amber-900/5 text-xs text-amber-900/30 font-medium">Logo 1</div>
                <div className="flex h-10 w-20 items-center justify-center rounded-lg bg-amber-900/5 text-xs text-amber-900/30 font-medium">Logo 2</div>
                <div className="flex h-10 w-20 items-center justify-center rounded-lg bg-amber-900/5 text-xs text-amber-900/30 font-medium">Logo 3</div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-amber-900/10 pt-6 md:flex-row">
            <p className="text-xs text-amber-900/40">
              &copy; {new Date().getFullYear()} ArtEcho. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-amber-900/40">
              <Link href="#" className="transition hover:text-amber-900/70">Privacy Policy</Link>
              <Link href="#" className="transition hover:text-amber-900/70">Terms of Service</Link>
              <Link href="#" className="transition hover:text-amber-900/70">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed bar — always visible at bottom */}
      <div
        className="border-t border-amber-200/40 bg-amber-50/90 backdrop-blur transition-all duration-500 cursor-pointer"
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1">
          <div className="flex items-center gap-2">
            <Image src="/i-11.png" alt="ArtEcho" width={120} height={120} className="h-16 w-16 object-contain" />
            <span className="text-xs text-amber-800/50">&copy; {new Date().getFullYear()} ArtEcho</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-800/50">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
            <span className="select-none">tap/hover for more</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
