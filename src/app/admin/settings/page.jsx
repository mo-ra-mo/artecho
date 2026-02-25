"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AppToast } from "@/components/app-toast";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", href: "/admin/dashboard" },
  { label: "Users", icon: "users", href: "/admin/users" },
  { label: "Learning", icon: "book", href: "/admin/learning" },
  { label: "Content & DB", icon: "card", href: "/admin/content-db" },
  { label: "Overview", icon: "card", href: "/admin" },
  { label: "Plans & Billing", icon: "card", href: "/admin/plans" },
  { label: "Settings", icon: "settings", href: "/admin/settings" },
];

const CTA_SLOTS_COUNT = 5;

function toCtaSlots(text) {
  const lines = String(text || "")
    .split("\n")
    .map((item) => item.trim());
  const slots = lines.slice(0, CTA_SLOTS_COUNT);
  while (slots.length < CTA_SLOTS_COUNT) slots.push("");
  return slots;
}

function NavIcon({ name, className }) {
  const icons = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
      </>
    ),
    card: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mainLogoUrl, setMainLogoUrl] = useState("");
  const [landingVideoUrl, setLandingVideoUrl] = useState("");
  const [ctaVideosText, setCtaVideosText] = useState("");
  const [plansText, setPlansText] = useState("[]");
  const [logoFile, setLogoFile] = useState(null);
  const [landingFile, setLandingFile] = useState(null);
  const [ctaFile, setCtaFile] = useState(null);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [uploadingTarget, setUploadingTarget] = useState("");

  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimersRef = useRef([]);

  const showToast = useCallback((message, type = "info") => {
    toastTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    toastTimersRef.current = [];
    setToast({ message, type });
    setToastVisible(true);
    const hideTimer = setTimeout(() => setToastVisible(false), 2200);
    const clearTimer = setTimeout(() => {
      setToast(null);
      toastTimersRef.current = [];
    }, 2600);
    toastTimersRef.current.push(hideTimer, clearTimer);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;
      const data = await res.json();
      const settings = data.settings || {};
      setMainLogoUrl(settings.mainLogoUrl || "");
      setLandingVideoUrl(settings.landingVideoUrl || "");
      setCtaVideosText(toCtaSlots((settings.ctaVideos || []).join("\n")).join("\n"));
      setPlansText(JSON.stringify(settings.plans || [], null, 2));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchSettings();
    }
  }, [status, session, fetchSettings]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") {
    router.push("/admin/login");
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const ctaVideos = toCtaSlots(ctaVideosText);

      let plans;
      try {
        plans = JSON.parse(plansText);
        if (!Array.isArray(plans)) throw new Error("Plans must be an array.");
      } catch {
        showToast("Plans JSON is invalid.", "error");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainLogoUrl,
          landingVideoUrl,
          ctaVideos,
          plans,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save settings.", "error");
        return;
      }
      showToast("Settings saved successfully.", "success");
    } catch {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const applyCtaUrlAtIndex = useCallback(
    (index, url) => {
      const normalized = toCtaSlots(ctaVideosText);
      normalized[index] = url.trim();
      setCtaVideosText(normalized.join("\n"));
    },
    [ctaVideosText]
  );

  const handleUpload = useCallback(
    async (target) => {
      const selectedFile =
        target === "logo" ? logoFile : target === "landing" ? landingFile : ctaFile;
      if (!selectedFile) {
        showToast("Please choose a file first.", "error");
        return;
      }

      setUploadingTarget(target);
      try {
        const formData = new FormData();
        formData.append("target", target);
        formData.append("file", selectedFile);

        const res = await fetch("/api/admin/settings/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Upload failed.", "error");
          return;
        }

        if (target === "logo") {
          setMainLogoUrl(data.url);
          setLogoFile(null);
        } else if (target === "landing") {
          setLandingVideoUrl(data.url);
          setLandingFile(null);
        } else {
          applyCtaUrlAtIndex(ctaIndex, data.url);
          setCtaFile(null);
        }
        showToast("File uploaded successfully. Save settings to apply.", "success");
      } catch {
        showToast("Upload failed.", "error");
      } finally {
        setUploadingTarget("");
      }
    },
    [
      applyCtaUrlAtIndex,
      ctaFile,
      ctaIndex,
      landingFile,
      logoFile,
      showToast,
    ]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppToast toast={toast} visible={toastVisible} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-56 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-5">
          <Image src="/i-11.png" alt="ArtEcho" width={36} height={36} />
          <div>
            <p className="text-sm font-bold text-slate-800">ArtEcho</p>
            <p className="text-[10px] text-slate-400">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                item.label === "Settings"
                  ? "bg-amber-50 font-semibold text-amber-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <NavIcon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-3 py-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-50"
          >
            <NavIcon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-56 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="mr-3 rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"
            >
              <svg
                className="h-5 w-5 text-slate-600"
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
            </button>
            <h1 className="text-lg font-bold text-slate-800">Site Settings</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Site
          </Link>
        </header>

        <main className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading settings...
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-800">Branding</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Main Logo URL
                    </label>
                    <input
                      type="text"
                      value={mainLogoUrl}
                      onChange={(e) => setMainLogoUrl(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                      placeholder="/i-6-1.png or https://..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Landing Video URL
                    </label>
                    <input
                      type="text"
                      value={landingVideoUrl}
                      onChange={(e) => setLandingVideoUrl(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                      placeholder="/videos/intro.mp4 or https://..."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-800">Direct File Uploads</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Upload files and URLs will be filled automatically.
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">Logo (Image)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpload("logo")}
                      disabled={uploadingTarget === "logo"}
                      className="mt-2 h-8 w-full rounded-md bg-slate-800 px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {uploadingTarget === "logo" ? "Uploading..." : "Upload Logo"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">Landing Video</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setLandingFile(e.target.files?.[0] || null)}
                      className="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpload("landing")}
                      disabled={uploadingTarget === "landing"}
                      className="mt-2 h-8 w-full rounded-md bg-slate-800 px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {uploadingTarget === "landing"
                        ? "Uploading..."
                        : "Upload Landing Video"}
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700">CTA Video Slot</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-[11px] text-slate-500">Slot</label>
                      <select
                        value={ctaIndex}
                        onChange={(e) => setCtaIndex(Number(e.target.value))}
                        className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
                      >
                        {[0, 1, 2, 3, 4].map((idx) => (
                          <option key={idx} value={idx}>
                            {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setCtaFile(e.target.files?.[0] || null)}
                      className="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpload("cta")}
                      disabled={uploadingTarget === "cta"}
                      className="mt-2 h-8 w-full rounded-md bg-slate-800 px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {uploadingTarget === "cta"
                        ? "Uploading..."
                        : `Upload CTA #${ctaIndex + 1}`}
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-800">CTA Videos</h2>
                <p className="mt-1 text-xs text-slate-400">
                  One URL per line (5 recommended).
                </p>
                <textarea
                  value={ctaVideosText}
                  onChange={(e) => setCtaVideosText(e.target.value)}
                  rows={6}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none"
                />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-800">Financial Plans JSON</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Edit plans as JSON array (used in Home and Billing pages).
                </p>
                <textarea
                  value={plansText}
                  onChange={(e) => setPlansText(e.target.value)}
                  rows={16}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700 outline-none"
                />
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

