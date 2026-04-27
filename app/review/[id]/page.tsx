"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GitMerge, RefreshCw, FileText, HelpCircle, Loader2, ChevronRight, Star, Target, Zap, Layout, BarChart3, CheckCircle2 } from "lucide-react";

import { getProblemMeta } from "@/lib/problems";
import { getSession, saveSession, ScaleLabSession } from "@/lib/sessionStorage";
import SaveButton from "@/components/SaveButton";
import ModelAnswerCard from "@/components/ModelAnswerCard";
import type { ModelAnswer } from "@/lib/sessionStorage";
import { motion, AnimatePresence } from "framer-motion";

function CollapsibleSection({ title, children, defaultOpen = false, className = "bg-[#0F172A] border border-[#1E293B]" }: { title: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean, className?: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`p-6 rounded-3xl ${className}`}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left focus:outline-none lg:pointer-events-none">
        {title}
        <ChevronRight className={`w-5 h-5 text-[#94A3B8] lg:hidden transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 lg:max-h-none lg:opacity-100 lg:mt-6 ${isOpen ? "max-h-[2500px] opacity-100 mt-6" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const problemId = params.id as string;
    const meta = getProblemMeta(problemId);
    const scenario = meta?.problem;
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

    if (!scenario) return <div className="h-screen bg-[#070B14] text-white flex items-center justify-center">Problem not found</div>;

    if (noReview) {
        return (
            <div className="h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center">
                <Layout className="w-16 h-16 text-[#1E293B] mb-6" />
                <h1 className="text-2xl font-bold text-white mb-2">Analysis Pending</h1>
                <p className="text-[#94A3B8] mb-8 max-w-sm">Complete your system design and generate an architecture to unlock the final review.</p>
                <button 
                  onClick={() => router.push(`/architecture/${problemId}`)}
                  className="px-8 py-3 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#6366F1]/20"
                >
                    Go to Architecture
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#070B14] text-[#E2E8F0]">
            <main className="max-w-6xl mx-auto p-6 md:p-12">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-[#1E293B] pb-10">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">
                            <a href="/problems" className="hover:text-white transition">Challenges</a>
                            <span>/</span>
                            <span className="text-[#6366F1]">Review</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">{problem}</h1>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <SaveButton problemId={problemId} />
                        <button 
                           onClick={() => window.print()}
                           className="px-5 py-2.5 rounded-xl border border-[#1E293B] bg-[#0F172A] text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-all text-sm font-bold flex items-center gap-2"
                        >
                           <FileText className="w-4 h-4" /> Export
                        </button>
                        <button
                          onClick={handleShare}
                          disabled={sharing || !!shareUrl}
                          className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#6366F1]/20 text-sm flex items-center gap-2"
                        >
                          {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                          {shareUrl ? "Shared" : "Save & Share"}
                        </button>
                    </div>
                </div>

                {shareUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-12 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-6"
                    >
                        <div className="min-w-0">
                            <p className="text-emerald-400 font-bold text-sm mb-1 uppercase tracking-wider">Share Link Ready</p>
                            <p className="text-[#94A3B8] text-[13px] truncate">{shareUrl}</p>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Copied!"); }} className="px-5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all shrink-0 uppercase tracking-widest">
                            Copy
                        </button>
                    </motion.div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                        <div className="w-10 h-10 border-4 border-[#6366F1]/30 border-t-[#6366F1] rounded-full animate-spin" />
                        <p className="text-[#94A3B8] font-bold uppercase tracking-widest text-[10px]">Generating Analytics...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Left Column: Scores */}
                        <div className="space-y-8">
                            <div className="bg-[#0F172A] border border-[#1E293B] p-10 rounded-3xl text-center relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#6366F1]" />
                                <h2 className="text-[#94A3B8] font-bold text-[10px] uppercase tracking-widest mb-4">Mastery Score</h2>
                                <div className="text-8xl font-black text-white tracking-tighter">
                                    {review.finalScore}<span className="text-2xl text-[#94A3B8] font-bold">/100</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                               <CollapsibleSection title={<h3 className="text-emerald-400 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">Strengths</h3>} defaultOpen={true}>
                                  <ul className="space-y-3">
                                      {review.strengths?.map((s: string, i: number) => (
                                          <li key={i} className="flex gap-3 text-[#E2E8F0] text-[13px] leading-relaxed group">
                                              <CheckCircle2 className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
                                              {s}
                                          </li>
                                      ))}
                                  </ul>
                               </CollapsibleSection>

                               <CollapsibleSection title={<h3 className="text-amber-400 font-bold flex items-center gap-2 uppercase tracking-widest text-xs">Weaknesses</h3>} defaultOpen={true}>
                                  <ul className="space-y-3">
                                      {review.weaknesses?.map((w: string, i: number) => (
                                          <li key={i} className="flex gap-3 text-[#E2E8F0] text-[13px] leading-relaxed">
                                              <Target className="w-4 h-4 text-amber-500/50 shrink-0 mt-0.5" />
                                              {w}
                                          </li>
                                      ))}
                                  </ul>
                               </CollapsibleSection>
                            </div>
                        </div>

                        {/* Right Column: Deep Dive */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 rounded-3xl bg-[#0F172A] border border-[#1E293B] shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                   <BarChart3 className="w-5 h-5 text-[#6366F1]" /> Architecture Analysis
                                </h3>
                                <p className="text-[#94A3B8] leading-relaxed text-[15px]">
                                    {review.architectureSummary}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest pl-4">Component Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {review.componentExplanations?.map((comp: any, i: number) => (
                                        <div key={i} className="p-6 rounded-3xl bg-[#0F172A] border border-[#1E293B] hover:bg-[#0F172A]/80 transition-all">
                                            <h4 className="font-bold text-[#6366F1] mb-3">{comp.component}</h4>
                                            <p className="text-[13px] text-[#94A3B8] leading-relaxed mb-6">{comp.reasoning}</p>
                                            
                                            <div className="pt-4 border-t border-[#1E293B]">
                                                {explanations[comp.component] ? (
                                                    <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B]">
                                                        <h5 className="text-[10px] font-bold text-[#6366F1] uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            <HelpCircle className="w-3.5 h-3.5" /> Coach Intel
                                                        </h5>
                                                        <p className="text-[12px] text-[#E2E8F0] leading-relaxed italic">
                                                            {explanations[comp.component]}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleExplainMistake(comp.component, comp.reasoning)}
                                                        disabled={explainingMap[comp.component]}
                                                        className="flex items-center gap-2 text-[11px] font-bold text-[#94A3B8] hover:text-[#6366F1] transition-all uppercase tracking-widest"
                                                    >
                                                        {explainingMap[comp.component] ? <Loader2 className="w-3 h-3 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                                                        Explain Mistake
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-[#0F172A] border border-[#1E293B] relative overflow-hidden group shadow-2xl">
                               <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#6366F1]/5 blur-[80px] rounded-full pointer-events-none" />
                               <h3 className="text-xl font-bold text-white mb-6 relative z-10">Recommended Roadmap</h3>
                               <div className="space-y-4 relative z-10">
                                    {review.recommendedImprovements?.map((rec: string, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 bg-[#070B14]/60 rounded-2xl border border-[#1E293B]">
                                            <div className="w-8 h-8 rounded-xl bg-[#6366F1] text-white flex items-center justify-center font-black shrink-0 text-sm">
                                                {i + 1}
                                            </div>
                                            <p className="text-[#E2E8F0] text-[13px] leading-relaxed pt-1.5">{rec}</p>
                                        </div>
                                    ))}
                               </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && review && (
                    <div className="mt-20 space-y-12">
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

                        <div className="p-10 rounded-3xl bg-[#0F172A] border border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-3">Mastered the concepts?</h3>
                                <p className="text-[#94A3B8] text-[15px] max-w-xl">Take what you've learned and start an improved attempt. We'll adjust the AI difficulty and provide smarter hints.</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="px-8 py-4 bg-[#6366F1] hover:bg-[#818CF8] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#6366F1]/20 whitespace-nowrap flex items-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" /> Retry with Intel
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
