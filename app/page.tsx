"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NODES = [
  { id: "user", x: 44, y: 85, label: "User", sub: "request" },
  { id: "lb", x: 148, y: 85, label: "Load Bal", sub: "round-robin" },
  { id: "svc1", x: 260, y: 44, label: "Service A", sub: "worker" },
  { id: "svc2", x: 260, y: 126, label: "Service B", sub: "worker" },
  { id: "cache", x: 372, y: 44, label: "Cache", sub: "redis" },
  { id: "db", x: 372, y: 126, label: "Database", sub: "postgres" },
];

const EDGES = [
  { from: "user", to: "lb" },
  { from: "lb", to: "svc1" },
  { from: "lb", to: "svc2" },
  { from: "svc1", to: "cache" },
  { from: "svc1", to: "db" },
  { from: "svc2", to: "cache" },
  { from: "svc2", to: "db" },
];

const NW = 74, NH = 30;

function center(id: string) {
  const n = NODES.find((n) => n.id === id)!;
  return { x: n.x + NW / 2, y: n.y + NH / 2 };
}

const PROMPTS = [
  "How would you scale this to 10M users?",
  "What happens if the API layer fails?",
  "How are you handling cache invalidation?",
  "Where are the single points of failure?",
];

function SystemFlowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ edge: 0, t: 0, hovered: null as string | null });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 480, H = 185;
    canvas.width = W; canvas.height = H;

    function drawNode(n: (typeof NODES)[0], active: boolean, hov: boolean) {
      ctx.beginPath();
      ctx.roundRect(n.x, n.y, NW, NH, 6);
      ctx.fillStyle = hov ? "rgba(59,130,246,0.16)" : active ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.03)";
      ctx.fill();
      ctx.strokeStyle = active || hov ? "rgba(59,130,246,0.45)" : "rgba(255,255,255,0.08)";
      ctx.lineWidth = active || hov ? 1 : 0.8;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.font = "500 10px 'DM Mono',monospace";
      ctx.fillStyle = active || hov ? "#93c5fd" : "#64748b";
      ctx.fillText(n.label, n.x + NW / 2, n.y + 12);
      ctx.font = "400 8px 'DM Mono',monospace";
      ctx.fillStyle = active ? "#3b82f6" : "#1e3a5f";
      ctx.fillText(n.sub, n.x + NW / 2, n.y + 23);
    }

    function drawEdge(e: (typeof EDGES)[0], active: boolean) {
      const f = center(e.from), t = center(e.to);
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)";
      ctx.lineWidth = active ? 1.2 : 0.7;
      ctx.stroke();
    }

    function drawParticle(e: (typeof EDGES)[0], pt: number) {
      const f = center(e.from), t = center(e.to);
      const x = f.x + (t.x - f.x) * pt, y = f.y + (t.y - f.y) * pt;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59,130,246,0.22)"; ctx.fill();
    }

    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const { edge, t, hovered } = state.current;
      const active = new Set([EDGES[edge].from, EDGES[edge].to]);
      EDGES.forEach((e, i) => drawEdge(e, i === edge));
      NODES.forEach((n) => drawNode(n, active.has(n.id), n.id === hovered));
      drawParticle(EDGES[edge], t);
      state.current.t = (t + 0.018) % 1;
      raf = requestAnimationFrame(draw);
    }
    draw();

    const iv = setInterval(() => { state.current.edge = (state.current.edge + 1) % EDGES.length; state.current.t = 0; }, 1400);

    const onMove = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const mx = (ev.clientX - r.left) * (W / r.width);
      const my = (ev.clientY - r.top) * (H / r.height);
      state.current.hovered = NODES.find((n) => mx >= n.x && mx <= n.x + NW && my >= n.y && my <= n.y + NH)?.id ?? null;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", () => (state.current.hovered = null));
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: "auto", display: "block" }} />;
}

