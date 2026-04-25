"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, saveSession } from "@/lib/sessionStorage";
import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { getProblem } from "@/lib/scenarios";
import { nodeTypeConfig, nodeTypes } from "@/features/architecture/components/CustomNode";
import { getLayoutedElements, prepareNodes, prepareEdges } from "@/features/architecture/utils/layout";
import {
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";


export default function ArchitecturePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const scenario = getProblem(problemId);
  const problem = scenario?.title || "System Design Problem";

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

  // prepareNodes, prepareEdges, getLayoutedElements imported from features/architecture/utils/layout

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
    } catch (err) {
      console.error(err);
      setError("Failed to load architecture from session.");
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  const handleNodeClick = async (_: any, node: any) => {
    setSelectedNode(node);
    setNodeExplanation(null);
    setExplanationLoading(true);

    const nodeLabel = node.data?.label;
    if (!nodeLabel) {
      setExplanationLoading(false);
      return;
    }

    // Check cache
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
      if (!res.ok) throw new Error(data.error || "Failed to explain node");

      if (session) {
        if (!session.explanations) session.explanations = {};
        session.explanations[nodeLabel] = data;
        saveSession(session);
      }

      setNodeExplanation(data);
    } catch (error) {
      console.error(error);
      setNodeExplanation({
        title: "Component",
        role: "Core architectural component",
        responsibilities: [
            "Handles specific domain logic",
            "Processes incoming requests or data"
        ],
        scalingNotes: [
            "Can be scaled horizontally",
            "Consider caching frequently accessed data"
        ],
        failureRisks: [
            "Single point of failure if not deployed redundantly",
            "Network latency under high load"
        ]
      });
    } finally {
      setExplanationLoading(false);
    }
  };

  useEffect(() => {
    loadFromSession();
  }, [loadFromSession]);

  const handleGenerateReview = async () => {
    setReviewLoading(true);
    try {
      const session = getSession(String(problemId));
      if (!session) throw new Error("No session found");
      const messages = session.messages || [];

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, messages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate review");

      session.review = data;
      saveSession(session);

      router.push(`/review/${problemId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate review. Please try again.");
      setReviewLoading(false);
    }
  };

  if (noArchitecture) {
    return (
      <div className="h-screen flex flex-col bg-[#020617] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">No architecture generated yet</h1>
          <p className="text-gray-400 mb-8">You need to complete the interview or click generate first.</p>
          <a href={`/interview/${problemId}`} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition">
            Go to Interview
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <Navbar />

      {/* ─── Sub-header ─── */}
      <div className="px-6 py-4 border-b border-gray-800/50 bg-black/40 backdrop-blur-md flex items-center justify-between shadow-sm z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5 font-medium tracking-wide">
            <a href="/problems" className="hover:text-white transition">Problems</a>
            <span>/</span>
            <a href={`/interview/${problemId}`} className="hover:text-white transition">{problem}</a>
            <span>/</span>
            <span className="text-purple-400">Architecture</span>
          </div>
          <h1 className="text-xl font-semibold text-white">{problem}</h1>
        </div>

        <div className="flex items-center gap-3">
          <SaveButton problemId={problemId as string} />
          {systemInsights?.score && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/60 border border-gray-800/50">
              <span className="text-xs text-gray-400">Score</span>
              <span className="text-sm font-bold text-white">
                {systemInsights.score}/100
              </span>
            </div>
          )}
          <button
            onClick={handleGenerateReview}
            disabled={reviewLoading}
            className={`px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-purple-500/25 ${reviewLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {reviewLoading ? "Generating Review..." : "Finish & Get Review →"}
          </button>
        </div>
      </div>

      {/* ─── Main ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <p className="text-sm">Generating personalized architecture...</p>
              <p className="text-xs text-gray-600">
                This may take a few seconds
              </p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="text-red-400 text-center max-w-md p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <p className="font-semibold mb-2">Generation Failed</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
              <button
                onClick={loadFromSession}
                className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              proOptions={{ hideAttribution: true }}
              onNodeClick={handleNodeClick}
              onPaneClick={() => setSelectedNode(null)}
            >
              <Background color="#1e293b" gap={24} size={1} />
              <Controls className="!bg-gray-900 !border-gray-700 !rounded-xl" />
              <MiniMap
                nodeColor={() => "#1e293b"}
                maskColor="rgba(2, 6, 23, 0.8)"
                className="!bg-gray-900 !border-gray-700 !rounded-xl"
              />
            </ReactFlow>
          )}
        </div>

        {/* ─── Right Panel ─── */}
        <aside className="w-[380px] border-l border-gray-800/50 bg-[#020617] overflow-y-auto">
          {selectedNode ? (
            <div className="p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400 mb-2">
                Component Inspector
              </p>
              <h2 className="text-2xl font-bold mb-1">
                {selectedNode.data?.label}
              </h2>
              {selectedNode.data?.type && (
                <span
                  className={`inline-block text-xs px-2.5 py-1 rounded-full border mb-5 ${
                    nodeTypeConfig[selectedNode.data.type as keyof typeof nodeTypeConfig]?.border || "border-gray-700"
                  } ${
                    nodeTypeConfig[selectedNode.data.type as keyof typeof nodeTypeConfig]?.color || "text-gray-400"
                  } bg-gray-900/40`}
                >
                  {selectedNode.data.type}
                </span>
              )}

              {selectedNode.data?.description && (
                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                  {selectedNode.data.description}
                </p>
              )}

              {explanationLoading ? (
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                  Generating explanation...
                </div>
              ) : nodeExplanation ? (
                <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
                  <div>
                    <h3 className="text-white font-semibold mb-1.5">Role</h3>
                    <p>{nodeExplanation.role}</p>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1.5">Responsibilities</h3>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      {nodeExplanation.responsibilities?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1.5">Scaling Notes</h3>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      {nodeExplanation.scalingNotes?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1.5">Failure Risks</h3>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      {nodeExplanation.failureRisks?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          ) : systemInsights ? (
            <div className="p-6 space-y-6">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400">
                System Analysis
              </p>

              {/* Summary */}
              <div>
                <h3 className="text-white font-semibold mb-2">Summary</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {systemInsights.summary}
                </p>
              </div>

              {/* Bottlenecks */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-red-400 font-semibold">Bottlenecks</h3>
                </div>
                <ul className="space-y-2">
                  {systemInsights.bottlenecks?.map((b: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-gray-400 pl-4 border-l-2 border-red-500/20 py-1"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tradeoffs */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                  <h3 className="text-blue-400 font-semibold">Tradeoffs</h3>
                </div>
                <ul className="space-y-2">
                  {systemInsights.tradeoffs?.map((t: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-gray-400 pl-4 border-l-2 border-blue-500/20 py-1"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scaling Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <h3 className="text-green-400 font-semibold">
                    Scaling Recommendations
                  </h3>
                </div>
                <ul className="space-y-2">
                  {systemInsights.scalingRecommendations?.map(
                    (r: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-gray-400 pl-4 border-l-2 border-green-500/20 py-1"
                      >
                        {r}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="pt-4 border-t border-gray-800/50">
                <p className="text-gray-500 text-xs italic">
                  Click any node on the canvas for component-level insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <p className="text-gray-500 text-sm text-center">
                Click a component to inspect its role, tradeoffs, and interview
                talking points.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}