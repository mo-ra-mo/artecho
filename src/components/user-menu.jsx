"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { PlanUsageSnapshot } from "@/components/plan-usage-snapshot";

export function UserMenu({ variant = "light" }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [refreshingSnapshot, setRefreshingSnapshot] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const loadSnapshot = useCallback(async () => {
    if (!session?.user?.id) return;
    setRefreshingSnapshot(true);
    try {
      const progressRes = await fetch("/api/user/progress");
      const progressData = await progressRes.json();
      if (!progressData?.error) {
          setSnapshot({
          planTier: progressData.plan || "FREE",
          watchedUsed: Number(
            progressData?.activity?.watchedVideosCount ??
              progressData?.limits?.educationalVideos?.used ??
              0
          ),
          watchedLimit: progressData?.limits?.educationalVideos?.limit ?? null,
          watchedRemaining:
            progressData?.limits?.educationalVideos?.remaining ?? null,
          uploadsUsed: Number(
            progressData?.activity?.uploadedVideosCount ??
              progressData?.limits?.videoUploads?.used ??
              0
          ),
          uploadsLimit: progressData?.limits?.videoUploads?.limit ?? null,
          uploadsRemaining: progressData?.limits?.videoUploads?.remaining ?? null,
            walletBalanceCents: Number(progressData?.wallet?.balanceCents || 0),
            provisionStatus: progressData?.provisioning?.status || null,
            storageUsedBytes: Number(progressData?.storage?.usedBytes || 0),
            monthlyUploadUsedBytes: Number(progressData?.storage?.monthlyUsedBytes || 0),
        });
        return;
      }

      const planRes = await fetch("/api/user/plan");
      const planData = await planRes.json();
      if (!planData?.error && planData?.tier) {
        setSnapshot((prev) => ({
          planTier: planData.tier,
          watchedUsed: prev?.watchedUsed ?? 0,
          watchedLimit: prev?.watchedLimit ?? null,
          watchedRemaining: prev?.watchedRemaining ?? null,
          uploadsUsed: prev?.uploadsUsed ?? 0,
          uploadsLimit: prev?.uploadsLimit ?? null,
          uploadsRemaining: prev?.uploadsRemaining ?? null,
            walletBalanceCents: prev?.walletBalanceCents ?? 0,
            provisionStatus: prev?.provisionStatus ?? null,
            storageUsedBytes: prev?.storageUsedBytes ?? 0,
            monthlyUploadUsedBytes: prev?.monthlyUploadUsedBytes ?? 0,
        }));
      }
    } catch {
    } finally {
      setRefreshingSnapshot(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    loadSnapshot();
  }, [session?.user?.id, loadSnapshot]);

  if (!session?.user) {
    return (
      <Link
        href="/"
        className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
          variant === "dark"
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        Log in
      </Link>
    );
  }

  const user = session.user;
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  const isDark = variant === "dark";

  return (
    <div ref={menuRef} className="relative mx-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 text-center justify-center transition hover:ring-2 hover:ring-white/20 cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <span
            className="flex h-[34px] w-[34px] items-center justify-center text-center rounded-full bg-linear-to-br from-teal-400 to-indigo-500 text-sm font-bold text-white ring-2 ring-white/20"
          >
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 ${
            isDark
              ? "border-white/15 bg-zinc-900/95 text-white"
              : "border-zinc-200 bg-white text-zinc-800"
          }`}
          role="menu"
        >
          {/* User info header */}
          <div className={`border-b px-4 py-3 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
            <p className="text-sm font-semibold truncate">{user.name || "User"}</p>
            <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-zinc-400"}`}>
              {user.email}
            </p>
            {snapshot && (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={loadSnapshot}
                    disabled={refreshingSnapshot}
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
                      isDark
                        ? "border-white/20 text-white/80 hover:bg-white/10"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    } disabled:opacity-60`}
                  >
                    {refreshingSnapshot ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <PlanUsageSnapshot
                  compact
                  planTier={snapshot.planTier}
                  watchedUsed={snapshot.watchedUsed}
                  watchedLimit={snapshot.watchedLimit}
                  watchedRemaining={snapshot.watchedRemaining}
                  uploadsUsed={snapshot.uploadsUsed}
                  uploadsLimit={snapshot.uploadsLimit}
                  uploadsRemaining={snapshot.uploadsRemaining}
                />
                <div className={`mt-1 rounded-md px-2 py-1 text-[10px] ${isDark ? "bg-white/5 text-white/70" : "bg-zinc-50 text-zinc-600"}`}>
                  Wallet: ${(Number(snapshot.walletBalanceCents || 0) / 100).toFixed(2)}
                  {" · "}Provision: {snapshot.provisionStatus || "N/A"}
                  {" · "}Storage: {(Number(snapshot.storageUsedBytes || 0) / (1024 * 1024)).toFixed(1)}MB
                </div>
              </div>
            )}
          </div>

          <div className="py-1.5">
            <MenuLink href="/dashboard" icon="dashboard" label="Dashboard" isDark={isDark} onClick={() => setOpen(false)} />
            <MenuLink href="/dashboard" icon="profile" label="Profile" isDark={isDark} onClick={() => setOpen(false)} />
            <MenuLink href="/billing" icon="settings" label="Settings & Billing" isDark={isDark} onClick={() => setOpen(false)} />
          </div>

          <div className={`border-t py-1.5 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition cursor-pointer ${
                isDark
                  ? "text-red-400 hover:bg-white/5"
                  : "text-red-500 hover:bg-red-50"
              }`}
              role="menuitem"
            >
              <MenuIcon name="logout" isDark={isDark} isRed />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label, isDark, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-2 text-sm transition ${
        isDark ? "hover:bg-white/5" : "hover:bg-zinc-50"
      }`}
      role="menuitem"
    >
      <MenuIcon name={icon} isDark={isDark} />
      {label}
    </Link>
  );
}

function MenuIcon({ name, isDark, isRed = false }) {
  const cls = `h-4 w-4 ${isRed ? (isDark ? "text-red-400" : "text-red-500") : isDark ? "text-white/50" : "text-zinc-400"}`;

  const icons = {
    dashboard: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    profile: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    settings: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    logout: (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };

  return icons[name] || null;
}
