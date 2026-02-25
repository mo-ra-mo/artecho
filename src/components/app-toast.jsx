"use client";

export function AppToast({ toast, visible }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed right-4 top-20 z-100 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      } ${
        toast.type === "success"
          ? "bg-emerald-600 text-white"
          : toast.type === "error"
            ? "bg-red-600 text-white"
            : "bg-slate-700 text-white"
      }`}
    >
      {toast.message}
    </div>
  );
}
