"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { getScenario } from "../../../lib/scenarios";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

export default function SharePage() {
    const params = useParams();
    const sessionId = params.uuid as string;

    const [sessionData, setSessionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data, error } = await supabase
                    .from("sessions")
                    .select("*")
                    .eq("id", sessionId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Session not found");

                setSessionData(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load shared session");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                <p className="text-gray-400 font-medium tracking-wide">Loading interview results...</p>
            </div>
        );
    }

    if (error || !sessionData) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-6">
                <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-2xl text-center max-w-md w-full">
                    <h3 className="text-xl text-red-400 font-semibold mb-3">Not Found</h3>
                    <p className="text-gray-300 mb-6">{error || "This shared session does not exist."}</p>
                    <a href="/" className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition inline-block">
                        Go to ScaleLab
                    </a>
                </div>
            </div>
        );
    }

    const { scenario_id, review, architecture } = sessionData;
    const scenario = getScenario(scenario_id);
    const problem = scenario?.title || "System Design Problem";

    return (
        <main className="min-h-screen bg-[#020617] text-white p-6 md:p-12 overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20 uppercase tracking-widest">
                                Verified Mock Interview
                            </span>
                            <span className="text-gray-500 text-sm">{new Date(sessionData.created_at).toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">{problem}</h1>
                        <p className="text-gray-400">{scenario?.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="bg-black/50 border border-gray-800 p-6 rounded-3xl text-center shadow-xl relative overflow-hidden min-w-[200px]">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                            <h2 className="text-gray-400 font-medium mb-1 uppercase tracking-widest text-xs">Final Score</h2>
                            <div className="text-6xl font-black text-white tracking-tighter">
                                {review?.finalScore || 0}<span className="text-2xl text-gray-600 font-bold">/100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Feedback */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50">
                            <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                                <span className="bg-green-500/20 p-1 rounded-md">👍</span> Strengths
                            </h3>
                            <ul className="space-y-3">
                                {review?.strengths?.map((s: string, i: number) => (
                                    <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-green-500/30 pl-3 py-1">
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50">
                            <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                                <span className="bg-red-500/20 p-1 rounded-md">⚠️</span> Areas to Improve
                            </h3>
                            <ul className="space-y-3">
                                {review?.weaknesses?.map((w: string, i: number) => (
                                    <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-red-500/30 pl-3 py-1">
                                        {w}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 p-6 rounded-3xl border border-green-500/20 shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-green-400">Recommendations</h3>
                            <div className="space-y-3">
                                {review?.recommendedImprovements?.map((rec: string, i: number) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {rec}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Architecture */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#0f172a] p-1 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                            <div className="p-5 border-b border-gray-800/50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">System Architecture</h3>
                            </div>
                            <div className="h-[400px] w-full bg-black/50">
                                {architecture?.nodes && architecture?.edges ? (
                                    <ReactFlow
                                        nodes={architecture.nodes}
                                        edges={architecture.edges}
                                        fitView
                                        nodesDraggable={false}
                                        nodesConnectable={false}
                                        elementsSelectable={false}
                                        proOptions={{ hideAttribution: true }}
                                    >
                                        <Background color="#334155" gap={16} size={1} />
                                        <Controls showInteractive={false} />
                                    </ReactFlow>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                        No architecture diagram available for this session.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#020617] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-xl font-bold mb-6 text-white">Architecture Summary</h3>
                            <p className="text-gray-300 leading-relaxed mb-8">
                                {review?.architectureSummary}
                            </p>

                            <h4 className="text-lg font-bold mb-4 text-white">Component Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {review?.componentExplanations?.map((comp: any, i: number) => (
                                    <div key={i} className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800/50">
                                        <h4 className="font-semibold text-blue-400 mb-2">{comp.component}</h4>
                                        <p className="text-sm text-gray-400 leading-relaxed">{comp.reasoning}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Call to Action */}
                <div className="mt-16 text-center border-t border-gray-800 pt-12 pb-8">
                    <h3 className="text-2xl font-bold mb-4">Want to test your own system design skills?</h3>
                    <p className="text-gray-400 mb-6">ScaleLab is a free AI-powered interview simulator.</p>
                    <a
                        href="/problems"
                        className="inline-block px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition shadow-lg shadow-white/10"
                    >
                        Try an Interview Now
                    </a>
                </div>

            </div>
        </main>
    );
}
