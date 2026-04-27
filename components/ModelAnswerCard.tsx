"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Layers,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  ArrowLeftRight,
  Database,
  Code2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import type { ModelAnswer } from "@/lib/sessionStorage";

interface ModelAnswerCardProps {
  problemId: string;
  problemTitle: string;
  problemStatement: string;
  userAnswers?: string;
  architectureResult?: any;
  reviewScores?: any;
  weaknesses?: string[];
  cachedAnswer?: ModelAnswer | null;
  onAnswerGenerated: (answer: ModelAnswer) => void;
}

function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-2 mb-3`}>
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <h3 className={`text-xs font-bold uppercase tracking-[0.12em] ${color}`}>
        {label}
      </h3>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#1E293B] text-[11px] text-[#94A3B8] font-medium">
      {text}
    </span>
  );
}

function BulletList({ items, dotColor = "text-[#6366F1]" }: { items: string[]; dotColor?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-[#94A3B8] leading-relaxed">
          <span className={`${dotColor} mt-[3px] shrink-0`}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ModelAnswerCard({
  problemId,
  problemTitle,
  problemStatement,
  userAnswers,
  architectureResult,
  reviewScores,
  weaknesses,
  cachedAnswer,
  onAnswerGenerated,
}: ModelAnswerCardProps) {
  const [revealed, setRevealed] = useState(!!cachedAnswer);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<ModelAnswer | null>(cachedAnswer ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    if (answer) {
      setRevealed(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/model-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          problemTitle,
          problemStatement,
          userAnswers,
          architectureResult,
          reviewScores,
          weaknesses,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate model answer");

      setAnswer(data);
      setRevealed(true);
      onAnswerGenerated(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCollapse = () => setRevealed(false);

  return (
    <div className="rounded-3xl border border-[#1E293B] bg-[#0F172A] overflow-hidden shadow-2xl">
      {/* ─── Header ─── */}
      <div className="px-6 py-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6366F1]/5 border border-[#6366F1]/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-[#6366F1]" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-tight">Model Solution</h2>
            <p className="text-[#94A3B8] text-[13px] mt-0.5">
              Reference architectural blueprint and tradeoff analysis.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6366F1] hover:bg-[#818CF8] text-white font-bold text-[13px] transition-all shadow-lg shadow-[#6366F1]/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Reveal Blueprint
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCollapse}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#070B14] border border-[#1E293B] text-[#94A3B8] hover:text-white text-[12px] font-bold transition-all"
            >
              <ChevronUp className="w-4 h-4" />
              Collapse
            </button>
          )}
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mx-6 mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[12px] font-bold">
          {error} — Showing fallback answer.
        </div>
      )}

      {/* ─── Content ─── */}
      {revealed && answer && (
        <div className="border-t border-[#1E293B] px-8 py-10 space-y-10 bg-white/[0.01]">

          {/* Overview */}
          <div>
            <SectionHeader icon={BookOpen} label="Overview" color="text-[#6366F1]" />
            <p className="text-[14px] text-[#E2E8F0] leading-relaxed font-medium">{answer.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Requirements */}
             {answer.requirements?.length > 0 && (
               <div>
                 <SectionHeader icon={CheckCircle2} label="Requirements" color="text-emerald-400" />
                 <BulletList items={answer.requirements} dotColor="text-emerald-500" />
               </div>
             )}

             {/* Scale Assumptions */}
             {answer.scaleAssumptions?.length > 0 && (
               <div>
                 <SectionHeader icon={TrendingUp} label="Scale Assumptions" color="text-amber-400" />
                 <BulletList items={answer.scaleAssumptions} dotColor="text-amber-500" />
               </div>
             )}
          </div>

          {/* API Design */}
          {answer.apiDesign?.length > 0 && (
            <div>
              <SectionHeader icon={Code2} label="API Design" color="text-[#6366F1]" />
              <div className="grid grid-cols-1 gap-3">
                {answer.apiDesign.map((api, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-[#070B14] border border-[#1E293B]"
                  >
                    <div className="px-2 py-1 rounded bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] text-[#6366F1] font-bold uppercase tracking-widest">{api.method}</div>
                    <code className="text-[12px] text-white font-mono bg-[#1E293B] px-2 py-1 rounded-md">
                      {api.endpoint}
                    </code>
                    <span className="text-[13px] text-[#94A3B8] font-medium">{api.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Model */}
          {answer.dataModel?.length > 0 && (
            <div>
              <SectionHeader icon={Database} label="Data Model" color="text-cyan-400" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {answer.dataModel.map((entity, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#070B14] border border-[#1E293B]"
                  >
                    <h4 className="text-[14px] font-bold text-white mb-3 font-mono">
                      {entity.entity}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {entity.fields.map((f, j) => (
                        <Tag key={j} text={f} />
                      ))}
                    </div>
                    {entity.notes && (
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed italic">{entity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture */}
          {answer.architecture?.length > 0 && (
            <div>
              <SectionHeader icon={Layers} label="Architecture" color="text-[#6366F1]" />
              <div className="space-y-3">
                {answer.architecture.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-2xl bg-[#070B14] border border-[#1E293B]"
                  >
                    <span className="text-[13px] font-bold text-white shrink-0 min-w-[160px]">
                      {item.component}
                    </span>
                    <span className="text-[13px] text-[#94A3B8] leading-relaxed font-medium">
                      {item.responsibility}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Tradeoffs */}
             {answer.tradeoffs?.length > 0 && (
               <div>
                 <SectionHeader icon={ArrowLeftRight} label="Tradeoffs" color="text-[#6366F1]" />
                 <BulletList items={answer.tradeoffs} dotColor="text-[#6366F1]" />
               </div>
             )}

             {/* Bottlenecks */}
             {answer.bottlenecks?.length > 0 && (
               <div>
                 <SectionHeader icon={AlertTriangle} label="Bottlenecks" color="text-red-400" />
                 <BulletList items={answer.bottlenecks} dotColor="text-red-500" />
               </div>
             )}
          </div>

          {/* How to explain */}
          {answer.howToExplainInInterview && (
            <div className="p-6 rounded-2xl bg-[#6366F1]/5 border border-[#6366F1]/10">
              <SectionHeader icon={MessageSquare} label="Coach Strategy" color="text-[#6366F1]" />
              <p className="text-[13px] text-[#E2E8F0] leading-relaxed italic font-medium">
                "{answer.howToExplainInInterview}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Loading skeleton ─── */}
      {loading && (
        <div className="border-t border-[#1E293B] px-8 py-12">
          <div className="flex flex-col items-center gap-4 text-[#94A3B8]">
            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            <p className="text-[12px] font-bold uppercase tracking-widest">Synthesizing System Blueprint…</p>
          </div>
          <div className="mt-10 space-y-4 max-w-md mx-auto">
            {[80, 60, 90].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-[#1E293B] animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