function WorkspacePreview() {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setShow(false);
      setTimeout(() => { setIdx((i) => (i + 1) % PROMPTS.length); setShow(true); }, 220);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      style={{ background: "#0b0f1a", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", boxShadow: "0 28px 80px rgba(0,0,0,0.55)" }}
    >
      {/* chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
        {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.65 }} />
        ))}
        <div style={{ flex: 1, height: 20, borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 8px" }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#94a3b8" }}>scalelab.app / interview / scale-10m</span>
        </div>
      </div>

      {/* canvas */}
      <div style={{ padding: "20px 24px 14px" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: "#1e3a5f", textTransform: "uppercase", marginBottom: 16 }}>
          Live system · URL shortener at scale
        </div>
        <SystemFlowCanvas />
      </div>

      {/* prompt bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "11px 20px", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)", flexShrink: 0 }} />
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#2d3f55" }}>AI:</span>
        <motion.span key={idx} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.2 }}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748b" }}>
          {PROMPTS[idx]}
        </motion.span>
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
          style={{ display: "inline-block", width: 2, height: 11, background: "#3b82f6", marginLeft: 2, flexShrink: 0 }} />
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#07090f", color: "#f1f5f9", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box}
        .btn-p{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 20px;border-radius:8px;background:#3b82f6;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;border:none;cursor:pointer;text-decoration:none;transition:background .15s,transform .12s}
        .btn-p:hover{background:#2563eb;transform:translateY(-1px)}
        .btn-g{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 20px;border-radius:8px;background:transparent;color:#64748b;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,0.09);cursor:pointer;text-decoration:none;transition:all .15s}
        .btn-g:hover{border-color:rgba(255,255,255,0.18);color:#94a3b8;transform:translateY(-1px)}
        .pill{padding:10px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.012);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#94a3b8;display:flex;align-items:center;gap:10px;transition:border-color .2s,color .2s}
        .pill:hover{border-color:rgba(59,130,246,0.28);color:#cbd5e1}
        .pill::before{content:'';display:block;width:3px;height:3px;border-radius:50%;background:#3b82f6;flex-shrink:0}
      `}</style>

      {/* bg */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div style={{ position: "absolute", top: "-18%", right: "-6%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,.065) 0%,transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>

        {/* hero */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 56, alignItems: "center", paddingTop: 72, paddingBottom: 68 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(139,92,246,0.22)", background: "rgba(139,92,246,0.07)", marginBottom: 26 }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa" }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: "0.1em", color: "#c4b5fd", textTransform: "uppercase" }}>Interview Simulator</span>
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(40px,4.8vw,56px)", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-.035em", color: "#f1f5f9", margin: "0 0 5px" }}>Think Like a Systems Engineer.</h1>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(40px,4.8vw,56px)", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-.035em", color: "#64748b", margin: "0 0 28px" }}>Not a LeetCode Solver.</h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, lineHeight: 1.75, color: "#94a3b8", maxWidth: 400, margin: "0 0 32px" }}>
              Break problems into requirements, scale, APIs, and architecture. Get real-time feedback on tradeoffs — like an actual interview.
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
              <Link href="/problems" className="btn-p" style={{ backgroundColor: "#8b5cf6" }}>Start Interview <ArrowRight style={{ width: 12, height: 12 }} /></Link>
              <Link href="/problems" className="btn-g">Explore Problems <ArrowUpRight style={{ width: 12, height: 12 }} /></Link>
            </div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.06em" }}>Try instantly. Sign up to save sessions and track progress.</span>
          </motion.div>
          <WorkspacePreview />
        </section>

        {/* truth */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "64px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: "#a78bfa", textTransform: "uppercase", marginBottom: 18 }}>What Interviews Actually Test</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-.025em", color: "#f1f5f9", margin: 0 }}>
              It's about tradeoffs,<br />not just drawing boxes.
            </h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#94a3b8", marginTop: 12, lineHeight: 1.7 }}>
              Most prep tools give you static diagrams.<br />This puts you under pressure.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["What breaks under scale", "Where latency really comes from", "Tradeoffs between consistency and speed", "How real systems evolve"].map((t) => (
              <div key={t} className="pill" style={{ color: "#cbd5e1" }}>{t}</div>
            ))}
          </div>
        </section>

        {/* cta */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "80px 0 96px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
          <div aria-hidden style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 480, height: 150, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(139,92,246,0.055) 0%,transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.03em", color: "#f1f5f9", margin: "0 0 4px" }}>Most Engineers Memorize Diagrams.</h2>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(30px,4vw,48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.03em", color: "#64748b", margin: "0 0 22px" }}>Few Can Design Systems Under Pressure.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: "#94a3b8", marginBottom: 36 }}>Start a real system design interview and learn how to reason through scale, APIs, databases, and tradeoffs.</p>
          <Link href="/problems" className="btn-p" style={{ backgroundColor: "#8b5cf6", height: 44, fontSize: 14, padding: "0 28px" }}>
            Start Interview <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.05em", color: "#64748b", marginTop: 20 }}>Try instantly. Sign up when you want to save progress.</span>
        </section>

      </div>
    </main>
  );
}