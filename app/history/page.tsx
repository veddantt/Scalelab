"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import AuthModal from "@/features/auth/components/AuthModal";
import Navbar from "@/components/Navbar";
import { restoreSession } from "@/lib/sessionRestore";
import { getProblem } from "@/lib/scenarios";
import {
  Clock,
  Trash2,
  ArrowRight,
  Loader2,
  Eye,
  Play,
  Link2,
  MessageCircle,
  Truck,
  ShieldCheck,
  HardDrive,
  Bell,
  Zap,
} from "lucide-react";

const iconMap: Record<string, any> = {
  "url-shortener": Link2,
  "real-time-chat": MessageCircle,
  "food-delivery": Truck,
  "rate-limiter": ShieldCheck,
  "file-storage": HardDrive,
  "notification-system": Bell,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      if (res.status === 401) {
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchSessions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const handleRestore = async (sessionId: string, target: "interview" | "review") => {
    setRestoringId(sessionId);
    try {
      const problemId = await restoreSession(sessionId);
      if (target === "review") {
        router.push(`/review/${problemId}`);
      } else {
        router.push(`/interview/${problemId}`);
      }
    } catch (err) {
      console.error("Restore failed:", err);
      alert("Failed to restore session. Please try again.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this saved session? This cannot be undone.")) return;
    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete session.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-24">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3 font-medium tracking-wide">
            <a href="/" className="hover:text-white transition">
              ScaleLab
            </a>
            <span>/</span>
            <span className="text-purple-400">History</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Interview{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              History
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Your saved interview sessions, ready to review or continue.
          </p>
        </div>

        {/* ─── Progress Analytics ─── */}
        {!authLoading && user && sessions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-gray-900/40 border border-gray-800/50 p-5 rounded-2xl">
              <p className="text-gray-400 text-sm font-medium mb-1">Total Practices</p>
              <h3 className="text-3xl font-bold text-white">{sessions.length}</h3>
            </div>
            <div className="bg-gray-900/40 border border-gray-800/50 p-5 rounded-2xl">
              <p className="text-gray-400 text-sm font-medium mb-1">Avg Score</p>
              <h3 className="text-3xl font-bold text-purple-400">
                {Math.round(
                  sessions.reduce((acc, s) => {
                    const score = (s.review_results && s.review_results.length > 0 && s.review_results[0].final_score) 
                      ? s.review_results[0].final_score 
                      : s.overall_score || 0;
                    return acc + score;
                  }, 0) / sessions.length
                )}
              </h3>
            </div>
            <div className="bg-gray-900/40 border border-gray-800/50 p-5 rounded-2xl">
              <p className="text-gray-400 text-sm font-medium mb-1">Best Score</p>
              <h3 className="text-3xl font-bold text-green-400">
                {Math.max(...sessions.map(s => (s.review_results && s.review_results.length > 0 && s.review_results[0].final_score) ? s.review_results[0].final_score : s.overall_score || 0))}
              </h3>
            </div>
            <div className="bg-gray-900/40 border border-gray-800/50 p-5 rounded-2xl">
              <p className="text-gray-400 text-sm font-medium mb-1">Last Practice</p>
              <h3 className="text-xl font-bold text-white mt-1">
                {new Date(sessions[0]?.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </h3>
            </div>
          </div>
        )}

        {/* ─── Not logged in ─── */}
        {!authLoading && !user && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Sign in to view your history
            </h2>
            <p className="text-gray-400 max-w-md mb-6">
              Create an account or sign in to save your interview sessions and
              track your progress over time.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg hover:shadow-purple-500/25"
            >
              Sign In
            </button>
            <AuthModal
              open={authOpen}
              onClose={() => setAuthOpen(false)}
              onSuccess={() => fetchSessions()}
            />
          </div>
        )}

        {/* ─── Loading ─── */}
        {loading && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-gray-900/40 border border-gray-800/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchSessions}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Empty ─── */}
        {!loading && !error && user && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/60 border border-gray-700/40 flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-3">
              No saved interviews yet
            </h2>
            <p className="text-gray-400 max-w-md mb-6">
              Start an interview from the Problems page, then click "Save" to
              store your progress.
            </p>
            <a
              href="/problems"
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Browse Problems
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* ─── Session Cards ─── */}
        {!loading && !error && user && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((s) => {
              const scenario = getProblem(s.problem_id);
              const Icon = iconMap[s.problem_id] || Link2;
              const isCompleted = s.status === "completed";
              const hasArch =
                s.architecture_results && s.architecture_results.length > 0;
              const hasReview =
                s.review_results && s.review_results.length > 0;
              const score =
                hasReview && s.review_results[0]?.final_score
                  ? s.review_results[0].final_score
                  : s.overall_score;

              return (
                <div
                  key={s.id}
                  className="group flex flex-col p-6 rounded-2xl border border-gray-800/60 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-700/60"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-800/60 border border-gray-700/40 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2">
                        {score && (
                          <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {score}/100
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            isCompleted
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {isCompleted ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      {s.attempt_number > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Attempt {s.attempt_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {s.problem_title}
                  </h3>
                  <p className="text-gray-500 text-[12px] mb-4">
                    {timeAgo(s.updated_at)} · Step {s.current_step}/7
                    {hasArch && " · Architecture"}
                    {hasReview && " · Review"}
                  </p>

                  {/* Tags */}
                  {scenario && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {scenario.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/60 text-gray-500 border border-gray-700/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-800/40">
                    <button
                      onClick={() =>
                        handleRestore(
                          s.id,
                          isCompleted ? "review" : "interview"
                        )
                      }
                      disabled={restoringId === s.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-purple-500/30 text-[12px] font-medium text-gray-400 hover:text-white transition disabled:opacity-50"
                    >
                      {restoringId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isCompleted ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isCompleted ? "View" : "Continue"}
                    </button>

                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="px-3 py-2 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-red-500/30 text-gray-500 hover:text-red-400 transition disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
