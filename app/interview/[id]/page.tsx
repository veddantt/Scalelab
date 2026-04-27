"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { saveSession, getSession, clearSession } from "@/lib/sessionStorage";
import { getProblem } from "@/lib/scenarios";
import { INTERVIEW_STEPS, ARCHITECTURE_STYLES } from "@/lib/config/workflow";
import { getHintForStep } from "@/lib/improvementHints";
import Navbar from "@/components/Navbar";
import SaveButton from "@/components/SaveButton";
import { Loader2, Send, Lock, CheckCircle2, Lightbulb, Zap, ArrowLeft, RefreshCw, Target } from "lucide-react";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const scenario = getProblem(problemId);
  const problem = scenario?.title;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("scalable-production");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"steps" | "score" | "arch">("steps");

  const [scores, setScores] = useState({
    clarity: 0,
    depth: 0,
    correctness: 0,
  });

  const [messages, setMessages] = useState<
    { role: string; content: string; feedback?: string }[]
  >([]);

  const [practiceMode, setPracticeMode] = useState(false);
  const [weakestAreas, setWeakestAreas] = useState<string[]>([]);
  const [improvementGoals, setImprovementGoals] = useState<string[]>([]);
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    const startInterview = async () => {
      if (!problem || messages.length > 0 || sending) return;
      setSending(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            problem,
            step: 0,
            practiceMode,
            weakestAreas,
            isInitialQuestion: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start interview");

        setMessages([
          {
            role: "ai",
            content: data.reply,
            feedback: data.feedback ?? undefined,
          },
        ]);
      } catch (error) {
        console.error("Error starting interview:", error);
        setToastMessage("Unable to start AI interview. Check your API configuration.");
        setTimeout(() => setToastMessage(null), 3000);
      } finally {
        setSending(false);
      }
    };

    if (problem && messages.length === 0) {
      startInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, messages.length]);

  const [input, setInput] = useState("");

  useEffect(() => {
    const session = getSession(String(problemId));
    if (session) {
      if (session.messages?.length) setMessages(session.messages);
      if (session.scores) setScores(session.scores);
      if (session.currentStep !== undefined) {
        setCurrentStep(session.currentStep);
        setHighestStep(session.highestStep !== undefined ? session.highestStep : session.currentStep);
      }
      if (session.practiceMode) setPracticeMode(session.practiceMode);
      if (session.weakestAreas) setWeakestAreas(session.weakestAreas);
      if (session.improvementGoals) setImprovementGoals(session.improvementGoals);
      if (session.attemptNumber) setAttemptNumber(session.attemptNumber);
    }
  }, [problemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          problem,
          step: currentStep,
          practiceMode,
          weakestAreas,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      const smoothed = {
        clarity: scores.clarity === 0
          ? data.scores.clarity
          : Math.round(scores.clarity * 0.7 + data.scores.clarity * 0.3),
        depth: scores.depth === 0
          ? data.scores.depth
          : Math.round(scores.depth * 0.7 + data.scores.depth * 0.3),
        correctness: scores.correctness === 0
          ? data.scores.correctness
          : Math.round(scores.correctness * 0.7 + data.scores.correctness * 0.3),
      };

      const aiMsg = {
        role: "ai",
        content: data.reply,
        feedback: data.feedback ?? undefined,
      };
      const finalMessages = [...newMessages, aiMsg];

      setMessages(finalMessages);
      setScores(smoothed);

      let newHighestStep = highestStep;
      let nextStep = currentStep;

      if (data.shouldAdvance && currentStep < INTERVIEW_STEPS.length - 1) {
        nextStep = currentStep + 1;
        newHighestStep = Math.max(highestStep, nextStep);

        const nextTitle = INTERVIEW_STEPS[nextStep]?.title ?? "Next Step";
        setToastMessage(`\u2713 Moving to: ${nextTitle}`);
        setTimeout(() => {
          setCurrentStep(nextStep);
          setHighestStep(newHighestStep);
          setToastMessage(null);
        }, 450);
      } else {
        setCurrentStep(nextStep);
        setHighestStep(newHighestStep);
      }

      const session = getSession(String(problemId));
      saveSession({
        id: String(problemId),
        problem: problem || "",
        messages: finalMessages,
        scores: smoothed,
        currentStep: nextStep,
        highestStep: newHighestStep,
        createdAt: session?.createdAt || new Date().toISOString(),
        attemptNumber: session?.attemptNumber || 1,
        originalSessionId: session?.originalSessionId,
        practiceMode: session?.practiceMode,
        weakestAreas: session?.weakestAreas,
        improvementGoals: session?.improvementGoals,
        modelAnswer: session?.modelAnswer,
      });
    } catch (error) {
      console.error(error);
      setMessages(newMessages);
      setToastMessage("Unable to contact AI service. Please try again.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateArchitecture = async () => {
    setGenerating(true);

    try {
      const archStyle = selectedStyle;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`arch-style-${problemId}`, archStyle);
      }

      const res = await fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          messages,
          architectureStyle: archStyle,
        }),
      });

      const data = await res.json();

      const session = getSession(String(problemId)) || {
        id: String(problemId),
        problem: problem || "",
        messages,
        scores,
        currentStep,
        highestStep,
        createdAt: new Date().toISOString(),
      };

      session.architecture = {
        nodes: data.nodes || [],
        edges: data.edges || [],
        summary: data.summary,
        score: data.score,
        bottlenecks: data.bottlenecks,
        tradeoffs: data.tradeoffs,
        scalingRecommendations: data.scalingRecommendations,
        isFallback: data.isFallback,
      };

      saveSession(session);

      setGenerating(false);
      router.push(`/architecture/${problemId}`);
    } catch (err) {
      console.error("Failed to generate architecture:", err);
      alert("Failed to generate architecture. Please try again.");
      setGenerating(false);
    }
  };

  const avgScore = Math.round(
    ((scores.clarity + scores.depth + scores.correctness) / 3) * 10
  );

  if (!scenario) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
          <p className="text-gray-400 mb-8 text-sm">The scenario you are looking for does not exist.</p>
          <a href="/problems" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition-colors">
            Browse Problems
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white overflow-hidden">
      <Navbar />

      {/* ─── Main Workspace ─── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden border-t border-slate-800/50">
        
        {/* ─── LEFT: Challenge Context & Sidebar ─── */}
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/60 bg-[#020617] z-10 overflow-y-auto custom-scrollbar">
          
          {/* Header Context */}
          <div className="p-5 border-b border-slate-800/60 shrink-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
              <a href="/problems" className="hover:text-gray-300 transition-colors">Problems</a>
              <span>/</span>
              <span className="text-purple-400/80 truncate">Interview</span>
            </div>
            
            <h1 className="text-xl font-bold text-white mb-2 leading-tight">{problem}</h1>
            <p className="text-gray-400 text-[13px] leading-relaxed mb-4">
              {scenario.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {scenario.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-gray-400 border border-slate-700/50"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Improvement Banner */}
            {practiceMode && attemptNumber > 1 && weakestAreas.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
                <Target className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Attempt {attemptNumber} Focus</h3>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    {getHintForStep(currentStep + 1, weakestAreas, improvementGoals) || "Focus on your previous feedback and improve your system design step by step."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Tabs */}
          <div className="flex-1 flex flex-col p-5">
            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Progress</span>
                <span className="text-[11px] font-bold text-purple-400">
                  {Math.round(((currentStep + 1) / INTERVIEW_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${((currentStep + 1) / INTERVIEW_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-1 p-1 mb-5 rounded-xl bg-slate-900/60 border border-slate-800/60 shrink-0">
              {(["steps", "score", "arch"] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => setSidebarTab(id)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                    sidebarTab === id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300 hover:bg-slate-800/40"
                  }`}
                >
                  {id === "arch" ? "Architecture" : id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              {/* ── STEPS TAB ── */}
              {sidebarTab === "steps" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    {INTERVIEW_STEPS.map((s: typeof INTERVIEW_STEPS[number], i: number) => {
                      const isLocked = i > highestStep;
                      const isCompleted = i < currentStep;
                      const isCurrent = i === currentStep;

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (isLocked) {
                              setToastMessage("Complete the current step first.");
                              setTimeout(() => setToastMessage(null), 3000);
                            } else {
                              setCurrentStep(i);
                            }
                          }}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            isCurrent
                              ? "bg-purple-500/10 border-purple-500/30"
                              : isCompleted
                                ? "bg-slate-900/40 border-slate-800/50 cursor-pointer hover:bg-slate-800/50"
                                : isLocked
                                  ? "bg-transparent border-transparent cursor-not-allowed opacity-40"
                                  : "bg-slate-900/20 border-slate-800/40 cursor-pointer hover:bg-slate-800/40"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all ${
                              isCurrent
                                ? "bg-purple-500 text-white"
                                : isCompleted
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                  : "bg-slate-800/80 border border-slate-700/60 text-gray-500"
                            }`}
                          >
                            {isCompleted ? "✓" : i + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span
                                className={`text-[12.5px] font-semibold leading-tight ${
                                  isCurrent ? "text-purple-300" : isCompleted ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {String(i + 1).padStart(2, "0")} {s.title}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  Current
                                </span>
                              )}
                              {isLocked && <Lock className="w-3 h-3 text-gray-600" />}
                            </div>
                            <p className={`text-[11px] leading-relaxed ${isCurrent ? "text-purple-400/70" : "text-gray-500"}`}>
                              {s.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 mt-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">AI Coach Tip</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {currentStep === 0 && "Start with users, core actions, and non-functional needs before discussing scale."}
                      {currentStep === 1 && "Estimate DAU, QPS, and storage. Use round numbers — precision isn't the goal."}
                      {currentStep === 2 && "Define REST or GraphQL endpoints. Show request/response shapes for core actions."}
                      {currentStep === 3 && "Choose SQL vs NoSQL and justify it. Mention indexing and data access patterns."}
                      {currentStep === 4 && "Sketch: client → gateway → services → storage. Name real components."}
                      {currentStep === 5 && "Identify the most critical failure point and explain how you'd mitigate it."}
                      {currentStep === 6 && "Summarize your decisions and be ready to defend each tradeoff clearly."}
                    </p>
                  </div>
                </div>
              )}

              {/* ── SCORE TAB ── */}
              {sidebarTab === "score" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="#1e293b" strokeWidth="6" />
                        <circle cx="48" cy="48" r="40" fill="transparent" stroke="url(#scoreGrad)" strokeWidth="6"
                          strokeDasharray="251.2" strokeLinecap="round"
                          strokeDashoffset={251.2 - (251.2 * avgScore) / 100}
                          className="transition-all duration-1000" />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{avgScore}</span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Score</span>
                      </div>
                    </div>
                  </div>
                  
                  {avgScore === 0 ? (
                    <p className="text-center text-[12px] text-gray-500 pt-2">
                      Answer a few questions to see your score.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: "Clarity", value: scores.clarity, color: "bg-blue-500" },
                        { label: "Depth", value: scores.depth, color: "bg-purple-500" },
                        { label: "Correctness", value: scores.correctness, color: "bg-emerald-500" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="p-3 rounded-xl border border-slate-800/60 bg-slate-900/40">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[12px] font-semibold text-gray-400">{label}</span>
                            <span className="text-[12px] font-bold text-gray-200">{value}<span className="text-gray-600 font-normal">/10</span></span>
                          </div>
                          <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ARCH TAB ── */}
              {sidebarTab === "arch" && (
                <div className="space-y-4">
                  <p className="text-[12px] text-gray-400 leading-relaxed mb-4">Architecture readiness based on your progress.</p>
                  <div className="space-y-2 mb-6">
                    {[
                      { label: "Requirements captured", done: highestStep > 0 },
                      { label: "Scale assumptions", done: highestStep > 1 },
                      { label: "APIs defined", done: highestStep > 2 },
                      { label: "Database selected", done: highestStep > 3 },
                      { label: "Architecture sketched", done: highestStep > 4 },
                      { label: "Bottlenecks reviewed", done: highestStep > 5 },
                    ].map(({ label, done }) => (
                      <div key={label} className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl border transition-colors ${done ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-800/50 bg-slate-900/30"}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? "text-emerald-500" : "text-gray-700"}`} />
                        <span className={`text-[12px] font-medium ${done ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-gray-500 mb-2">Select Style</p>
                    {ARCHITECTURE_STYLES.map((style: typeof ARCHITECTURE_STYLES[number]) => (
                      <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedStyle === style.id ? "border-purple-500/40 bg-purple-500/10 shadow-sm" : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/60"
                          }`}>
                        <span className={`font-semibold text-[13px] block mb-0.5 ${selectedStyle === style.id ? "text-purple-300" : "text-gray-300"}`}>{style.label}</span>
                        <span className="text-[11px] text-gray-500 leading-relaxed block">{style.description}</span>
                      </button>
                    ))}
                  </div>

                  <button onClick={handleGenerateArchitecture} disabled={generating || highestStep < 4}
                    className={`w-full py-3.5 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 mt-4 transition-all ${highestStep < 4 ? "bg-slate-800/50 text-gray-500 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"}`}>
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Zap className="w-4 h-4" />Generate Architecture</>}
                  </button>
                  {highestStep < 4 && (
                    <p className="text-center text-[10px] text-gray-500 mt-2">Complete {4 - highestStep} more step{4 - highestStep > 1 ? "s" : ""} to unlock generation.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ─── RIGHT: Chat Interface (Primary Focus) ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
          
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live Interview</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-gray-400 font-medium hidden sm:inline-block">
                Step {currentStep + 1}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-gray-300 text-[11px] font-semibold hidden sm:inline-block">
                {INTERVIEW_STEPS[currentStep].title}
              </span>
              <SaveButton problemId={problemId} />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar">
            {messages.length === 0 && !sending && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Initializing interview...</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-3xl ${msg.role === "ai" ? "" : "ml-auto"}`}
              >
                <div className="text-[11px] uppercase tracking-widest font-bold text-gray-500 mb-2">
                  {msg.role === "ai" ? "ScaleLab AI" : "You"}
                </div>
                <div
                  className={`p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === "ai"
                    ? "bg-slate-900/60 border border-slate-800/60 text-gray-200"
                    : "bg-purple-600/15 border border-purple-500/25 text-white"
                    }`}
                >
                  {msg.content}
                </div>
                {msg.role === "ai" && msg.feedback && (
                  <div className="mt-2.5 ml-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-[12px] text-blue-200/80 italic leading-relaxed">
                      <strong className="text-blue-400 not-italic mr-1.5 font-semibold text-[11px] uppercase tracking-wider">Feedback</strong>
                      {msg.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 border-t border-slate-800/60 bg-[#020617] shrink-0">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[14px] placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-slate-900/80 transition-all shadow-inner"
                placeholder="Type your response here..."
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10 shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-[13px] font-semibold shadow-2xl z-50 transition-all animate-in slide-in-from-bottom-5 ${toastMessage.startsWith("\u2713")
          ? "bg-emerald-950/90 border border-emerald-500/30 text-emerald-400"
          : "bg-red-950/90 border border-red-500/30 text-red-400"
          }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}