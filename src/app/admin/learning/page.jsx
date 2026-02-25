"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  { label: "Overview", icon: "cpu", href: "/admin" },
  { label: "Plans & Billing", icon: "card", href: "/admin/plans" },
  { label: "Settings", icon: "card", href: "/admin/settings" },
];

function NavIcon({ name, className }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" /></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" /></>,
    card: <><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    profile: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function parseFeedback(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { feedback: raw }; }
}

const LEVEL_STYLE = {
  beginner: "bg-slate-100 text-slate-600",
  intermediate: "bg-teal-50 text-teal-700",
  advanced: "bg-amber-50 text-amber-700",
  unknown: "bg-slate-50 text-slate-400",
};

export default function AdminLearningPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [manualVideoTitle, setManualVideoTitle] = useState("");
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const [manualInsertAt, setManualInsertAt] = useState("end");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState(null);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimersRef = useRef([]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const url = userFilter !== "all" ? `/api/admin/learning?userId=${userFilter}` : "/api/admin/learning";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.sessions?.length) setSessions(data.sessions);
        else setSessions([]);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [userFilter]);

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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchSessions();
      fetchVideos();
    }
  }, [status, session, fetchSessions, fetchVideos]);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  const moveVideo = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= videos.length) return;
    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setVideos(updated);
  };

  const handleSaveOrder = async () => {
    if (videos.length === 0) return;
    setSavingOrder(true);
    try {
      const orderedIds = videos.map((video) => video.id);
      const res = await fetch("/api/admin/learning/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
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
      setVideos((prev) => prev.filter((video) => video.id !== id));
      showToast("Video removed.", "success");
    } catch {
      showToast("Failed to remove video.", "error");
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleSaveTitle = async (id) => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      showToast("Title cannot be empty.", "error");
      return;
    }

    setEditingVideoId(id);
    try {
      const res = await fetch("/api/admin/learning/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update title.", "error");
        return;
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.id === id ? { ...video, title: data.video.title } : video
        )
      );
      setEditingVideoId(null);
      setTitleDraft("");
      showToast("Video title updated.", "success");
    } catch {
      showToast("Failed to update title.", "error");
    }
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
            manualInsertAt === "end"
              ? videos.length + 1
              : Number(manualInsertAt),
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
      fetchVideos();
      showToast("Video added to database.", "success");
    } catch {
      showToast("Failed to add video.", "error");
    } finally {
      setAddingVideo(false);
    }
  };

  const uniqueUsers = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => map.set(s.user.id, s.user));
    return Array.from(map.values());
  }, [sessions]);

  const filtered = useMemo(() => {
    let result = sessions.filter((s) => {
      if (userFilter !== "all" && s.userId !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const userName = (s.user.name || "").toLowerCase();
        if (!s.content.toLowerCase().includes(q) && !userName.includes(q)) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortAsc ? da - db : db - da;
    });
    return result;
  }, [sessions, userFilter, search, sortAsc]);

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
      {/* Sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 flex h-full w-56 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
          <Image src="/i-11.png" alt="ArtEcho" width={36} height={36} />
          <div>
            <p className="text-sm font-bold text-slate-800">ArtEcho</p>
            <p className="text-[10px] text-slate-400">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${item.label === "Learning" ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
              <NavIcon name={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-50 cursor-pointer"><NavIcon name="logout" className="w-4 h-4" />Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:ml-56 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-4 sm:px-6 py-3">
          <div className="flex items-center">
            <button type="button" onClick={() => setSidebarOpen(v => !v)} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-800">Learning Sessions</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{filtered.length} sessions</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Site
            </Link>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6">
          {/* Video mapping manager */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
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
                className="h-9 rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncing ? "Syncing..." : "Sync Playlist"}
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder || videos.length === 0}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingOrder ? "Saving..." : "Save Order"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_120px_auto]">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Manual Video Title
                </label>
                <input
                  type="text"
                  value={manualVideoTitle}
                  onChange={(e) => setManualVideoTitle(e.target.value)}
                  placeholder="Enter video title..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  YouTube Video URL
                </label>
                <input
                  type="text"
                  value={manualVideoUrl}
                  onChange={(e) => setManualVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Position
                </label>
                <select
                  value={manualInsertAt}
                  onChange={(e) => setManualInsertAt(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  <option value="end">End</option>
                  {Array.from({ length: videos.length + 1 }, (_, idx) => (
                    <option key={idx + 1} value={String(idx + 1)}>
                      {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddManualVideo}
                disabled={addingVideo}
                className="h-9 self-end rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingVideo ? "Adding..." : "Add Video"}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {lastSyncedAt
                ? `Last synced: ${fmtDate(lastSyncedAt)}`
                : "No playlist synced yet."}
              <span className="ml-2">
                Auto-resync runs every 6 hours.
              </span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Title</th>
                    <th className="px-3 py-2 font-semibold">Video ID</th>
                    <th className="px-3 py-2 font-semibold">Preview</th>
                    <th className="px-3 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video, index) => (
                    <tr key={video.id} className="border-b border-slate-50">
                      <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {editingVideoId === video.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={titleDraft}
                              onChange={(e) => setTitleDraft(e.target.value)}
                              className="h-7 w-full min-w-[180px] rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveTitle(video.id)}
                              className="rounded border border-emerald-300 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVideoId(null);
                                setTitleDraft("");
                              }}
                              className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          video.title
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500">
                        {video.videoId}
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={video.sourceUrl || `https://www.youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border border-indigo-200 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          Open
                        </a>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVideoId(video.id);
                              setTitleDraft(video.title);
                            }}
                            disabled={editingVideoId === video.id}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
                          >
                            Edit Title
                          </button>
                          <button
                            type="button"
                            onClick={() => moveVideo(index, -1)}
                            disabled={index === 0}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveVideo(index, 1)}
                            disabled={index === videos.length - 1}
                            className="rounded border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-40"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(video.id)}
                            disabled={deletingVideoId === video.id}
                            className="rounded border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-500 disabled:opacity-50"
                          >
                            {deletingVideoId === video.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {videos.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-xs text-slate-400"
                      >
                        No videos available. Sync a playlist first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search content</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search session content..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-600 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">User</label>
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                <option value="all">All Users</option>
                {uniqueUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => setSortAsc(!sortAsc)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer">
              Date {sortAsc ? "↑ Oldest" : "↓ Newest"}
            </button>
          </div>

          {/* Sessions list */}
          <div className="mt-4 space-y-3">
            {filtered.map((s) => {
              const fb = parseFeedback(s.aiFeedback);
              const isOpen = expandedId === s.id;
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden transition hover:shadow-sm">
                  {/* Row header */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : s.id)}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{s.user.name}</span>
                        <span className="text-[10px] text-slate-400">{s.user.email}</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{s.content}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[10px] text-slate-400">{fmtDate(s.createdAt)}</span>
                      {fb?.level && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${LEVEL_STYLE[fb.level] || LEVEL_STYLE.unknown}`}>
                          {fb.level}{fb.score ? ` · ${fb.score}/10` : ""}
                        </span>
                      )}
                      {s.inputs.length > 0 && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                          {s.inputs.length} AI input{s.inputs.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <svg className={`mt-1 h-4 w-4 shrink-0 text-slate-300 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">
                      {/* Full content */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Session Content</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg border border-slate-100 p-3">{s.content}</p>
                      </div>

                      {/* AI Feedback */}
                      {fb && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">AI Feedback</h4>
                          <div className="bg-white rounded-lg border border-slate-100 p-3 space-y-2">
                            {fb.feedback && <p className="text-sm text-slate-700">{fb.feedback}</p>}
                            {fb.strengths?.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-emerald-600 uppercase">Strengths</span>
                                <ul className="mt-0.5 space-y-0.5">
                                  {fb.strengths.map((s, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {fb.improvements?.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-amber-600 uppercase">Improvements</span>
                                <ul className="mt-0.5 space-y-0.5">
                                  {fb.improvements.map((s, i) => (
                                    <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* AI Inputs/Outputs */}
                      {s.inputs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">AI Conversation ({s.inputs.length})</h4>
                          <div className="space-y-2">
                            {s.inputs.map((inp) => (
                              <div key={inp.id} className="bg-white rounded-lg border border-slate-100 p-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 uppercase">User Input</span>
                                  <span className="text-[10px] text-slate-400">{fmtDate(inp.createdAt)}</span>
                                </div>
                                <p className="text-sm text-slate-700 mb-2">{inp.input}</p>
                                {inp.output && (
                                  <>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 uppercase">AI Output</span>
                                    </div>
                                    <p className="text-sm text-slate-600">{inp.output}</p>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && filtered.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
                <p className="text-sm text-slate-400">No learning sessions match your filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
