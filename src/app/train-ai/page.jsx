"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppToast } from "@/components/app-toast";
import { PlanUsageSnapshot } from "@/components/plan-usage-snapshot";

const ACHIEVEMENTS = [
  { label: "First Upload", color: "bg-indigo-400", icon: "upload" },
  { label: "10 Uploads", color: "bg-zinc-200 text-zinc-600", icon: "stack" },
  { label: "First Trained", color: "bg-indigo-400", icon: "check" },
];

export default function TrainAiPage() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState(null);
  const [modelsData, setModelsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [syncingJobs, setSyncingJobs] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
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

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [progressRes, modelsRes] = await Promise.all([
        fetch("/api/user/progress"),
        fetch("/api/train-ai/models"),
      ]);
      const [progressJson, modelsJson] = await Promise.all([
        progressRes.json(),
        modelsRes.json(),
      ]);
      if (progressRes.ok) setProgress(progressJson);
      if (modelsRes.ok) {
        setModelsData(modelsJson);
        const firstModelId = modelsJson?.models?.[0]?.id || "";
        setSelectedModelId((prev) => prev || firstModelId);
      }
    } catch {
      showToast("Failed to load training data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateModel = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/train-ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newModelName }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not create model.", "error");
        return;
      }
      setNewModelName("");
      showToast("New personal LoRA model created.", "success");
      await fetchAll();
      setSelectedModelId(data?.model?.id || "");
    } catch {
      showToast("Could not create model.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedModelId) {
      showToast("Please select a model first.", "error");
      return;
    }
    if (!selectedFile) {
      showToast("Please select a video file.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("modelId", selectedModelId);
      formData.append("file", selectedFile);
      const res = await fetch("/api/train-ai/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed.", "error");
        return;
      }
      setSelectedFile(null);
      showToast("Training video uploaded.", "success");
      await fetchAll();
    } catch {
      showToast("Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedModelId) {
      showToast("Please select a model first.", "error");
      return;
    }
    setTraining(true);
    try {
      const res = await fetch("/api/train-ai/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedModelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Training failed.", "error");
        return;
      }
      if (data?.queued) {
        showToast("Training job queued on provider. Use Sync Jobs to refresh.", "info");
      } else {
        showToast("Model trained successfully and improved.", "success");
      }
      await fetchAll();
    } catch {
      showToast("Training failed.", "error");
    } finally {
      setTraining(false);
    }
  };

  const handleSyncJobs = async () => {
    const runningJobs = (modelsData?.models || [])
      .map((m) => m.latestJob)
      .filter((j) => j && (j.status === "QUEUED" || j.status === "RUNNING"));
    if (!runningJobs.length) {
      showToast("No queued/running jobs to sync.", "info");
      return;
    }

    setSyncingJobs(true);
    try {
      await Promise.all(
        runningJobs.map((job) =>
          fetch(`/api/train-ai/train?jobId=${job.id}`).catch(() => null)
        )
      );
      await fetchAll();
      showToast("Jobs synced from provider.", "success");
    } catch {
      showToast("Failed to sync jobs.", "error");
    } finally {
      setSyncingJobs(false);
    }
  };

  const plan = progress?.plan || modelsData?.tier || "FREE";
  const models = modelsData?.models || [];
  const selectedModel = models.find((m) => m.id === selectedModelId) || null;
  const modelLimits = modelsData?.limits || {};
  const isFreePlan = plan === "FREE";
  const videoQuota = progress?.limits?.videoUploads;
  const educationalQuota = progress?.limits?.educationalVideos;
  const aiTrainingQuota = progress?.limits?.aiTraining;
  const freeVideoRemaining = videoQuota?.remaining ?? 0;
  const walletBalanceCents = Number(progress?.wallet?.balanceCents || 0);
  const storageInfo = progress?.storage || {};
  const provisioningInfo = progress?.provisioning || null;
  const watchedUsed = Number(
    progress?.activity?.watchedVideosCount ?? educationalQuota?.used ?? 0
  );
  const uploadUsed = Number(
    progress?.activity?.uploadedVideosCount ?? videoQuota?.used ?? 0
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppToast toast={toast} visible={toastVisible} />
      <Navbar activePage="/train-ai" />
      <div className="h-16" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold italic tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
            Train Your AI
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 md:text-base">
            Train lightweight personal LoRA models from your uploaded videos.
            Models are stored per user, improve over time, and are created
            on-demand based on your plan.
          </p>
        </div>

        {/* Top row: Profile + Create model */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Profile Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-50">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={112}
                  height={112}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-indigo-500 text-3xl font-bold text-white">
                  {(session?.user?.name || "A").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-bold italic text-slate-700">
              {session?.user?.name || "Artist"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Your personal model set grows with your style.
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">Progress</span>
                <span className="font-bold text-slate-800">{progress?.progressPercent || 0}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${progress?.progressPercent || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-zinc-700">Achievements</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACHIEVEMENTS.map((a) => (
                  <span
                    key={a.label}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      a.color === "bg-indigo-400"
                        ? "bg-indigo-400 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {a.icon === "upload" && (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                    {a.icon === "stack" && (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                      </svg>
                    )}
                    {a.icon === "check" && (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <path d="M22 4L12 14.01l-3-3" />
                      </svg>
                    )}
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Model Builder */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  className="w-5 h-5 text-zinc-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-700">
                  Personal LoRA Builder
                </h2>
                <p className="text-xs text-zinc-400">
                  On-demand per-user models by your current plan
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Model name (e.g. My Anime Motion Style)"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none"
              />
              <button
                type="button"
                onClick={handleCreateModel}
                disabled={creating || loading}
                className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Model"}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-slate-700">Plan: {plan}</span>
                <span>
                  Model slots:{" "}
                  {modelLimits.maxModelsUnlimited
                    ? "Unlimited"
                    : `${modelsData?.usage?.modelsUsed || 0}/${modelLimits.maxModels ?? 0}`}
                </span>
                <span>
                  Videos/model:{" "}
                  {modelLimits.maxVideosPerModelUnlimited
                    ? "Unlimited"
                    : modelLimits.maxVideosPerModel ?? 0}
                </span>
                <span>
                  Train runs:{" "}
                  {modelLimits.maxTrainRunsUnlimited
                    ? "Unlimited"
                    : modelLimits.maxTrainRuns ?? 0}
                </span>
              </div>
            </div>

            <PlanUsageSnapshot
              className="mt-3"
              compact
              planTier={plan}
              watchedUsed={watchedUsed}
              watchedLimit={educationalQuota?.limit ?? null}
              watchedRemaining={educationalQuota?.remaining ?? null}
              uploadsUsed={uploadUsed}
              uploadsLimit={videoQuota?.limit ?? null}
              uploadsRemaining={videoQuota?.remaining ?? null}
            />

            {isFreePlan && (
              <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                Free usage — Video uploads: {videoQuota?.used ?? 0}/{videoQuota?.limit ?? 3}
                {" · "}AI training submits: {aiTrainingQuota?.used ?? 0}/{aiTrainingQuota?.limit ?? 3}
              </div>
            )}

            <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Wallet: ${(walletBalanceCents / 100).toFixed(2)}
              {" · "}Storage used: {(Number(storageInfo?.usedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
              {" · "}Monthly upload: {(Number(storageInfo?.monthlyUsedBytes || 0) / (1024 * 1024)).toFixed(1)} MB
              {typeof storageInfo?.monthlyLimitBytes === "number"
                ? `/${(storageInfo.monthlyLimitBytes / (1024 * 1024)).toFixed(0)} MB`
                : "/Unlimited"}
              {" · "}Provision: {provisioningInfo?.status || "Not required"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/wallet/topup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amountCents: 1000 }),
                  })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d?.url) window.location.href = d.url;
                    });
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700"
              >
                Top up $10
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/provisioning", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ runNow: true }),
                  });
                  await fetchAll();
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700"
              >
                Provision now
              </button>
            </div>
          </div>
        </div>

        {/* Upload & Train */}
        <div className="mt-10 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              Upload & Train
            </h2>
          </div>
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Select model
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none"
                >
                  <option value="">Choose a model...</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.videoCount} video / v{m.latestVersion})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  Upload training video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleUploadVideo}
                disabled={uploading || !selectedModelId || !selectedFile || (isFreePlan && freeVideoRemaining <= 0)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Video"}
              </button>
              <button
                type="button"
                onClick={handleTrainModel}
                disabled={training || !selectedModelId}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {training ? "Training..." : "Train Selected Model"}
              </button>
              <button
                type="button"
                onClick={handleSyncJobs}
                disabled={syncingJobs || loading}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {syncingJobs ? "Syncing..." : "Sync Jobs"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Style Model Cards */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">
            Your AI Style Models
          </h2>
          {loading ? (
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
              Loading models...
            </div>
          ) : models.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="text-sm text-zinc-500">
                No personal models yet. Create one and upload videos to start.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`rounded-2xl border bg-white p-4 ${
                    selectedModelId === model.id
                      ? "border-indigo-400 ring-2 ring-indigo-100"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{model.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Status: {model.status} · Tier: {model.planTier}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedModelId(model.id)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-700"
                    >
                      Select
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-zinc-50 py-2">
                      <p className="text-[10px] text-zinc-500">Videos</p>
                      <p className="text-sm font-bold text-slate-800">{model.videoCount}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 py-2">
                      <p className="text-[10px] text-zinc-500">Version</p>
                      <p className="text-sm font-bold text-slate-800">v{model.latestVersion}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 py-2">
                      <p className="text-[10px] text-zinc-500">Trains</p>
                      <p className="text-sm font-bold text-slate-800">{model.trainRuns}</p>
                    </div>
                  </div>
                  {model.latestJob && (
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Last job: {model.latestJob.status} ({model.latestJob.progress}%)
                      {model.latestJob.provider ? ` · ${model.latestJob.provider}` : ""}
                    </p>
                  )}
                  {model.adapterUrl && (
                    <p className="mt-1 break-all text-[11px] text-indigo-700">
                      Adapter: {model.adapterUrl}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedModel && (
          <div className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <p className="text-sm font-semibold text-indigo-900">
              Active model: {selectedModel.name}
            </p>
            <p className="mt-1 text-xs text-indigo-700">
              This model is personalized for your account and keeps improving as
              you upload more videos and train again.
            </p>
          </div>
        )}
        {/* Tips + Next in Loop */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Tips */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                <svg
                  className="w-4 h-4 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-700">
                Tips for Better Training
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Upload coherent videos from one visual style per model",
                "Train after each batch to move model version forward",
                "Use short, clean clips to reduce noise in style learning",
                "Create separate models for different artistic directions",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <p className="text-xs text-zinc-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next in Loop */}
          <div className="rounded-2xl border border-zinc-200 bg-slate-700 p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 2v8L4.72 20.55a1 1 0 00.9 1.45h12.76a1 1 0 00.9-1.45L14 10V2" />
                  <path d="M8.5 2h7" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">
                Next in Your Loop: Test Your AI
              </h3>
            </div>
            <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
              Once your model training is complete, head to the Dashboard to
              test your AI and compare output quality against your latest uploads.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Go to Dashboard
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between rounded-2xl bg-orange-400 px-6 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-white">
                Need more training capacity?
              </p>
              <p className="text-xs text-white/70">
                Upgrade your plan for more model slots and higher training limits
              </p>
            </div>
          </div>
          <Link
            href="/app"
            className="rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/30"
          >
            View Plans
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
