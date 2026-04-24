"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const problems = [
    "Design Uber",
    "Design Twitter Feed",
    "Design Netflix",
    "Design WhatsApp",
    "Design URL Shortener",
    "Design Rate Limiter",
    "Design Food Delivery App",
    "Design Real-Time Chat App",
];

export default function ReviewPage() {
    const params = useParams();
    const problemId = Number(params.id);
    const problem = problems[problemId] || "System Design Problem";

    const [review, setReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReview = async () => {
            try {
                const stored = sessionStorage.getItem(`messages-${problemId}`);
                const messages = stored ? JSON.parse(stored) : [];

                const res = await fetch("/api/review", {
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
                        : data.error || "Failed to generate review";
                    throw new Error(msg);
                }

                setReview(data);
            } catch (err: any) {
                console.error(err);
                if (err.message.includes("high demand") || err.message.includes("503")) {
                    setError("Google's AI model is currently experiencing high demand. Please try again in a few moments.");
                } else {
                    setError(err.message || "Failed to generate review.");
                }
            } finally {
                setLoading(false);
            }
        };

        generateReview();
    }, [problemId, problem]);

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <p className="text-green-500 font-semibold tracking-[0.2em] uppercase text-xs mb-2">Final Evaluation</p>
                        <h1 className="text-3xl font-bold">{problem}</h1>
                    </div>
                    <div className="flex gap-4">
                        <a
                            href={`/architecture/${problemId}`}
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl transition text-sm font-medium"
                        >
                            View Architecture
                        </a>
                        <a
                            href="/"
                            className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl transition text-sm font-medium"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
                        <p className="text-gray-400 font-medium tracking-wide">Analyzing your performance and generating review...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-2xl text-center max-w-2xl mx-auto mt-20">
                        <h3 className="text-xl text-red-400 font-semibold mb-3">Analysis Failed</h3>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : review ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Score & Lists */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-[#020617] border border-gray-800 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
                                <h2 className="text-gray-400 font-medium mb-2 uppercase tracking-widest text-xs">Final Score</h2>
                                <div className="text-7xl font-black text-white tracking-tighter">
                                    {review.finalScore}<span className="text-3xl text-gray-600 font-bold">/100</span>
                                </div>
                            </div>

                            <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50">
                                <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                                    <span className="bg-green-500/20 p-1 rounded-md">👍</span> Strengths
                                </h3>
                                <ul className="space-y-3">
                                    {review.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-green-500/30 pl-3 py-1">
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800/50">
                                <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                                    <span className="bg-red-500/20 p-1 rounded-md">⚠️</span> Weaknesses
                                </h3>
                                <ul className="space-y-3">
                                    {review.weaknesses?.map((w: string, i: number) => (
                                        <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-red-500/30 pl-3 py-1">
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Deep Dive */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0f172a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                <h3 className="text-xl font-bold mb-4 text-white">System Architecture Summary</h3>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {review.architectureSummary}
                                </p>
                            </div>

                            <div className="bg-[#020617] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                <h3 className="text-xl font-bold mb-6 text-white">Component Explanations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {review.componentExplanations?.map((comp: any, i: number) => (
                                        <div key={i} className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800/50">
                                            <h4 className="font-semibold text-blue-400 mb-2">{comp.component}</h4>
                                            <p className="text-sm text-gray-400 leading-relaxed">{comp.reasoning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 p-8 rounded-3xl border border-green-500/20 shadow-xl">
                                <h3 className="text-xl font-bold mb-6 text-green-400">Recommended Improvements</h3>
                                <div className="space-y-4">
                                    {review.recommendedImprovements?.map((rec: string, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-2xl border border-gray-800/50">
                                            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold shrink-0 text-sm">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed pt-1.5">
                                                {rec}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
