"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { saveSession, getSession } from "../../../lib/sessionStorage";
import { getScenario } from "../../../lib/scenarios";
import Navbar from "../../components/Navbar";
import SaveButton from "../../components/SaveButton";
import { Loader2, Send, Lock, CheckCircle2, Lightbulb, Zap } from "lucide-react";

const steps = [
  { title: "Requirements", subtitle: "Core features & scope" },
  { title: "Scale", subtitle: "Traffic & data sizing" },
  { title: "APIs", subtitle: "Endpoints & contracts" },
  { title: "Database", subtitle: "Schema & storage" },
  { title: "Architecture", subtitle: "High-level components" },
  { title: "Bottlenecks", subtitle: "Failure points & limits" },
  { title: "Review", subtitle: "Final evaluation" },
];

const architectureStyles = [
  {
    id: "high-level",
    label: "High-Level Design",
    description: "Conceptual overview with major components",
  },
  {
    id: "scalable-production",
    label: "Scalable Production",
    description: "Load balancers, caches, queues, workers",
  },
  {
    id: "highly-available",
    label: "Highly Available",
    description: "Redundancy, failover, multi-region",
  },
];

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const scenario = getScenario(problemId);
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

  useEffect(() => {
    if (problem && messages.length === 0) {
      setMessages([
        {
          role: "ai",
          content: `Let's design: **${problem}**.\n\nWhat are the core functional requirements?`,
        },
      ]);
    }
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      // Weighted score smoothing: 70% old + 30% new
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

      if (data.shouldAdvance && currentStep < steps.length - 1) {
        nextStep = currentStep + 1;
        newHighestStep = Math.max(highestStep, nextStep);

        // Toast then advance after short delay
        const nextTitle = steps[nextStep]?.title ?? "Next Step";
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

      saveSession({
        id: String(problemId),
        problem: problem || "",
        messages: finalMessages,
        scores: smoothed,
        currentStep: nextStep,
        highestStep: newHighestStep,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      setMessages([
        ...newMessages,
        {
          role: "ai",
          content:
            "Something went wrong contacting the AI. Check your API key and try again.",
        },
      ]);
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
      
      // Save architecture to session
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
      <div className="h-screen flex flex-col bg-[#020617] text-white">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Problem Not Found</h1>
          <p className="text-gray-400 mb-8">The scenario you are looking for does not exist.</p>
          <a href="/problems" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition">
            Browse Problems
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#020617] text-white overflow-hidden">
      <Navbar />

      {/* ─── Content ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── LEFT: Chat ─── */}
        <div className="flex-1 border-r border-gray-800/50 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800/50 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5 font-medium tracking-wide">
                <a href="/problems" className="hover:text-white transition">Problems</a>
                <span>/</span>
                <a href={`/interview/${problemId}`} className="hover:text-white transition">{problem}</a>
                <span>/</span>
                <span className="text-purple-400">Interview</span>
              </div>
              <h1 className="text-lg font-semibold">{problem}</h1>
              {scenario && (
                <p className="text-xs text-gray-400 mt-1">{scenario.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SaveButton problemId={problemId} />
              <span className="text-xs text-gray-500 font-medium">
                Step {currentStep + 1}/{steps.length}
              </span>
              <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                {steps[currentStep].title}
              </span>
            </div>
          </div>

          {/* Problem Statement */}
          {scenario && (
            <div className="px-6 py-3 border-b border-gray-800/30 bg-gray-900/20">
              <div className="flex gap-2 flex-wrap">
                {scenario.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded bg-gray-800/50 text-gray-500 border border-gray-700/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-2xl ${msg.role === "ai" ? "" : "ml-auto"}`}
              >
                <div className="text-xs mb-1.5 text-gray-500 font-medium">
                  {msg.role === "ai" ? "ScaleLab AI" : "You"}
                </div>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "ai"
                      ? "bg-gray-900/60 border border-gray-800/50 text-gray-200"
                      : "bg-purple-600/20 border border-purple-500/20 text-white"
                  }`}
                >
                  {msg.content}
                </div>
                {/* Inline feedback under AI messages */}
                {msg.role === "ai" && msg.feedback && (
                  <p className="mt-1.5 px-1 text-[11px] text-gray-600 italic leading-relaxed">
                    {msg.feedback}
                  </p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800/50 bg-black/30">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 p-3.5 rounded-2xl bg-gray-900/80 border border-gray-700/50 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                placeholder="Type your answer..."
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="px-5 bg-white text-black rounded-2xl font-medium text-sm hover:bg-gray-100 transition disabled:opacity-40 flex items-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
        <aside className="w-[340px] flex flex-col bg-[#020617] border-l border-gray-800/50 overflow-hidden">

        {/* ─── Sidebar Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800/50 shrink-0 space-y-3">

          {/* Title */}
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
            System Design Interview
          </p>

          {/* Live badge + step counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80">
                Live Interview
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              Step {currentStep + 1}/{steps.length}
            </span>
          </div>

          {/* Progress bar with percentage */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-gray-600 font-medium">Progress</span>
              <span className="text-[10px] font-bold text-purple-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-gray-900/60 border border-gray-800/50">
            {(["steps", "score", "arch"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setSidebarTab(id)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                  sidebarTab === id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {id === "arch" ? "Architecture" : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* ── STEPS TAB ── */}
          {sidebarTab === "steps" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {steps.map((s, i) => {
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
                          ? "bg-purple-500/10 border-purple-500/30 shadow-[0_0_16px_rgba(168,85,247,0.1)]"
                          : isCompleted
                          ? "bg-gray-900/30 border-gray-800/40 cursor-pointer hover:bg-gray-800/40 hover:border-gray-700"
                          : isLocked
                          ? "bg-transparent border-transparent cursor-not-allowed opacity-40"
                          : "bg-gray-900/20 border-gray-800/30 cursor-pointer hover:bg-gray-800/30"
                      }`}
                    >
                      {/* Circle */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all ${
                          isCurrent
                            ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            : isCompleted
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                            : "bg-gray-800/80 border border-gray-700/60 text-gray-600"
                        }`}
                      >
                        {isCompleted ? "✓" : i + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span
                            className={`text-[12px] font-semibold leading-tight ${
                              isCurrent
                                ? "text-purple-200"
                                : isCompleted
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")} {s.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap shrink-0">
                              Current
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/70 border border-emerald-500/20 whitespace-nowrap shrink-0">
                              Done
                            </span>
                          )}
                          {isLocked && (
                            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-600 border border-gray-700/30 whitespace-nowrap shrink-0">
                              <Lock className="w-2 h-2" />
                              Locked
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed ${
                            isCurrent ? "text-purple-400/60" : "text-gray-600"
                          }`}
                        >
                          {s.subtitle}
                        </p>
                        {isCurrent && i < steps.length - 1 && (
                          <p className="text-[10px] text-purple-400/40 mt-1.5 italic">
                            Answer this step to unlock {steps[i + 1].title} →
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Coach Tip */}
              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    AI Coach Tip
                  </span>
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

              {/* Dev shortcut */}
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={() => { setHighestStep(6); setCurrentStep(6); }}
                  className="w-full py-1.5 rounded-lg border border-gray-700/40 text-[11px] text-gray-500 hover:text-gray-300 hover:border-gray-600 transition font-medium"
                >
                  Unlock demo flow
                </button>
              )}
            </div>
          )}

          {/* ── SCORE TAB ── */}
          {sidebarTab === "score" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-3">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="#1f2937" strokeWidth="6" />
                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="url(#scoreGrad)" strokeWidth="6"
                      strokeDasharray="251.2" strokeLinecap="round"
                      strokeDashoffset={251.2 - (251.2 * avgScore) / 100}
                      className="transition-all duration-1000" />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{avgScore}</span>
                    <span className="text-[10px] text-gray-500 font-medium">/ 100</span>
                  </div>
                </div>
              </div>
              {avgScore === 0 && (
                <p className="text-center text-[11px] text-gray-600 pb-1">
                  Not enough data yet — answer a few questions to see your score.
                </p>
              )}
              <div className="space-y-2.5">
                {[
                  { label: "Clarity", value: scores.clarity, bar: "from-blue-600 to-blue-400" },
                  { label: "Depth", value: scores.depth, bar: "from-purple-600 to-purple-400" },
                  { label: "Correctness", value: scores.correctness, bar: "from-emerald-600 to-emerald-400" },
                ].map(({ label, value, bar }) => (
                  <div key={label} className="p-3 rounded-xl bg-gray-900/40 border border-gray-800/50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">{label}</span>
                      <span className="text-[12px] font-bold text-gray-300">{value}<span className="text-gray-600 font-normal">/10</span></span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`} style={{ width: `${value * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {avgScore > 0 && (
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {avgScore >= 70 ? "Strong performance. Keep depth high — interviewers reward specificity." : "Good start. Give more concrete examples and specific technology choices."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ARCH TAB ── */}
          {sidebarTab === "arch" && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500">Architecture readiness based on your progress.</p>
              {[
                { label: "Requirements captured", done: highestStep > 0 },
                { label: "Scale assumptions", done: highestStep > 1 },
                { label: "APIs defined", done: highestStep > 2 },
                { label: "Database selected", done: highestStep > 3 },
                { label: "Architecture sketched", done: highestStep > 4 },
                { label: "Bottlenecks reviewed", done: highestStep > 5 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5 py-2 px-3 rounded-xl border border-gray-800/50 bg-gray-900/30">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? "text-emerald-500" : "text-gray-700"}`} />
                  <span className={`text-[12px] font-medium ${done ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
                </div>
              ))}
              <p className="text-[11px] text-gray-500 pt-1">
                {highestStep < 4 ? `Complete ${4 - highestStep} more step${4 - highestStep > 1 ? "s" : ""} before generating.` : "Ready to generate your architecture diagram."}
              </p>
              <div className="space-y-1.5">
                {architectureStyles.map((style) => (
                  <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition text-[12px] ${
                      selectedStyle === style.id ? "border-purple-500/40 bg-purple-500/10 text-white" : "border-gray-800/50 bg-gray-900/20 text-gray-400 hover:border-gray-700"
                    }`}>
                    <span className="font-semibold block">{style.label}</span>
                    <span className="text-[10px] text-gray-500">{style.description}</span>
                  </button>
                ))}
              </div>
              <button onClick={handleGenerateArchitecture} disabled={generating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-[13px] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Zap className="w-4 h-4" />Generate Architecture</>}
              </button>
            </div>
          )}
        </div>
        </aside>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl z-50 transition-all ${
          toastMessage.startsWith("\u2713")
            ? "bg-emerald-950 border border-emerald-500/30 text-emerald-400"
            : "bg-gray-900 border border-red-500/30 text-red-400"
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}