"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { problemMeta } from "@/lib/problems";
import type { ProblemMeta } from "@/lib/problems";
import { getSession, saveSession } from "@/lib/sessionStorage";
import Navbar from "@/components/Navbar";
import MiniArchPreview from "@/components/MiniArchPreview";
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
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Play,
  Star,
  Database,
  GitBranch,
  Scale,
  Workflow,
  Video,
  Calendar,
} from "lucide-react";

// ─── Static maps ──────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "url-shortener": Link2,
  "real-time-chat": MessageCircle,
  "food-delivery": Truck,
  "rate-limiter": ShieldCheck,
  "file-storage": HardDrive,
  "notification-system": Bell,
  "search-autocomplete": Search,
  "distributed-job-scheduler": Calendar,
  "video-streaming-platform": Video,
};

const difficultyBadge: Record<string, string> = {
  Beginner:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Intermediate: "bg-blue-500/10    text-blue-400    border-blue-500/25",
  Advanced:     "bg-violet-500/10  text-violet-400  border-violet-500/25",
};

const difficultyGlow: Record<string, string> = {
  Beginner:     "hover:border-emerald-500/30 hover:shadow-emerald-500/10",
  Intermediate: "hover:border-blue-500/30    hover:shadow-blue-500/10",
  Advanced:     "hover:border-red-500/30     hover:shadow-red-500/10",
};

const difficultyDot: Record<string, string> = {
  Beginner:     "bg-emerald-400",
  Intermediate: "bg-blue-400",
  Advanced:     "bg-red-400",
};

type DifficultyFilter = "All" | "Beginner" | "Intermediate" | "Advanced";

// ─── Featured problem (real-time-chat) ────────────────────────────────────────
const FEATURED_ID = "real-time-chat";

