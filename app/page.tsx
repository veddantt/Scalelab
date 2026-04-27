"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Play, X, CheckCircle2, AlertCircle, Terminal, Cpu, Globe, Database } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NODES = [
  { id: "client", x: 40, y: 85, label: "Client", sub: "request" },
  { id: "cdn", x: 130, y: 85, label: "CDN", sub: "edge" },
  { id: "api", x: 220, y: 85, label: "API", sub: "gateway" },
  { id: "svc", x: 310, y: 85, label: "Services", sub: "worker" },
  { id: "db", x: 400, y: 85, label: "Database", sub: "postgres" },
];

const EDGES = [
  { from: "client", to: "cdn" },
  { from: "cdn", to: "api" },
  { from: "api", to: "svc" },
  { from: "svc", to: "db" },
];

const NW = 70, NH = 32;

function center(id: string) {
  const n = NODES.find((n) => n.id === id)!;
  return { x: n.x + NW / 2, y: n.y + NH / 2 };
}

function SystemFlowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ edge: 0, t: 0, hovered: null as string | null });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 500, H = 200;
    canvas.width = W; canvas.height = H;

    function drawNode(n: (typeof NODES)[0], active: boolean, hov: boolean) {
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, NW, NH, 8);
      ctx.fillStyle = hov ? "rgba(59,130,246,0.1)" : active ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)";
      ctx.fill();
      ctx.strokeStyle = active || hov ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)";
      ctx.lineWidth = active || hov ? 1.2 : 0.8;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.fillStyle = active || hov ? "#6366F1" : "#64748b";
      ctx.fillText(n.label, n.x + NW / 2, n.y + 13);
      ctx.font = "400 8px 'Inter', sans-serif";
      ctx.fillStyle = active ? "#6366F1" : "#334155";
      ctx.fillText(n.sub, n.x + NW / 2, n.y + 24);
    }

    function drawEdge(e: (typeof EDGES)[0], active: boolean) {
      const f = center(e.from), t = center(e.to);
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.03)";
      ctx.lineWidth = active ? 1.5 : 0.8;
      ctx.stroke();
    }

    function drawParticle(e: (typeof EDGES)[0], pt: number) {
      const f = center(e.from), t = center(e.to);
      const x = f.x + (t.x - f.x) * pt, y = f.y + (t.y - f.y) * pt;
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#6366F1"; ctx.fill();
      ctx.shadowBlur = 8; ctx.shadowColor = "#6366F1";
      ctx.fill(); ctx.shadowBlur = 0;
    }

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const { edge, t, hovered } = state.current;
      const active = new Set([EDGES[edge].from, EDGES[edge].to]);
      EDGES.forEach((e, i) => drawEdge(e, i === edge));
      NODES.forEach((n) => drawNode(n, active.has(n.id), n.id === hovered));
      drawParticle(EDGES[edge], t);
      state.current.t = (t + 0.015) % 1;
      raf = requestAnimationFrame(draw);
    }
    draw();

    const iv = setInterval(() => { state.current.edge = (state.current.edge + 1) % EDGES.length; state.current.t = 0; }, 1200);

    const onMove = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = (ev.clientX - r.left) * (W / r.width);
      const my = (ev.clientY - r.top) * (H / r.height);
      state.current.hovered = NODES.find((n) => mx >= n.x && mx <= n.x + NW && my >= n.y && my <= n.y + NH)?.id ?? null;
    };
    canvas.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function WorkspacePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative bg-[#0F172A] rounded-2xl border border-[#1E293B] overflow-hidden shadow-2xl shadow-black/50"
    >
      {/* Chrome Header */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-[#1E293B] bg-white/[0.01]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
        </div>
        <div className="flex-1 px-3 py-1 rounded bg-[#070B14] border border-[#1E293B] text-[10px] text-[#94A3B8] font-mono text-center">
          scalelab.ai / workspace
        </div>
      </div>

      {/* Workspace Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-widest">AI Interviewing...</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] text-[#6366F1] font-mono">
            Step 5: Architecture
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Message */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded bg-[#6366F1] flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[12px] font-medium text-white">How would you scale this to 10M users?</p>
            </div>
          </div>

          {/* Diagram Area */}
          <div className="py-4 bg-[#070B14] rounded-xl border border-dashed border-[#1E293B]">
            <SystemFlowCanvas />
          </div>

          {/* Feedback Indicators */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Good separation
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070B14] border border-[#1E293B] text-[10px] text-[#94A3B8] font-mono italic">
              Sign up to save this session
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const DEMO_STEPS = [
  {
    title: "Phase 1: Requirements",
    ai: "Design a scalable backend system with high read traffic.",
    user: "I'll focus on low latency and eventual consistency for high availability.",
    icon: Globe,
    feedback: "✔ Good focus on availability",
  },
  {
    title: "Phase 2: Scaling Strategy",
    ai: "How would you design this for 10M active users?",
    user: "I’d use a global CDN, API gateway, and horizontally scale stateless services.",
    icon: Cpu,
    feedback: "✔ Strong scaling mental model",
  },
  {
    title: "Phase 3: Architecture Design",
    ai: "What data storage layer would you choose?",
    user: "A distributed NoSQL DB with Redis for caching hot paths.",
    icon: Database,
    feedback: "✔ Correct use of polyglot persistence",
  },
  {
    title: "Phase 4: Feedback & Review",
    ai: "Session Complete. Final Score: 8.5/10",
    user: "Reviewing my tradeoffs and bottleneck analysis...",
    icon: Terminal,
    feedback: "⚠ Missing partitioning strategy; ⚠ Discuss failure cases",
  }
];

function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#070B14] border border-[#1E293B] rounded-3xl overflow-hidden shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors z-10">
          <X className="w-5 h-5 text-[#94A3B8]" />
        </button>

        <div className="p-8 md:p-10">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">How ScaleLab Works</h3>
            <p className="text-[#94A3B8] text-[14px]">Experience a realistic system design interview loop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 flex flex-col gap-3">
              {DEMO_STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all ${
                    step === i 
                      ? "bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1]" 
                      : "bg-[#0F172A]/40 border-[#1E293B] text-[#94A3B8] hover:border-[#94A3B8]/20"
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-1 opacity-60">Step {i + 1}</div>
                  <div className="text-[13px] font-bold">{s.title.split(": ")[1]}</div>
                </button>
              ))}
            </div>

            <div className="md:col-span-8 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 relative min-h-[320px] flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center">
                  {(() => {
                    const Icon = DEMO_STEPS[step].icon;
                    return <Icon className="w-4 h-4 text-[#6366F1]" />;
                  })()}
                </div>
                <h4 className="font-bold text-white text-[15px]">{DEMO_STEPS[step].title}</h4>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-[#6366F1] flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-white fill-white" />
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#E2E8F0]">{DEMO_STEPS[step].ai}</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <p className="text-[13px] leading-relaxed text-[#94A3B8] text-right bg-[#070B14] px-3 py-2 rounded-xl border border-[#1E293B]">
                    {DEMO_STEPS[step].user}
                  </p>
                  <div className="w-5 h-5 rounded bg-[#1E293B] flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1E293B]">
                <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-400">
                  {DEMO_STEPS[step].feedback}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#1E293B] pt-8">
             <div className="text-[#94A3B8] text-[13px] italic font-bold">Ready to try it yourself?</div>
             <div className="flex gap-3">
               <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[#94A3B8] hover:text-white transition-colors text-[14px] font-bold">
                 Cancel
               </button>
               <Link href="/problems" className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-xl font-bold transition-all shadow-[0_4px_15px_rgba(59,130,246,0.2)] text-[14px]">
                 Start Practicing →
               </Link>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#070B14] text-[#E2E8F0] overflow-x-hidden selection:bg-[#6366F1]/30 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center pt-16 pb-24 lg:pt-24 lg:pb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] font-bold text-[#6366F1] uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366F1]"></span>
              </span>
              AI System Design Practice
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
              Think Like a <span className="text-[#6366F1]">Systems Engineer.</span> <br />
              <span className="text-[#94A3B8]">Not a LeetCode Solver.</span>
            </h1>

            <p className="text-lg md:text-xl text-[#94A3B8] leading-relaxed mb-10 max-w-xl">
              Break problems into requirements, scale, APIs, and architecture.
              Get real-time feedback on tradeoffs — like an actual interview.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/problems" className="px-8 py-4 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#6366F1]/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 group">
                Start Interview <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setDemoOpen(true)}
                className="px-8 py-4 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#94A3B8]/20 text-white rounded-2xl font-bold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                See How It Works <Play className="w-4 h-4 fill-white" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[13px] text-[#94A3B8] font-bold italic opacity-60">
              Try instantly. Sign up to save sessions and track progress.
            </div>
          </motion.div>

          <WorkspacePreview />
        </section>

        {/* Feature Highlights */}
        <section className="py-24 border-t border-[#1E293B]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[11px] font-bold text-[#6366F1] uppercase tracking-widest mb-4">The Methodology</div>
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
                Interviews test how you think,<br />not what you memorized.
              </h2>
              <p className="text-[#94A3B8] text-lg leading-relaxed max-w-lg mb-8">
                Most prep tools give you static diagrams to copy. 
                ScaleLab puts you under pressure, forcing you to justify every node and cache layer.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Requirements First", desc: "Define functional and non-functional goals.", icon: Globe },
                { label: "Scale Analysis", desc: "Calculate QPS, storage, and throughput.", icon: Cpu },
                { label: "Deep-Dive APIs", desc: "Design contract and endpoint structures.", icon: Zap },
                { label: "Storage Strategy", desc: "Choose DBs based on CAP theorem.", icon: Database }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#6366F1]/30 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-[#070B14] border border-[#1E293B] flex items-center justify-center mb-4 group-hover:bg-[#6366F1]/10 transition-colors">
                    <item.icon className="w-5 h-5 text-[#94A3B8] group-hover:text-[#6366F1] transition-colors" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{item.label}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statement Section */}
        <section className="py-32 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
              Most Engineers Memorize Diagrams. <br />
              <span className="text-[#1E293B]">Few Can Design Systems Under Pressure.</span>
            </h2>
            <p className="text-xl text-[#94A3B8] mb-12 font-medium">
              This is where you learn to think — not copy. Start your journey into senior engineering.
            </p>
            <Link href="/problems" className="inline-flex items-center gap-2 px-10 py-5 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#6366F1]/30 hover:-translate-y-1 active:scale-95">
              Ready to practice under pressure? →
            </Link>
          </div>
        </section>

        {/* Footer info */}
        <footer className="py-12 border-t border-[#1E293B] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#6366F1] fill-[#6366F1]" />
            <span className="font-bold text-white tracking-tight">ScaleLab</span>
          </div>
          <div className="text-[12px] text-[#94A3B8] font-bold opacity-60">
            © 2026 ScaleLab. The premium system design interview platform.
          </div>
          <div className="flex gap-6">
             <Link href="/problems" className="text-[12px] text-[#94A3B8] hover:text-white transition-colors font-bold uppercase tracking-widest">Challenges</Link>
             <Link href="/problems" className="text-[12px] text-[#94A3B8] hover:text-white transition-colors font-bold uppercase tracking-widest">Practice Mode</Link>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {demoOpen && <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}