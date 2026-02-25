"use client";

const PLAN_BADGE_CLASSES = {
  FREE: "border-zinc-300 bg-zinc-100 text-zinc-700",
  BASIC: "border-teal-200 bg-teal-50 text-teal-700",
  PRO: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PRO_PLUS: "border-violet-200 bg-violet-50 text-violet-700",
  CREATOR: "border-amber-200 bg-amber-50 text-amber-700",
};

const RING_COLOR_BY_PLAN = {
  FREE: "rgb(82 82 91)",
  BASIC: "rgb(13 148 136)",
  PRO: "rgb(79 70 229)",
  PRO_PLUS: "rgb(124 58 237)",
  CREATOR: "rgb(217 119 6)",
};

function normalizeLimit(value) {
  return typeof value === "number" ? value : null;
}

export function PlanUsageSnapshot({
  planTier,
  watchedUsed = 0,
  watchedLimit = null,
  watchedRemaining = null,
  uploadsUsed = 0,
  uploadsLimit = null,
  uploadsRemaining = null,
  className = "",
  compact = false,
}) {
  const effectivePlanTier = planTier || "FREE";
  const planLabel = effectivePlanTier.replace(/_/g, " ");
  const planBadgeClass =
    PLAN_BADGE_CLASSES[effectivePlanTier] ||
    "border-slate-200 bg-slate-50 text-slate-700";
  const ringColor = RING_COLOR_BY_PLAN[effectivePlanTier] || "rgb(13 148 136)";

  const safeWatchedUsed = Number(watchedUsed || 0);
  const safeUploadsUsed = Number(uploadsUsed || 0);
  const normalizedWatchedLimit = normalizeLimit(watchedLimit);
  const normalizedUploadsLimit = normalizeLimit(uploadsLimit);
  const watchedTarget = normalizedWatchedLimit ?? 6;
  const uploadsTarget = normalizedUploadsLimit ?? 6;
  const totalTarget = watchedTarget + uploadsTarget;
  const progressPercent =
    totalTarget > 0
      ? Math.min(
          100,
          Math.round(((safeWatchedUsed + safeUploadsUsed) / totalTarget) * 100)
        )
      : 0;
  const ringDegree = Math.round((progressPercent / 100) * 360);
  const ringStyle = {
    background: `conic-gradient(${ringColor} ${ringDegree}deg, rgb(228 228 231) 0deg)`,
  };

  const watchedLeft =
    typeof watchedRemaining === "number" ? watchedRemaining : "Unlimited";
  const uploadsLeft =
    typeof uploadsRemaining === "number" ? uploadsRemaining : "Unlimited";

  if (compact) {
    return (
      <div
        className={`rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 ${
          className || ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planBadgeClass}`}
          >
            {planLabel}
          </span>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full p-[2px]"
            style={ringStyle}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-800">
              {progressPercent}%
            </div>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-[11px] text-zinc-600">
          <p>
            Watched: {safeWatchedUsed}/
            {normalizedWatchedLimit ?? "Unlimited"} (left: {watchedLeft})
          </p>
          <p>
            Uploads: {safeUploadsUsed}/
            {normalizedUploadsLimit ?? "Unlimited"} (left: {uploadsLeft})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 ${className || ""}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full p-[3px]"
            style={ringStyle}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-slate-800">
              {progressPercent}%
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Learning Snapshot
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Plan</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planBadgeClass}`}
              >
                {planLabel}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Progress = watched videos + uploaded videos
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Videos Watched
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {safeWatchedUsed}/{normalizedWatchedLimit ?? "Unlimited"}
          </p>
          <p className="text-xs text-zinc-500">Left: {watchedLeft}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Video Uploads
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {safeUploadsUsed}/{normalizedUploadsLimit ?? "Unlimited"}
          </p>
          <p className="text-xs text-zinc-500">Left: {uploadsLeft}</p>
        </div>
      </div>
    </div>
  );
}