// ─── Problem Detail Panel ─────────────────────────────────────────────────────
function ProblemDetailPanel({ meta, onStart, onTryDemo }: { meta: ProblemMeta; onStart: () => void; onTryDemo: () => void }) {
  const { problem, requirements, practiceSkills, archPreview } = meta;
  const Icon = iconMap[problem.id] ?? Link2;

  return (
    <div className="flex flex-col w-full">

      {/* ── Header ── */}
      <div className="p-8 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Clock className="w-3 h-3" />
              ~{problem.estimatedMinutes}m
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 leading-snug">{problem.title}</h2>
        <p className="text-gray-400 text-[13.5px] leading-relaxed">{problem.description}</p>
      </div>

      {/* ── Architecture preview — full width ── */}
      <div className="px-8 pb-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Architecture Preview</p>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/50 overflow-hidden">
          <MiniArchPreview nodes={archPreview.nodes} edges={archPreview.edges} compact />
        </div>
      </div>

      {/* ── Requirements + Practice — side-by-side on md+ ── */}
      <div className="px-8 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key requirements */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Key Requirements</p>
          <ul className="space-y-2.5">
            {requirements.slice(0, 5).map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[12.5px] text-gray-400 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500/50 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Practice skills */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">What You&apos;ll Practice</p>
          <div className="flex flex-wrap gap-2">
            {practiceSkills.slice(0, 6).map((s) => (
              <span key={s} className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/8 border border-purple-500/15 text-purple-300/80 font-medium">
                {s}
              </span>
            ))}
          </div>
          {/* Muted real-world row */}
          <p className="text-[11px] text-gray-600 mt-4">
            Real-world: <span className="text-gray-500">{problem.examples.join(" · ")}</span>
          </p>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="px-8 pb-8 pt-2 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-[13px] transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] group"
          >
            Start Interview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onTryDemo}
            className="hidden sm:flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-700/60 bg-slate-900/60 text-gray-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/5 text-[12px] font-semibold transition-all shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Demo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProblemsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<DifficultyFilter>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(problemMeta[0].problem.id);
  const [isPracticeMode, setIsPracticeMode] = useState(true);

  // Featured entry
  const featured = problemMeta.find((m) => m.problem.id === FEATURED_ID) ?? problemMeta[0];

  // Filtered + searched list for the explorer and grid
  const filtered = useMemo(() => {
    return problemMeta.filter((m) => {
      if (filter !== "All" && m.problem.difficulty !== filter) return false;
      const q = search.toLowerCase();
      if (q && !m.problem.title.toLowerCase().includes(q) && !m.problem.tags.some((t) => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [filter, search]);

  const selectedMeta = problemMeta.find((m) => m.problem.id === selectedId) ?? problemMeta[0];

  const handleTryDemo = (id: string) => {
    const existing = getSession(id);
    if (!existing?.architecture?.nodes?.length) {
      fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: problemMeta.find(m => m.problem.id === id)?.problem.title || id, messages: [], architectureStyle: "high-level" }),
      }).then(r => r.json()).then(data => {
        const session = existing || { id, problem: problemMeta.find(m => m.problem.id === id)?.problem.title || id, messages: [], scores: { clarity: 0, depth: 0, correctness: 0 }, currentStep: 0, createdAt: new Date().toISOString() };
        session.architecture = { nodes: data.nodes, edges: data.edges, summary: data.summary, score: data.score, bottlenecks: data.bottlenecks, tradeoffs: data.tradeoffs, scalingRecommendations: data.scalingRecommendations, isFallback: data.isFallback };
        saveSession(session);
        router.push(`/architecture/${id}`);
      }).catch(() => router.push(`/interview/${id}`));
    } else {
      router.push(`/architecture/${id}`);
    }
  };

  const handleStartInterview = (id: string) => {
    let session = getSession(id);
    if (!session) {
      session = {
        id,
        problem: problemMeta.find((m) => m.problem.id === id)?.problem.title || id,
        messages: [],
        scores: { clarity: 0, depth: 0, correctness: 0 },
        currentStep: 0,
        createdAt: new Date().toISOString(),
        attemptNumber: 1,
        practiceMode: isPracticeMode,
      };
      saveSession(session);
    } else if (session.messages.length === 0) {
      session.practiceMode = isPracticeMode;
      saveSession(session);
    }
    router.push(`/interview/${id}`);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-purple-600/6 blur-[160px] rounded-full" />
        <div className="absolute top-[50vh] -left-32 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-[30vh] right-0 w-[400px] h-[400px] bg-indigo-600/4 blur-[120px] rounded-full" />
      </div>

      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-24 relative z-10">

        {/* ═══════════════════════════════════════
            HERO
        ═══════════════════════════════════════ */}
        <div className="mb-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-purple-400/80 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
              <Layers className="w-3 h-3" />
              System Design Studio
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-3">
            Explore{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                System Design
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-transparent" />
            </span>
            {" "}Challenges
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Practice real-world architectures with AI feedback. Each interview adapts to your answers.
          </p>
        </div>

        {/* ═══════════════════════════════════════
            BEGINNER BANNER
        ═══════════════════════════════════════ */}
        <div className="mb-10 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/8 to-transparent border border-emerald-500/20 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-gray-300">
              <span className="font-semibold text-white">New to system design?</span>{" "}
              Start with the URL Shortener — it covers the fundamentals in ~25 minutes.
            </p>
          </div>
          <button
            onClick={() => handleStartInterview("url-shortener")}
            className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/25 transition-all whitespace-nowrap"
          >
            Start →
          </button>
        </div>

        {/* ═══════════════════════════════════════
            FEATURED CARD
        ═══════════════════════════════════════ */}
        <section className="mb-10">
          <p className="text-[11px] uppercase tracking-widest text-gray-600 font-bold mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-700" />
            Featured Challenge
            <span className="flex-1 h-px bg-gray-800/60" />
          </p>

          <div className="relative group rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#0d1230]/80 via-[#080d1e]/90 to-[#020617]/80 backdrop-blur-xl overflow-hidden shadow-2xl hover:border-purple-500/35 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-purple-500/10">
            {/* Glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/15 transition-all duration-700" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/8 blur-[60px] rounded-full pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[featured.problem.difficulty]}`}>
                    {featured.problem.difficulty}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                  {featured.problem.title}
                </h2>
                <p className="text-gray-400 text-[14px] leading-relaxed mb-5">
                  {featured.problem.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {featured.problem.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-800/60 text-gray-400 border border-gray-700/50">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-7">
                  {featured.problem.examples.map((e) => (
                    <span key={e} className="text-[12px] px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 text-gray-300 font-medium">
                      {e}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    onClick={() => handleStartInterview(featured.problem.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-[13px] transition-all shadow-lg shadow-purple-500/25 hover:scale-[1.03] active:scale-[0.97] group/btn"
                  >
                    Start Interview
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleTryDemo(featured.problem.id)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-700/50 bg-gray-900/40 text-gray-400 hover:text-white hover:border-purple-500/30 text-[12px] font-semibold transition-all hover:scale-[1.03] active:scale-[0.97]"
                  >
                    <Play className="w-3.5 h-3.5" /> Try Demo
                  </button>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    ~{featured.problem.estimatedMinutes}m
                  </div>
                </div>
              </div>

              {/* Right — architecture preview */}
              <div className="hidden md:flex flex-col justify-center p-8 border-l border-gray-800/40">
                <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-5">Architecture Overview</p>
                <div className="bg-black/30 rounded-2xl border border-gray-800/40 p-4">
                  <MiniArchPreview nodes={featured.archPreview.nodes} edges={featured.archPreview.edges} />
                </div>
                <div className="mt-5 space-y-2">
                  {featured.requirements.slice(0, 3).map((r) => (
                    <div key={r} className="flex items-start gap-2 text-[12px] text-gray-500">
                      <ChevronRight className="w-3.5 h-3.5 text-purple-500/50 shrink-0 mt-0.5" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FILTERS + SEARCH + MODE
        ═══════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                  filter === d
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                    : "bg-gray-900/40 border-gray-800/50 text-gray-500 hover:text-gray-300 hover:border-gray-700"
                }`}
              >
                {d !== "All" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot[d]}`} />
                )}
                {d === "All" ? "All Challenges" : d}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            {/* Mode Toggle */}
            <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800/50 rounded-xl px-4 py-2 shrink-0">
              <span className={`text-[12px] font-semibold transition-colors ${!isPracticeMode ? "text-white" : "text-gray-500"}`}>Interview</span>
              <button 
                onClick={() => setIsPracticeMode(!isPracticeMode)}
                className="w-10 h-5 bg-gray-800 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <div className={`w-4 h-4 rounded-full bg-purple-400 absolute top-0.5 transition-transform ${isPracticeMode ? "translate-x-5" : "translate-x-1"}`} />
              </button>
              <span className={`text-[12px] font-semibold transition-colors ${isPracticeMode ? "text-purple-400" : "text-gray-500"}`}>Practice</span>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition"
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            INTERACTIVE EXPLORER
        ═══════════════════════════════════════ */}
        <section className="mb-16">
          <p className="text-[11px] uppercase tracking-widest text-gray-600 font-bold mb-5 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-700" />
            Interactive Explorer
            <span className="flex-1 h-px bg-gray-800/60" />
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-gray-800/40 rounded-2xl bg-gray-900/20">
              <p className="text-gray-500 text-sm mb-3">No challenges match your filters.</p>
              <button
                onClick={() => { setFilter("All"); setSearch(""); }}
                className="text-purple-400 text-sm hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* ── Left: problem list ── */}
              <div className="w-full lg:w-[260px] shrink-0 flex flex-col gap-1">
                {filtered.map((meta) => {
                  const { problem } = meta;
                  const Icon = iconMap[problem.id] ?? Link2;
                  const isSelected = problem.id === selectedId;
                  return (
                    <div key={problem.id} className="flex flex-col">
                      <button
                        onClick={() => setSelectedId(problem.id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 group/item ${
                          isSelected
                            ? "bg-purple-500/10 border-purple-500/25"
                            : "bg-transparent border-transparent hover:bg-slate-900/60 hover:border-slate-800/60"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-purple-500/20" : "bg-slate-800/60"
                        }`}>
                          <Icon className={`w-4 h-4 transition-colors ${
                            isSelected ? "text-purple-300" : "text-gray-500 group-hover/item:text-gray-400"
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-[12.5px] font-semibold leading-snug transition-colors ${
                            isSelected ? "text-white" : "text-gray-400 group-hover/item:text-gray-200"
                          }`}>
                            {problem.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${difficultyDot[problem.difficulty]}`} />
                            <span className="text-[11px] text-gray-600">{problem.difficulty} · ~{problem.estimatedMinutes}m</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-1 h-6 rounded-full bg-purple-500 shrink-0" />
                        )}
                      </button>

                      {/* Mobile inline expansion */}
                      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${
                        isSelected ? "mt-2 max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                      }`}>
                        <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/15 mx-1">
                          <p className="text-[12px] text-gray-400 leading-relaxed mb-3">{problem.description}</p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {problem.tags.map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-gray-500 border border-slate-700/40">{t}</span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleStartInterview(problem.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-[12px] shadow-lg shadow-purple-500/20">
                              Start Interview
                            </button>
                            <button onClick={() => handleTryDemo(problem.id)} className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-gray-300 text-[12px] font-semibold">
                              Demo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Right: detail panel (Desktop Only) ── */}
              <div
                className="hidden lg:block flex-1 relative rounded-2xl border border-slate-800/60 bg-slate-950/70 backdrop-blur-xl transition-all duration-300"
                key={selectedMeta.problem.id}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent rounded-t-2xl" />
                <ProblemDetailPanel
                  meta={selectedMeta}
                  onStart={() => router.push(`/interview/${selectedMeta.problem.id}`)}
                  onTryDemo={() => handleTryDemo(selectedMeta.problem.id)}
                />
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════
            BROWSE GRID (compact) — existing problems
        ═══════════════════════════════════════ */}
        <section className="mb-14">
          <p className="text-[11px] uppercase tracking-widest text-gray-600 font-bold mb-5 flex items-center gap-2">
            <span className="w-4 h-px bg-gray-700" />
            Browse All
            <span className="flex-1 h-px bg-gray-800/60" />
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {problemMeta.filter((m) => m.problem.difficulty !== "Advanced" || ["rate-limiter"].includes(m.problem.id)).map(({ problem }) => {
              const Icon = iconMap[problem.id] ?? Link2;
              return (
                <button
                  key={problem.id}
                  onClick={() => handleStartInterview(problem.id)}
                  className={`group h-full flex flex-col p-5 rounded-2xl border border-slate-800/70 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl text-left ${difficultyGlow[problem.difficulty]}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  <h3 className="text-[13.5px] font-semibold text-white group-hover:text-purple-300 transition-colors mb-1.5 leading-snug">
                    {problem.title}
                  </h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed mb-4 line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {problem.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-gray-500 border border-slate-700/40">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Clock className="w-3 h-3" />
                      ~{problem.estimatedMinutes}m
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 group-hover:text-purple-400 transition-colors">
                      Start
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            ADVANCED CHALLENGES SECTION
        ═══════════════════════════════════════ */}
        <section className="mb-14">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-4 h-px bg-amber-800/60" />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-amber-500/70 font-bold">Advanced Challenges</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Deep-dive problems requiring broader system thinking</p>
            </div>
            <span className="flex-1 h-px bg-gray-800/60" />
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-500/8 text-amber-400/80 border-amber-500/20 shrink-0">
              ~45–50 min
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {problemMeta.filter((m) => ["search-autocomplete", "distributed-job-scheduler", "video-streaming-platform"].includes(m.problem.id)).map(({ problem }) => {
              const Icon = iconMap[problem.id] ?? Link2;
              return (
                <button
                  key={problem.id}
                  onClick={() => handleStartInterview(problem.id)}
                  className="group h-full flex flex-col p-5 rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-900/80 to-slate-950/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/25 text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-900/15 border border-amber-800/25 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-400/80" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  <h3 className="text-[13.5px] font-semibold text-white group-hover:text-amber-200 transition-colors mb-1.5 leading-snug">
                    {problem.title}
                  </h3>
                  <p className="text-gray-500 text-[12px] leading-relaxed mb-4 line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {problem.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-gray-500 border border-slate-700/40">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Clock className="w-3 h-3" />
                      ~{problem.estimatedMinutes}m
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 group-hover:text-amber-400 transition-colors">
                      Start
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            BOTTOM STATS
        ═══════════════════════════════════════ */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { value: `${problemMeta.length}`, label: "Challenges", icon: Layers },
            { value: "AI", label: "Feedback Engine", icon: Zap },
            { value: "3", label: "Difficulty Levels", icon: CheckCircle2 },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-5 rounded-2xl border border-slate-800/60 bg-slate-950/40 backdrop-blur-sm text-center">
              <Icon className="w-4 h-4 text-purple-400/80 mb-1" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}