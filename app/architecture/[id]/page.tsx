"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, saveSession } from "@/lib/sessionStorage";
import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import ReactFlow, { Background, Controls, MiniMap, Panel, useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { getProblem } from "@/lib/scenarios";
import { nodeTypeConfig, nodeTypes } from "@/features/architecture/components/CustomNode";
import { getLayoutedElements, prepareNodes, prepareEdges } from "@/features/architecture/utils/layout";
import { AlertTriangle, ArrowLeftRight, TrendingUp, Download, RefreshCw, ChevronRight, Sparkles, BarChart3, Info, Loader2, Shield, Zap, Layers } from "lucide-react";
import { toPng } from "html-to-image";

const ARCH_STYLES = [
  { id: "high-level", label: "High-Level", icon: Layers, desc: "Conceptual overview" },
  { id: "scalable-production", label: "Production", icon: Zap, desc: "Load balancers, caches, queues" },
  { id: "highly-available", label: "Highly Available", icon: Shield, desc: "Redundancy & failover" },
];

function ArchitectureInner() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const scenario = getProblem(problemId);
  const problem = scenario?.title || "System Design Problem";
  const flowRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noArchitecture, setNoArchitecture] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [nodeExplanation, setNodeExplanation] = useState<any | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [systemInsights, setSystemInsights] = useState<any | null>(null);
  const [archStyle, setArchStyle] = useState("high-level");
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rightTab, setRightTab] = useState<"overview" | "inspector">("overview");

  const loadFromSession = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const session = getSession(String(problemId));
      if (!session?.architecture?.nodes?.length) {
        setNoArchitecture(true);
        setLoading(false);
        return;
      }
      const prepared = prepareNodes(session.architecture.nodes);
      const styledEdges = prepareEdges(session.architecture.edges);
      const layouted = getLayoutedElements(prepared, styledEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setSystemInsights({
        summary: session.architecture.summary,
        score: session.architecture.score,
        bottlenecks: session.architecture.bottlenecks,
        tradeoffs: session.architecture.tradeoffs,
        scalingRecommendations: session.architecture.scalingRecommendations,
        isFallback: session.architecture.isFallback,
      });
      setNoArchitecture(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load architecture from session.");
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { loadFromSession(); }, [loadFromSession]);

  const handleNodeClick = async (_: any, node: any) => {
    setSelectedNode(node);
    setRightTab("inspector");
    setNodeExplanation(null);
    setExplanationLoading(true);
    const nodeLabel = node.data?.label;
    if (!nodeLabel) { setExplanationLoading(false); return; }
    const session = getSession(String(problemId));
    if (session?.explanations?.[nodeLabel]) {
      setNodeExplanation(session.explanations[nodeLabel]);
      setExplanationLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/node-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, nodeLabel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (session) {
        if (!session.explanations) session.explanations = {};
        session.explanations[nodeLabel] = data;
        saveSession(session);
      }
      setNodeExplanation(data);
    } catch {
      setNodeExplanation({
        title: nodeLabel, role: "Core architectural component",
        responsibilities: ["Handles domain logic", "Processes requests"],
        scalingNotes: ["Can be scaled horizontally"],
        failureRisks: ["Single point of failure if not redundant"],
      });
    } finally { setExplanationLoading(false); }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setSelectedNode(null);
    setNodeExplanation(null);
    try {
      const session = getSession(String(problemId));
      const messages = session?.messages || [];
      const res = await fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, messages, architectureStyle: archStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (session) {
        session.architecture = {
          nodes: data.nodes, edges: data.edges, summary: data.summary,
          score: data.score, bottlenecks: data.bottlenecks,
          tradeoffs: data.tradeoffs, scalingRecommendations: data.scalingRecommendations,
          isFallback: data.isFallback,
        };
        saveSession(session);
      }
      loadFromSession();
    } catch (err) {
      console.error(err);
      alert("Failed to regenerate. Please try again.");
    } finally { setRegenerating(false); }
  };

  const handleExportPNG = async () => {
    if (!flowRef.current) return;
    setExporting(true);
    try {
      const el = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement;
      if (!el) return;
      const png = await toPng(el, { backgroundColor: "#020617", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${problemId}-architecture.png`;
      link.href = png;
      link.click();
    } catch (err) { console.error("Export failed:", err); }
    finally { setExporting(false); }
  };

  const handleGenerateReview = async () => {
    setReviewLoading(true);
    try {
      const session = getSession(String(problemId));
      if (!session) throw new Error("No session");
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, messages: session.messages || [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      session.review = data;
      saveSession(session);
      router.push(`/review/${problemId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate review.");
      setReviewLoading(false);
    }
  };

  /* ─── Empty state ─── */
  if (noArchitecture) {
    return (
      <div className="h-screen flex flex-col bg-[#020617] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">No Architecture Yet</h1>
          <p className="text-gray-400 mb-8 max-w-md">Complete the interview and generate your architecture diagram to see it here.</p>
          <a href={`/interview/${problemId}`} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20">
            Go to Interview
          </a>
        </div>
      </div>
    );
  }

  const scoreColor = (systemInsights?.score ?? 0) >= 80 ? "text-emerald-400" : (systemInsights?.score ?? 0) >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <Navbar />

      {/* ─── Sub-header ─── */}
      <div className="px-6 py-3 border-b border-gray-800/50 bg-black/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1 font-medium tracking-wide">
            <a href="/problems" className="hover:text-white transition">Problems</a>
            <ChevronRight className="w-3 h-3" />
            <a href={`/interview/${problemId}`} className="hover:text-white transition">{problem}</a>
            <ChevronRight className="w-3 h-3" />
            <span className="text-purple-400">Architecture</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">{problem}</h1>
            {systemInsights?.isFallback && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">FALLBACK</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <SaveButton problemId={problemId} />
          {systemInsights?.score != null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/60 border border-gray-800/50">
              <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-400">Score</span>
              <span className={`text-sm font-bold ${scoreColor}`}>{systemInsights.score}</span>
              <span className="text-[10px] text-gray-600">/100</span>
            </div>
          )}
          <button onClick={handleExportPNG} disabled={exporting || loading}
            className="px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40">
            <Download className="w-3.5 h-3.5" />{exporting ? "..." : "PNG"}
          </button>
          <button onClick={handleGenerateReview} disabled={reviewLoading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-60 flex items-center gap-2">
            {reviewLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <>Finish & Review<ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

        {/* ─── Canvas ─── */}
        <div className="flex-1 min-h-[55vh] lg:min-h-0 relative shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800/50" ref={flowRef}>
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500/20 border-t-purple-500" />
                <Sparkles className="w-4 h-4 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-medium">Loading architecture...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="text-red-400 text-center max-w-md p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <p className="font-semibold mb-2">Generation Failed</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
              <button onClick={loadFromSession} className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition">Retry</button>
            </div>
          ) : (
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              fitView fitViewOptions={{ padding: 0.35, maxZoom: 1.2 }}
              proOptions={{ hideAttribution: true }}
              onNodeClick={handleNodeClick}
              onPaneClick={() => { setSelectedNode(null); setRightTab("overview"); }}
              minZoom={0.3} maxZoom={2}
              defaultEdgeOptions={{ type: "default", animated: true }}
            >
              <Background color="#1e293b" gap={28} size={1} />
              <Controls className="!bg-gray-900/90 !border-gray-700/50 !rounded-xl !shadow-xl" showInteractive={false} />
              <MiniMap nodeColor={() => "#334155"} maskColor="rgba(2, 6, 23, 0.85)" className="!bg-gray-900/90 !border-gray-700/50 !rounded-xl !shadow-xl" style={{ width: 140, height: 90 }} />

              {/* ─── Floating style selector ─── */}
              <Panel position="top-left">
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-xl max-w-[280px] sm:max-w-none">
                  {ARCH_STYLES.map((s) => {
                    const SIcon = s.icon;
                    const active = archStyle === s.id;
                    return (
                      <button key={s.id} onClick={() => setArchStyle(s.id)} title={s.desc}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          active ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "text-gray-500 hover:text-gray-300 border border-transparent hover:bg-gray-800/50"
                        }`}>
                        <SIcon className="w-3.5 h-3.5" />{s.label}
                      </button>
                    );
                  })}
                  <button onClick={handleRegenerate} disabled={regenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-all disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />{regenerating ? "..." : "Regenerate"}
                  </button>
                </div>
              </Panel>

              {/* ─── Node count ─── */}
              <Panel position="bottom-left">
                <div className="px-3 py-1.5 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-lg text-[10px] text-gray-500 font-medium">
                  {nodes.length} nodes · {edges.length} edges
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <aside className="w-full lg:w-[380px] shrink-0 bg-[#020617] flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-800/50 shrink-0">
            {([
              { id: "overview" as const, label: "System Overview", icon: BarChart3 },
              { id: "inspector" as const, label: "Inspector", icon: Info },
            ]).map((t) => {
              const TIcon = t.icon;
              return (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold transition-all border-b-2 ${
                    rightTab === t.id ? "text-white border-purple-500 bg-purple-500/5" : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}>
                  <TIcon className="w-3.5 h-3.5" />{t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ─── OVERVIEW TAB ─── */}
            {rightTab === "overview" && systemInsights ? (
              <div className="p-5 space-y-5">
                {/* Score ring */}
                {systemInsights.score != null && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="26" fill="transparent" stroke="#1f2937" strokeWidth="5" />
                        <circle cx="32" cy="32" r="26" fill="transparent" stroke="url(#archScoreGrad)" strokeWidth="5"
                          strokeDasharray="163.4" strokeLinecap="round"
                          strokeDashoffset={163.4 - (163.4 * (systemInsights.score || 0)) / 100}
                          className="transition-all duration-1000" />
                        <defs>
                          <linearGradient id="archScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-lg font-bold ${scoreColor}`}>{systemInsights.score}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white mb-1">Architecture Score</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {(systemInsights.score ?? 0) >= 80 ? "Strong design with solid component choices." : (systemInsights.score ?? 0) >= 60 ? "Good foundation — room for scaling improvements." : "Needs more depth in component selection and failure handling."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {systemInsights.summary && (
                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold mb-2">Summary</h3>
                    <p className="text-[13px] text-gray-300 leading-relaxed">{systemInsights.summary}</p>
                  </div>
                )}

                {/* Bottlenecks */}
                {systemInsights.bottlenecks?.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <h3 className="text-red-400 font-semibold text-xs">Bottlenecks</h3>
                    </div>
                    <ul className="space-y-2">
                      {systemInsights.bottlenecks.map((b: string, i: number) => (
                        <li key={i} className="text-[12px] text-gray-400 pl-3 border-l-2 border-red-500/30 py-0.5 leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tradeoffs */}
                {systemInsights.tradeoffs?.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                      <h3 className="text-blue-400 font-semibold text-xs">Tradeoffs</h3>
                    </div>
                    <ul className="space-y-2">
                      {systemInsights.tradeoffs.map((t: string, i: number) => (
                        <li key={i} className="text-[12px] text-gray-400 pl-3 border-l-2 border-blue-500/30 py-0.5 leading-relaxed">{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Scaling */}
                {systemInsights.scalingRecommendations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-emerald-400 font-semibold text-xs">Scaling Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                      {systemInsights.scalingRecommendations.map((r: string, i: number) => (
                        <li key={i} className="text-[12px] text-gray-400 pl-3 border-l-2 border-emerald-500/30 py-0.5 leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-gray-600 text-[10px] italic pt-2">Click any node to inspect its role and scaling behavior.</p>
              </div>
            ) : rightTab === "overview" ? (
              <div className="h-full flex items-center justify-center p-6">
                <p className="text-gray-600 text-sm text-center">No system analysis available yet.</p>
              </div>
            ) : null}

            {/* ─── INSPECTOR TAB ─── */}
            {rightTab === "inspector" && selectedNode ? (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const cfg = nodeTypeConfig[selectedNode.data?.type as keyof typeof nodeTypeConfig] ?? nodeTypeConfig.service;
                    const NIcon = cfg.icon;
                    return (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                        <NIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-bold">{selectedNode.data?.label}</h2>
                    {selectedNode.data?.type && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${(nodeTypeConfig[selectedNode.data.type as keyof typeof nodeTypeConfig] ?? nodeTypeConfig.service).color} opacity-70`}>
                        {selectedNode.data.type}
                      </span>
                    )}
                  </div>
                </div>

                {selectedNode.data?.description && (
                  <p className="text-[12px] text-gray-400 mb-5 leading-relaxed p-3 rounded-xl bg-gray-900/40 border border-gray-800/50">{selectedNode.data.description}</p>
                )}

                {explanationLoading ? (
                  <div className="flex items-center gap-3 text-gray-500 text-sm py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />Analyzing component...
                  </div>
                ) : nodeExplanation ? (
                  <div className="space-y-4">
                    {[
                      { title: "Role", content: nodeExplanation.role, type: "text" },
                      { title: "Responsibilities", content: nodeExplanation.responsibilities, type: "list" },
                      { title: "Scaling Notes", content: nodeExplanation.scalingNotes, type: "list" },
                      { title: "Failure Risks", content: nodeExplanation.failureRisks, type: "list" },
                    ].map((section) => (
                      <div key={section.title} className="p-3 rounded-xl bg-gray-900/30 border border-gray-800/40">
                        <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider mb-2">{section.title}</h3>
                        {section.type === "text" ? (
                          <p className="text-[12px] text-gray-400 leading-relaxed">{section.content}</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {(section.content as string[])?.map((item: string, i: number) => (
                              <li key={i} className="text-[12px] text-gray-400 flex items-start gap-2">
                                <span className="text-purple-500 mt-1 shrink-0">•</span>{item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : rightTab === "inspector" ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-3">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-1">No Component Selected</p>
                <p className="text-gray-600 text-xs">Click a node on the canvas to inspect it.</p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitectureInner />
    </ReactFlowProvider>
  );
}