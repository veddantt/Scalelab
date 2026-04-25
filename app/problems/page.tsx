"use client";

import { useState, useMemo } from "react";
import { scenarios } from "../../lib/scenarios";
import {
  Clock,
  ArrowRight,
  Search,
  Link2,
  MessageCircle,
  Truck,
  ShieldCheck,
  HardDrive,
  Bell,
  Zap,
  Filter,
  Globe,
} from "lucide-react";

const iconMap: Record<string, any> = {
  "url-shortener": Link2,
  "real-time-chat": MessageCircle,
  "food-delivery": Truck,
  "rate-limiter": ShieldCheck,
  "file-storage": HardDrive,
  "notification-system": Bell,
};

const difficultyGlow: Record<string, string> = {
  Beginner: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
  Intermediate: "hover:border-blue-500/40 hover:shadow-blue-500/10",
  Advanced: "hover:border-red-500/40 hover:shadow-red-500/10",
};

const difficultyBadge: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Problems", href: "/problems" },
  { label: "Interview", href: "#" },
  { label: "Architecture", href: "#" },
  { label: "Review", href: "#" },
];

type DifficultyFilter = "All" | "Beginner" | "Intermediate" | "Advanced";
type SortBy = "default" | "time-asc" | "time-desc" | "difficulty";

export default function ProblemsPage() {
  const [filter, setFilter] = useState<DifficultyFilter>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortBy>("default");

  const filtered = useMemo(() => {
    let list = scenarios.filter((s) => {
      if (filter !== "All" && s.difficulty !== filter) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
    if (sort === "time-asc") list = [...list].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    if (sort === "time-desc") list = [...list].sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
    if (sort === "difficulty") {
      const order = { Beginner: 0, Intermediate: 1, Advanced: 2 };
      list = [...list].sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    }
    return list;
  }, [filter, search, sort]);

  return (
    <main className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-purple-500/8 blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold tracking-wide">ScaleLab</span>
          </a>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`text-[13px] font-medium transition ${
                  label === "Problems"
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-24 relative z-10">
        {/* ─── Page Header ─── */}
        <div className="mb-10">
          <p className="text-purple-400 font-semibold tracking-wider uppercase text-xs mb-3">
            Scenario Library
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose a{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Challenge
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Select a system design problem to start your AI-powered mock
            interview. Each scenario generates a unique architecture and analysis.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "6 Scenarios", icon: Filter },
              { label: "3 Difficulty Levels", icon: Globe },
              { label: "AI Powered", icon: Zap },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 text-[13px] text-gray-300"
              >
                <Icon className="w-3.5 h-3.5 text-purple-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Filters + Search ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(["All", "Beginner", "Intermediate", "Advanced"] as const).map(
              (d) => (
                <button
                  key={d}
                  onClick={() => setFilter(d)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition ${
                    filter === d
                      ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                      : "bg-gray-900/40 border-gray-800/50 text-gray-500 hover:text-gray-300 hover:border-gray-700"
                  }`}
                >
                  {d === "All" ? "All Scenarios" : d}
                </button>
              )
            )}
          </div>

          {/* Search + sort */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scenarios..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortBy)}
              className="px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 text-[12px] text-gray-400 focus:outline-none focus:border-purple-500/40 transition appearance-none cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="time-asc">Time ↑</option>
              <option value="time-desc">Time ↓</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
        </div>

        {/* ─── Cards Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((scenario) => {
            const Icon = iconMap[scenario.id] || Link2;
            return (
              <a
                key={scenario.id}
                href={`/interview/${scenario.id}`}
                className={`group flex flex-col p-7 rounded-2xl border border-gray-800/60 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-xl ${difficultyGlow[scenario.difficulty]}`}
              >
                {/* Icon + Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-800/60 border border-gray-700/40 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[scenario.difficulty]}`}>
                    {scenario.difficulty}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-2">
                  {scenario.title}
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-[13px] leading-relaxed mb-4 flex-1">
                  {scenario.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {scenario.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/60 text-gray-500 border border-gray-700/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Real-world examples */}
                <div className="px-3 py-2 rounded-lg bg-gray-900/50 border border-gray-800/40 mb-4">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider font-bold">Real-world</span>
                  <p className="text-[12px] text-gray-400 mt-0.5">{scenario.examples.join(" · ")}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/40">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    ~{scenario.estimatedMinutes} min
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 group-hover:text-purple-400 transition-colors">
                    Start Interview
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No scenarios match your filters.</p>
            <button onClick={() => { setFilter("All"); setSearch(""); }} className="mt-3 text-purple-400 text-sm hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* ─── Bottom helper banner ─── */}
        <div className="mt-12 p-5 rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-[13px] text-gray-400">
            <span className="text-white font-semibold">Not sure where to start?</span>{" "}
            Try a Beginner level problem to get familiar with the flow. Each interview adapts to your answers in real time.
          </p>
        </div>
      </div>
    </main>
  );
}