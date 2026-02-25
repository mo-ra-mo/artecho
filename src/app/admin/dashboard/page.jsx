"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

const PIE_COLORS = ["#94a3b8", "#14b8a6", "#f59e0b", "#818cf8"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.totalUsers !== undefined) setStats(data);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchStats();
    }
  }, [status, session, fetchStats]);

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

  const statCards = stats ? [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      sub: `${stats.activeUsers.toLocaleString()} active (30d)`,
      icon: "users",
      color: "bg-teal-500",
      bg: "bg-teal-50",
    },
    {
      label: "Paid Plans",
      value: stats.paidPlans.toLocaleString(),
      sub: "Active subscriptions",
      icon: "card",
      color: "bg-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Today's Sessions",
      value: stats.todaySessions.toLocaleString(),
      sub: `${stats.totalSessions.toLocaleString()} total`,
      icon: "book",
      color: "bg-indigo-400",
      bg: "bg-indigo-50",
    },
    {
      label: "Conversion Rate",
      value:
        stats.totalUsers > 0
          ? `${((stats.paidPlans / stats.totalUsers) * 100).toFixed(1)}%`
          : "—",
      sub: "Free → Paid",
      icon: "grid",
      color: "bg-slate-600",
      bg: "bg-slate-50",
    },
  ] : [];

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
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                item.label === "Dashboard"
                  ? "bg-amber-50 font-semibold text-amber-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <NavIcon name={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-50 cursor-pointer">
            <NavIcon name="logout" className="w-4 h-4" />
            Logout
          </button>
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
            <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Site
            </Link>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
          {!stats ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
            </div>
          ) : (
          <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {card.label}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
                  >
                    <NavIcon
                      name={card.icon}
                      className={`w-4 h-4 ${card.color.replace("bg-", "text-")}`}
                    />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-5 lg:grid-cols-5">
            {/* Bar chart — sessions per day (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Learning Sessions — Last 7 Days
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.sessionsPerDay} barSize={28}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="sessions"
                      fill="#14b8a6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart — plans distribution (2 cols) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Active Plans Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.plansByTier}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.plansByTier.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Manage Users",
                desc: "View all users, their progress, and AI models.",
                href: "/admin",
                color: "border-teal-200 hover:bg-teal-50",
                icon: "users",
              },
              {
                title: "Plans & Billing",
                desc: "View subscriptions, cancel or modify plans.",
                href: "/admin/plans",
                color: "border-amber-200 hover:bg-amber-50",
                icon: "card",
              },
              {
                title: "View Site",
                desc: "Open the public-facing ArtEcho website.",
                href: "/",
                color: "border-indigo-200 hover:bg-indigo-50",
                icon: "grid",
              },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl border bg-white p-4 transition ${link.color}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <NavIcon name={link.icon} className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {link.title}
                  </p>
                  <p className="text-[11px] text-slate-400">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
}
