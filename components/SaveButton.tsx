"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import AuthModal from "@/features/auth/components/AuthModal";
import { getSession } from "@/lib/sessionStorage";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";

interface SaveButtonProps {
  problemId: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function SaveButton({ problemId }: SaveButtonProps) {
  const { user } = useAuth();
  const [state, setState] = useState<SaveState>("idle");
  const [authOpen, setAuthOpen] = useState(false);

  const doSave = async () => {
    setState("saving");
    try {
      const session = getSession(problemId);
      if (!session) {
        throw new Error("No active session to save");
      }

      const payload = {
        problem_id: problemId,
        problem_title: session.problem,
        status:
          session.review ? "completed" : ("in_progress" as const),
        current_step: session.currentStep || 1,
        scores: session.scores || { clarity: 0, depth: 0, correctness: 0 },
        messages: session.messages || [],
        architecture: session.architecture
          ? {
              summary: session.architecture.summary,
              score: session.architecture.score,
              nodes: session.architecture.nodes,
              edges: session.architecture.edges,
              bottlenecks: session.architecture.bottlenecks,
              tradeoffs: session.architecture.tradeoffs,
              scalingRecommendations:
                session.architecture.scalingRecommendations,
              isFallback: (session.architecture as any).isFallback,
            }
          : undefined,
        review: session.review || undefined,
      };

      const res = await fetch("/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setState("saved");
      setTimeout(() => setState("idle"), 3000);
    } catch (err: any) {
      console.error("Save failed:", err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const handleClick = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    doSave();
  };

  const handleAuthSuccess = () => {
    // After successful login, trigger the save
    setTimeout(() => doSave(), 300);
  };

  const stateConfig = {
    idle: {
      icon: Save,
      text: "Save",
      className:
        "bg-gray-900/60 border-gray-800/50 hover:border-purple-500/30 text-gray-400 hover:text-white",
    },
    saving: {
      icon: Loader2,
      text: "Saving...",
      className:
        "bg-gray-900/60 border-gray-800/50 text-gray-400 cursor-wait",
    },
    saved: {
      icon: Check,
      text: "Saved!",
      className:
        "bg-green-500/10 border-green-500/20 text-green-400",
    },
    error: {
      icon: AlertCircle,
      text: "Failed",
      className:
        "bg-red-500/10 border-red-500/20 text-red-400",
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === "saving"}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${config.className}`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${state === "saving" ? "animate-spin" : ""}`}
        />
        {config.text}
      </button>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
