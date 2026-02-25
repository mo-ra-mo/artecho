"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AppToast } from "@/components/app-toast";
import { PlanUsageSnapshot } from "@/components/plan-usage-snapshot";

const LESSONS = [
  {
    id: 1,
    title: "Basic Line Work",
    desc: "Learn the fundamentals of clean, confident line work that forms the foundation of all drawing.",
    difficulty: "Beginner",
    category: "Fundamentals",
  },
  {
    id: 2,
    title: "Shape Construction",
    desc: "Master basic geometric shapes and learn to build complex forms from simple primitives.",
    difficulty: "Beginner",
    category: "Fundamentals",
  },
  {
    id: 3,
    title: "Shading Basics",
    desc: "Explore light and shadow to add depth and dimension to your drawings.",
    difficulty: "Beginner",
    category: "Fundamentals",
  },
  {
    id: 4,
    title: "Figure Drawing",
    desc: "Capture the human form through gesture and proportion studies.",
    difficulty: "Intermediate",
    category: "Figure",
  },
  {
    id: 5,
    title: "Perspective Drawing",
    desc: "Understand one, two, and three-point perspective for realistic scenes.",
    difficulty: "Intermediate",
    category: "Environment",
  },
  {
    id: 6,
    title: "Character Design",
    desc: "Create unique and expressive characters with personality and style.",
    difficulty: "Advanced",
    category: "Character",
  },
];

