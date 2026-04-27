"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GitMerge, RefreshCw, FileText, HelpCircle, Loader2, ChevronRight } from "lucide-react";

import { getProblem } from "@/lib/scenarios";
import { getSession, saveSession, ScaleLabSession } from "@/lib/sessionStorage";

import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import ModelAnswerCard from "@/components/ModelAnswerCard";
import type { ModelAnswer } from "@/lib/sessionStorage";

function CollapsibleSection({ title, children, defaultOpen = false, className = "bg-gray-900/40 border border-gray-800/50" }: { title: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean, className?: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`p-5 lg:p-6 rounded-3xl ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left focus:outline-none lg:pointer-events-none">
        {title}
        <ChevronRight className={`w-5 h-5 text-gray-500 lg:hidden transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 lg:max-h-none lg:opacity-100 lg:mt-4 ${isOpen ? "max-h-[2500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const problemId = params.id as string;
    const scenario = getProblem(problemId);
    const problem = scenario?.title;

    const [review, setReview] = useState<any>(null);
    const [noReview, setNoReview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [modelAnswer, setModelAnswer] = useState<ModelAnswer | null>(null);
    const [explainingMap, setExplainingMap] = useState<Record<string, boolean>>({});
    const [explanations, setExplanations] = useState<Record<string, string>>({});

    const handleExplainMistake = async (comp: string, reasoning: string) => {
        setExplainingMap(prev => ({ ...prev, [comp]: true }));
        try {
            const session = getSession(problemId);
            const userAnswers = session?.messages
                ?.filter((m: any) => m.role === "user")
                .map((m: any) => m.content)
                .join("\n\n");
                
            const res = await fetch("/api/explain-mistake", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problemTitle: scenario?.title,
                    problemStatement: scenario?.description,
                    component: comp,
                    reasoning,
                    userAnswers
                })
            });
            
            if (!res.ok) throw new Error("Failed to get explanation");
            const data = await res.json();
            setExplanations(prev => ({ ...prev, [comp]: data.explanation }));
        } catch (err) {
            console.error(err);
            alert("Failed to load explanation.");
        } finally {
            setExplainingMap(prev => ({ ...prev, [comp]: false }));
        }
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            const session = getSession(problemId);
            if (!session) throw new Error("No session found in local storage.");

            const { createClient } = await import("@/lib/supabase/client");
            const supabaseClient = createClient();

            const { data, error: dbError } = await supabaseClient
                .from("sessions")
                .insert([
                    {
                        scenario_id: problemId,
                        messages: session.messages || [],
                        scores: session.scores || {},
                        architecture: session.architecture || {},
                        review: review,
                        model_answer: session.modelAnswer || null,
                        attempt_number: session.attemptNumber || 1,
                        practice_mode: session.practiceMode || false,
                        improvement_goals: session.improvementGoals || null,
                        weakest_areas: session.weakestAreas || null,
                    },
                ])
                .select()
                .single();

            if (dbError) throw dbError;
            
            const url = `${window.location.origin}/share/${data.id}`;
            setShareUrl(url);
        } catch (err: any) {
            console.error("Failed to share:", err);
            alert("Failed to create share link: " + err.message);
        } finally {
            setSharing(false);
        }
    };

    useEffect(() => {
        const loadReview = () => {
            try {
                const session = getSession(problemId);
                if (!session?.review) {
                    setNoReview(true);
                    setLoading(false);
                    return;
                }
                setReview(session.review);
            } catch (err: any) {
                console.error(err);
                setError("Failed to load review from session.");
            } finally {
                setLoading(false);
            }
        };

        loadReview();
    }, [problemId]);

    // Separately load cached model answer from session
    useEffect(() => {
        const session = getSession(problemId);
        if (session?.modelAnswer) {
            setModelAnswer(session.modelAnswer);
        }
    }, [problemId]);

    const handleModelAnswerGenerated = (answer: ModelAnswer) => {
        const session = getSession(problemId);
        if (session) {
            session.modelAnswer = answer;
            saveSession(session);
        }
        setModelAnswer(answer);
    };

    const handleRetry = () => {
        const session = getSession(problemId);
        if (!session) return;
        
        const newSession: ScaleLabSession = {
            id: problemId,
            problem: problemId,
            messages: [],
            scores: { clarity: 0, depth: 0, correctness: 0 },
            currentStep: 0,
            createdAt: new Date().toISOString(),
            attemptNumber: (session.attemptNumber || 1) + 1,
            originalSessionId: session.originalSessionId || session.id,
            practiceMode: true,
            weakestAreas: review?.weaknesses || [],
            improvementGoals: review?.weaknesses || [],
            modelAnswer: session.modelAnswer
        };
        
        saveSession(newSession);
        router.push(`/interview/${problemId}`);
    };

    const handleExport = () => {
        window.print();
    };

    if (!scenario) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-3xl font-bold mb-4">Problem Not Found</h1>
                    <p className="text-gray-400 mb-8">The scenario you are looking for does not exist.</p>
                    <a href="/problems" className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition">
                        Browse Problems
                    </a>
                </div>
            </div>
        );
    }

    if (noReview) {
        return (
            <div className="min-h-screen flex flex-col bg-black text-white">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-3xl font-bold mb-4">No review available yet</h1>
                    <p className="text-gray-400 mb-8">You need to complete the architecture step first.</p>
                    <a href={`/architecture/${problemId}`} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition">
                        Generate Architecture First
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Navbar />
            <main className="flex-1 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2 font-medium tracking-wide">
                            <a href="/problems" className="hover:text-white transition">Problems</a>
                            <span>/</span>
                            <a href={`/interview/${problemId}`} className="hover:text-white transition">{problem}</a>
                            <span>/</span>
                            <span className="text-green-500">Review</span>
                        </div>
                        <h1 className="text-3xl font-bold">{problem}</h1>
                    </div>
                    <div className="hidden lg:flex flex-wrap gap-3">
                        <SaveButton problemId={problemId} />
                        <a
                            href={`/architecture/${problemId}`}
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl transition text-sm font-medium"
                        >
                            View Architecture
                        </a>
                        <a
                            href="/problems"
                            className="px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl transition text-sm font-medium"
                        >
                            Back to Library
                        </a>
                        {!loading && !error && review && (
                            <button
                                onClick={handleShare}
                                disabled={sharing || !!shareUrl}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition text-sm font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {sharing ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                ) : shareUrl ? (
                                    "✓ Shared"
                                ) : (
                                    "🔗 Save & Share"
                                )}
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl transition text-sm font-medium flex items-center gap-2 print:hidden"
                        >
                            <FileText className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {shareUrl && (
                    <div className="mb-12 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-green-400 font-medium mb-1">Your public share link is ready!</p>
                            <a href={shareUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white underline decoration-gray-500 underline-offset-4">
                                {shareUrl}
                            </a>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                alert("Copied to clipboard!");
                            }}
                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm transition"
                        >
                            Copy Link
                        </button>
                    </div>
                )}

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

                            <CollapsibleSection title={<h3 className="text-green-400 font-semibold flex items-center gap-2"><span className="bg-green-500/20 p-1 rounded-md">👍</span> Strengths</h3>} defaultOpen={true}>
                                <ul className="space-y-3">
                                    {review.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-green-500/30 pl-3 py-1 break-words">
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleSection>

                            <CollapsibleSection title={<h3 className="text-red-400 font-semibold flex items-center gap-2"><span className="bg-red-500/20 p-1 rounded-md">⚠️</span> Weaknesses</h3>} defaultOpen={true}>
                                <ul className="space-y-3">
                                    {review.weaknesses?.map((w: string, i: number) => (
                                        <li key={i} className="text-gray-300 text-sm leading-relaxed border-l-2 border-red-500/30 pl-3 py-1 break-words">
                                            {w}
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleSection>
                        </div>

                        {/* Right Column: Deep Dive */}
                        <div className="lg:col-span-2 space-y-4 lg:space-y-8">
                            <CollapsibleSection className="bg-[#0f172a] border border-gray-800 shadow-xl" title={<h3 className="text-lg lg:text-xl font-bold text-white">System Architecture Summary</h3>}>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    {review.architectureSummary}
                                </p>
                            </CollapsibleSection>

                            <CollapsibleSection className="bg-[#020617] border border-gray-800 shadow-xl" title={<h3 className="text-lg lg:text-xl font-bold text-white">Component Explanations</h3>}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {review.componentExplanations?.map((comp: any, i: number) => (
                                        <div key={i} className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800/50 flex flex-col">
                                            <h4 className="font-semibold text-blue-400 mb-2 break-words">{comp.component}</h4>
                                            <p className="text-sm text-gray-400 leading-relaxed flex-1 break-words">{comp.reasoning}</p>
                                            
                                            {/* Explain Mistake Button/Result */}
                                            <div className="mt-4 pt-4 border-t border-gray-800/50 print:hidden">
                                                {explanations[comp.component] ? (
                                                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                                                        <h5 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                            <HelpCircle className="w-3.5 h-3.5" /> Coach Explanation
                                                        </h5>
                                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                            {explanations[comp.component]}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleExplainMistake(comp.component, comp.reasoning)}
                                                        disabled={explainingMap[comp.component]}
                                                        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                                                    >
                                                        {explainingMap[comp.component] ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <HelpCircle className="w-3.5 h-3.5" />
                                                        )}
                                                        {explainingMap[comp.component] ? "Analyzing..." : "Explain My Mistake"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 shadow-xl" title={<h3 className="text-lg lg:text-xl font-bold text-green-400">Recommended Improvements</h3>}>
                                <div className="space-y-4">
                                    {review.recommendedImprovements?.map((rec: string, i: number) => (
                                        <div key={i} className="flex gap-3 lg:gap-4 p-4 bg-black/40 rounded-2xl border border-gray-800/50">
                                            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold shrink-0 text-sm">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-300 text-[13px] lg:text-sm leading-relaxed pt-1 break-words">
                                                {rec}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        </div>
                    </div>
                ) : null}

                {/* ─── Model Answer ─── */}
                {!loading && review && (
                    <div className="mt-10">
                        <ModelAnswerCard
                            problemId={problemId}
                            problemTitle={scenario?.title ?? problemId}
                            problemStatement={scenario?.description ?? ""}
                            userAnswers={
                                (() => {
                                    const session = getSession(problemId);
                                    return session?.messages
                                        ?.filter((m: any) => m.role === "user")
                                        .map((m: any) => m.content)
                                        .join("\n\n");
                                })()
                            }
                            architectureResult={
                                (() => {
                                    const session = getSession(problemId);
                                    return session?.architecture ?? null;
                                })()
                            }
                            reviewScores={review}
                            weaknesses={review?.weaknesses}
                            cachedAnswer={modelAnswer}
                            onAnswerGenerated={handleModelAnswerGenerated}
                        />
                    </div>
                )}

                {/* ─── Comparison & Retry Section ─── */}
                {!loading && review && (
                    <div className="mt-10 space-y-8 print:hidden">
                        {/* Comparison */}
                        {modelAnswer && (
                            <div className="bg-gray-900/40 p-8 rounded-3xl border border-gray-800/50">
                                <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                    <GitMerge className="w-5 h-5 text-purple-400" />
                                    Your Design vs Model Answer
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/50 p-5 rounded-2xl border border-red-500/10">
                                        <h4 className="text-red-400 font-semibold mb-3">Missing from your answer</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {review.weaknesses?.map((w: string, i: number) => (
                                                <span key={i} className="text-[11px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
                                                    {w.substring(0, 40)}{w.length > 40 ? "..." : ""}
                                                </span>
                                            ))}
                                            {(!review.weaknesses || review.weaknesses.length === 0) && (
                                                <span className="text-gray-500 text-sm">Great job, no major misses!</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-black/50 p-5 rounded-2xl border border-green-500/10">
                                        <h4 className="text-green-400 font-semibold mb-3">Model Answer Focus</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {modelAnswer.bottlenecks?.slice(0, 3).map((b: string, i: number) => (
                                                <span key={i} className="text-[11px] px-2.5 py-1 rounded-md bg-green-500/10 text-green-300 border border-green-500/20">
                                                    {b.substring(0, 40)}{b.length > 40 ? "..." : ""}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Retry CTA */}
                        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-purple-950/10 overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-blue-400" />
                                    Retry with Feedback
                                </h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-xl">
                                    Practice this problem again in Improvement Mode. You'll get targeted hints based on your weakest areas from this attempt.
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="shrink-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
                            >
                                Start Improved Attempt
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
        
        {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#020617]/90 backdrop-blur-xl border-t border-gray-800 flex justify-between gap-2 z-50 print:hidden">
            <a
                href="/problems"
                className="px-4 py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl transition text-[13px] font-semibold flex-1 text-center"
            >
                Back
            </a>
            {!loading && !error && review && (
                <button
                    onClick={handleShare}
                    disabled={sharing || !!shareUrl}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl transition text-[13px] font-semibold flex-1 text-center shadow-lg disabled:opacity-50"
                >
                    {sharing ? "Sharing..." : shareUrl ? "✓ Shared" : "Share"}
                </button>
            )}
            <a
                href={`/architecture/${problemId}`}
                className="px-4 py-2.5 bg-gray-800 text-white hover:bg-gray-700 rounded-xl transition text-[13px] font-semibold flex-1 text-center whitespace-nowrap"
            >
                Architecture
            </a>
        </div>
        </div>
    );
}
