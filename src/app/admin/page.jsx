"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Overview", icon: "grid", href: "/admin" },
  { label: "Dashboard", icon: "chart", href: "/admin/dashboard" },
  { label: "Users", icon: "users", href: "/admin/users" },
  { label: "Learning", icon: "book", href: "/admin/learning" },
  { label: "Content & DB", icon: "card", href: "/admin/content-db" },
  { label: "Plans & Billing", icon: "card", href: "/admin/plans" },
  { label: "Settings", icon: "card", href: "/admin/settings" },
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
    chart: (
      <>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
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
    profile: (
      <>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
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

const PLAN_COLORS = {
  CREATOR: "bg-amber-100 text-amber-700",
  PRO_PLUS: "bg-violet-100 text-violet-700",
  PRO: "bg-indigo-100 text-indigo-700",
  BASIC: "bg-teal-50 text-teal-700",
  FREE: "bg-slate-100 text-slate-500",
};

const ROLE_COLORS = {
  ADMIN: "bg-red-50 text-red-600",
  USER: "bg-slate-100 text-slate-500",
};

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "ADMIN") return;

    async function fetchData() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/users"),
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [status, session]);

  if (status === "loading" || (!session && status !== "unauthenticated")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== "ADMIN") return null;

  const filtered = users.filter((u) => {
    if (
      searchText &&
      !(u.name || "").toLowerCase().includes(searchText.toLowerCase()) &&
      !(u.email || "").toLowerCase().includes(searchText.toLowerCase())
    )
      return false;
    if (planFilter !== "all" && u.plan !== planFilter) return false;
    return true;
  });

  const statsCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers?.toLocaleString() ?? "0", color: "bg-amber-500" },
        { label: "Active Plans", value: stats.paidPlans?.toLocaleString() ?? "0", color: "bg-teal-500" },
        { label: "Today's Sessions", value: stats.todaySessions?.toLocaleString() ?? "0", color: "bg-indigo-400" },
        { label: "Total Sessions", value: stats.totalSessions?.toLocaleString() ?? "0", color: "bg-slate-600" },
      ]
    : [];

  const handleLogout = () => {
    signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
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
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/admin";
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-amber-50 font-semibold text-amber-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <NavIcon name={item.icon} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-50 cursor-pointer"
          >
            <NavIcon name="logout" className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-56 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-4 sm:px-6 py-3">
          <div className="flex items-center">
            <button type="button" onClick={() => setSidebarOpen(v => !v)} className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
              <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-800">Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Signed in as <span className="font-medium text-slate-600">{session.user?.name || session.user?.email}</span>
            </span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Site
            </Link>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Loading admin data...</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {statsCards.map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${s.color}`} />
                      <span className="text-xs text-slate-400">{s.label}</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-800">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Search & Filters */}
              <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search name or email..."
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Plan
                  </label>
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
                  >
                    <option value="all">All Plans</option>
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PRO">PRO</option>
                    <option value="PRO_PLUS">PRO+</option>
                    <option value="CREATOR">CREATOR</option>
                  </select>
                </div>
              </div>

              {/* Users table */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Signup Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition"
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-700">
                              {user.name || "—"}
                            </p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                PLAN_COLORS[user.plan] || "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {user.plan || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                ROLE_COLORS[user.role] || "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                <p>
                  Showing {filtered.length} of {users.length} users
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