export default function LearnPage() {
  useSession();
  const [progress, setProgress] = useState(null);
  const [planTierFallback, setPlanTierFallback] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [learningVideos, setLearningVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const [difficulty, setDifficulty] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [openingLessonId, setOpeningLessonId] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimersRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    const loadProgress = async () => {
      try {
        const res = await fetch("/api/user/progress");
        const data = await res.json();
        if (!mounted) return;
        if (!data.error) {
          setProgress(data);
          return;
        }

        const planRes = await fetch("/api/user/plan");
        const planData = await planRes.json();
        if (!planData.error && planData.tier) {
          setPlanTierFallback(planData.tier);
        }
      } catch {
      } finally {
        if (mounted) setProgressLoaded(true);
      }
    };
    loadProgress();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    fetch("/api/learning/videos")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setLearningVideos(data.videos || []);
      })
      .catch(() => {});
  }, []);

  const filtered = LESSONS.filter((l) => {
    if (difficulty !== "all" && l.difficulty !== difficulty) return false;
    if (category !== "all" && l.category !== category) return false;
    return true;
  });

  const isFreePlan = progress?.plan === "FREE";
  const educationalQuota = progress?.limits?.educationalVideos;
  const educationalRemaining = educationalQuota?.remaining ?? 0;
  const educationalBlocked = isFreePlan && educationalRemaining <= 0;
  const videoUploadQuota = progress?.limits?.videoUploads;
  const watchedUsed = Number(
    progress?.activity?.watchedVideosCount ?? educationalQuota?.used ?? 0
  );
  const uploadUsed = Number(
    progress?.activity?.uploadedVideosCount ?? videoUploadQuota?.used ?? 0
  );
  const effectivePlanTier = progress?.plan || planTierFallback || null;
  const normalizedPlanTier = effectivePlanTier || (progressLoaded ? "FREE" : null);
  const VIDEOS_PER_PAGE = 6;
  const totalVideoPages = Math.max(
    1,
    Math.ceil(learningVideos.length / VIDEOS_PER_PAGE)
  );
  const pagedVideos = learningVideos.slice(
    (currentVideoPage - 1) * VIDEOS_PER_PAGE,
    currentVideoPage * VIDEOS_PER_PAGE
  );
  const getEmbedUrl = (video) => {
    const raw = String(video?.embedUrl || "").trim();
    const rawId = String(video?.videoId || "").trim();

    if (raw.includes("/embed/")) return raw;

    try {
      if (raw) {
        const url = new URL(raw);
        const host = url.hostname.toLowerCase();
        if (host.includes("youtube.com")) {
          const watchId = url.searchParams.get("v");
          if (watchId) return `https://www.youtube.com/embed/${watchId}`;
        }
        if (host.includes("youtu.be")) {
          const shortId = url.pathname.replace("/", "");
          if (shortId) return `https://www.youtube.com/embed/${shortId}`;
        }
      }
    } catch {
    }

    if (rawId) return `https://www.youtube.com/embed/${rawId}`;
    return "";
  };

  useEffect(() => {
    if (currentVideoPage > totalVideoPages) {
      setCurrentVideoPage(totalVideoPages);
    }
  }, [currentVideoPage, totalVideoPages]);

  const showToast = (message, type = "info") => {
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
  };

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedVideo(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedVideo]);

  const handleViewLesson = async (lessonId) => {
    if (educationalBlocked) {
      showToast(
        "Free plan educational video limit reached. Upgrade to continue.",
        "error"
      );
      return;
    }

    setOpeningLessonId(lessonId);
    try {
      const res = await fetch("/api/user/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "educational_video" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to open lesson.", "error");
        return;
      }

      if (data?.quota) {
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activity: {
              ...prev.activity,
              watchedVideosCount: Number(prev.activity?.watchedVideosCount || 0) + 1,
              uploadedVideosCount: Number(prev.activity?.uploadedVideosCount || 0),
            },
            limits: {
              ...prev.limits,
              educationalVideos: {
                ...prev.limits.educationalVideos,
                used: data.quota.used,
                limit: data.quota.limit,
                remaining: data.quota.remaining,
              },
            },
          };
        });
      } else {
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activity: {
              ...prev.activity,
              watchedVideosCount: Number(prev.activity?.watchedVideosCount || 0) + 1,
              uploadedVideosCount: Number(prev.activity?.uploadedVideosCount || 0),
            },
          };
        });
      }

      showToast("Lesson opened.", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setOpeningLessonId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppToast toast={toast} visible={toastVisible} />
      <Navbar activePage="/learn" />
      <div className="h-16" />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-2xl font-bold italic tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
            Learn Drawing
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 md:text-base">
            Master the fundamentals and develop your unique artistic style
            through structured lessons designed for creative minds.
          </p>
        </div>

        {/* Progress + Stats */}
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Progress bar */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">
                Your Progress
              </p>
              <div className="mt-2 h-2.5 w-full max-w-xs rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${progress?.progressPercent || 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-zinc-400">
                Keep going! Complete more lessons to level up.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 px-5 py-3">
                <svg className="w-5 h-5 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <span className="text-xl font-bold text-slate-800">{progress?.totalSessions || 0}</span>
                <span className="text-[10px] text-zinc-400">Completed</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 px-5 py-3">
                <svg className="w-5 h-5 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z" />
                </svg>
                <span className="text-xl font-bold text-slate-800">{progress?.uniqueDays || 0}</span>
                <span className="text-[10px] text-zinc-400">Day Streak</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 px-5 py-3">
                <svg className="w-5 h-5 text-zinc-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="text-[10px] text-zinc-400">Last Opened</span>
                <span className="text-sm font-bold text-slate-800">
                  {progress?.lastSession?.content?.slice(0, 30) || "No sessions yet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <PlanUsageSnapshot
          className="mt-4"
          planTier={normalizedPlanTier}
          watchedUsed={watchedUsed}
          watchedLimit={educationalQuota?.limit ?? null}
          watchedRemaining={educationalQuota?.remaining ?? null}
          uploadsUsed={uploadUsed}
          uploadsLimit={videoUploadQuota?.limit ?? null}
          uploadsRemaining={videoUploadQuota?.remaining ?? null}
        />

        {/* Filters */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Fundamentals">Fundamentals</option>
                <option value="Figure">Figure</option>
                <option value="Environment">Environment</option>
                <option value="Character">Character</option>
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                <option value="all">All Status</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-600 px-4 text-xs font-semibold text-white transition hover:bg-slate-700 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Apply Filters
            </button>
          </div>
        </div>

        {/* Lessons grid */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">Educational Videos</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Playlist videos are mapped from admin panel and shown in order.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {pagedVideos.map((video) => (
              <div
                key={video.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                <div className="group relative aspect-video w-full overflow-hidden bg-zinc-100">
                  <img
                    src={
                      video.thumbnailUrl ||
                      `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
                    }
                    alt={video.title}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback =
                        video.thumbnailFallbackUrl ||
                        `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
                      if (target.src !== fallback) target.src = fallback;
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(video)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/35"
                    aria-label={`Play ${video.title}`}
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow">
                      <svg
                        className="h-5 w-5 translate-x-px"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </button>
                </div>
                <div className="px-3 py-2">
                  <p className="line-clamp-2 text-xs font-semibold text-slate-700">
                    {video.title}
                  </p>
                </div>
              </div>
            ))}
            {pagedVideos.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
                No videos yet. Ask admin to sync a YouTube playlist.
              </div>
            )}
          </div>
          {learningVideos.length > VIDEOS_PER_PAGE && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalVideoPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentVideoPage(page)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                      currentVideoPage === page
                        ? "bg-teal-600 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Lessons grid */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">All Lessons</h2>
          <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600">
            {isFreePlan ? (
              <span>
                Free educational videos: {educationalQuota?.used ?? 0}/
                {educationalQuota?.limit ?? 2} used ({educationalRemaining} left)
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">
                Educational videos are unlimited on your current plan.
              </span>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((lesson) => (
              <div
                key={lesson.id}
                className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden transition hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="h-40 w-full bg-zinc-100" />

                <div className="p-4">
                  {/* Tags */}
                  <div className="flex gap-1.5 mb-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
                      {lesson.difficulty}
                    </span>
                    <span className="rounded-full bg-indigo-400 px-2.5 py-0.5 text-[10px] font-medium text-white">
                      {lesson.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-700">
                    {lesson.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    {lesson.desc}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      Not Started
                    </span>
                    <button
                      type="button"
                      onClick={() => handleViewLesson(lesson.id)}
                      disabled={openingLessonId === lesson.id || educationalBlocked}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      {openingLessonId === lesson.id
                        ? "Opening..."
                        : educationalBlocked
                          ? "Limit Reached"
                          : "View Lesson"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notify */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C7.58 2 4 5.58 4 10v4.29L2.71 15.71A1 1 0 003.41 17h17.18a1 1 0 00.7-1.71L20 14.29V10c0-4.42-3.58-8-8-8zm0 22a2 2 0 002-2h-4a2 2 0 002 2z" />
              </svg>
              <h2 className="text-xl font-bold italic text-slate-800">Notify</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
              >
                + New Reminder
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 cursor-pointer"
              >
                View All
              </button>
            </div>
          </div>

          {/* Reminder cards */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[false, true].map((muted, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-600 text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4l-10 8L2 4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${muted ? "border-zinc-200 text-zinc-400" : "border-zinc-200 text-zinc-600"}`}>
                      Lesson Reminder
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${muted ? "border-zinc-200 text-zinc-400" : "border-zinc-200 text-zinc-600"}`}>
                      Email
                    </span>
                    <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-medium text-white">
                      Parent group&apos;s Notification&apos;s status
                    </span>
                  </div>
                  <p className={`mt-1.5 text-sm ${muted ? "text-zinc-400" : "text-zinc-700"}`}>
                    Practice your line work lesson
                  </p>
                  <p className={`mt-0.5 text-xs ${muted ? "text-zinc-300" : "text-zinc-400"}`}>
                    Tomorrow at 9:00 AM
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mock send */}
          <button
            type="button"
            className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-700 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22l-4-9-9-4z" />
            </svg>
            Run Mock Sends (Demo)
          </button>
        </div>

        {/* Guidance & Tips */}
        <div className="mt-12">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
            </svg>
            <h2 className="text-xl font-bold italic text-slate-800">
              Guidance &amp; Tips
            </h2>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {/* Tip 1 */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 shrink-0 text-emerald-500 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Complete More Lessons
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    The more lessons you complete, the better you&apos;ll
                    understand artistic techniques that translate into stronger
                    AI style models.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 2 */}
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 text-zinc-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Upload Diverse Artwork
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                    Include various subjects and compositions in your uploads to
                    help the AI learn the full range of your artistic style.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 3 */}
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Write Detailed Prompts
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                    When testing your AI, use descriptive prompts that specify
                    mood, composition, and subject matter for better results.
        </p>
      </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 mb-6 rounded-2xl border border-zinc-200 bg-slate-50 py-8 sm:py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-800">
            Ready to Train Your AI?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
            Complete lessons and apply them to your AI model. The more you
            learn, the better your AI understands your artistic journey.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="/train-ai"
              className="inline-flex h-10 items-center rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Train Your AI
            </a>
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              View Dashboard
            </a>
          </div>
        </div>
      </main>
      {selectedVideo && (
        (() => {
          const embedUrl = getEmbedUrl(selectedVideo);
          const playableUrl = embedUrl
            ? `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`
            : "";
          return (
        <div
          className="fixed inset-0 z-110 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="line-clamp-1 pr-4 text-sm font-semibold text-white">
                {selectedVideo.title}
              </p>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {playableUrl ? (
                <iframe
                  src={playableUrl}
                  title={selectedVideo.title}
                  className="h-full w-full"
                  loading="eager"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-300">
                  Video URL is invalid. Please resync the playlist from admin panel.
                </div>
              )}
            </div>
          </div>
        </div>
          );
        })()
      )}
      <Footer />
    </div>
  );
}
