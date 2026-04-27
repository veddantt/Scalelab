"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { problemMeta } from "@/lib/problems";
import { getSession, saveSession } from "@/lib/sessionStorage";
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
  Zap,
  Users,
  Database,
  Globe,
  Settings2,
  Cpu,
  Layers,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "url-shortener": Link2,
  "real-time-chat": MessageCircle,
  "food-delivery": Truck,
  "rate-limiter": ShieldCheck,
  "file-storage": HardDrive,
  "notification-system": Bell,
  "search-autocomplete": Search,
  "distributed-job-scheduler": Activity,
  "video-streaming-platform": Layers,
};

const difficultyBadge: Record<string, string> = {
  Beginner:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Intermediate: "bg-[#6366F1]/10    text-blue-400    border-[#6366F1]/25",
  Advanced:     "bg-amber-500/10  text-amber-400   border-amber-500/25",
};

const difficultyDot: Record<string, string> = {
  Beginner:     "bg-emerald-400",
  Intermediate: "bg-blue-400",
  Advanced:     "bg-amber-400",
};

export default function ProblemsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(problemMeta[0].problem.id);
  const [isPracticeMode, setIsPracticeMode] = useState(true);

  const filtered = useMemo(() => {
    return problemMeta.filter((m) => {
      if (filter !== "All" && m.problem.difficulty !== filter) return false;
      const q = search.toLowerCase();
      if (q && !m.problem.title.toLowerCase().includes(q) && !m.problem.tags.some((t) => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [filter, search]);

  const selectedMeta = problemMeta.find((m) => m.problem.id === selectedId) ?? problemMeta[0];

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
    }
    router.push(`/interview/${id}`);
  };

  return (
    <div className="flex h-[calc(100vh-58px)] bg-[#070B14] text-[#E2E8F0] overflow-hidden">
      
      {/* ── LEFT: Challenge Explorer ── */}
      <aside className="w-[320px] border-r border-[#1E293B] bg-[#070B14] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#1E293B] space-y-4 shrink-0">
          <div className="flex items-center justify-between bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-2">
            <span className={`text-[12px] font-bold transition-colors ${!isPracticeMode ? "text-white" : "text-[#94A3B8]"}`}>Interview</span>
            <button 
              onClick={() => setIsPracticeMode(!isPracticeMode)}
              className="w-10 h-5 bg-[#1E293B] rounded-full relative transition-colors"
            >
              <div className={`w-3 h-3 rounded-full bg-[#6366F1] absolute top-1 transition-transform ${isPracticeMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className={`text-[12px] font-bold transition-colors ${isPracticeMode ? "text-[#6366F1]" : "text-[#94A3B8]"}`}>Practice</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search systems..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] text-[13px] text-[#E2E8F0] outline-none focus:border-[#6366F1]/50 transition-all"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {["All", "Beginner", "Intermediate", "Advanced"].map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  filter === d ? "bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1]" : "bg-transparent border-[#1E293B] text-[#94A3B8] hover:border-[#94A3B8]/30"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-[#070B14]">
          {filtered.map((m) => {
            const Icon = iconMap[m.problem.id] ?? Link2;
            const isSelected = m.problem.id === selectedId;
            return (
              <button
                key={m.problem.id}
                onClick={() => setSelectedId(m.problem.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all relative group ${
                  isSelected ? "bg-[#0F172A] border-[#1E293B] shadow-sm" : "bg-transparent border-transparent hover:bg-[#0F172A]/40"
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#1E293B] text-[#6366F1]" : "bg-[#0F172A] text-[#94A3B8]"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[13px] font-bold mb-0.5 truncate ${isSelected ? "text-white" : "text-[#E2E8F0]"}`}>{m.problem.title}</div>
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${difficultyDot[m.problem.difficulty]}`} />
                       <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{m.problem.difficulty}</span>
                    </div>
                  </div>
                </div>
                {isSelected && <motion.div layoutId="activeChallenge" className="absolute left-0 top-3 bottom-3 w-1 bg-[#6366F1] rounded-full" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── CENTER: Details ── */}
      <section className="flex-1 flex flex-col bg-[#070B14] overflow-y-auto custom-scrollbar border-r border-[#1E293B]">
        <div className="p-8 md:p-12 max-w-4xl mx-auto w-full">
           <div className="flex items-center gap-4 mb-8">
              <div className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${difficultyBadge[selectedMeta.problem.difficulty]}`}>
                {selectedMeta.problem.difficulty}
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                ~{selectedMeta.problem.estimatedMinutes} Mins
              </div>
           </div>

           <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">{selectedMeta.problem.title}</h1>
           <p className="text-lg text-[#94A3B8] leading-relaxed mb-12">{selectedMeta.problem.description}</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div>
                 <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-6 border-b border-[#1E293B] pb-2">Core Requirements</h3>
                 <div className="space-y-4">
                    {selectedMeta.requirements.map((r, i) => (
                      <div key={i} className="flex gap-3 text-[14px] text-[#E2E8F0]">
                        <CheckCircle2 className="w-4 h-4 text-[#94A3B8]/40 shrink-0 mt-0.5" />
                        {r}
                      </div>
                    ))}
                 </div>
              </div>
              <div>
                 <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-6 border-b border-[#1E293B] pb-2">Architecture Preview</h3>
                 <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] overflow-hidden p-4">
                    <MiniArchPreview nodes={selectedMeta.archPreview.nodes} edges={selectedMeta.archPreview.edges} compact />
                 </div>
              </div>
           </div>

           <div className="p-10 rounded-3xl bg-[#0F172A] border border-[#1E293B] relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6366F1]/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                 <h2 className="text-2xl font-bold text-white mb-3">Begin Simulation</h2>
                 <p className="text-[#94A3B8] mb-8 max-w-md">Practice designing the {selectedMeta.problem.title} and receive real-time feedback on your tradeoffs.</p>
                 <button 
                  onClick={() => handleStartInterview(selectedMeta.problem.id)}
                  className="px-8 py-4 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center gap-2 shadow-lg shadow-[#6366F1]/20"
                 >
                    Start Interview
                    <ArrowRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
      </section>

      {/* ── RIGHT: Metadata ── */}
      <aside className="w-[320px] bg-[#070B14] shrink-0 h-full min-h-0 overflow-hidden">
         <div className="h-full min-h-0 overflow-y-auto p-6 pb-12 custom-scrollbar space-y-8">
            <div className="space-y-6">
               <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4 border-b border-[#1E293B] pb-2">System Profile</h3>
               
               <div className="space-y-3">
                 {[
                   { icon: Users, label: "Scale", val: selectedMeta.systemProfile.users },
                   { icon: Zap, label: "Throughput", val: selectedMeta.systemProfile.qps },
                   { icon: Globe, label: "Latency", val: selectedMeta.systemProfile.latency },
                   { icon: Database, label: "Storage", val: selectedMeta.systemProfile.storage },
                   { icon: Cpu, label: "System Type", val: selectedMeta.systemProfile.type }
                 ].map((stat) => (
                   <div key={stat.label} className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <div className="flex items-center gap-2 mb-1.5">
                         <stat.icon className="w-3.5 h-3.5 text-[#94A3B8]" />
                         <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className="text-[14px] font-bold text-[#E2E8F0]">{stat.val}</div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-4 border-b border-[#1E293B] pb-2">Recommended Stack</h3>
               <div className="flex flex-wrap gap-2">
                  {["Redis", "Kafka", "PostgreSQL", "Cassandra", "gRPC"].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[11px] text-[#E2E8F0] font-bold hover:border-[#6366F1]/40 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
               </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F172A] border-l-2 border-l-[#6366F1] border border-[#1E293B]">
               <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-[#94A3B8]" />
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Interview Mode</span>
               </div>
               <p className="text-[11px] text-[#94A3B8] leading-relaxed italic">
                 "Senior level evaluation. Focus on data consistency and partitioning."
               </p>
            </div>
         </div>
      </aside>

    </div>
  );
}