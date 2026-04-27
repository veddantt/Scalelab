"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, saveSession } from "@/lib/sessionStorage";
import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import ReactFlow, { Background, Controls, MiniMap, Panel, useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { getProblemMeta } from "@/lib/problems";
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
  const meta = getProblemMeta(problemId);
  const scenario = meta?.problem;
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
  const [sheetState, setSheetState] = useState<"peek" | "half" | "full">("peek");

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
    setSheetState("full");
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
      const png = await toPng(el, { backgroundColor: "#070B14", pixelRatio: 2 });
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
      <div className="h-screen flex flex-col bg-[#070B14] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mb-6">
            <Sparkles className="w-7 h-7 text-[#6366F1]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">No Architecture Yet</h1>
          <p className="text-[#94A3B8] mb-8 max-w-md">Complete the interview and generate your architecture diagram to see it here.</p>
          <a href={`/interview/${problemId}`} className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#6366F1]/20">
            Go to Interview
          </a>
        </div>
      </div>
    );
  }

  const scoreColor = (systemInsights?.score ?? 0) >= 80 ? "text-emerald-400" : (systemInsights?.score ?? 0) >= 60 ? "text-amber-400" : "text-red-400";

  const renderSidebarContent = () => (
    <>
      {/* Tab bar */}
      <div className="flex border-b border-[#1E293B] shrink-0">
        {([
          { id: "overview" as const, label: "System Overview", icon: BarChart3 },
          { id: "inspector" as const, label: "Inspector", icon: Info },
        ]).map((t) => {
          const TIcon = t.icon;
          return (
            <button key={t.id} onClick={() => setRightTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                rightTab === t.id ? "text-white border-[#6366F1] bg-[#6366F1]/5" : "text-[#94A3B8] border-transparent hover:text-white"
              }`}>
              <TIcon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* ─── OVERVIEW TAB ─── */}
        {rightTab === "overview" && systemInsights ? (
          <div className="p-6 space-y-6">
            {/* Score ring */}
            {systemInsights.score != null && (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="transparent" stroke="#1E293B" strokeWidth="5" />
                    <circle cx="32" cy="32" r="26" fill="transparent" stroke="currentColor" strokeWidth="5"
                      strokeDasharray="163.4" strokeLinecap="round"
                      strokeDashoffset={163.4 - (163.4 * (systemInsights.score || 0)) / 100}
                      className="text-[#6366F1] transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-bold ${scoreColor}`}>{systemInsights.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white mb-1 uppercase tracking-tight">Architecture Score</p>
                  <p className="text-[10px] text-[#94A3B8] leading-relaxed font-medium">
                    {(systemInsights.score ?? 0) >= 80 ? "Strong design with solid component choices." : (systemInsights.score ?? 0) >= 60 ? "Good foundation — room for scaling." : "Needs more depth in component selection."}
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            {systemInsights.summary && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold mb-3">System Summary</h3>
                <p className="text-[13px] text-[#E2E8F0] leading-relaxed p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">{systemInsights.summary}</p>
              </div>
            )}

            {/* Bottlenecks */}
            {systemInsights.bottlenecks?.length > 0 && (
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-red-400 font-bold text-[10px] uppercase tracking-widest">Bottlenecks</h3>
                </div>
                <ul className="space-y-3">
                  {systemInsights.bottlenecks.map((b: string, i: number) => (
                    <li key={i} className="text-[12px] text-[#94A3B8] pl-3 border-l-2 border-red-500/30 py-0.5 leading-relaxed font-medium">{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tradeoffs */}
            {systemInsights.tradeoffs?.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowLeftRight className="w-4 h-4 text-[#94A3B8]" />
                  <h3 className="text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest">Tradeoffs</h3>
                </div>
                <ul className="space-y-3">
                  {systemInsights.tradeoffs.map((t: string, i: number) => (
                    <li key={i} className="text-[12px] text-[#94A3B8] pl-3 border-l-2 border-[#1E293B] py-0.5 leading-relaxed font-medium">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scaling */}
            {systemInsights.scalingRecommendations?.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Scaling</h3>
                </div>
                <ul className="space-y-3">
                  {systemInsights.scalingRecommendations.map((r: string, i: number) => (
                    <li key={i} className="text-[12px] text-[#94A3B8] pl-3 border-l-2 border-emerald-500/30 py-0.5 leading-relaxed font-medium">{r}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-[#94A3B8]/40 text-[10px] italic font-bold text-center">Click nodes on the canvas to inspect</p>
          </div>
        ) : rightTab === "overview" ? (
          <div className="h-full flex items-center justify-center p-6">
            <p className="text-[#94A3B8] text-sm text-center font-bold">No system analysis available yet.</p>
          </div>
        ) : null}

        {/* ─── INSPECTOR TAB ─── */}
        {rightTab === "inspector" && selectedNode ? (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              {(() => {
                const cfg = nodeTypeConfig[selectedNode.data?.type as keyof typeof nodeTypeConfig] ?? nodeTypeConfig.service;
                const NIcon = cfg.icon;
                return (
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cfg.bg} border ${cfg.border} shadow-lg shadow-[#070B14]`}>
                    <NIcon className={`w-6 h-6 ${cfg.color}`} />
                  </div>
                );
              })()}
              <div>
                <h2 className="text-xl font-bold text-white">{selectedNode.data?.label}</h2>
                {selectedNode.data?.type && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${(nodeTypeConfig[selectedNode.data.type as keyof typeof nodeTypeConfig] ?? nodeTypeConfig.service).color} opacity-80`}>
                    {selectedNode.data.type}
                  </span>
                )}
              </div>
            </div>

            {selectedNode.data?.description && (
              <p className="text-[13px] text-[#94A3B8] mb-6 leading-relaxed p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] font-medium">{selectedNode.data.description}</p>
            )}

            {explanationLoading ? (
              <div className="flex flex-col items-center gap-4 text-[#94A3B8] text-sm py-12 justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Analyzing Component...</span>
              </div>
            ) : nodeExplanation ? (
              <div className="space-y-5">
                {[
                  { title: "Role", content: nodeExplanation.role, type: "text" },
                  { title: "Responsibilities", content: nodeExplanation.responsibilities, type: "list" },
                  { title: "Scaling Notes", content: nodeExplanation.scalingNotes, type: "list" },
                  { title: "Failure Risks", content: nodeExplanation.failureRisks, type: "list" },
                ].map((section) => (
                  <div key={section.title} className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
                    <h3 className="text-[#6366F1] font-bold text-[10px] uppercase tracking-widest mb-3">{section.title}</h3>
                    {section.type === "text" ? (
                      <p className="text-[13px] text-[#E2E8F0] leading-relaxed font-medium">{section.content}</p>
                    ) : (
                      <ul className="space-y-2">
                        {(section.content as string[])?.map((item: string, i: number) => (
                          <li key={i} className="text-[12px] text-[#94A3B8] flex items-start gap-2 font-medium">
                            <span className="text-[#6366F1] mt-1 shrink-0">•</span>{item}
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
            <div className="w-16 h-16 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-[#1E293B]" />
            </div>
            <p className="text-[#94A3B8] text-sm font-bold mb-1 uppercase tracking-widest">No Component Selected</p>
            <p className="text-[#94A3B8]/40 text-xs font-bold">Select a node to inspect its behavior.</p>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-[#070B14] text-white overflow-hidden">
      <Navbar />

      {/* ─── Sub-header ─── */}
      <div className="px-6 py-4 border-b border-[#1E293B] bg-[#070B14]/50 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1.5">
            <a href="/problems" className="hover:text-white transition">Challenges</a>
            <ChevronRight className="w-3 h-3" />
            <a href={`/interview/${problemId}`} className="hover:text-white transition truncate max-w-[150px]">{problem}</a>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#6366F1]">Architecture</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{problem}</h1>
            {systemInsights?.isFallback && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">FALLBACK MODE</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveButton problemId={problemId} />
          {systemInsights?.score != null && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B]">
              <BarChart3 className="w-4 h-4 text-[#94A3B8]" />
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Design</span>
              <span className={`text-sm font-bold ${scoreColor}`}>{systemInsights.score}</span>
              <span className="text-[10px] text-[#94A3B8] opacity-40">/100</span>
            </div>
          )}
          <button onClick={handleExportPNG} disabled={exporting || loading}
            className="px-4 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-[#94A3B8]/20 text-[#94A3B8] hover:text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40">
            <Download className="w-4 h-4" />{exporting ? "..." : "PNG"}
          </button>
          <button onClick={handleGenerateReview} disabled={reviewLoading}
            className="px-6 py-2 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white font-bold text-sm transition-all shadow-lg shadow-[#6366F1]/20 disabled:opacity-60 flex items-center gap-2">
            {reviewLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Finalizing...</> : <>Review Design<ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[#070B14]">

        {/* ─── Canvas ─── */}
        <div className="w-full lg:flex-1 h-[55vh] lg:h-auto min-h-[55vh] lg:min-h-0 relative shrink-0 border-b lg:border-b-0 border-[#1E293B]" ref={flowRef}>
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#6366F1]/20 border-t-[#6366F1]" />
                <Sparkles className="w-4 h-4 text-[#6366F1] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Rendering System Architecture...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="text-red-400 text-center max-w-md p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <p className="font-bold mb-2">Generation Failed</p>
                <p className="text-xs text-[#94A3B8]">{error}</p>
              </div>
              <button onClick={loadFromSession} className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition uppercase text-xs tracking-widest">Retry</button>
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
              <Background color="#1E293B" gap={32} size={1} />
              <Controls className="!bg-[#0F172A] !border-[#1E293B] !rounded-xl !shadow-2xl" showInteractive={false} />
              <MiniMap nodeColor={() => "#1E293B"} maskColor="rgba(7, 11, 20, 0.9)" className="!bg-[#0F172A] !border-[#1E293B] !rounded-xl !shadow-2xl" style={{ width: 140, height: 90 }} />

              {/* ─── Floating style selector ─── */}
              <Panel position="top-left">
                <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#0F172A]/90 backdrop-blur-xl border border-[#1E293B] rounded-2xl shadow-2xl max-w-[280px] sm:max-w-none">
                  {ARCH_STYLES.map((s) => {
                    const SIcon = s.icon;
                    const active = archStyle === s.id;
                    return (
                      <button key={s.id} onClick={() => setArchStyle(s.id)} title={s.desc}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          active ? "bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20 shadow-lg shadow-[#6366F1]/10" : "text-[#94A3B8] border border-transparent hover:bg-[#1E293B]"
                        }`}>
                        <SIcon className="w-3.5 h-3.5" />{s.label}
                      </button>
                    );
                  })}
                  <button onClick={handleRegenerate} disabled={regenerating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#6366F1]/10 to-[#6366F1]/5 text-[#6366F1] border border-[#6366F1]/20 hover:border-[#6366F1]/40 transition-all disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />{regenerating ? "..." : "Regenerate"}
                  </button>
                </div>
              </Panel>

              {/* ─── Node count ─── */}
              <Panel position="bottom-left">
                <div className="px-3 py-1.5 bg-[#0F172A]/80 backdrop-blur-xl border border-[#1E293B] rounded-lg text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest">
                  {nodes.length} nodes · {edges.length} edges
                </div>
              </Panel>
            </ReactFlow>
          )}
        </div>

        {/* ─── Desktop Right Panel ─── */}
        <aside className="hidden lg:flex w-[380px] shrink-0 bg-[#070B14] flex-col border-l border-[#1E293B] overflow-hidden">
          {renderSidebarContent()}
        </aside>

        {/* ─── Mobile Bottom Sheet ─── */}
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 rounded-t-3xl bg-[#070B14]/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50 border-t border-[#1E293B] transition-all duration-300 flex flex-col ${
          sheetState === "peek" ? "h-[64px]" : sheetState === "half" ? "h-[45vh]" : "h-[85vh]"
        }`}>
          {/* Drag Handle */}
          <div 
            className="w-full flex justify-center py-4 shrink-0 cursor-pointer" 
            onClick={() => setSheetState(s => s === "peek" ? "half" : s === "half" ? "full" : "peek")}
          >
            <div className="w-12 h-1.5 bg-[#1E293B] rounded-full" />
          </div>
          
          {sheetState === "peek" ? (
            <div className="px-5 text-center text-[#94A3B8] font-bold text-[11px] uppercase tracking-widest cursor-pointer" onClick={() => setSheetState("half")}>
              System Details & Analysis
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderSidebarContent()}
            </div>
          )}
        </div>
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