"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  Monitor,
  Database,
  Layers,
  MessageSquare,
  Activity,
  Zap
} from "lucide-react";

// ─── Features ────────────────────────────────────────────────────────────────
const features = [
  {
    icon: Cpu,
    title: "AI-Generated Architectures",
    description:
      "Your answers drive a real architecture — not a template. The AI builds the diagram from what you say in the interview.",
    color: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/15",
    glow: "hover:shadow-purple-500/10",
  },
  {
    icon: GitBranch,
    title: "Interactive System Diagrams",
    description:
      "Click any node to inspect its role, scaling risks, and the tradeoffs you'd defend in a FAANG interview.",
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/15",
    glow: "hover:shadow-blue-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Bottleneck Analysis",
    description:
      "Automatically surfaces single points of failure, write contention, and cache-invalidation risks in your design.",
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/15",
    glow: "hover:shadow-amber-500/10",
  },
  {
    icon: TrendingUp,
    title: "Scaling Recommendations",
    description:
      "Actionable advice on read replicas, sharding, async workers, and horizontal scaling — tailored to your design.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/15",
    glow: "hover:shadow-emerald-500/10",
  },
];

// ─── Live Flow Nodes ───────────────────────────────────────────────────────
const flowNodes = [
  { id: "client",  label: "Client",        icon: Monitor,       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  { id: "gateway", label: "WS Gateway",    icon: Activity,      color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "chat",    label: "Chat Service",  icon: MessageSquare, color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30" },
  { id: "kafka",   label: "Kafka",         icon: Layers,        color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", insight: "bottleneck" },
  { id: "db",      label: "Database",      icon: Database,      color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  insight: "scaling" },
];

function LiveFlowStrip() {
  const [activeNode, setActiveNode] = useState(0);

  // Cycle the packet through the nodes
  useEffect(() => {
    const t = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % flowNodes.length);
    }, 1500); // Packet moves every 1.5s
    return () => clearInterval(t);
  }, []);

  const currentInsight = flowNodes[activeNode]?.insight;

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">
      <div className="inline-flex items-center gap-2 mb-8">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">Live Example: Real-Time Chat System</span>
      </div>

      {/* The Strip */}
      <div className="relative w-full overflow-x-auto md:overflow-visible pb-4 hide-scrollbar">
        <div className="flex items-center justify-center min-w-max md:min-w-0">
          {flowNodes.map((node, i) => {
            const Icon = node.icon;
            const isTarget = activeNode === i;
            
            return (
              <div key={node.id} className="flex items-center shrink-0">
                {/* Node Pill */}
                <div
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-full border 
                    transition-all duration-300
                    ${isTarget ? `${node.bg} ${node.border} scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)]` : "bg-gray-900/30 border-gray-800/60 opacity-60"}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isTarget ? node.color : "text-gray-500"}`} />
                  <span className={`text-[12px] font-semibold whitespace-nowrap ${isTarget ? node.color : "text-gray-400"}`}>
                    {node.label}
                  </span>

                  {/* Packet visual (only shows when this node is active) */}
                  {isTarget && (
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_1s_ease-in-out_infinite]" />
                  )}
                </div>

                {/* Connector */}
                {i < flowNodes.length - 1 && (
                  <div className="flex items-center w-8 md:w-12 shrink-0 relative overflow-hidden h-4 mx-1">
                    {/* Background track */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-px bg-gray-800" />
                    </div>
                    {/* The traveling packet (only travels forward to the NEXT node) */}
                    {activeNode === i && (
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-4 h-1.5 rounded-full bg-white shadow-[0_0_10px_white] animate-[slideRight_1.5s_linear_forwards]" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(300%); opacity: 0; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Insights Row */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
        {/* Bottleneck Card */}
        <div className={`
          flex-1 w-full sm:max-w-[280px] lg:max-w-[280px] p-4 rounded-2xl border transition-all duration-500
          ${currentInsight === "bottleneck" ? "bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] -translate-y-1" : "bg-gray-900/20 border-gray-800/40 opacity-50"}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${currentInsight === "bottleneck" ? "text-red-400" : "text-gray-600"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${currentInsight === "bottleneck" ? "text-red-400" : "text-gray-600"}`}>Bottleneck</span>
          </div>
          <p className={`text-[12px] leading-relaxed ${currentInsight === "bottleneck" ? "text-gray-200" : "text-gray-500"}`}>
            Massive message fan-out creates contention at peak traffic.
          </p>
        </div>

        {/* Tradeoff Card */}
        <div className={`
          flex-1 w-full sm:max-w-[280px] lg:max-w-[280px] p-4 rounded-2xl border transition-all duration-500
          ${currentInsight === "tradeoff" ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] -translate-y-1" : "bg-gray-900/20 border-gray-800/40 opacity-50"}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className={`w-3.5 h-3.5 ${currentInsight === "tradeoff" ? "text-blue-400" : "text-gray-600"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${currentInsight === "tradeoff" ? "text-blue-400" : "text-gray-600"}`}>Tradeoff</span>
          </div>
          <p className={`text-[12px] leading-relaxed ${currentInsight === "tradeoff" ? "text-gray-200" : "text-gray-500"}`}>
            Guaranteed delivery via Kafka adds slight latency vs memory queues.
          </p>
        </div>

        {/* Scaling Card */}
        <div className={`
          flex-1 w-full sm:max-w-[280px] lg:max-w-[280px] p-4 rounded-2xl border transition-all duration-500
          ${currentInsight === "scaling" ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] -translate-y-1" : "bg-gray-900/20 border-gray-800/40 opacity-50"}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-3.5 h-3.5 ${currentInsight === "scaling" ? "text-emerald-400" : "text-gray-600"}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${currentInsight === "scaling" ? "text-emerald-400" : "text-gray-600"}`}>Scaling</span>
          </div>
          <p className={`text-[12px] leading-relaxed ${currentInsight === "scaling" ? "text-gray-200" : "text-gray-500"}`}>
            Partition Kafka by chat room and async archive old messages.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* ─── CENTERED HERO ─── */}
      <section id="hero" className="relative max-w-[1400px] mx-auto px-6 md:px-10 pt-28 pb-16 flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center">
          <div className="absolute top-0 w-[800px] h-[500px] bg-purple-600/8 blur-[160px] rounded-full" />
          <div className="absolute top-40 w-[600px] h-[400px] bg-blue-600/6 blur-[140px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-full border border-purple-500/20 bg-purple-500/6 text-purple-400 text-[11px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            AI-Powered System Design
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-extrabold tracking-tight leading-[1.1] mb-6">
            Practice System Design
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              With AI Feedback
            </span>
          </h1>

          <p className="text-gray-400 text-[17px] leading-relaxed mb-10 max-w-2xl">
            Answer interview questions, get a real architecture diagram, see your bottlenecks, and receive a final score — all powered by AI in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 w-full px-4">
            <a
              href="/problems"
              className="w-full sm:w-auto group inline-flex justify-center items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold text-[15px] transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/35 hover:scale-[1.03] active:scale-[0.97]"
            >
              Start Practicing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-7 py-4 rounded-2xl border border-gray-700/60 bg-gray-900/40 text-gray-300 hover:text-white hover:border-gray-600 text-[14px] font-semibold transition-all hover:scale-[1.02]"
            >
              <ChevronDown className="w-4 h-4" />
              View Demo
            </a>
          </div>
        </div>

        {/* ── LIVE FLOW STRIP ── */}
        <div id="preview" className="relative z-10 w-full pt-10">
          <LiveFlowStrip />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-24">
        <div className="mb-14 text-center">
          <p className="text-purple-400 text-[11px] font-bold tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to ace system design</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group p-8 rounded-2xl border ${f.border} ${f.bg} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${f.glow} cursor-default`}
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
              <p className="text-gray-400 text-[14px] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="text-center px-6 py-20 pb-32">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to practice?</h2>
          <p className="text-gray-400 mb-8 leading-relaxed text-lg">
            Pick a system design problem and get AI-powered feedback in minutes.
          </p>
          <a
            href="/problems"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold text-[16px] transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.03] active:scale-[0.97]"
          >
            Browse Challenges
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>
    </main>
  );
}