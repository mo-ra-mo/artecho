"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const AI_MODELS = [
  {
    id: 1,
    name: "Watercolor Dreams",
    level: "Journeyman",
    desc: "A delicate watercolor style perfect for botanical illustrations and soft landscapes",
    price: 29,
  },
  {
    id: 2,
    name: "Ink Noir",
    level: "Apprentice",
    desc: "Bold ink strokes and dramatic contrast for noir-inspired compositions",
    price: 19,
  },
  {
    id: 3,
    name: "Pastel Bloom",
    level: "Journeyman",
    desc: "Soft pastel textures blending color theory with gentle gradients",
    price: 34,
  },
  {
    id: 4,
    name: "Charcoal Sketch",
    level: "Apprentice",
    desc: "Raw charcoal aesthetics capturing the essence of quick gesture drawing",
    price: 15,
  },
  {
    id: 5,
    name: "Digital Realism",
    level: "Master",
    desc: "Hyper-realistic digital painting style trained on classical art techniques",
    price: 49,
  },
  {
    id: 6,
    name: "Abstract Linework",
    level: "Journeyman",
    desc: "Minimalist line art with abstract compositions and clean geometry",
    price: 24,
  },
];

const FILMING_ROBOTS = [
  {
    id: 1,
    name: "SketchBot Mini",
    level: "Starter",
    desc: "A compact filming robot for quick timelapse recordings of your drawing sessions",
    price: 59,
  },
  {
    id: 2,
    name: "ArtLens Pro",
    level: "Pro",
    desc: "Overhead camera rig with AI-guided tracking for detailed art process capture",
    price: 129,
  },
  {
    id: 3,
    name: "StudioArm 360",
    level: "Pro",
    desc: "Multi-angle robotic arm that captures your artwork from every perspective",
    price: 199,
  },
];

const CATEGORIES = {
  ai: ["All Categories", "Watercolor", "Ink", "Pastel", "Charcoal", "Digital", "Abstract"],
  robots: ["All Categories", "Compact", "Overhead", "Multi-angle"],
};

const LEVELS = {
  ai: ["All Levels", "Apprentice", "Journeyman", "Master"],
  robots: ["All Levels", "Starter", "Pro"],
};

const PRICES = ["All Prices", "Under $20", "$20 - $40", "Over $40"];

export default function MarketplacePage() {
  const [tab, setTab] = useState("ai");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [level, setLevel] = useState("All Levels");
  const [price, setPrice] = useState("All Prices");

  const items = tab === "ai" ? AI_MODELS : FILMING_ROBOTS;

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (level !== "All Levels" && item.level !== level) return false;
    if (price === "Under $20" && item.price >= 20) return false;
    if (price === "$20 - $40" && (item.price < 20 || item.price > 40))
      return false;
    if (price === "Over $40" && item.price <= 40) return false;
    return true;
  });

  const resetFilters = () => {
    setSearch("");
    setCategory("All Categories");
    setLevel("All Levels");
    setPrice("All Prices");
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar activePage="/marketplace" />
      <div className="h-16" />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Coming Soon Banner */}
        <div className="mb-8 rounded-3xl border-2 border-zinc-900 bg-linear-to-r from-amber-200 via-orange-200 to-yellow-200 p-5 sm:p-8 shadow-[4px_4px_0_rgba(0,0,0,0.85)] sm:shadow-[6px_6px_0_rgba(0,0,0,0.85)]">
          <p className="text-center text-[34px] font-black uppercase leading-none tracking-tight text-zinc-900 sm:text-[56px] md:text-[72px]" style={{ fontFamily: "'Comic Sans MS', 'Bangers', cursive" }}>
            Coming Soon
          </p>
          <p className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 sm:text-sm">
            Marketplace Is Under Construction
          </p>
        </div>

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-2xl font-bold italic tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
            Marketplace
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 md:text-base">
            Discover curated AI style models and playful filming robots to
            enhance your creative workflow
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex gap-6 border-b border-zinc-200">
          <button
            type="button"
            onClick={() => { setTab("ai"); resetFilters(); }}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              tab === "ai"
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            AI Models
          </button>
          <button
            type="button"
            onClick={() => { setTab("robots"); resetFilters(); }}
            className={`pb-3 text-sm font-semibold transition cursor-pointer ${
              tab === "robots"
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Filming Robots
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-9 w-full sm:w-44 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600 outline-none placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                {CATEGORIES[tab].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                {LEVELS[tab].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Price Range
              </label>
              <select
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 outline-none"
              >
                {PRICES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="inline-flex h-9 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          {/* Product grid */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">
              {tab === "ai" ? "AI Style Models" : "Filming Robots"}
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-zinc-200 bg-white overflow-hidden transition hover:shadow-md"
                >
                  <div className="h-40 w-full bg-zinc-100" />
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-700">
                      {item.name}
                    </h3>
                    <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
                      {item.level}
                    </span>
                    <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                      {item.desc}
                    </p>
                    <p className="mt-3 text-lg font-bold text-slate-800">
                      ${item.price}
                    </p>
                    <p className="text-[10px] text-zinc-400 cursor-pointer hover:underline">
                      Learn more
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex h-8 items-center rounded-lg bg-teal-600 px-4 text-xs font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
                    >
                      Add to Library
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden w-64 shrink-0 lg:block">
            {/* My Library */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-bold text-slate-700">My Library</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Items you&apos;ve added to your collection
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-200">
                  <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Abstract Linework
                  </p>
                  <p className="text-[10px] text-zinc-400">AI Model</p>
                </div>
              </div>
            </div>

            {/* Licensing */}
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-bold text-slate-700">
                Licensing Information
              </h3>
              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                All purchases in this marketplace are demo/mock transactions for
                preview purposes. No actual payment processing is integrated in
                this version. Full licensing details will be available upon
                official release.
              </p>
            </div>
          </div>
        </div>
        {/* How the Marketplace Works */}
        <div className="mt-16 mb-6">
          <h2 className="text-center text-xl font-bold text-slate-800">
            How the Marketplace Works
          </h2>

          <div className="mt-6 space-y-4">
            {/* AI Style Models */}
            <div className="rounded-2xl border border-zinc-200 bg-white py-6 px-4 sm:py-10 sm:px-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center">
                <svg className="w-7 h-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94L6.73 20.15a2.12 2.12 0 01-3-3l6.68-6.68a6 6 0 017.94-7.94L14.7 6.3z" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-700">
                AI Style Models
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500 leading-relaxed">
                In the future, these trained AI models can be licensed or used
                within SchoolKids AI to apply unique artistic styles to your
                work. Imagine generating art in the style of your favorite
                artist or blending multiple styles together.
              </p>
            </div>

            {/* Filming Robots */}
            <div className="rounded-2xl border border-zinc-200 bg-white py-6 px-4 sm:py-10 sm:px-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center">
                <svg className="w-7 h-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3h-2a2 2 0 00-2 2v2h6V5a2 2 0 00-2-2z" />
                  <circle cx="8" cy="14" r="2" />
                  <circle cx="16" cy="14" r="2" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-700">
                Filming Robots
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500 leading-relaxed">
                Lego-style filming robots can capture your drawing process from
                overhead, making it easy to create timelapse videos and training
                data for your AI models. Perfect for artists who want to
                document their creative journey.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
