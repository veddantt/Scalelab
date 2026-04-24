"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getSession, saveSession } from "../../../lib/sessionStorage";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

import { getScenario } from "../../../lib/scenarios";

const nodeWidth = 190;
const nodeHeight = 70;

function getLayoutedElements(nodes: any[], edges: any[]) {
    const dagreGraph = new dagre.graphlib.Graph();

    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: "LR",
        nodesep: 80,
        ranksep: 140,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: nodeWidth,
            height: nodeHeight,
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}

export default function ArchitecturePage() {
    const params = useParams();
    const problemId = params.id as string;
    const scenario = getScenario(problemId);
    const problem = scenario?.title || "System Design Problem";

    const [nodes, setNodes] = useState<any[]>([]);
    const [edges, setEdges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    const [nodeExplanation, setNodeExplanation] = useState<any | null>(null);
    const [explanationLoading, setExplanationLoading] = useState(false);

    const generateArchitecture = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const session = getSession(String(problemId));
            const messages = session ? session.messages : [];

            if (session?.architecture) {
                const layouted = getLayoutedElements(session.architecture.nodes, session.architecture.edges);
                setNodes(layouted.nodes);
                setEdges(layouted.edges);
                setLoading(false);
                return;
            }

            const res = await fetch("/api/architecture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ problem, messages }),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = typeof data.error === "object"
                    ? data.error.message
                    : data.error || "Failed to generate architecture";
                throw new Error(msg);
            }

            const styledNodes = (data.nodes || []).map((node: any) => ({
                ...node,
                style: {
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "1px solid #334155",
                    borderRadius: 14,
                    padding: 14,
                    width: 190,
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                },
            }));

            const styledEdges = (data.edges || []).map((edge: any) => ({
                ...edge,
                type: "smoothstep",
                animated: true,
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                },
                style: {
                    stroke: "#64748b",
                    strokeWidth: 2,
                },
                labelStyle: {
                    fill: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 600,
                },
                labelBgStyle: {
                    fill: "#020617",
                    fillOpacity: 0.9,
                },
            }));

            if (session) {
                session.architecture = { nodes: styledNodes, edges: styledEdges };
                saveSession(session);
            }

            const layouted = getLayoutedElements(styledNodes, styledEdges);

            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        } catch (error) {
            console.error(error);

            const fallbackNodes = [
                { id: "1", data: { label: "Client App" } },
                { id: "2", data: { label: "API Gateway" } },
                { id: "3", data: { label: "Core Service" } },
                { id: "4", data: { label: "PostgreSQL Database" } },
                { id: "5", data: { label: "Redis Cache" } },
                { id: "6", data: { label: "Message Queue" } },
            ];

            const fallbackEdges = [
                { id: "e1-2", source: "1", target: "2", label: "HTTP" },
                { id: "e2-3", source: "2", target: "3", label: "Route" },
                { id: "e3-4", source: "3", target: "4", label: "Read/Write" },
                { id: "e3-5", source: "3", target: "5", label: "Cache" },
                { id: "e3-6", source: "3", target: "6", label: "Async Events" },
            ];

            const fallbackStyledNodes = fallbackNodes.map((node: any) => ({
                ...node,
                style: {
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "1px solid #334155",
                    borderRadius: 14,
                    padding: 14,
                    width: 190,
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                },
            }));

            const fallbackStyledEdges = fallbackEdges.map((edge: any) => ({
                ...edge,
                type: "smoothstep",
                animated: true,
                style: {
                    stroke: "#64748b",
                    strokeWidth: 2,
                },
            }));

            const layouted = getLayoutedElements(fallbackStyledNodes, fallbackStyledEdges);

            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        } finally {
            setLoading(false);
        }
    }, [problemId, problem]);

    const handleNodeClick = async (_: any, node: any) => {
        setSelectedNode(node);
        setNodeExplanation(null);
        setExplanationLoading(true);

        const nodeLabel = node.data?.label;
        if (!nodeLabel) {
            setExplanationLoading(false);
            return;
        }

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
                purpose: "This component handles a core responsibility in the architecture.",
                whyItMatters: "It helps separate concerns and keeps the system easier to scale.",
                interviewTalkingPoint: "Explain what data it owns, which services call it, and how it behaves under high traffic.",
                scalingRisk: "If overloaded, this component may become a bottleneck without caching, replication, or async processing.",
            });
        } finally {
            setExplanationLoading(false);
        }
    };

    useEffect(() => {
        generateArchitecture();
    }, [generateArchitecture]);

    return (
        <main className="h-screen bg-[#020617] text-white flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800/50 bg-black/40 backdrop-blur-md flex items-center justify-between shadow-sm z-10">
                <div className="flex flex-col">
                    <span className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-1">Architecture Workspace</span>
                    <h1 className="text-xl font-semibold text-white">{problem}</h1>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href={`/interview/${problemId}`}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        ← Back to Interview
                    </a>
                    <a
                        href={`/review/${problemId}`}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-purple-500/25"
                    >
                        Finish & Get Review →
                    </a>
                </div>
            </div>

            <div className="flex-1 flex">
                <div className="flex-1">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            <p>Generating personalized architecture...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 bg-gray-900/30">
                            <div className="text-red-400 text-center max-w-md p-6 border border-red-500/20 bg-red-500/10 rounded-xl">
                                <p className="font-semibold mb-2">Generation Failed</p>
                                <p className="text-sm opacity-90">{error}</p>
                            </div>
                            <button
                                onClick={generateArchitecture}
                                className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition"
                            >
                                Retry Generation
                            </button>
                        </div>
                    ) : (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            fitView
                            fitViewOptions={{ padding: 0.25 }}
                            proOptions={{ hideAttribution: true }}
                            onNodeClick={handleNodeClick}
                            onPaneClick={() => setSelectedNode(null)}
                        >
                            <Background color="#334155" gap={24} size={1} />
                            <Controls />
                            <MiniMap
                                nodeColor={() => "#1e293b"}
                                maskColor="rgba(2, 6, 23, 0.75)"
                            />
                        </ReactFlow>
                    )}
                </div>

                <aside className="w-[360px] border-l border-gray-800 bg-[#020617] p-6">
                    {selectedNode ? (
                        <>
                            <p className="text-xs uppercase tracking-[0.2em] text-purple-400 mb-3">
                                Component
                            </p>

                            <h2 className="text-2xl font-bold mb-4">
                                {selectedNode.data?.label}
                            </h2>

                            {explanationLoading ? (
                                <div className="flex items-center gap-3 text-gray-500 text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                    Generating explanation...
                                </div>
                            ) : nodeExplanation ? (
                                <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Purpose</h3>
                                        <p>{nodeExplanation.purpose}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Why it matters</h3>
                                        <p>{nodeExplanation.whyItMatters}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Interview talking point</h3>
                                        <p>{nodeExplanation.interviewTalkingPoint}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold mb-2">Scaling risk</h3>
                                        <p>{nodeExplanation.scalingRisk}</p>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="h-full flex items-center text-gray-500">
                            Click a component to inspect its role, tradeoffs, and interview talking points.
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}