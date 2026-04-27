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
  CheckCircle2,
  Play,
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

const difficultyDot: Record<string, string> = {
  Beginner:     "bg-emerald-400",
  Intermediate: "bg-blue-400",
  Advanced:     "bg-violet-400",
};

type DifficultyFilter = "All" | "Beginner" | "Intermediate" | "Advanced";

// ─── Problem Detail Content ───────────────────────────────────────────────────
function ProblemDetailContent({ meta, onStart, onTryDemo }: { meta: ProblemMeta; onStart: () => void; onTryDemo: () => void }) {
  const { problem, requirements, practiceSkills, archPreview } = meta;
  const Icon = iconMap[problem.id] ?? Link2;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shrink-0">
          <Icon className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">{problem.title}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${difficultyBadge[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Estimated time: ~{problem.estimatedMinutes}m</span>
          </div>
        </div>
      </div>
      
      <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-3xl">
        {problem.description}
      </p>

      {/* ── Architecture preview ── */}
      <section className="mb-14">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4">Architecture Preview</h3>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden shadow-inner">
          <MiniArchPreview nodes={archPreview.nodes} edges={archPreview.edges} compact />
        </div>
      </section>

      {/* ── Requirements + Practice ── */}
      <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-5">Key Requirements</h3>
          <ul className="space-y-3.5">
            {requirements.map((r) => (
              <li key={r} className="flex items-start gap-3 text-[13.5px] text-gray-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-purple-500/50 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-5">What You&apos;ll Practice</h3>
          <div className="flex flex-wrap gap-2.5">
            {practiceSkills.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-gray-300 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={onStart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[14px] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-500/20"
        >
          Start Interview
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={onTryDemo}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 text-gray-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Demo
        </button>
      </section>
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

  // Filtered + searched list for the explorer sidebar
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
    <div className="flex flex-col min-h-screen bg-[#020617] text-white">
      <Navbar />

      {/* Main App Workspace */}
      <div className="flex flex-1 flex-col md:flex-row border-t border-slate-800/50">
        
        {/* ─── LEFT SIDEBAR (Challenge List) ─── */}
        <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col bg-[#020617] z-10 md:sticky md:top-0 md:h-[calc(100vh)]">
          
          {/* Sidebar Header (Sticky) */}
          <div className="p-5 border-b border-slate-800/60 space-y-4 shrink-0 bg-[#020617]">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-2.5">
              <span className={`text-[13px] font-semibold transition-colors ${!isPracticeMode ? "text-white" : "text-gray-500"}`}>Interview</span>
              <button 
                onClick={() => setIsPracticeMode(!isPracticeMode)}
                className="w-11 h-6 bg-slate-800 rounded-full relative transition-colors focus:outline-none"
              >
                <div className={`w-4 h-4 rounded-full bg-purple-500 absolute top-1 transition-transform ${isPracticeMode ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className={`text-[13px] font-semibold transition-colors ${isPracticeMode ? "text-purple-400" : "text-gray-500"}`}>Practice</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    filter === d
                      ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                      : "bg-transparent border-slate-800/60 text-gray-500 hover:text-gray-300 hover:bg-slate-800/40"
                  }`}
                >
                  {d === "All" ? "All" : d}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-10">No challenges found.</p>
            ) : (
              filtered.map((meta) => {
                const { problem } = meta;
                const Icon = iconMap[problem.id] ?? Link2;
                const isSelected = problem.id === selectedId;
                
                return (
                  <button
                    key={problem.id}
                    onClick={() => setSelectedId(problem.id)}
                    className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                      isSelected
                        ? "bg-purple-500/5 border-purple-500/20 shadow-sm"
                        : "bg-transparent border-transparent hover:bg-slate-900/40"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                    )}
                    
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                      isSelected ? "bg-purple-500/20" : "bg-slate-800/50"
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors ${
                        isSelected ? "text-purple-300" : "text-gray-400"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold leading-snug mb-1 truncate transition-colors ${
                        isSelected ? "text-white" : "text-gray-300 group-hover:text-gray-100"
                      }`}>
                        {problem.title}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot[problem.difficulty]}`} />
                          {problem.difficulty}
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className="text-[11px] text-gray-500">{problem.estimatedMinutes}m</span>
                      </div>

                      <div className="flex gap-1.5 overflow-hidden">
                        {problem.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-gray-500 border border-slate-700/40 whitespace-nowrap">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT MAIN CONTENT (Full Page Details) ─── */}
        <div className="flex-1 bg-[#020617] relative">
          {/* Subtle background glow for the workspace */}
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 py-10 md:py-16 md:px-12 relative z-10">
            <ProblemDetailContent
              meta={selectedMeta}
              onStart={() => handleStartInterview(selectedMeta.problem.id)}
              onTryDemo={() => handleTryDemo(selectedMeta.problem.id)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}