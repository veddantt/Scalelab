"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession, saveSession } from "../../../lib/sessionStorage";
import Navbar from "../../components/Navbar";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { getScenario } from "../../../lib/scenarios";
import {
  Monitor,
  Shield,
  Server,
  Database,
  Zap,
  Layers,
  Cog,
  HardDrive,
  Globe,
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";

// ─── Node type → icon + color mapping ───
const nodeTypeConfig: Record<string, { icon: any; color: string; border: string }> = {
  client:     { icon: Monitor,   color: "text-blue-400",   border: "border-blue-500/30" },
  gateway:    { icon: Shield,    color: "text-purple-400", border: "border-purple-500/30" },
  service:    { icon: Server,    color: "text-cyan-400",   border: "border-cyan-500/30" },
  database:   { icon: Database,  color: "text-amber-400",  border: "border-amber-500/30" },
  cache:      { icon: Zap,       color: "text-yellow-400", border: "border-yellow-500/30" },
  queue:      { icon: Layers,    color: "text-orange-400", border: "border-orange-500/30" },
  worker:     { icon: Cog,       color: "text-teal-400",   border: "border-teal-500/30" },
  storage:    { icon: HardDrive, color: "text-emerald-400",border: "border-emerald-500/30" },
  external:   { icon: Globe,     color: "text-indigo-400", border: "border-indigo-500/30" },
  monitoring: { icon: Activity,  color: "text-pink-400",   border: "border-pink-500/30" },
};

// ─── Custom Node Component ───
const CustomNode = memo(({ data }: { data: any }) => {
  const config = nodeTypeConfig[data.type] || nodeTypeConfig.service;
  const Icon = config.icon;

  return (
    <div
      className={`px-4 py-3 rounded-2xl border ${config.border} bg-[#0f172a] shadow-lg hover:shadow-xl hover:border-opacity-60 transition-all duration-200 min-w-[170px] cursor-pointer group`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !w-2 !h-2 !border-0" />
      <div className="flex items-center gap-2.5">
        <div className={`${config.color} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-white text-xs font-semibold leading-tight">
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-600 !w-2 !h-2 !border-0" />
    </div>
  );
});
CustomNode.displayName = "CustomNode";

const nodeTypes = { custom: CustomNode };

// ─── Dagre Layout ───
const NODE_W = 190;
const NODE_H = 60;

function getLayoutedElements(nodes: any[], edges: any[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 160 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const layoutedNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });

  return { nodes: layoutedNodes, edges };
}

// ─── MOCK FALLBACK ───
const FALLBACK_INSIGHTS = {
  summary: "Standard 3-tier architecture with load balancing and caching.",
  score: 72,
  bottlenecks: [
    "Single database write path under peak load",
    "Cache invalidation delays causing stale reads",
  ],
  tradeoffs: [
    "Chose PostgreSQL for ACID transactions, sacrificing horizontal write scalability",
    "Added Redis for speed but introduced cache-invalidation complexity",
  ],
  scalingRecommendations: [
    "Add read replicas to PostgreSQL and route read queries",
    "Partition Kafka topics by entity ID for parallel consumers",
    "Deploy application service behind auto-scaling load balancer",
  ],
};

const FALLBACK_NODES = [
  { id: "1", label: "Web Client",       type: "client" },
  { id: "2", label: "API Gateway",      type: "gateway" },
  { id: "3", label: "Core Service",     type: "service" },
  { id: "4", label: "PostgreSQL",       type: "database" },
  { id: "5", label: "Redis Cache",      type: "cache" },
  { id: "6", label: "Message Queue",    type: "queue" },
  { id: "7", label: "Background Worker", type: "worker" },
];

const FALLBACK_EDGES = [
  { id: "e1-2", source: "1", target: "2", label: "HTTPS request" },
  { id: "e2-3", source: "2", target: "3", label: "Route & forward" },
  { id: "e3-4", source: "3", target: "4", label: "SQL read/write" },
  { id: "e3-5", source: "3", target: "5", label: "Cache lookup" },
  { id: "e3-6", source: "3", target: "6", label: "Publish event" },
  { id: "e6-7", source: "6", target: "7", label: "Consume job" },
];

export default function ArchitecturePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const scenario = getScenario(problemId);
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

  // ─── Prepare nodes for ReactFlow ───
  function prepareNodes(rawNodes: any[]) {
    return rawNodes.map((n: any) => ({
      id: n.id,
      type: "custom",
      data: {
        label: n.label || n.data?.label || "Unknown",
        type: n.type || "service",
        description: n.description || "",
      },
      position: n.position || { x: 0, y: 0 },
    }));
  }

  function prepareEdges(rawEdges: any[]) {
    return rawEdges.map((e: any) => ({
      id: e.id || `e-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.label || "",
      type: "smoothstep",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#475569", strokeWidth: 1.5 },
      labelStyle: { fill: "#94a3b8", fontSize: 10, fontWeight: 500 },
      labelBgStyle: { fill: "#020617", fillOpacity: 0.9 },
    }));
  }

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

        <div className="flex items-center gap-4">
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
                    nodeTypeConfig[selectedNode.data.type]?.border || "border-gray-700"
                  } ${
                    nodeTypeConfig[selectedNode.data.type]?.color || "text-gray-400"
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