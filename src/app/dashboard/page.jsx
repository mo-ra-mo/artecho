"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PlanUsageSnapshot } from "@/components/plan-usage-snapshot";

const LEVELS = [
  { key: "kindergarten", label: "Kindergarten", icon: "🎨", minProgress: 0 },
  { key: "elementary", label: "Elementary", icon: "✏️", minProgress: 25 },
  { key: "middle", label: "Middle School", icon: "🖌️", minProgress: 50 },
  { key: "high", label: "High School", icon: "🎓", minProgress: 75 },
];

const LEVEL_MESSAGES = {
  kindergarten: "Your AI kid is exploring playful scribbles!",
  elementary: "Your AI kid is sketching like an elementary schooler!",
  middle: "Your AI kid is learning composition and shading!",
  high: "Your AI kid is creating confident, concept-driven artwork!",
};

const PLAN_STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  EXPIRED: "border-amber-200 bg-amber-50 text-amber-700",
  SUSPENDED: "border-red-200 bg-red-50 text-red-700",
};

function getLevel(progress) {
  if (progress >= 75) return LEVELS[3];
  if (progress >= 50) return LEVELS[2];
  if (progress >= 25) return LEVELS[1];
  return LEVELS[0];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState(null);
  const [modelsData, setModelsData] = useState(null);
  const [planTierFallback, setPlanTierFallback] = useState(null);
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotalPages, setGalleryTotalPages] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryProvider, setGalleryProvider] = useState("all");
  const [galleryModelId, setGalleryModelId] = useState("all");
  const [galleryFavoriteOnly, setGalleryFavoriteOnly] = useState(false);
  const [gallerySort, setGallerySort] = useState("favorites_newest");
  const [galleryView, setGalleryView] = useState("active");
  const [selectedGenerationIds, setSelectedGenerationIds] = useState([]);
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [undoDelete, setUndoDelete] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const loadMoreRef = useRef(null);
  const undoTimerRef = useRef(null);
  const GALLERY_PAGE_SIZE = 9;
  const [selectedModelId, setSelectedModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Illustration");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [generateError, setGenerateError] = useState("");

  const fetchGalleryPage = useCallback(async (pageToLoad, append = false) => {
    if (append) {
      setGalleryLoadingMore(true);
    } else {
      setGalleryLoading(true);
    }
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageToLoad));
      params.set("limit", String(GALLERY_PAGE_SIZE));
      if (gallerySearch.trim()) params.set("search", gallerySearch.trim());
      if (galleryProvider !== "all") params.set("provider", galleryProvider);
      if (galleryModelId !== "all") params.set("modelId", galleryModelId);
      if (galleryFavoriteOnly) params.set("favoriteOnly", "true");
      if (gallerySort) params.set("sort", gallerySort);
      params.set("deleted", galleryView === "trash" ? "only" : "without");
      const res = await fetch(`/api/train-ai/generations?${params.toString()}`);
      const data = await res.json();
      if (res.ok && !data.error) {
        setGalleryItems((prev) =>
          append ? [...prev, ...(data?.items || [])] : data?.items || []
        );
        setGalleryTotalPages(data?.totalPages || 1);
        setGalleryTotal(data?.total || 0);
      }
    } catch {
      // silent
    } finally {
      if (append) {
        setGalleryLoadingMore(false);
      } else {
        setGalleryLoading(false);
      }
    }
  }, [gallerySearch, galleryProvider, galleryModelId, galleryFavoriteOnly, gallerySort, galleryView]);

  const loadDashboardData = useCallback(async () => {
    setDashboardRefreshing(true);
    try {
      const [pRes, mRes, planRes] = await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/train-ai/models"),
        fetch("/api/user/plan"),
      ]);
      const [pData, mData, planData] = await Promise.all([
        pRes.json(),
        mRes.json(),
        planRes.json(),
      ]);
      if (!pData.error) {
        setProgress(pData);
      }
      if (!mData.error) {
        setModelsData(mData);
        setSelectedModelId((prev) => prev || mData?.models?.[0]?.id || "");
      }
      if (!planData.error && planData?.tier) {
        setPlanTierFallback(planData.tier);
      }
    } catch {
      // silent
    } finally {
      setDashboardRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    setGalleryPage(1);
    setSelectedGenerationIds([]);
    setAllMatchingSelected(false);
    fetchGalleryPage(1, false);
  }, [gallerySearch, galleryProvider, galleryModelId, galleryFavoriteOnly, gallerySort, galleryView, fetchGalleryPage]);

  useEffect(() => {
    if (galleryPage > 1) {
      fetchGalleryPage(galleryPage, true);
    }
  }, [galleryPage, fetchGalleryPage]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const progressPercent = progress?.progressPercent || 0;
  const level = getLevel(progressPercent);
  const models = modelsData?.models || [];
  const effectivePlanTier =
    progress?.plan || planTierFallback || modelsData?.tier || "FREE";
  const effectivePlanStatus = progress?.planStatus || "ACTIVE";
  const planStatusClass =
    PLAN_STATUS_STYLES[effectivePlanStatus] ||
    "border-zinc-200 bg-zinc-50 text-zinc-700";
  const educationalQuota = progress?.limits?.educationalVideos;
  const uploadQuota = progress?.limits?.videoUploads;
  const aiTrainingQuota = progress?.limits?.aiTraining;
  const watchedCount = Number(
    progress?.activity?.watchedVideosCount ?? educationalQuota?.used ?? 0
  );
  const uploadedCount = Number(
    progress?.activity?.uploadedVideosCount ?? uploadQuota?.used ?? 0
  );
  const loraUsage = modelsData?.usage || {};
  const loraLimits = modelsData?.limits || {};
  const walletBalanceCents = Number(progress?.wallet?.balanceCents || 0);
  const storageInfo = progress?.storage || {};
  const provisioningInfo = progress?.provisioning || null;

  const userName = session?.user?.name || "Artist";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image || null;
  const isTrashView = galleryView === "trash";
  const selectedCount = allMatchingSelected ? galleryTotal : selectedGenerationIds.length;

  const getActiveGalleryFilters = useCallback(
    () => ({
      search: gallerySearch.trim() || undefined,
      provider: galleryProvider !== "all" ? galleryProvider : undefined,
      modelId: galleryModelId !== "all" ? galleryModelId : undefined,
      favoriteOnly: galleryFavoriteOnly,
    }),
    [gallerySearch, galleryProvider, galleryModelId, galleryFavoriteOnly]
  );

  const handleGenerate = async () => {
    setGenerateError("");
    if (!selectedModelId) {
      setGenerateError("Please select a trained model first.");
      return;
    }
    if (!prompt.trim() || prompt.trim().length < 5) {
      setGenerateError("Prompt must be at least 5 characters.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/train-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selectedModelId,
          prompt: prompt.trim(),
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Failed to generate image.");
        return;
      }
      setGenerated(data);
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
    } catch {
      setGenerateError("Failed to generate image.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleFavorite = async (id, isFavorite) => {
    try {
      const res = await fetch("/api/train-ai/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isFavorite: !isFavorite }),
      });
      if (!res.ok) return;
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
    } catch {
      // silent
    }
  };

  const handleDeleteGeneration = async (id) => {
    try {
      const res = await fetch(
        `/api/train-ai/generations?id=${id}${isTrashView ? "&permanent=true" : ""}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const deletedIds = Array.isArray(data?.deletedIds) ? data.deletedIds : [id];
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
      if (generated?.generation?.id === id) {
        setGenerated(null);
      }
      if (!isTrashView) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndoDelete({
          ids: deletedIds,
          count: data?.deletedCount || deletedIds.length,
        });
        undoTimerRef.current = setTimeout(() => setUndoDelete(null), 7000);
      }
    } catch {
      // silent
    }
  };

  const handleToggleSelect = (id) => {
    if (allMatchingSelected) setAllMatchingSelected(false);
    setSelectedGenerationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    if (allMatchingSelected) setAllMatchingSelected(false);
    const visibleIds = galleryItems.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedGenerationIds.includes(id));
    if (allSelected) {
      setSelectedGenerationIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedGenerationIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectAllAcrossPages = () => {
    setAllMatchingSelected((prev) => !prev);
    setSelectedGenerationIds([]);
  };

  const handleBulkFavorite = async (isFavorite) => {
    if (isTrashView) return;
    if (!selectedCount) return;
    setBulkBusy(true);
    try {
      const payload = allMatchingSelected
        ? {
            selectAllMatching: true,
            filters: getActiveGalleryFilters(),
            isFavorite,
          }
        : { ids: selectedGenerationIds, isFavorite };
      const res = await fetch("/api/train-ai/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      setGalleryPage(1);
      setSelectedGenerationIds([]);
      setAllMatchingSelected(false);
      await fetchGalleryPage(1, false);
    } catch {
      // silent
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCount) return;
    setBulkBusy(true);
    try {
      const payload = allMatchingSelected
        ? {
            selectAllMatching: true,
            filters: getActiveGalleryFilters(),
            permanent: isTrashView,
          }
        : { ids: selectedGenerationIds, permanent: isTrashView };
      const res = await fetch("/api/train-ai/generations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const deletedIds = Array.isArray(data?.deletedIds) ? data.deletedIds : selectedGenerationIds;
      setSelectedGenerationIds([]);
      setAllMatchingSelected(false);
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
      if (generated?.generation?.id && deletedIds.includes(generated.generation.id)) {
        setGenerated(null);
      }
      if (!isTrashView) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndoDelete({
          ids: deletedIds,
          count: data?.deletedCount || deletedIds.length,
        });
        undoTimerRef.current = setTimeout(() => setUndoDelete(null), 7000);
      }
    } catch {
      // silent
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedCount) return;
    setBulkBusy(true);
    try {
      const payload = allMatchingSelected
        ? {
            action: "restore",
            selectAllMatching: true,
            filters: getActiveGalleryFilters(),
          }
        : { action: "restore", ids: selectedGenerationIds };
      const res = await fetch("/api/train-ai/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      setSelectedGenerationIds([]);
      setAllMatchingSelected(false);
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
    } catch {
      // silent
    } finally {
      setBulkBusy(false);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoDelete?.ids?.length) return;
    try {
      const res = await fetch("/api/train-ai/generations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          ids: undoDelete.ids,
        }),
      });
      if (!res.ok) return;
      setUndoDelete(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setGalleryPage(1);
      await fetchGalleryPage(1, false);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (galleryLoading || galleryLoadingMore) return;
        if (galleryPage >= galleryTotalPages) return;
        setGalleryPage((p) => p + 1);
      },
      { rootMargin: "240px 0px 240px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [galleryLoading, galleryLoadingMore, galleryPage, galleryTotalPages]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar activePage="/dashboard" />
      <div className="h-16" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold italic tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
            Watch your AI companion grow through creative learning and artistic
            development
          </p>
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={dashboardRefreshing}
            className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            {dashboardRefreshing ? "Refreshing data..." : "Refresh dashboard data"}
          </button>
        </div>

        {/* Profile + Growth Progress */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[280px_1fr]">
          {/* Profile Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={112}
                height={112}
                className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-amber-100"
              />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-teal-200 via-emerald-200 to-amber-200 text-4xl font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold text-zinc-900">{userName}</h2>
            {userEmail && (
              <p className="mt-1 text-xs text-zinc-400">{userEmail}</p>
            )}
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <span>{level.icon}</span>
              {level.label}
            </span>
            <p className="mt-4 text-sm text-zinc-500">
              {LEVEL_MESSAGES[level.key]}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-zinc-800">{progress?.totalSessions || 0}</p>
                <p className="text-[10px] text-zinc-400">Sessions</p>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div>
                <p className="text-lg font-bold text-zinc-800">{progress?.uniqueDays || 0}</p>
                <p className="text-[10px] text-zinc-400">Active Days</p>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div>
                <p className="text-lg font-bold text-zinc-800">{effectivePlanTier}</p>
                <p className="text-[10px] text-zinc-400">Plan</p>
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-wide ${planStatusClass}`}
              >
                {effectivePlanStatus}
              </span>
            </div>
          </div>

          {/* Growth Progress Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">
                Growth Progress
              </h3>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {progressPercent}%
              </span>
            </div>

            <div className="mt-4 h-2.5 w-full rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-teal-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between">
              {LEVELS.map((l) => (
                <div key={l.key} className="flex flex-col items-center gap-1">
                  <span
                    className={`text-lg ${progressPercent >= l.minProgress ? "" : "grayscale opacity-40"}`}
                  >
                    {l.icon}
                  </span>
                  <span
                    className={`text-xs ${progressPercent >= l.minProgress ? "text-zinc-700 font-medium" : "text-zinc-400"}`}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/learn"
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-teal-600"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
                Continue Learning
              </Link>
              <Link
                href="/train-ai"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Train AI
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[1fr_280px]">
          <PlanUsageSnapshot
            planTier={effectivePlanTier}
            watchedUsed={watchedCount}
            watchedLimit={educationalQuota?.limit ?? null}
            watchedRemaining={educationalQuota?.remaining ?? null}
            uploadsUsed={uploadedCount}
            uploadsLimit={uploadQuota?.limit ?? null}
            uploadsRemaining={uploadQuota?.remaining ?? null}
          />

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Account Settings
            </p>
            <div className="mt-2 space-y-2 text-xs text-zinc-600">
              <p>
                Subscription status:{" "}
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${planStatusClass}`}
                >
                  {effectivePlanStatus}
                </span>
              </p>
              <p>
                AI training submits:{" "}
                <span className="font-semibold text-zinc-800">
                  {typeof aiTrainingQuota?.used === "number"
                    ? `${aiTrainingQuota.used}/${aiTrainingQuota.limit}`
                    : "Unlimited"}
                </span>
              </p>
              <p>
                Wallet balance:{" "}
                <span className="font-semibold text-zinc-800">
                  ${(walletBalanceCents / 100).toFixed(2)}
                </span>
              </p>
              <p>
                Storage used:{" "}
                <span className="font-semibold text-zinc-800">
                  {(Number(storageInfo?.usedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
                </span>
              </p>
              <p>
                Monthly upload:{" "}
                <span className="font-semibold text-zinc-800">
                  {(Number(storageInfo?.monthlyUsedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
                  {typeof storageInfo?.monthlyLimitBytes === "number"
                    ? ` / ${(storageInfo.monthlyLimitBytes / (1024 * 1024)).toFixed(0)} MB`
                    : " / Unlimited"}
                </span>
              </p>
              <p>
                Infra provision:{" "}
                <span className="font-semibold text-zinc-800">
                  {provisioningInfo?.status || "Not required"}
                </span>
              </p>
              <p>
                LoRA model slots:{" "}
                <span className="font-semibold text-zinc-800">
                  {loraLimits?.maxModelsUnlimited
                    ? "Unlimited"
                    : `${loraUsage?.modelsUsed || 0}/${loraLimits?.maxModels ?? 0}`}
                </span>
              </p>
              <p>
                Videos per model:{" "}
                <span className="font-semibold text-zinc-800">
                  {loraLimits?.maxVideosPerModelUnlimited
                    ? "Unlimited"
                    : loraLimits?.maxVideosPerModel ?? 0}
                </span>
              </p>
              <p>
                Train runs per model:{" "}
                <span className="font-semibold text-zinc-800">
                  {loraLimits?.maxTrainRunsUnlimited
                    ? "Unlimited"
                    : loraLimits?.maxTrainRuns ?? 0}
                </span>
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/billing"
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Billing & Plan
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/provisioning", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ runNow: true }),
                  });
                  await loadDashboardData();
                }}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Provision Infra
              </button>
              <Link
                href="/train-ai"
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Train Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900">Recent Sessions</h2>
            <Link
              href="/learn"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
            >
              View all sessions →
            </Link>
          </div>

          {progress?.recentSessions?.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {progress.recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                      <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 line-clamp-2">
                    {s.content?.slice(0, 80) || "Learning session"}
                  </p>
                  {s.aiFeedback && (
                    <p className="mt-2 text-xs text-zinc-500 line-clamp-2">
                      {s.aiFeedback.slice(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <svg className="mx-auto h-10 w-10 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
              <p className="mt-3 text-sm text-zinc-500">No sessions yet. Start learning to see your progress here!</p>
              <Link
                href="/learn"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-5 py-2 text-xs font-semibold text-white transition hover:bg-teal-600"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>

        {/* AI Testing Area */}
        <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
              <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">
                AI Testing Area
              </h2>
              <p className="text-xs text-zinc-500">
                Test your AI model with creative prompts
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-amber-100/70 px-5 py-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              Personalized generation is active with your selected LoRA model.
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Select Trained Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-teal-300"
            >
              <option value="">Choose your model...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · v{m.latestVersion} · {m.status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Enter Your Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 placeholder:text-zinc-400 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-300"
              placeholder="Describe what you want to generate, e.g., 'A whimsical character with flowing hair in a forest setting'"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Output Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-teal-300"
            >
              <option>Illustration</option>
              <option>Character Design</option>
              <option>Landscape</option>
              <option>Abstract</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-600 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {generating ? "Generating..." : "Generate"}
          </button>
          {generateError && (
            <p className="mt-3 text-sm font-medium text-red-600">{generateError}</p>
          )}
          {generated?.provider && (
            <p className="mt-3 text-xs text-zinc-500">
              Provider: <span className="font-semibold text-zinc-700">{generated.provider}</span>
              {" · "}
              Model: <span className="font-semibold text-zinc-700">{generated?.model?.name || "-"}</span>
            </p>
          )}

          <div className="mt-8">
            <h3 className="text-base font-bold text-zinc-800 mb-3">
              Generated Output
            </h3>
            {generated?.imageUrl ? (
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                <Image
                  src={generated.imageUrl}
                  alt="AI generated output"
                  width={1024}
                  height={1024}
                  className="h-auto w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100">
                <p className="text-sm text-zinc-400">
                  Your AI-generated preview will appear here
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-zinc-800">
                Your Generated Gallery
              </h3>
              <span className="text-xs text-zinc-500">
                {galleryTotal} result{galleryTotal === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
              <div className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setGalleryView("active")}
                  className={`h-7 rounded-md px-2 text-[11px] font-semibold ${
                    galleryView === "active"
                      ? "bg-teal-500 text-white"
                      : "text-zinc-600"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryView("trash")}
                  className={`h-7 rounded-md px-2 text-[11px] font-semibold ${
                    galleryView === "trash"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-600"
                  }`}
                >
                  Trash
                </button>
              </div>
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => {
                  setGallerySearch(e.target.value);
                  setGalleryPage(1);
                }}
                placeholder="Search prompt/model..."
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 outline-none focus:border-teal-300"
              />
              <select
                value={galleryProvider}
                onChange={(e) => {
                  setGalleryProvider(e.target.value);
                  setGalleryPage(1);
                }}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 outline-none focus:border-teal-300"
              >
                <option value="all">All providers</option>
                <option value="mvp">MVP</option>
                <option value="fal">fal</option>
                <option value="external">external</option>
              </select>
              <select
                value={galleryModelId}
                onChange={(e) => {
                  setGalleryModelId(e.target.value);
                  setGalleryPage(1);
                }}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-700 outline-none focus:border-teal-300"
              >
                <option value="all">All models</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <label className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700">
                <input
                  type="checkbox"
                  checked={galleryFavoriteOnly}
                  onChange={(e) => {
                    setGalleryFavoriteOnly(e.target.checked);
                    setGalleryPage(1);
                  }}
                  className="h-3.5 w-3.5 accent-amber-500"
                />
                Favorites only
              </label>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <label className="text-xs font-semibold text-zinc-600">Sort:</label>
              <select
                value={gallerySort}
                onChange={(e) => {
                  setGallerySort(e.target.value);
                  setGalleryPage(1);
                }}
                className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none focus:border-teal-300"
              >
                <option value="favorites_newest">Favorites first (Newest)</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="provider">Provider (A-Z)</option>
              </select>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700"
                >
                  Select visible
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllAcrossPages}
                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                    allMatchingSelected
                      ? "border-teal-300 bg-teal-50 text-teal-700"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {allMatchingSelected ? "All results selected" : "Select all results"}
                </button>
                <span className="text-[11px] text-zinc-500">
                  {selectedCount} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isTrashView ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBulkFavorite(true)}
                      disabled={bulkBusy || selectedCount === 0}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 disabled:opacity-50"
                    >
                      Favorite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkFavorite(false)}
                      disabled={bulkBusy || selectedCount === 0}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 disabled:opacity-50"
                    >
                      Unfavorite
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleBulkRestore}
                    disabled={bulkBusy || selectedCount === 0}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-50"
                  >
                    Restore selected
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkBusy || selectedCount === 0}
                  className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 disabled:opacity-50"
                >
                  {isTrashView ? "Delete permanently" : "Delete selected"}
                </button>
              </div>
            </div>

            {galleryLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                Loading gallery...
              </div>
            ) : galleryItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                  >
                    <div className="relative">
                      <label className="absolute left-2 top-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded bg-white/90">
                        <input
                          type="checkbox"
                          checked={allMatchingSelected || selectedGenerationIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="h-3.5 w-3.5 accent-teal-500"
                        />
                      </label>
                      <Image
                        src={item.imageUrl}
                        alt={item.prompt || "Generated image"}
                        width={1024}
                        height={1024}
                        unoptimized
                        className="h-40 w-full object-cover"
                      />
                      {!isTrashView ? (
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item.id, item.isFavorite)}
                          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-bold ${
                            item.isFavorite
                              ? "bg-amber-500 text-white"
                              : "bg-white/90 text-zinc-600"
                          }`}
                        >
                          {item.isFavorite ? "★" : "☆"}
                        </button>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold text-zinc-800">
                        {item.prompt}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {item.model?.name || "Model"} · {item.provider}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400">
                          {new Date(item.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={item.imageUrl}
                            download={`artecho-${item.id}.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                          >
                            Download
                          </a>
                          {isTrashView ? (
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch("/api/train-ai/generations", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "restore", id: item.id }),
                                });
                                setGalleryPage(1);
                                await fetchGalleryPage(1, false);
                              }}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              Restore
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleDeleteGeneration(item.id)}
                            className="text-[11px] font-semibold text-red-500 hover:text-red-600"
                          >
                            {isTrashView ? "Delete permanently" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                No generated images match current filters.
              </div>
            )}

            {!isTrashView && undoDelete?.ids?.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span>
                  {undoDelete.count} item{undoDelete.count === 1 ? "" : "s"} deleted.
                </span>
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-800"
                >
                  Undo
                </button>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Page {galleryPage} of {galleryTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setGalleryPage((p) => Math.min(galleryTotalPages, p + 1))}
                disabled={galleryPage >= galleryTotalPages || galleryLoadingMore || galleryLoading}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-50"
              >
                {galleryLoadingMore ? "Loading more..." : "Load more"}
              </button>
            </div>
            <div ref={loadMoreRef} className="h-6 w-full" />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/learn" className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:shadow-md hover:border-teal-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 group-hover:bg-teal-100 transition">
              <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-800">Learn Drawing</h3>
            <p className="mt-1 text-xs text-zinc-500">Continue your lessons and improve your skills</p>
          </Link>
          <Link href="/train-ai" className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:shadow-md hover:border-amber-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100 transition">
              <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-800">Train Your AI</h3>
            <p className="mt-1 text-xs text-zinc-500">Upload artwork and train your AI model</p>
          </Link>
          <Link href="/marketplace" className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:shadow-md hover:border-indigo-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition">
              <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-800">Marketplace</h3>
            <p className="mt-1 text-xs text-zinc-500">Browse and share AI art styles</p>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
