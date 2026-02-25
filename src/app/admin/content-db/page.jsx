"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { AppToast } from "@/components/app-toast";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", href: "/admin/dashboard" },
  { label: "Users", icon: "users", href: "/admin/users" },
  { label: "Learning", icon: "book", href: "/admin/learning" },
  { label: "Overview", icon: "card", href: "/admin" },
  { label: "Content & DB", icon: "database", href: "/admin/content-db" },
  { label: "Plans & Billing", icon: "card", href: "/admin/plans" },
  { label: "Settings", icon: "card", href: "/admin/settings" },
];

const TABLE_OPTIONS = [
  { value: "users", label: "Users" },
  { value: "plans", label: "Plans" },
  { value: "learning_sessions", label: "Learning Sessions" },
  { value: "ai_inputs", label: "AI Inputs" },
  { value: "learning_videos", label: "Learning Videos" },
  { value: "lora_models", label: "LoRA Models" },
  { value: "lora_training_videos", label: "LoRA Training Videos" },
  { value: "lora_training_jobs", label: "LoRA Training Jobs" },
  { value: "generated_images", label: "Generated Images" },
  { value: "wallet_ledger", label: "Wallet Ledger" },
  { value: "infra_provisions", label: "Infra Provisions" },
];

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
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
        <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
      </>
    ),
    card: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
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

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminContentDbPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimersRef = useRef([]);

  const [videos, setVideos] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [manualVideoTitle, setManualVideoTitle] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualInsertAt, setManualInsertAt] = useState("end");
  const [syncing, setSyncing] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);

  const [dbStats, setDbStats] = useState(null);
  const [tableName, setTableName] = useState("users");
  const [tableRows, setTableRows] = useState([]);
  const [tablePage, setTablePage] = useState(1);
  const [tableTotalPages, setTableTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);
  const [provisions, setProvisions] = useState([]);
  const [provisionsLoading, setProvisionsLoading] = useState(false);
  const [retryingProvisionId, setRetryingProvisionId] = useState(null);

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

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/learning/videos");
      if (!res.ok) return;
      const data = await res.json();
      setVideos(data.videos || []);
      setPlaylistUrl(data.playlistUrl || "");
      setLastSyncedAt(data.lastSyncedAt || null);
    } catch {
      // silent
    }
  }, []);

  const fetchDbOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/database/overview");
      if (!res.ok) return;
      const data = await res.json();
      setDbStats(data);
    } catch {
      // silent
    }
  }, []);

  const fetchTable = useCallback(async (table, page) => {
    setTableLoading(true);
    try {
      const res = await fetch(
        `/api/admin/database/table?table=${table}&page=${page}&pageSize=20`
      );
      if (!res.ok) {
        setTableRows([]);
        return;
      }
      const data = await res.json();
      setTableRows(data.rows || []);
      setTableTotalPages(data.totalPages || 1);
    } catch {
      setTableRows([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  const fetchProvisions = useCallback(async () => {
    setProvisionsLoading(true);
    try {
      const res = await fetch("/api/admin/provisioning");
      if (!res.ok) {
        setProvisions([]);
        return;
      }
      const data = await res.json();
      setProvisions(data.provisions || []);
    } catch {
      setProvisions([]);
    } finally {
      setProvisionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchVideos();
      fetchDbOverview();
      fetchProvisions();
    }
  }, [status, session, fetchVideos, fetchDbOverview, fetchProvisions]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchTable(tableName, tablePage);
    }
  }, [status, session, tableName, tablePage, fetchTable]);

  const handleRetryProvision = async (provisionId) => {
    setRetryingProvisionId(provisionId);
    try {
      const res = await fetch("/api/admin/provisioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provisionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Provision retry failed.", "error");
        return;
      }
      showToast("Provision job triggered.", "success");
      fetchProvisions();
      fetchDbOverview();
    } catch {
      showToast("Provision retry failed.", "error");
    } finally {
      setRetryingProvisionId(null);
    }
  };

  const moveVideo = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= videos.length) return;
    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setVideos(updated);
  };

  const handleSyncPlaylist = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/learning/videos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Playlist sync failed.", "error");
        return;
      }
      showToast(`Playlist synced (${data.count} videos).`, "success");
      fetchVideos();
    } catch {
      showToast("Playlist sync failed.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddManualVideo = async () => {
    if (!manualVideoTitle.trim() || !manualVideoUrl.trim()) {
      showToast("Video title and URL are required.", "error");
      return;
    }
    setAddingVideo(true);
    try {
      const res = await fetch("/api/admin/learning/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualVideoTitle,
          videoUrl: manualVideoUrl,
          insertAt:
            manualInsertAt === "end" ? videos.length + 1 : Number(manualInsertAt),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to add video.", "error");
        return;
      }
      setManualVideoTitle("");
      setManualVideoUrl("");
      setManualInsertAt("end");
      showToast("Video added to database.", "success");
      fetchVideos();
    } catch {
      showToast("Failed to add video.", "error");
    } finally {
      setAddingVideo(false);
    }
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      const res = await fetch("/api/admin/learning/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: videos.map((v) => v.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save order.", "error");
        return;
      }
      showToast("Video order saved.", "success");
      fetchVideos();
    } catch {
      showToast("Failed to save order.", "error");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    setDeletingVideoId(id);
    try {
      const res = await fetch("/api/admin/learning/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to remove video.", "error");
        return;
      }
      showToast("Video removed.", "success");
      fetchVideos();
    } catch {
      showToast("Failed to remove video.", "error");
    } finally {
      setDeletingVideoId(null);
    }
  };

  const tableColumns = useMemo(() => {
    if (!tableRows.length) return [];
    return Object.keys(tableRows[0]);
  }, [tableRows]);

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
                item.label === "Content & DB"
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
            <h1 className="text-lg font-bold text-slate-800">Content & Database</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Site
          </Link>
        </header>

        <main className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-800">Content Upload Manager</h2>
            <p className="mt-1 text-xs text-slate-400">
              Sync playlist, add manual videos, and manage video order for Learn page.
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[260px] flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  YouTube Playlist URL
                </label>
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSyncPlaylist}
                disabled={syncing || !playlistUrl.trim()}
                className="h-9 rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                {syncing ? "Syncing..." : "Sync Playlist"}
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder || videos.length === 0}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 disabled:opacity-60"
              >
                {savingOrder ? "Saving..." : "Save Order"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_120px_auto]">
              <input
                type="text"
                value={manualVideoTitle}
                onChange={(e) => setManualVideoTitle(e.target.value)}
                placeholder="Manual video title"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              />
              <input
                type="text"
                value={manualVideoUrl}
                onChange={(e) => setManualVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              />
              <select
                value={manualInsertAt}
                onChange={(e) => setManualInsertAt(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="end">End</option>
                {Array.from({ length: videos.length + 1 }, (_, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {idx + 1}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddManualVideo}
                disabled={addingVideo}
                className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
              >
                {addingVideo ? "Adding..." : "Add Video"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Last synced: {fmtDate(lastSyncedAt)} — Auto-resync every 6 hours.
            </p>
          </section>

          <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-800">Mapped Videos</h3>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Preview</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, index) => (
                  <tr key={video.id} className="border-b border-slate-50">
                    <td className="px-2 py-2">{index + 1}</td>
                    <td className="px-2 py-2 text-slate-700">{video.title}</td>
                    <td className="px-2 py-2">
                      <a
                        href={video.sourceUrl || `https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-indigo-200 px-2 py-1 text-[10px] font-semibold text-indigo-600"
                      >
                        Open
                      </a>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveVideo(index, -1)}
                          disabled={index === 0}
                          className="rounded border border-slate-200 px-2 py-1 text-[10px] disabled:opacity-40"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveVideo(index, 1)}
                          disabled={index === videos.length - 1}
                          className="rounded border border-slate-200 px-2 py-1 text-[10px] disabled:opacity-40"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(video.id)}
                          disabled={deletingVideoId === video.id}
                          className="rounded border border-red-200 px-2 py-1 text-[10px] text-red-500 disabled:opacity-50"
                        >
                          {deletingVideoId === video.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                Infrastructure Provisioning
              </h2>
              <button
                type="button"
                onClick={fetchProvisions}
                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
              >
                Refresh
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Physical database provisioning jobs for Pro+ / Creator users.
            </p>

            {provisionsLoading ? (
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                Loading provisioning jobs...
              </div>
            ) : provisions.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                No provisioning jobs yet.
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">User</th>
                      <th className="px-3 py-2 font-semibold">Tier</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Cost</th>
                      <th className="px-3 py-2 font-semibold">Provider</th>
                      <th className="px-3 py-2 font-semibold">Endpoint</th>
                      <th className="px-3 py-2 font-semibold">Updated</th>
                      <th className="px-3 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provisions.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="px-3 py-2 text-slate-700">{item.userId}</td>
                        <td className="px-3 py-2 text-slate-700">{item.tier}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.status === "SUCCEEDED"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.status === "FAILED"
                                  ? "bg-red-50 text-red-600"
                                  : item.status === "RUNNING"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.errorMessage ? (
                            <p className="mt-1 max-w-[260px] truncate text-[10px] text-red-500">
                              {item.errorMessage}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          ${((Number(item.costCents || 0) || 0) / 100).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{item.provider || "—"}</td>
                        <td className="max-w-[220px] px-3 py-2 text-slate-700">
                          <span className="line-clamp-2 break-all">
                            {item.endpoint || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">{fmtDate(item.updatedAt)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleRetryProvision(item.id)}
                            disabled={
                              retryingProvisionId === item.id ||
                              item.status === "RUNNING" ||
                              item.status === "SUCCEEDED"
                            }
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 disabled:opacity-40"
                          >
                            {retryingProvisionId === item.id ? "Running..." : "Retry"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-800">Database Access (Read-only)</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Users", value: dbStats?.users ?? "—" },
                { label: "Plans", value: dbStats?.plans ?? "—" },
                { label: "Learning Sessions", value: dbStats?.learningSessions ?? "—" },
                { label: "Learning Videos", value: dbStats?.learningVideos ?? "—" },
                { label: "Wallet Ledger", value: dbStats?.walletLedgers ?? "—" },
                { label: "Infra Provisions", value: dbStats?.infraProvisions ?? "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Table</label>
                <select
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    setTablePage(1);
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  {TABLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => fetchTable(tableName, tablePage)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700"
              >
                Refresh
              </button>
              <a
                href={`/api/admin/database/export?table=${tableName}`}
                className="inline-flex h-9 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Export CSV
              </a>
            </div>

            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    {tableColumns.map((col) => (
                      <th key={col} className="px-3 py-2 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, index) => (
                    <tr key={index} className="border-b border-slate-50">
                      {tableColumns.map((col) => (
                        <td key={col} className="max-w-[280px] px-3 py-2 text-slate-700">
                          <span className="line-clamp-2 break-all">
                            {String(row[col])}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!tableLoading && tableRows.length === 0 && (
                    <tr>
                      <td className="px-3 py-5 text-center text-slate-400" colSpan={Math.max(1, tableColumns.length)}>
                        No rows found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                disabled={tablePage <= 1}
                className="rounded border border-slate-200 px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500">
                Page {tablePage} / {tableTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
                disabled={tablePage >= tableTotalPages}
                className="rounded border border-slate-200 px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

