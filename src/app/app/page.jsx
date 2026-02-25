"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/footer";
import { DrawingRobot } from "@/components/drawing-robot";
import { Navbar } from "@/components/navbar";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";

export default function AppHomePage() {
  const [activePlan, setActivePlan] = useState(2);
  const [plans, setPlans] = useState(DEFAULT_SITE_SETTINGS.plans);

  useEffect(() => {
    let mounted = true;
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data?.settings?.plans) && data.settings.plans.length) {
          setPlans(data.settings.plans);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-white overflow-x-hidden">
      <DrawingRobot />
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Light grid background */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="rgba(0,0,0,0.03)" strokeWidth="0.4">
          <line x1="0" y1="120" x2="320" y2="180" />
          <line x1="320" y1="180" x2="580" y2="90" />
          <line x1="580" y1="90" x2="900" y2="150" />
          <line x1="900" y1="150" x2="1200" y2="80" />
          <line x1="0" y1="350" x2="200" y2="400" />
          <line x1="200" y1="400" x2="480" y2="320" />
          <line x1="480" y1="320" x2="720" y2="400" />
          <line x1="720" y1="400" x2="1000" y2="340" />
          <line x1="1000" y1="340" x2="1200" y2="380" />
          <line x1="0" y1="580" x2="260" y2="620" />
          <line x1="260" y1="620" x2="520" y2="560" />
          <line x1="520" y1="560" x2="780" y2="640" />
          <line x1="780" y1="640" x2="1050" y2="580" />
          <line x1="1050" y1="580" x2="1200" y2="620" />
          <line x1="0" y1="750" x2="350" y2="720" />
          <line x1="350" y1="720" x2="650" y2="780" />
          <line x1="650" y1="780" x2="950" y2="710" />
          <line x1="950" y1="710" x2="1200" y2="760" />

          <line x1="160" y1="0" x2="200" y2="400" />
          <line x1="200" y1="400" x2="260" y2="620" />
          <line x1="260" y1="620" x2="350" y2="720" />
          <line x1="320" y1="180" x2="200" y2="400" />
          <line x1="480" y1="0" x2="480" y2="320" />
          <line x1="480" y1="320" x2="520" y2="560" />
          <line x1="520" y1="560" x2="650" y2="780" />
          <line x1="580" y1="90" x2="480" y2="320" />
          <line x1="800" y1="0" x2="720" y2="400" />
          <line x1="720" y1="400" x2="780" y2="640" />
          <line x1="780" y1="640" x2="950" y2="710" />
          <line x1="900" y1="150" x2="720" y2="400" />
          <line x1="1080" y1="0" x2="1000" y2="340" />
          <line x1="1000" y1="340" x2="1050" y2="580" />
          <line x1="1050" y1="580" x2="950" y2="710" />

          <line x1="320" y1="180" x2="480" y2="320" />
          <line x1="200" y1="400" x2="480" y2="320" />
          <line x1="480" y1="320" x2="720" y2="400" />
          <line x1="520" y1="560" x2="720" y2="400" />
          <line x1="720" y1="400" x2="1000" y2="340" />
          <line x1="780" y1="640" x2="1050" y2="580" />
          <line x1="260" y1="620" x2="520" y2="560" />
          <line x1="350" y1="720" x2="520" y2="560" />
          <line x1="650" y1="780" x2="780" y2="640" />
        </g>

        <g fill="rgba(0,0,0,0.03)">
          <rect x="316" y="176" width="8" height="8" rx="1" />
          <rect x="576" y="86" width="8" height="8" rx="1" />
          <rect x="896" y="146" width="8" height="8" rx="1" />
          <rect x="196" y="396" width="8" height="8" rx="1" />
          <rect x="476" y="316" width="8" height="8" rx="1" />
          <rect x="716" y="396" width="8" height="8" rx="1" />
          <rect x="996" y="336" width="8" height="8" rx="1" />
          <rect x="256" y="616" width="8" height="8" rx="1" />
          <rect x="516" y="556" width="8" height="8" rx="1" />
          <rect x="776" y="636" width="8" height="8" rx="1" />
          <rect x="1046" y="576" width="8" height="8" rx="1" />
          <rect x="346" y="716" width="8" height="8" rx="1" />
          <rect x="646" y="776" width="8" height="8" rx="1" />
          <rect x="946" y="706" width="8" height="8" rx="1" />
        </g>
      </svg>

      {/* Hero Art + Two-Way Learning — fit in one screen */}
      <section className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-6">
        {/* Hero Art Image */}
        <Image
          src="/images/hero-art-transparent.png"
          alt="ArtEcho Hero"
          width={672}
          height={300}
          className="mb-6 w-screen max-w-none h-auto object-cover"
          draggable={false}
        />

        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Two-Way Learning
          </h2>
          <p className="text-glow mx-auto mt-2 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            A symbiotic relationship where you grow as an artist while your AI
            learns your unique creative voice.
          </p>

          <div className="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
            {/* You Learn */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center">
                <div className="h-16 w-16 rounded-full border-[2.5px] border-cyan-400" />
              </div>
              <h3 className="text-glow mt-5 text-lg font-semibold text-zinc-900">
                You Learn
              </h3>
              <p className="text-glow mt-3 max-w-xs text-sm text-zinc-500">
                Master drawing techniques through curated lessons. Build muscle
                memory, understand composition, and develop your personal
                aesthetic.
              </p>
            </div>

            {/* Continuous Exchange */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 shadow-sm">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7b8794"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-glow mt-5 text-sm font-medium text-zinc-500">
                Continuous Exchange
              </h3>
            </div>

            {/* AI Learns You */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center">
                <div className="h-16 w-16 rounded-full border-[2.5px] border-violet-400" />
              </div>
              <h3 className="text-glow mt-5 text-lg font-semibold text-zinc-900">
                AI Learns from You
              </h3>
              <p className="text-glow mt-3 max-w-xs text-sm text-zinc-500">
                Your uploaded artwork teaches the AI your style patterns. In
                Phase 1, this is simulated — future phases will use real LoRA
                training.
              </p>
            </div>
          </div>


          {/* Info banner */}
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full bg-zinc-100 px-5 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-300/60">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" />
              </svg>
            </div>
            <p className="text-xs text-zinc-500 md:text-sm">
              Phase 1 uses mock training. Real diffusion model integration
              coming in future updates.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Creative Minds Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Built for Creative Minds
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Whether you&apos;re a beginner picking up a pencil for the first
            time or an experienced artist exploring AI collaboration.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Card 1 — Structured Learning */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                Structured Learning Path
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Progress from basic shapes to advanced techniques with carefully
                designed lessons.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Fundamentals of line & shape",
                  "Light, shadow & form",
                  "Composition & perspective",
                  "Style development",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-zinc-600"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2 — AI Style Training */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.92a1 1 0 0 0-.75.97V12" />
                  <path d="M12 12v4" />
                  <circle cx="12" cy="18" r="2" />
                  <path d="M6 12a6 6 0 0 1 12 0" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                AI Style Training
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Upload your artwork and watch as ArtEcho learns your unique
                artistic fingerprint.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Upload & analyze artwork",
                  "Pattern recognition",
                  "Style replication",
                  "Continuous improvement",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-zinc-600"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Loop Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-glow text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            The Core Loop: Learn, Teach, Test
          </h2>
          <p className="text-glow mx-auto mt-5 max-w-xl text-sm text-zinc-500 leading-7 md:text-base">
            Our mascot&mdash;a curious baby robot sprouting a tiny
            leaf&mdash;represents the growth mindset at the heart of ArtEcho.
            As you complete lessons, your skills flourish. As you upload your
            art, the AI learns alongside you. Together, you evolve.
          </p>
          <div className="mt-8 flex items-center justify-center gap-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600 md:text-4xl">
                50+
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-500 tracking-wide">
                Drawing Lessons
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-zinc-800 md:text-4xl">5</p>
              <p className="mt-1 text-xs font-medium text-zinc-500 tracking-wide">
                AI Style Levels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Who It&apos;s For
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Whether you&apos;re just starting out or refining your craft,
            ArtEcho AI adapts to your journey.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Art Students */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                Art Students
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Build foundational skills while exploring AI-assisted creativity
                in a supportive environment.
              </p>
            </div>

            {/* Illustrators */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                Illustrators
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Train AI models on your signature style and discover new
                creative possibilities.
              </p>
            </div>

            {/* Designers */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                  <polyline points="7.5 19.79 7.5 14.6 3 12" />
                  <polyline points="21 12 16.5 14.6 16.5 19.79" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900">
                Designers
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Experiment with AI tools to accelerate ideation and expand your
                design toolkit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How ArtEcho AI Works Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-zinc-400">
              How ArtEcho AI works
            </p>
            <h2 className="text-glow mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
              Adopt &rarr; Upload Art &rarr; Watch your AI grow
            </h2>
            <p className="text-glow mt-3 text-center max-w-2xl text-sm text-zinc-500 md:text-base">
              We turn your everyday doodles into a playful growth journey so you
              can see how an AI model might learn from your creative process.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Adopt your AI kid */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12h.01M15 12h.01" />
                  <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                  <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5.5 5 1.5" />
                  <path d="M19 6.3V4a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Adopt your AI kid
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Give your AI kid a name and a personality. It starts at
                Kindergarten level, wide-eyed and ready to learn from your art.
              </p>
            </div>

            {/* Upload drawings & process */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Upload drawings &amp; process
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Share your sketches, finished pieces, or short process clips.
                Each upload becomes a training puzzle piece for future AI
                fine-tuning.
              </p>
            </div>

            {/* Watch levels unlock */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                Watch levels unlock
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Track progress from Kindergarten doodles to High School concepts
                with clear levels, fun messages, and a future-ready training
                pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Start Your Journey Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Start Your Journey
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Pick a lesson and begin creating. Your AI companion evolves with
            every stroke.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Lesson 1: Basic Shapes — geometric shapes icon */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <path d="M17 3l4 7h-8l4-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">
                Lesson 1: Basic Shapes
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Learn to see the world through simple geometric forms.
              </p>
            </div>

            {/* Lesson 2: Light & Shadow — sun/moon icon */}
            <div
              className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center"
              style={{ opacity: 0.7 }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">
                Lesson 2: Light &amp; Shadow
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Bring depth and dimension to your drawings.
              </p>
            </div>

            {/* Lesson 3: Composition — layout/grid icon */}
            <div
              className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm p-6 text-center"
              style={{ opacity: 0.45 }}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">
                Lesson 3: Composition
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Arrange elements to create visual harmony.
              </p>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/learn"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              View All Lessons
            </Link>
          </div>
        </div>
      </section>

      {/* Train Your AI Style Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Train Your AI Style
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Create custom AI models that understand your unique artistic voice.
            Upload your work and watch your style come to life.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Watercolor Dreams */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div
                className="relative h-44 w-full"
                style={{
                  background:
                    "linear-gradient(135deg, #e0f2fe, #bae6fd, #a5b4fc, #c4b5fd)",
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full opacity-30"
                  viewBox="0 0 200 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="50" cy="60" r="45" fill="#7dd3fc" opacity="0.5" />
                  <circle
                    cx="120"
                    cy="50"
                    r="35"
                    fill="#c4b5fd"
                    opacity="0.4"
                  />
                  <circle
                    cx="90"
                    cy="100"
                    r="50"
                    fill="#a5b4fc"
                    opacity="0.3"
                  />
                  <circle
                    cx="160"
                    cy="90"
                    r="30"
                    fill="#93c5fd"
                    opacity="0.4"
                  />
                  <circle
                    cx="30"
                    cy="120"
                    r="25"
                    fill="#e0e7ff"
                    opacity="0.5"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Watercolor Dreams
                  </h3>
                  <span className="rounded-full bg-teal-400 px-3 py-0.5 text-xs font-bold text-white">
                    Master
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Soft gradients and flowing colors inspired by traditional
                  watercolor techniques.
                </p>
              </div>
            </div>

            {/* Bold Linework */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div
                className="relative h-44 w-full"
                style={{
                  background:
                    "linear-gradient(135deg, #f5f5f4, #e7e5e4, #d6d3d1)",
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 200 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="30"
                    y1="30"
                    x2="170"
                    y2="30"
                    stroke="#44403c"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="40"
                    y1="55"
                    x2="160"
                    y2="55"
                    stroke="#57534e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M50 80 Q100 40 150 80 Q130 120 100 100 Q70 120 50 80Z"
                    stroke="#44403c"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <line
                    x1="60"
                    y1="110"
                    x2="140"
                    y2="110"
                    stroke="#78716c"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="70"
                    y1="130"
                    x2="130"
                    y2="130"
                    stroke="#a8a29e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Bold Linework
                  </h3>
                  <span className="rounded-full bg-zinc-200 px-3 py-0.5 text-xs font-semibold text-zinc-600">
                    Apprentice
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Clean, confident strokes with emphasis on form and silhouette.
                </p>
              </div>
            </div>

            {/* Digital Realism */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div
                className="relative h-44 w-full"
                style={{
                  background:
                    "linear-gradient(135deg, #fef3c7, #fde68a, #fbbf24, #f59e0b)",
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full opacity-60"
                  viewBox="0 0 200 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="30"
                    y="20"
                    width="60"
                    height="80"
                    rx="4"
                    fill="#ffffff"
                    opacity="0.3"
                  />
                  <rect
                    x="35"
                    y="25"
                    width="50"
                    height="35"
                    rx="2"
                    fill="#78350f"
                    opacity="0.15"
                  />
                  <circle cx="60" cy="42" r="8" fill="#fbbf24" opacity="0.4" />
                  <path
                    d="M35 50 L50 40 L65 48 L85 30 L85 60 L35 60Z"
                    fill="#92400e"
                    opacity="0.15"
                  />
                  <circle
                    cx="140"
                    cy="60"
                    r="30"
                    fill="#ffffff"
                    opacity="0.2"
                  />
                  <circle
                    cx="140"
                    cy="60"
                    r="20"
                    fill="#fbbf24"
                    opacity="0.3"
                  />
                  <line
                    x1="140"
                    y1="35"
                    x2="140"
                    y2="25"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  <line
                    x1="140"
                    y1="85"
                    x2="140"
                    y2="95"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  <line
                    x1="115"
                    y1="60"
                    x2="105"
                    y2="60"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  <line
                    x1="165"
                    y1="60"
                    x2="175"
                    y2="60"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Digital Realism
                  </h3>
                  <span className="rounded-full bg-zinc-200 px-3 py-0.5 text-xs font-semibold text-zinc-600">
                    Advanced
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Photorealistic rendering with attention to lighting and
                  texture details.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/train-ai"
              className="inline-flex h-11 items-center justify-center rounded-full bg-teal-400 px-8 text-sm font-bold text-white transition hover:bg-teal-500"
            >
              Start Training Your AI
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Dashboard Preview Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-glow text-sm text-zinc-400 italic">
              Built with future admin tools in mind
            </p>
            <h2 className="text-glow mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
              Monitor progress across your creative community
            </h2>
            <p className="text-glow mx-auto mt-4 max-w-3xl text-sm text-zinc-500 leading-7">
              An admin-only dashboard (using role flags on user accounts) will help
              you understand how people use ArtEcho, even before advanced analytics
              come online.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
                title: "User & AI kid overview",
                desc: "See a list of users with their AI kid levels and progress percentages so you can spot who is just starting and who is nearing High School mastery.",
                bullets: [
                  "Email, sign-up date, and AI kid level per user",
                  "Derived levels based on progress ranges (0\u2013100%)",
                  "Helps you design challenges tailored to skill tiers",
                ],
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                ),
                title: "Training uploads at a glance",
                desc: "Browse a table of all uploads across users to see what kinds of art people are feeding into their AI kids.",
                bullets: [
                  "File types labeled as Image, Video, or Other",
                  "Quick links to previews and timestamps",
                  "Spot trends to inspire new prompts and lessons",
                ],
              },
              {
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                ),
                title: "Training jobs & marketplace lens",
                desc: "Follow how creators experiment with pretend training jobs and marketplace listings so you can prioritize future AI integrations.",
                bullets: [
                  "Statuses like Pending, Ready, or Completed for each job",
                  "Marketplace listings with level and status badges",
                  "Admin controls to adjust job status for demos",
                ],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-zinc-200/60 p-6"
              >
                <div className="flex items-center gap-2 text-amber-600 mb-3">
                  {card.icon}
                  <h3 className="text-base font-semibold text-zinc-900">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {card.desc}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {card.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed"
                    >
                      <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA bar */}
          <div className="mt-14 rounded-2xl border border-zinc-200/60 bg-zinc-50/40 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 md:text-2xl">
                Ready to raise your first AI kid?
              </h3>
              <p className="mt-2 max-w-md text-sm text-zinc-500 leading-relaxed">
                ArtEcho makes the journey from your sketchbook to future AI
                models feel playful, transparent, and deeply yours. Start with a
                Kindergarten-level robot today and grow alongside it.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full bg-amber-500 px-8 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Sign up free
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-8 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Log in to continue
              </Link>
              <Link
                href="/about"
                className="text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                Learn more about how ArtEcho works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Plan Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-7xl w-[75%]">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Choose Your Plan
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Start basic and upgrade as you grow. Every plan gives you access to
            the full Learn &rarr; Teach &rarr; Test &rarr; Notify loop.
          </p>

          <div
            className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
            onMouseLeave={() => setActivePlan(Math.min(2, plans.length - 1))}
          >
            {plans.map((plan, idx) => {
              const isActive = activePlan === idx;
              return (
                <div
                  key={`${plan.tier}-${plan.name}`}
                  className={`flex flex-col justify-between rounded-2xl backdrop-blur-sm p-6 transition-all duration-300 ${
                    isActive
                      ? "border-2 border-teal-400 bg-white/60 shadow-lg scale-[1.03]"
                      : "border border-zinc-200/70 bg-white/60 scale-100"
                  }`}
                  onMouseEnter={() => setActivePlan(idx)}
                >
                  <div>
                    {/* <div
                      className={`mb-3 flex justify-center transition-all duration-300 overflow-hidden ${
                        isActive ? "max-h-10 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <span className="inline-block rounded-full bg-teal-400 px-4 py-1 text-xs font-bold text-white">
                        Most Popular
                      </span>
                    </div> */}
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-zinc-900">
                      {plan.price}
                      <span className="text-sm font-normal text-zinc-500">
                        {plan.period ? ` ${plan.period}` : plan.price === "$0" ? " forever" : " /month"}
                      </span>
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {(Array.isArray(plan.features) ? plan.features : []).map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-xs text-zinc-600"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-400 text-white">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className={`mt-6 h-10 w-full rounded-full text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-teal-400 font-bold text-white hover:bg-teal-500"
                        : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                    }`}
                  >
                    {plan.cta || "Select Plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Future Ecosystem Preview Section */}
      <section className="relative z-10 w-full py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-glow text-center text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
            Future Ecosystem Preview
          </h2>
          <p className="text-glow mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-500 md:text-base">
            Coming soon: A marketplace for trained AI models and physical
            filming robots. Here&apos;s a sneak peek at what&apos;s on the
            horizon.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1 — full opacity */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm overflow-hidden">
              <div className="relative">
                <div className="h-48 w-full bg-linear-to-br from-zinc-100 to-zinc-200" />
                <div className="absolute top-3 left-3 right-3 rounded-lg bg-zinc-600 py-1.5 text-center text-xs font-semibold text-white">
                  Coming Soon
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-zinc-300 px-3 py-0.5 text-xs font-medium text-zinc-600">
                    AI Model
                  </span>
                  <span className="text-sm font-bold text-teal-500">$98</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                  Anime Style Pro
                </h3>
                <p className="mt-1.5 text-sm text-zinc-500">
                  A professionally trained anime style model with vibrant colors
                  and expressive characters.
                </p>
                <button
                  type="button"
                  className="mt-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  View / Buy (Mock)
                </button>
              </div>
            </div>

            {/* Card 2 — faded */}
            <div className="rounded-2xl border border-zinc-200/70 bg-white/60 backdrop-blur-sm overflow-hidden opacity-50">
              <div className="relative">
                <div className="h-48 w-full bg-linear-to-br from-zinc-100 to-zinc-200" />
                <div className="absolute top-3 left-3 right-3 rounded-lg bg-zinc-400 py-1.5 text-center text-xs font-semibold text-white">
                  Coming Soon
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-zinc-300 px-3 py-0.5 text-xs font-medium text-zinc-500">
                    AI Model
                  </span>
                  <span className="text-sm font-bold text-teal-400">$98</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-700">
                  Portrait Sketch AI
                </h3>
                <p className="mt-1.5 text-sm text-zinc-400">
                  Realistic pencil portrait generation trained on classical
                  drawing techniques.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-4 h-10 w-full rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-400 cursor-not-allowed"
                >
                  View / Buy (Mock)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/marketplace"
              className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story & Vision Section */}
      <section className="relative z-10 w-full py-24 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-glow text-2xl font-bold italic tracking-tight text-zinc-800 md:text-3xl">
            Our Story &amp; Vision
          </h2>
          <p className="text-glow mx-auto mt-6 max-w-xl text-sm text-zinc-500 leading-7 md:text-base">
            ArtEcho was born from a simple belief: AI should empower artists,
            not replace them. We&apos;re building a platform where learning and
            teaching go hand in hand&mdash;a space for growth,
            experimentation, and creative collaboration between humans and AI.
          </p>
          <p className="text-glow mx-auto mt-5 max-w-xl text-sm text-zinc-500 leading-7 md:text-base">
            Our mission is to make AI art education approachable, supportive,
            and fun for students, illustrators, and designers everywhere.
          </p>
          <div className="mt-8">
            <Link
              href="/about"
              className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Read Our Full Story
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
