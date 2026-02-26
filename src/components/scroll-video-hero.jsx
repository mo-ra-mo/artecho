"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";

const BASE_NODES = [
  { x: 320, y: 180 },
  { x: 580, y: 90 },
  { x: 900, y: 150 },
  { x: 200, y: 400 },
  { x: 480, y: 320 },
  { x: 720, y: 400 },
  { x: 1000, y: 340 },
  { x: 260, y: 620 },
  { x: 520, y: 560 },
  { x: 780, y: 640 },
  { x: 1050, y: 580 },
  { x: 350, y: 720 },
  { x: 650, y: 780 },
  { x: 950, y: 710 },
];

const EDGES = [
  [null, 0, [0, 120]],
  [0, 1],
  [1, 2],
  [2, null, [1200, 80]],
  [null, 3, [0, 350]],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, null, [1200, 380]],
  [null, 7, [0, 580]],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, null, [1200, 620]],
  [null, 11, [0, 750]],
  [11, 12],
  [12, 13],
  [13, null, [1200, 760]],
  [null, 3, [160, 0]],
  [3, 7],
  [7, 11],
  [0, 3],
  [null, 4, [480, 0]],
  [4, 8],
  [8, 12],
  [1, 4],
  [null, 5, [800, 0]],
  [5, 9],
  [9, 13],
  [2, 5],
  [null, 6, [1080, 0]],
  [6, 10],
  [10, 13],
  [0, 4],
  [3, 4],
  [4, 5],
  [8, 5],
  [5, 6],
  [9, 10],
  [7, 8],
  [11, 8],
  [12, 9],
];

const VIDEO_CDN_BASE_URL = (process.env.NEXT_PUBLIC_VIDEO_CDN_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const VIDEO_DEBUG = /^(1|true|yes|on)$/i.test(
  process.env.NEXT_PUBLIC_VIDEO_DEBUG || "",
);
const withVideoBase = (path) =>
  VIDEO_CDN_BASE_URL ? `${VIDEO_CDN_BASE_URL}${path}` : path;
const DEFAULT_DESKTOP_INTRO_VIDEO = VIDEO_CDN_BASE_URL
  ? `${VIDEO_CDN_BASE_URL}/intro.mp4`
  : "/videos/intro.mp4";
const DEFAULT_MOBILE_INTRO_VIDEO = VIDEO_CDN_BASE_URL
  ? `${VIDEO_CDN_BASE_URL}/intro-mobile.mp4`
  : "/videos/intro-mobile.mp4";
const DEFAULT_CTA_VIDEOS = [
  withVideoBase("/videos/cta-1.mp4"),
  withVideoBase("/videos/cta-2.mp4"),
  withVideoBase("/videos/cta-3.mp4"),
  withVideoBase("/videos/cta-4.mp4"),
  withVideoBase("/videos/cta-5.mp4"),
];
const LOCAL_DESKTOP_INTRO_VIDEO = "/videos/intro.mp4";
const LOCAL_MOBILE_INTRO_VIDEO = "/videos/intro-mobile.mp4";
const LOCAL_CTA_VIDEOS = [
  "/videos/cta-1.mp4",
  "/videos/cta-2.mp4",
  "/videos/cta-3.mp4",
  "/videos/cta-4.mp4",
  "/videos/cta-5.mp4",
];

function logVideoRuntime(level, message, meta = {}) {
  if (!VIDEO_DEBUG) return;
  const logger = level === "error" ? console.error : console.warn;
  logger(`[ArtEcho][video] ${message}`, meta);
}

function NetworkGrid() {
  const nodes = BASE_NODES;

  const getPos = (idx, fallback) =>
    idx != null ? [nodes[idx].x, nodes[idx].y] : fallback;

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="rgba(255,255,255,0.12)" strokeWidth="0.9">
        {EDGES.map((e, i) => {
          const [a, b, fb] = e;
          const from = getPos(a, fb || [0, 0]);
          const to = getPos(b, fb || [0, 0]);
          return (
            <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
          );
        })}
      </g>

      <g fill="rgba(255,255,255,0.18)">
        {nodes.map((n, i) => (
          <rect key={i} x={n.x - 4} y={n.y - 4} width="8" height="8" rx="1" />
        ))}
      </g>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white"
        aria-hidden
      />
      <p className="text-sm font-medium text-white/80">Loading...</p>
    </div>
  );
}

