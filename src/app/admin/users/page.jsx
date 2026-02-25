"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

/* ─── Nav (shared) ─── */
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

const TIER_STYLE = { FREE: "bg-slate-100 text-slate-500", BASIC: "bg-teal-50 text-teal-700", PRO: "bg-amber-50 text-amber-700", PRO_PLUS: "bg-violet-50 text-violet-700", CREATOR: "bg-indigo-50 text-indigo-700" };
const ROLE_STYLE = { ADMIN: "bg-red-50 text-red-600", USER: "bg-slate-50 text-slate-500" };
const PAGE_SIZE = 8;

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.users?.length) setUsers(data.users);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [status, session, fetchUsers]);

  const filtered = useMemo(() => {
    let result = users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      let va = a[sortKey] || "";
      let vb = b[sortKey] || "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, search, roleFilter, planFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, roleFilter, planFilter]);

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

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch { /* silent */ }
    setDeleting(null);
    setConfirmDelete(null);
  };

  const handleEditStart = (user) => {
    setEditing(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing, ...editForm }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editing ? { ...u, ...editForm } : u))
        );
      }
    } catch { /* silent */ }
    setSaving(false);
    setEditing(null);
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
            <Link key={item.label} href={item.href} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${item.label === "Users" ? "bg-amber-50 font-semibold text-amber-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
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
            <h1 className="text-lg font-bold text-slate-800">Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{users.length} total</span>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Site
            </Link>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, or ID..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-600 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Plan</label>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
                <option value="all">All Plans</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="PRO_PLUS">Pro+</option>
                <option value="CREATOR">Creator</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  {[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role" },
                    { key: "plan", label: "Plan" },
                    { key: "createdAt", label: "Created" },
                  ].map((col) => (
                    <th key={col.key} className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                      {col.label} <SortArrow col={col.key} />
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">{user.id.slice(0, 8)}</span>
                    </td>

                    {/* Name — inline edit */}
                    <td className="px-4 py-3">
                      {editing === user.id ? (
                        <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-7 w-full rounded border border-teal-300 bg-white px-2 text-sm text-slate-700 outline-none" />
                      ) : (
                        <span className="font-semibold text-slate-700">{user.name}</span>
                      )}
                    </td>

                    {/* Email — inline edit */}
                    <td className="px-4 py-3">
                      {editing === user.id ? (
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-7 w-full rounded border border-teal-300 bg-white px-2 text-sm text-slate-700 outline-none" />
                      ) : (
                        <span className="text-xs text-slate-500">{user.email}</span>
                      )}
                    </td>

                    {/* Role — inline edit */}
                    <td className="px-4 py-3">
                      {editing === user.id ? (
                        <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="h-7 rounded border border-teal-300 bg-white px-2 text-xs text-slate-700 outline-none">
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ROLE_STYLE[user.role] || ROLE_STYLE.USER}`}>{user.role}</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[user.plan] || TIER_STYLE.FREE}`}>{user.plan}</span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(user.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {editing === user.id ? (
                          <>
                            <button type="button" onClick={handleEditSave} disabled={saving} className="rounded-md bg-teal-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer">
                              {saving ? "…" : "Save"}
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 cursor-pointer">
                              Cancel
                            </button>
                          </>
                        ) : confirmDelete === user.id ? (
                          <>
                            <button type="button" onClick={() => handleDelete(user.id)} disabled={deleting === user.id} className="rounded-md bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer">
                              {deleting === user.id ? "…" : "Yes"}
                            </button>
                            <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 cursor-pointer">
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleEditStart(user)} className="rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                              Edit
                            </button>
                            <button type="button" onClick={() => setConfirmDelete(user.id)} className="rounded-md border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50 cursor-pointer">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && pageData.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" /></td></tr>
                )}
                {!loading && pageData.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No users match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-slate-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} type="button" onClick={() => setPage(i)} className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${page === i ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                  {i + 1}
                </button>
              ))}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                Next →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
