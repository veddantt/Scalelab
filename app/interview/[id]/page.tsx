"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { saveSession, getSession } from "@/lib/sessionStorage";
import { getProblemMeta } from "@/lib/problems";
import { INTERVIEW_STEPS, ARCHITECTURE_STYLES } from "@/lib/config/workflow";
import SaveButton from "@/components/SaveButton";
import { 
  Loader2, 
  Send, 
  Lock, 
  CheckCircle2, 
  Lightbulb, 
  Zap, 
  Target, 
  Layout, 
  BarChart3, 
  Info,
  Users,
  Globe,
  Database,
  Cpu,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const meta = getProblemMeta(problemId);
  const scenario = meta?.problem;
  const problem = scenario?.title;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("scalable-production");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [rightTab, setRightTab] = useState<"score" | "arch" | "info">("score");

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
  const [input, setInput] = useState("");

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
        setToastMessage("Unable to start AI interview.");
      } finally {
        setSending(false);
      }
    };

    if (problem && messages.length === 0) {
      startInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, messages.length]);

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
        clarity: scores.clarity === 0 ? data.scores.clarity : Math.round(scores.clarity * 0.7 + data.scores.clarity * 0.3),
        depth: scores.depth === 0 ? data.scores.depth : Math.round(scores.depth * 0.7 + data.scores.depth * 0.3),
        correctness: scores.correctness === 0 ? data.scores.correctness : Math.round(scores.correctness * 0.7 + data.scores.correctness * 0.3),
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
        setToastMessage(`\u2713 Moving to: ${INTERVIEW_STEPS[nextStep].title}`);
        setTimeout(() => {
          setCurrentStep(nextStep);
          setHighestStep(newHighestStep);
          setToastMessage(null);
        }, 800);
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
        createdAt: getSession(String(problemId))?.createdAt || new Date().toISOString(),
        attemptNumber: getSession(String(problemId))?.attemptNumber || 1,
      });
    } catch (error) {
      console.error(error);
      setToastMessage("Unable to contact AI service.");
    } finally {
      setSending(false);
    }
  };

  const handleGenerateArchitecture = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, messages, architectureStyle: selectedStyle }),
      });
      const data = await res.json();
      const session = getSession(String(problemId)) || { id: String(problemId), problem: problem || "", messages: messages, scores, currentStep, highestStep, createdAt: new Date().toISOString() };
      session.architecture = data;
      saveSession(session);
      router.push(`/architecture/${problemId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate architecture.");
    } finally {
      setGenerating(false);
    }
  };

  const avgScore = Math.round(((scores.clarity + scores.depth + scores.correctness) / 3) * 10);

  if (!scenario || !meta) return <div className="h-screen bg-[#070B14] text-white flex items-center justify-center">Problem not found</div>;

  return (
    <div className="flex h-[calc(100vh-58px)] bg-[#070B14] text-[#E2E8F0] overflow-hidden">
      
      {/* ── LEFT: Interview Timeline (Steps) ── */}
      <aside className="w-[300px] border-r border-[#1E293B] bg-[#070B14] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#1E293B] shrink-0">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-1.5">Interview Session</div>
          <h1 className="text-lg font-bold text-white truncate">{problem}</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {INTERVIEW_STEPS.map((s, i) => {
            const isLocked = i > highestStep;
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;

            return (
              <button
                key={i}
                disabled={isLocked}
                onClick={() => setCurrentStep(i)}
                className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  isCurrent 
                    ? "bg-[#6366F1]/10 border-[#6366F1]/30 text-white" 
                    : isCompleted
                      ? "bg-emerald-500/5 border-emerald-500/20 text-[#E2E8F0]/80"
                      : "bg-[#0F172A]/40 border-[#1E293B] text-[#94A3B8] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${
                    isCurrent ? "bg-[#6366F1] text-white" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-[#1E293B] text-[#94A3B8]"
                  }`}>
                    {isCompleted ? "✔" : i + 1}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold mb-0.5">{s.title}</div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isCurrent ? "text-[#6366F1]/80" : "text-[#94A3B8]"}`}>
                      {s.subtitle}
                    </p>
                  </div>
                </div>
                {isLocked && <Lock className="absolute top-3 right-3 w-3 h-3 text-[#1E293B]" />}
                {isCurrent && <motion.div layoutId="activeStep" className="absolute left-0 top-0 bottom-0 w-1 bg-[#6366F1]" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#1E293B]">
          <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B]">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Coach Tip</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed italic">
              {INTERVIEW_STEPS[currentStep].subtitle} Focus on clarity over complexity.
            </p>
          </div>
        </div>
      </aside>

      {/* ── CENTER: Chat Interface ── */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#070B14]">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between shrink-0 bg-[#070B14]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Session Active</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-[#070B14] bg-[#6366F1] flex items-center justify-center text-[10px] font-bold">AI</div>
                <div className="w-6 h-6 rounded-full border-2 border-[#070B14] bg-[#1E293B] flex items-center justify-center text-[10px] font-bold italic">Me</div>
             </div>
             <SaveButton problemId={problemId} />
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                msg.role === "ai" ? "bg-[#6366F1] shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-[#1E293B]"
              }`}>
                {msg.role === "ai" ? <Zap className="w-4 h-4 text-white fill-white" /> : <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />}
              </div>
              <div className="space-y-3 min-w-0">
                <div className={`p-5 rounded-2xl text-[14px] leading-relaxed shadow-lg ${
                  msg.role === "ai" 
                    ? "bg-[#0F172A] border border-[#1E293B] text-[#E2E8F0]" 
                    : "bg-[#6366F1]/15 border border-[#6366F1]/25 text-white"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "ai" && msg.feedback && (
                  <div className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-[#6366F1]/5 border border-[#6366F1]/10">
                    <Target className="w-3.5 h-3.5 text-[#6366F1] mt-0.5 shrink-0" />
                    <p className="text-[12px] text-[#6366F1]/80 italic leading-relaxed">{msg.feedback}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <div className="p-6 border-t border-[#1E293B] bg-[#070B14]">
          <div className="max-w-4xl mx-auto relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your system design decisions..."
              className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-[#6366F1]/50 rounded-2xl px-6 py-5 pr-16 text-[14px] outline-none transition-all placeholder:text-[#94A3B8]/40 focus:bg-[#0F172A]/80"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="absolute right-3 top-3 bottom-3 px-4 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6366F1]/20"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="text-center mt-3 text-[10px] text-[#94A3B8]/60 font-mono tracking-tight">
            Use shortcuts: [Ctrl+Enter] to send · ScaleLab AI v2.0
          </div>
        </div>
      </section>

      {/* ── RIGHT: Tabs (Score & Architecture) ── */}
      <aside className="w-[320px] border-l border-[#1E293B] bg-[#070B14] flex flex-col shrink-0 h-full min-h-0 overflow-hidden">
        <div className="flex border-b border-[#1E293B] shrink-0">
           {[
             { id: "score", icon: BarChart3 },
             { id: "arch", icon: Layout },
             { id: "info", icon: Info }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setRightTab(tab.id as any)}
               className={`flex-1 flex flex-col items-center py-4 transition-all relative ${
                 rightTab === tab.id ? "text-[#6366F1] bg-[#6366F1]/5" : "text-[#94A3B8] hover:text-white"
               }`}
             >
               <tab.icon className="w-5 h-5 mb-1" />
               <span className="text-[10px] font-bold uppercase tracking-widest">{tab.id}</span>
               {rightTab === tab.id && <motion.div layoutId="rightTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-12 custom-scrollbar">
          {rightTab === "score" && (
            <div className="space-y-8">
              <div className="text-center">
                 <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="8" />
                      <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={364} strokeDashoffset={364 - (364 * avgScore) / 100} className="text-[#6366F1] transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-bold text-white">{avgScore}</span>
                       <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Score</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Clarity", val: scores.clarity, color: "bg-[#6366F1]" },
                  { label: "Depth", val: scores.depth, color: "bg-[#6366F1]" },
                  { label: "Correctness", val: scores.correctness, color: "bg-emerald-500" }
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] font-medium text-[#94A3B8]">{s.label}</span>
                      <span className="text-[12px] font-bold text-white">{s.val}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0F172A] overflow-hidden border border-[#1E293B]">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${s.val * 10}%` }} className={`h-full ${s.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightTab === "arch" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Model Style</p>
                {ARCHITECTURE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedStyle === style.id 
                        ? "bg-[#6366F1]/10 border-[#6366F1]/30 text-white" 
                        : "bg-[#0F172A]/40 border-[#1E293B] text-[#94A3B8]"
                    }`}
                  >
                    <div className="text-[13px] font-bold mb-1">{style.label}</div>
                    <p className="text-[11px] leading-relaxed opacity-60">{style.description}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateArchitecture}
                disabled={generating || highestStep < 4}
                className="w-full py-4 bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-2xl font-bold text-[13px] shadow-lg shadow-[#6366F1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Generate Diagram
              </button>
              {highestStep < 4 && (
                <p className="text-center text-[10px] text-[#94A3B8]">Reach Step 5 to unlock architecture generation.</p>
              )}
            </div>
          )}

          {rightTab === "info" && (
            <div className="space-y-6">
               <div>
                  <h4 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Challenge Info</h4>
                  <p className="text-[13px] text-[#94A3B8] leading-relaxed mb-4">{scenario.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {scenario.tags.map(t => (
                      <span key={t} className="px-2 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-[10px] text-[#94A3B8] font-bold">{t}</span>
                    ))}
                  </div>
               </div>
               
               <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-3">System Profile</h4>
                  {[
                    { icon: Users, label: "Users", val: meta.systemProfile.users },
                    { icon: Zap, label: "QPS", val: meta.systemProfile.qps },
                    { icon: Globe, label: "Latency", val: meta.systemProfile.latency },
                    { icon: Database, label: "Storage", val: meta.systemProfile.storage },
                    { icon: Cpu, label: "Type", val: meta.systemProfile.type }
                  ].map((stat) => (
                    <div key={stat.label} className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                       <div className="flex items-center gap-2 mb-1">
                          <stat.icon className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">{stat.label}</span>
                       </div>
                       <div className="text-[13px] font-bold text-white">{stat.val}</div>
                    </div>
                  ))}
               </div>

               <div className="p-5 rounded-2xl bg-[#0F172A] border-l-2 border-l-[#6366F1] border border-[#1E293B]">
                  <div className="flex items-center gap-2 mb-3">
                     <Activity className="w-4 h-4 text-[#94A3B8]" />
                     <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Interview Mode</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed italic">
                    "{meta.systemProfile.interviewGuidance || 'Focus on scaling bottlenecks, data models, and component tradeoffs.'}"
                  </p>
               </div>
            </div>
          )}
        </div>
      </aside>

      {/* Toast Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-[13px] shadow-2xl z-[100] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}