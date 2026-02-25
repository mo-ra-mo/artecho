"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { PLAN_MONTHLY_PRICE_CENTS } from "@/lib/plan-pricing";

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

const TIER_STYLE = {
  FREE: "bg-slate-100 text-slate-500",
  BASIC: "bg-teal-50 text-teal-700",
  PRO: "bg-amber-50 text-amber-700",
  PRO_PLUS: "bg-violet-50 text-violet-700",
  CREATOR: "bg-indigo-50 text-indigo-700",
};

const STATUS_STYLE = {
  ACTIVE: { dot: "bg-emerald-500", text: "text-emerald-600" },
  EXPIRED: { dot: "bg-red-500", text: "text-red-500" },
  SUSPENDED: { dot: "bg-amber-500", text: "text-amber-500" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const SORT_KEYS = ["user", "tier", "status", "startDate", "endDate"];

export default function AdminPlansPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("startDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [canceling, setCanceling] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const data = await res.json();
        if (data.plans?.length) setPlans(data.plans);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchPlans();
    }
  }, [status, session, fetchPlans]);

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

  const handleCancel = async (planId) => {
    setCanceling(planId);
    try {
      const res = await fetch("/api/admin/plans/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (res.ok) {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planId ? { ...p, status: "EXPIRED", endDate: new Date().toISOString() } : p
          )
        );
      }
    } catch { /* silent */ }
    setCanceling(null);
    setConfirmCancel(null);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = plans
    .filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.user.name.toLowerCase().includes(q) && !p.user.email.toLowerCase().includes(q)) return false;
      }
      if (tierFilter !== "all" && p.tier !== tierFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let va, vb;
      if (sortKey === "user") { va = a.user.name; vb = b.user.name; }
      else if (sortKey === "tier") { va = a.tier; vb = b.tier; }
      else if (sortKey === "status") { va = a.status; vb = b.status; }
      else if (sortKey === "startDate") { va = a.startDate; vb = b.startDate; }
      else { va = a.endDate || ""; vb = b.endDate || ""; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === "ACTIVE").length,
    paid: plans.filter((p) => p.tier !== "FREE" && p.status === "ACTIVE").length,
    revenue: plans
      .filter((p) => p.status === "ACTIVE")
      .reduce(
        (sum, p) => sum + (PLAN_MONTHLY_PRICE_CENTS[p.tier] || 0) / 100,
        0
      ),
  };

  const SortArrow = ({ col }) => {
    if (sortKey !== col) return <span className="text-slate-300 ml-0.5">↕</span>;
    return <span className="text-amber-500 ml-0.5">{sortAsc ? "↑" : "↓"}</span>;
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
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                item.label === "Plans & Billing"
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
            <h1 className="text-lg font-bold text-slate-800">Plans & Billing</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Site
          </Link>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total Plans", value: stats.total, color: "bg-slate-600" },
              { label: "Active Subscriptions", value: stats.active, color: "bg-emerald-500" },
              { label: "Paid Active", value: stats.paid, color: "bg-amber-500" },
              { label: "Monthly Revenue", value: `$${stats.revenue}`, color: "bg-teal-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user name or email..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-600 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tier</label>
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                <option value="all">All Tiers</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="PRO_PLUS">Pro+</option>
                <option value="CREATOR">Creator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort("user")}>
                    User <SortArrow col="user" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort("tier")}>
                    Tier <SortArrow col="tier" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort("status")}>
                    Status <SortArrow col="status" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort("startDate")}>
                    Start Date <SortArrow col="startDate" />
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort("endDate")}>
                    End Date <SortArrow col="endDate" />
                  </th>
                  <th className="px-4 py-3 font-medium">Stripe Sub</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((plan) => {
                  const st = STATUS_STYLE[plan.status] || STATUS_STYLE.ACTIVE;
                  return (
                    <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-700">{plan.user.name}</p>
                        <p className="text-[11px] text-slate-400">{plan.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[plan.tier] || TIER_STYLE.FREE}`}>
                          {plan.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(plan.startDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(plan.endDate)}</td>
                      <td className="px-4 py-3">
                        {plan.stripeSubscriptionId ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                            {plan.stripeSubscriptionId.slice(0, 16)}…
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {plan.status === "ACTIVE" && plan.tier !== "FREE" ? (
                          confirmCancel === plan.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCancel(plan.id)}
                                disabled={canceling === plan.id}
                                className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                              >
                                {canceling === plan.id ? "…" : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmCancel(null)}
                                className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmCancel(plan.id)}
                              className="rounded-md border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                      No plans match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Showing {filtered.length} of {plans.length} plans
          </div>
        </main>
      </div>

      {/* Cancel confirmation overlay (mobile-friendly) */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setConfirmCancel(null)}>
          <div className="mx-4 rounded-xl bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-slate-700">Cancel this subscription?</p>
            <p className="mt-1 text-xs text-slate-400">The plan will be expired immediately and the Stripe subscription canceled.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => handleCancel(confirmCancel)} disabled={canceling} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white cursor-pointer">
                {canceling ? "Canceling..." : "Yes, Cancel"}
              </button>
              <button type="button" onClick={() => setConfirmCancel(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 cursor-pointer">
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