const VIDEO_SEEN_KEY = "artecho_video_seen";

function hasSeenVideo() {
  try {
    return sessionStorage.getItem(VIDEO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markVideoSeen() {
  try {
    sessionStorage.setItem(VIDEO_SEEN_KEY, "1");
  } catch {}
}

function AuthSlider({ authTab, setAuthTab }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [thumbOffset, setThumbOffset] = useState(0);
  const startXRef = useRef(0);
  const offsetRef = useRef(0);

  const isLogin = authTab === "login";

  const getTrackWidth = () => trackRef.current?.offsetWidth || 200;

  const commitPosition = (offset) => {
    const half = getTrackWidth() / 2;
    if (offset > half * 0.5) {
      setAuthTab("login");
    } else if (offset < -half * 0.5) {
      setAuthTab("signup");
    }
    offsetRef.current = 0;
    setThumbOffset(0);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    startXRef.current = e.clientX;
    offsetRef.current = 0;
    setThumbOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const maxOffset = getTrackWidth() * 0.5 - 6;
    const dx = e.clientX - startXRef.current;
    const clamped = Math.max(-maxOffset, Math.min(maxOffset, dx));
    offsetRef.current = clamped;
    setThumbOffset(clamped);
  };

  const handlePointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    const finalOffset = e.clientX - startXRef.current;
    const maxOffset = getTrackWidth() * 0.5 - 6;
    const clamped = Math.max(-maxOffset, Math.min(maxOffset, finalOffset));
    commitPosition(clamped);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const restPos = isLogin ? "calc(50% - 2px)" : "2px";

  return (
    <div className="mb-3 select-none">
      <div
        ref={trackRef}
        className="relative flex h-9 items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] rounded-lg bg-white/15 shadow-sm pointer-events-none"
          style={{
            left: restPos,
            transform: dragging ? `translateX(${thumbOffset}px)` : "none",
            transition: dragging ? "none" : "left 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <button
          type="button"
          onClick={() => setAuthTab("signup")}
          className={`relative z-10 flex-1 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
            !isLogin ? "text-white" : "text-white/40 hover:text-white/60"
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => setAuthTab("login")}
          className={`relative z-10 flex-1 py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
            isLogin ? "text-white" : "text-white/40 hover:text-white/60"
          }`}
        >
          Log in
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-white/25">
        {isLogin ? "← Slide left for Sign up" : "Slide right for Log in →"}
      </p>
    </div>
  );
}

export function ScrollVideoHero({ src = DEFAULT_DESKTOP_INTRO_VIDEO }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const videoRef = useRef(null);
  const [landingVideoSrc, setLandingVideoSrc] = useState(src);
  const [mobileLandingVideoSrc, setMobileLandingVideoSrc] = useState(
    DEFAULT_MOBILE_INTRO_VIDEO,
  );
  const [brandLogoSrc, setBrandLogoSrc] = useState("/i-6-1.png");
  const [ctaVideos, setCtaVideos] = useState(DEFAULT_CTA_VIDEOS);
  const [videoError, setVideoError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [navigatingAway, setNavigatingAway] = useState(false);
  const [isMobileLike, setIsMobileLike] = useState(false);
  const [logoLoadedSrc, setLogoLoadedSrc] = useState("");
  const [videoPreloadMap, setVideoPreloadMap] = useState({});

  // Auth form state
  const [authTab, setAuthTab] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthPw, setShowAuthPw] = useState(false);
  const activeLandingVideoSrc = isMobileLike ? mobileLandingVideoSrc : landingVideoSrc;

  const handleCtaVideoError = useCallback((e, fallbackCandidates, contextLabel) => {
    const el = e.currentTarget;
    if (!el) return;
    const currentSrc = el.getAttribute("src") || "";
    const attempted = new Set(
      (el.dataset.fallbackTried || "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    const candidates = (Array.isArray(fallbackCandidates) ? fallbackCandidates : [])
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    const nextFallback = candidates.find(
      (candidate) => candidate !== currentSrc && !attempted.has(candidate),
    );

    logVideoRuntime("warn", "Video load failed; checking fallback.", {
      context: contextLabel,
      failedSrc: currentSrc,
      candidates,
    });

    if (!nextFallback) {
      logVideoRuntime("error", "No fallback candidate available.", {
        context: contextLabel,
        failedSrc: currentSrc,
        attempted: Array.from(attempted),
      });
      return;
    }

    attempted.add(nextFallback);
    el.dataset.fallbackTried = Array.from(attempted).join("|");
    el.setAttribute("src", nextFallback);
    el.load();
    el.play().catch(() => {});
    logVideoRuntime("warn", "Fallback applied.", {
      context: contextLabel,
      fallbackSrc: nextFallback,
    });
  }, []);

  const handleGoogleSignIn = useCallback(() => {
    signIn("google", { callbackUrl: "/dashboard" });
  }, []);

  const handleAuthSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setAuthError("");
      setAuthLoading(true);

      try {
        if (authTab === "signup") {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: authName,
              email: authEmail,
              password: authPassword,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            setAuthError(
              json.errors
                ? Object.values(json.errors).flat()[0]
                : json.error || "Registration failed",
            );
            setAuthLoading(false);
            return;
          }
        }

        const res = await signIn("credentials", {
          email: authEmail,
          password: authPassword,
          redirect: false,
        });
        if (res?.error) {
          setAuthError(
            authTab === "signup"
              ? "Account created but auto-login failed. Switch to Log in."
              : "Invalid email or password.",
          );
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch {
        setAuthError("Something went wrong. Please try again.");
      }
      setAuthLoading(false);
    },
    [authTab, authEmail, authPassword, authName, router],
  );

  useEffect(() => {
    let mounted = true;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        const settings = data?.settings;
        if (typeof settings?.landingVideoUrl === "string" && settings.landingVideoUrl.trim()) {
          setLandingVideoSrc(settings.landingVideoUrl);
        }
        if (
          typeof settings?.landingVideoMobileUrl === "string" &&
          settings.landingVideoMobileUrl.trim()
        ) {
          setMobileLandingVideoSrc(settings.landingVideoMobileUrl);
        }
        if (typeof settings?.mainLogoUrl === "string" && settings.mainLogoUrl.trim()) {
          setBrandLogoSrc(settings.mainLogoUrl);
        }
        if (Array.isArray(settings?.ctaVideos)) {
          const normalized = Array.from({ length: 5 }, (_, i) => {
            const candidate = settings.ctaVideos[i];
            return typeof candidate === "string" && candidate.trim()
              ? candidate
              : DEFAULT_CTA_VIDEOS[i];
          });
          setCtaVideos(normalized);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const computeMobileLike = () => {
      const smallViewport = window.matchMedia("(max-width: 768px)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      setIsMobileLike(smallViewport || coarsePointer);
    };

    computeMobileLike();
    window.addEventListener("resize", computeMobileLike);
    return () => window.removeEventListener("resize", computeMobileLike);
  }, []);

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active) setLogoLoadedSrc(brandLogoSrc);
    };
    img.onerror = () => {
      if (active) setLogoLoadedSrc(brandLogoSrc);
    };
    img.src = brandLogoSrc;
    return () => {
      active = false;
    };
  }, [brandLogoSrc]);

  useEffect(() => {
    let active = true;
    const videoSources = [
      activeLandingVideoSrc,
      ...ctaVideos.slice(0, isMobileLike ? 2 : 5),
    ].filter(
      (src) => typeof src === "string" && src.trim().length > 0,
    );
    const cleaners = [];

    const markReady = (src) => {
      if (!active) return;
      setVideoPreloadMap((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
    };

    videoSources.forEach((src) => {
      if (videoPreloadMap[src]) return;

      const preloadVideo = document.createElement("video");
      preloadVideo.preload = "metadata";
      preloadVideo.muted = true;
      preloadVideo.playsInline = true;
      preloadVideo.src = src;

      const onReady = () => markReady(src);
      const onError = () => {
        logVideoRuntime("warn", "Preload failed; runtime fallback will handle.", {
          phase: "preload",
          src,
        });
        markReady(src);
      };

      preloadVideo.addEventListener("loadeddata", onReady, { once: true });
      preloadVideo.addEventListener("error", onError, { once: true });
      preloadVideo.load();

      cleaners.push(() => {
        preloadVideo.removeEventListener("loadeddata", onReady);
        preloadVideo.removeEventListener("error", onError);
      });
    });

    return () => {
      active = false;
      cleaners.forEach((fn) => fn());
    };
  }, [activeLandingVideoSrc, ctaVideos, isMobileLike, videoPreloadMap]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const connection = navigator.connection;
    const verySlowNetwork =
      connection?.saveData === true ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g";

    // On mobile-like or very slow connections, skip intro to avoid infinite loading.
    if (isMobileLike || verySlowNetwork) {
      const skipTimer = setTimeout(() => {
        setVideoReady(true);
        setShowLogo(false);
        setVideoEnded(true);
      }, 0);
      return () => clearTimeout(skipTimer);
    }

    const nav = performance.getEntriesByType("navigation")[0];
    if (nav?.type === "reload") {
      try {
        sessionStorage.removeItem(VIDEO_SEEN_KEY);
      } catch {}
    }

    if (hasSeenVideo()) {
      video.pause();
      const seekToEnd = () => {
        video.currentTime = video.duration || 0;
        video.pause();
        setVideoReady(true);
        setShowLogo(true);
        setVideoEnded(true);
      };
      if (video.readyState >= 1) {
        queueMicrotask(seekToEnd);
      } else {
        video.addEventListener("loadedmetadata", seekToEnd, { once: true });
        return () => video.removeEventListener("loadedmetadata", seekToEnd);
      }
      return;
    }

    const startWithDelay = () => {
      clearTimeout(failSafeTimer);
      setVideoReady(true);
      setTimeout(() => video.play().catch(() => {}), 100);
    };

    const onCanPlay = () => startWithDelay();
    const failSafeTimer = setTimeout(() => {
      setVideoError(true);
      setVideoReady(true);
      setShowLogo(false);
      setVideoEnded(true);
    }, 7000);

    video.addEventListener("canplay", onCanPlay);
    if (video.readyState >= 3) {
      queueMicrotask(startWithDelay);
    }
    return () => {
      clearTimeout(failSafeTimer);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [activeLandingVideoSrc, isMobileLike]);

  const showCta = videoEnded;
  const [btnReady, setBtnReady] = useState(false);
  const hideIntroOnMobile = isMobileLike && showCta;
  const requiredVideoSources = [
    activeLandingVideoSrc,
    ...ctaVideos.slice(0, isMobileLike ? 2 : 5),
  ].filter(
    (src) => typeof src === "string" && src.trim().length > 0,
  );
  const allVideosReady =
    requiredVideoSources.length === 0 ||
    requiredVideoSources.every((src) => videoPreloadMap[src]);
  const logoReady = logoLoadedSrc === brandLogoSrc;
  const allVisualsReady = logoReady && allVideosReady && videoReady;

  const ctaRef = useRef(null);

  useEffect(() => {
    if (showCta) {
      setTimeout(() => setBtnReady(true), 1000);
    }
  }, [showCta]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-black">
        <NetworkGrid />
      </div>

      {!allVisualsReady && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center">
            <LoadingSpinner />
            <p className="mt-3 text-xs text-white/55">
              Preparing videos and interface...
            </p>
          </div>
        </div>
      )}

      {!hideIntroOnMobile && (
        <section
          className="relative z-1 flex items-center justify-center w-full bg-black transition-all duration-700 ease-in-out"
          style={{
            height: "100dvh",
            transform: navigatingAway ? "translateY(-100%)" : "none",
            opacity: navigatingAway ? 0 : 1,
          }}
          aria-label="ArtEcho landing video"
        >
          {!videoError ? (
            <>
              {/* White border frame */}
              <div className="absolute inset-2 sm:inset-[35px] rounded-xl border border-white/80 pointer-events-none z-10" />
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                src={activeLandingVideoSrc}
                muted
                playsInline
                preload="metadata"
                onEnded={() => {
                  markVideoSeen();
                  setShowLogo(true);
                  setTimeout(() => setVideoEnded(true), 2000);
                }}
                onError={() => {
                  if (isMobileLike && activeLandingVideoSrc !== landingVideoSrc) {
                    logVideoRuntime("warn", "Mobile intro failed; falling back to desktop intro.", {
                      failedSrc: activeLandingVideoSrc,
                      fallbackSrc: landingVideoSrc,
                    });
                    setMobileLandingVideoSrc(landingVideoSrc);
                    return;
                  }
                  if (activeLandingVideoSrc !== LOCAL_DESKTOP_INTRO_VIDEO) {
                    logVideoRuntime("warn", "Primary intro failed; falling back to local intro.", {
                      failedSrc: activeLandingVideoSrc,
                      fallbackSrc: LOCAL_DESKTOP_INTRO_VIDEO,
                    });
                    setLandingVideoSrc(LOCAL_DESKTOP_INTRO_VIDEO);
                    return;
                  }
                  if (isMobileLike && mobileLandingVideoSrc !== LOCAL_MOBILE_INTRO_VIDEO) {
                    logVideoRuntime(
                      "warn",
                      "Mobile intro fallback failed; trying local mobile intro.",
                      {
                        failedSrc: mobileLandingVideoSrc,
                        fallbackSrc: LOCAL_MOBILE_INTRO_VIDEO,
                      },
                    );
                    setMobileLandingVideoSrc(LOCAL_MOBILE_INTRO_VIDEO);
                    return;
                  }
                  logVideoRuntime("error", "Intro unavailable after fallbacks; skipping intro.", {
                    failedSrc: activeLandingVideoSrc,
                  });
                  // If landing video is missing on deploy, skip intro gracefully.
                  setVideoError(true);
                  setVideoReady(true);
                  setShowLogo(false);
                  setVideoEnded(true);
                }}
              />
              {showLogo && (
                <div
                  className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:right-17 sm:left-auto max-w-6xl mx-auto flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-0"
                  style={{
                    animation:
                      "logoFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                  }}
                >
                  <div className="pointer-events-none">
                    <p
                      className="text-white text-left font-semibold leading-tight"
                      style={{
                        fontSize: "clamp(13px, 4vw, 28px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Interactive AI-powered learning platform
                    </p>
                  </div>
                  <div>
                    <Image
                      src={brandLogoSrc}
                      alt="ArtEcho Logo"
                      width={300}
                      height={300}
                      className="h-12 w-14 object-contain sm:h-36 sm:w-40"
                    />
                  </div>
                </div>
              )}
              {showCta && (
                <button
                  type="button"
                  onClick={() =>
                    window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
                  }
                  className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/80 hover:text-white transition cursor-pointer"
                  aria-label="Scroll down"
                >
                  <div className="relative flex h-8 w-5 items-start justify-center rounded-full border border-white/55">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce" />
                  </div>
                  <svg
                    className="h-3.5 w-3.5 animate-bounce"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[10px] tracking-wide">Scroll</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="max-w-xl px-6 text-center text-white">
                <p className="text-sm font-medium text-white/70">
                  Intro video unavailable.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {showCta && (
        <div
          ref={ctaRef}
          className="min-h-dvh w-full relative z-1 flex items-stretch justify-center pt-3 sm:pt-[72px] pb-3 sm:pb-5 px-2.5 sm:px-5 overflow-y-auto sm:overflow-hidden"
          style={{
            transform: navigatingAway ? "translateY(-100%)" : "none",
            opacity: navigatingAway ? 0 : 1,
            transition: "all 0.7s ease-in-out",
          }}
        >
          <div className="w-full max-w-6xl rounded-xl sm:rounded-3xl border border-white/15 bg-white/4 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10 overflow-hidden flex flex-col">
            <div
              className={`${isLoggedIn ? "flex" : "grid grid-cols-1 lg:grid-cols-2"} flex-1 min-h-0 items-stretch`}
            >
              {/* ─── LEFT: Auth Section ─── */}
              {!isLoggedIn && (
                <div className="flex flex-col justify-center gap-2 h-full px-4 py-4 sm:px-6 sm:py-4 md:px-10 lg:px-12 border-b lg:border-b-0 lg:border-r border-white/10 overflow-visible md:overflow-y-auto">
                  <div className="mb-4 w-full flex-col items-center justify-center text-center">
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl">
                      Welcome to{" "}
                      <span>
                        <Image
                          src={brandLogoSrc}
                          alt="ArtEcho"
                          width={64}
                          height={64}
                          className="opacity-70 mb-1 mx-auto inline-block"
                        />
                      </span>
                    </h1>
                    <p className="mt-1 text-xs text-white/50">
                      Sign in or create an account to start your journey.
                    </p>
                  </div>

                  {authError && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {authError}
                    </div>
                  )}

                  {/* Google button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="flex h-10 w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10 cursor-pointer"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-1 flex items-center">
                      <div className="w-full h-5 border-b border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 mb-2 text-white/30 bg-transparent">
                        or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Draggable Auth Slider */}
                  <AuthSlider authTab={authTab} setAuthTab={setAuthTab} />

                  <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                    {authTab === "signup" && (
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-white/60">
                          Name
                        </label>
                        <input
                          type="text"
                          autoComplete="name"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
                          placeholder="Your name"
                        />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/60">
                        Email
                      </label>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/60">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showAuthPw ? "text" : "password"}
                          autoComplete={
                            authTab === "signup"
                              ? "new-password"
                              : "current-password"
                          }
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="h-9 w-full rounded-lg border border-white/15 bg-white/5 pl-3 pr-9 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition"
                          placeholder={
                            authTab === "signup"
                              ? "Min 8 chars, 1 uppercase, 1 number"
                              : "••••••••"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowAuthPw(!showAuthPw)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition cursor-pointer"
                          tabIndex={-1}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {showAuthPw ? (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            ) : (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="h-9 w-full rounded-lg bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {authLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {authTab === "login"
                            ? "Signing in..."
                            : "Creating account..."}
                        </span>
                      ) : authTab === "login" ? (
                        "Log in"
                      ) : (
                        "Create account"
                      )}
                    </button>
                  </form>

                  {/* Mobile-only lightweight CTA preview */}
                  <div className="mt-3 md:hidden">
                    <p className="mb-1.5 text-[10px] text-white/35 tracking-widest uppercase text-center">
                      Quick preview
                    </p>
                    <div className="group relative h-28 overflow-hidden rounded-lg border border-white/20 bg-black/30">
                      <video
                        className="absolute inset-0 h-full w-full object-cover grayscale contrast-120 brightness-75"
                        src={ctaVideos[0]}
                        muted
                        playsInline
                        loop
                        autoPlay={false}
                        preload="metadata"
                        onError={(e) =>
                          handleCtaVideoError(
                            e,
                            [LOCAL_CTA_VIDEOS[0], DEFAULT_CTA_VIDEOS[0]],
                            "cta-mobile-preview-0",
                          )
                        }
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/20" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="inline-block rounded-md rounded-bl-none border border-zinc-900 bg-yellow-50 px-2 py-1 shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
                          <p
                            className="text-[10px] font-extrabold leading-tight tracking-tight text-zinc-900"
                            style={{ fontFamily: "'Comic Sans MS', 'Bangers', cursive" }}
                          >
                            Learn to draw with real artists!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── RIGHT: Showcase Section ─── */}
              <div
                className={`${isLoggedIn ? "flex flex-1 flex-col px-4 py-3 sm:px-5 md:px-8 overflow-hidden" : "hidden md:flex md:flex-col md:px-8 md:py-4 overflow-hidden"}`}
              >
                <p className="text-[12px] text-white/40 mb-2 tracking-widest uppercase text-center shrink-0">
                  Discover the platform
                </p>

                {/* Comic-panel layout — 5 videos */}
                <div className="flex-1 min-h-0 rounded-xl border-2 border-white/25 bg-black/20 p-1.5 sm:p-2 flex flex-col gap-1.5 sm:gap-2">
                  {/* Row 1 — 2 panels */}
                  <div className="flex-3 grid grid-cols-2 min-h-0 gap-1.5 sm:gap-2">
                    {[
                      {
                        video: ctaVideos[0],
                        text: "Learn to draw with real artists!",
                        pos: "tl",
                      },
                      {
                        video: ctaVideos[1],
                        text: "Train your AI to echo your style!",
                        pos: "tr",
                      },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-lg sm:rounded-xl border-2 border-white/30 shadow-[0_3px_10px_rgba(0,0,0,0.35)]"
                      >
                        <video
                          className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 brightness-75 transition-[filter] duration-300 group-hover:grayscale group-hover:contrast-115 group-hover:brightness-85"
                          src={p.video}
                          muted
                          playsInline
                          loop
                          autoPlay={!isMobileLike}
                          preload="metadata"
                          onError={(e) =>
                            handleCtaVideoError(
                              e,
                              [LOCAL_CTA_VIDEOS[i], DEFAULT_CTA_VIDEOS[i]],
                              `cta-top-${i}`,
                            )
                          }
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/30" />
                        <div
                          className={`absolute top-1.5 sm:top-3 ${p.pos === "tl" ? "left-1.5 sm:left-3" : "right-1.5 sm:right-3"} max-w-[82%] z-10`}
                        >
                          <div
                            className={`relative bg-yellow-50 border sm:border-2 border-zinc-900 rounded-lg sm:rounded-xl ${p.pos === "tl" ? "rounded-bl-none" : "rounded-br-none"} px-2 py-1 sm:px-3.5 sm:py-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)] sm:shadow-[3px_3px_0_rgba(0,0,0,0.8)]`}
                          >
                            <p className="text-[11px] sm:text-[15px] font-extrabold text-zinc-900 leading-snug tracking-tight" style={{ fontFamily: "'Comic Sans MS', 'Bangers', cursive" }}>
                              {p.text}
                            </p>
                            <div
                              className={`absolute -bottom-1.5 sm:-bottom-2 ${p.pos === "tl" ? "left-2 sm:left-3" : "right-2 sm:right-3"} w-2 h-2 sm:w-3 sm:h-3 bg-yellow-50 border-b sm:border-b-2 border-r sm:border-r-2 border-zinc-900 rotate-45`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Row 2 — 3 panels */}
                  <div className="flex-2 grid grid-cols-3 min-h-0 gap-1.5 sm:gap-2">
                    {[
                      {
                        video: ctaVideos[2],
                        text: "Create stunning art together",
                      },
                      {
                        video: ctaVideos[3],
                        text: "Explore the marketplace",
                      },
                      {
                        video: ctaVideos[4],
                        text: "Your style, echoed by AI",
                      },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="group relative overflow-hidden rounded-lg sm:rounded-xl border-2 border-white/30 shadow-[0_3px_10px_rgba(0,0,0,0.35)]"
                      >
                        <video
                          className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 brightness-75 transition-[filter] duration-300 group-hover:grayscale group-hover:contrast-115 group-hover:brightness-85"
                          src={p.video}
                          muted
                          playsInline
                          loop
                          autoPlay={!isMobileLike}
                          preload="metadata"
                          onError={(e) =>
                            handleCtaVideoError(
                              e,
                              [LOCAL_CTA_VIDEOS[i + 2], DEFAULT_CTA_VIDEOS[i + 2]],
                              `cta-bottom-${i + 2}`,
                            )
                          }
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/30" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 z-10">
                          <div className="bg-yellow-50 border sm:border-2 border-zinc-900 rounded-md sm:rounded-lg rounded-bl-none px-1.5 py-0.5 sm:px-3 sm:py-1.5 shadow-[1px_1px_0_rgba(0,0,0,0.8)] sm:shadow-[2px_2px_0_rgba(0,0,0,0.8)] inline-block">
                            <p className="text-[9px] sm:text-[13px] font-extrabold text-zinc-900 leading-snug tracking-tight" style={{ fontFamily: "'Comic Sans MS', 'Bangers', cursive" }}>
                              {p.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Bottom buttons ─── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNavigatingAway(true);
                    setTimeout(() => router.push(isLoggedIn ? "/dashboard" : "/app"), 700);
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full px-4 sm:px-6 text-xs sm:text-sm font-semibold cursor-pointer transition-all duration-500 ease-out active:scale-95"
                  style={{
                    background: isLoggedIn
                      ? "linear-gradient(135deg, #bfa57a, #a98c5f, #94774a)"
                      : btnReady
                      ? "linear-gradient(135deg, #fbbf24, #fb923c, #fdba74)"
                      : "#ffffff",
                    color: btnReady ? "#ffffff" : "#0f172a",
                    boxShadow: isLoggedIn
                      ? "0 2px 8px rgba(169,140,95,0.32), 0 1px 6px rgba(148,119,74,0.26)"
                      : btnReady
                      ? "0 2px 8px rgba(251,146,60,0.28), 0 1px 6px rgba(251,191,36,0.2)"
                      : "none",
                    transform: btnReady ? "scale(1.02)" : "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (isLoggedIn) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 14px rgba(169,140,95,0.42), 0 2px 8px rgba(148,119,74,0.3)";
                      e.currentTarget.style.transform = "scale(1)";
                    } else if (btnReady) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(251,146,60,0.35), 0 2px 8px rgba(251,191,36,0.24)";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isLoggedIn) {
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(169,140,95,0.32), 0 1px 6px rgba(148,119,74,0.26)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    } else if (btnReady) {
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(251,146,60,0.28), 0 1px 6px rgba(251,191,36,0.2)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }
                  }}
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start echoing your art"}
                </button>
              
              <span className="h-px w-full bg-white/20 sm:hidden" />
              <span className="hidden h-7 w-px bg-white/20 sm:block" />

              <Link
                href={isLoggedIn ? "/learn" : "/about"}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-white/5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Start learning
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
