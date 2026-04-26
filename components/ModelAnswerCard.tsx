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
    <span className="inline-block px-2 py-0.5 rounded-md bg-gray-800/60 border border-gray-700/40 text-[11px] text-gray-300 font-medium">
      {text}
    </span>
  );
}

function BulletList({ items, dotColor = "text-purple-500" }: { items: string[]; dotColor?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-gray-300 leading-relaxed">
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
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-blue-950/10 overflow-hidden">
      {/* ─── Header ─── */}
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-[15px]">Model Answer</h2>
            <p className="text-gray-400 text-[12px] mt-0.5">
              See how a strong candidate would structure this system design answer.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-[13px] transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Reveal Model Answer
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCollapse}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800/60 border border-gray-700/40 text-gray-400 hover:text-white text-[12px] font-medium transition"
            >
              <ChevronUp className="w-4 h-4" />
              Collapse
            </button>
          )}
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mx-6 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
          {error} — Showing fallback answer.
        </div>
      )}

      {/* ─── Content ─── */}
      {revealed && answer && (
        <div className="border-t border-purple-500/10 px-6 py-6 space-y-7">

          {/* Overview */}
          <div>
            <SectionHeader icon={BookOpen} label="Overview" color="text-purple-400" />
            <p className="text-[13px] text-gray-300 leading-relaxed">{answer.overview}</p>
          </div>

          {/* Requirements */}
          {answer.requirements?.length > 0 && (
            <div>
              <SectionHeader icon={CheckCircle2} label="Requirements" color="text-blue-400" />
              <BulletList items={answer.requirements} dotColor="text-blue-500" />
            </div>
          )}

          {/* Scale Assumptions */}
          {answer.scaleAssumptions?.length > 0 && (
            <div>
              <SectionHeader icon={TrendingUp} label="Scale Assumptions" color="text-emerald-400" />
              <BulletList items={answer.scaleAssumptions} dotColor="text-emerald-500" />
            </div>
          )}

          {/* API Design */}
          {answer.apiDesign?.length > 0 && (
            <div>
              <SectionHeader icon={Code2} label="API Design" color="text-cyan-400" />
              <div className="space-y-2">
                {answer.apiDesign.map((api, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-start gap-2.5 p-3 rounded-xl bg-gray-900/40 border border-gray-800/40"
                  >
                    <Tag text={api.method} />
                    <code className="text-[12px] text-cyan-300 font-mono bg-gray-800/60 px-2 py-0.5 rounded-md">
                      {api.endpoint}
                    </code>
                    <span className="text-[12px] text-gray-400 flex-1">{api.purpose}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Model */}
          {answer.dataModel?.length > 0 && (
            <div>
              <SectionHeader icon={Database} label="Data Model" color="text-violet-400" />
              <div className="space-y-3">
                {answer.dataModel.map((entity, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/40"
                  >
                    <h4 className="text-[13px] font-semibold text-violet-300 mb-2 font-mono">
                      {entity.entity}
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {entity.fields.map((f, j) => (
                        <Tag key={j} text={f} />
                      ))}
                    </div>
                    {entity.notes && (
                      <p className="text-[11px] text-gray-500 leading-relaxed">{entity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture */}
          {answer.architecture?.length > 0 && (
            <div>
              <SectionHeader icon={Layers} label="Architecture" color="text-orange-400" />
              <div className="space-y-2">
                {answer.architecture.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-800/40"
                  >
                    <span className="text-[12px] font-semibold text-orange-300 shrink-0 min-w-[160px]">
                      {item.component}
                    </span>
                    <span className="text-[12px] text-gray-400 leading-relaxed">
                      {item.responsibility}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tradeoffs */}
          {answer.tradeoffs?.length > 0 && (
            <div>
              <SectionHeader icon={ArrowLeftRight} label="Tradeoffs" color="text-blue-400" />
              <BulletList items={answer.tradeoffs} dotColor="text-blue-500" />
            </div>
          )}

          {/* Bottlenecks */}
          {answer.bottlenecks?.length > 0 && (
            <div>
              <SectionHeader icon={AlertTriangle} label="Bottlenecks" color="text-red-400" />
              <BulletList items={answer.bottlenecks} dotColor="text-red-500" />
            </div>
          )}

          {/* Scaling Plan */}
          {answer.scalingPlan?.length > 0 && (
            <div>
              <SectionHeader icon={GitBranch} label="Scaling Plan" color="text-emerald-400" />
              <BulletList items={answer.scalingPlan} dotColor="text-emerald-500" />
            </div>
          )}

          {/* How to explain */}
          {answer.howToExplainInInterview && (
            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/20">
              <SectionHeader icon={MessageSquare} label="How to Explain in an Interview" color="text-purple-400" />
              <p className="text-[13px] text-gray-300 leading-relaxed">
                {answer.howToExplainInInterview}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Loading skeleton ─── */}
      {loading && (
        <div className="border-t border-purple-500/10 px-6 py-8">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <p className="text-[13px] font-medium">Generating model answer…</p>
            <p className="text-[11px] text-gray-600">This may take 10–20 seconds</p>
          </div>
          <div className="mt-6 space-y-3">
            {[80, 60, 90, 50, 70].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full bg-gray-800/60 animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
