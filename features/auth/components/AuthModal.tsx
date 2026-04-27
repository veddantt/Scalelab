"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { X, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful sign-in or sign-up */
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
  title?: string;
  description?: string;
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  initialMode = "signin",
  title,
  description,
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error);
        } else {
          onSuccess?.();
          onClose();
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error);
        } else {
          setSuccessMessage("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#070B14] border border-[#1E293B] rounded-[32px] shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#6366F1]" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#94A3B8] hover:text-white transition p-2 hover:bg-[#1E293B] rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10 pt-12">
          {/* Header */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {title || (mode === "signin" ? "Welcome back" : "Create Account")}
          </h2>
          <p className="text-[#94A3B8] text-[13px] font-medium mb-8">
            {description || (mode === "signin"
              ? "Access your saved interview sessions and history."
              : "Start saving your progress and architectural designs.")}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 p-1.5 bg-[#0F172A] border border-[#1E293B] rounded-2xl mb-8">
            <button
              onClick={() => { setMode("signin"); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition ${
                mode === "signin"
                  ? "bg-[#1E293B] text-white shadow-lg"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition ${
                mode === "signup"
                  ? "bg-[#1E293B] text-white shadow-lg"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-[12px] font-bold flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[12px] font-bold flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#6366F1] transition-colors" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-white text-sm placeholder-[#334155] focus:outline-none focus:border-[#6366F1]/50 transition-all font-medium"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#6366F1] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-white text-sm placeholder-[#334155] focus:outline-none focus:border-[#6366F1]/50 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#6366F1] hover:bg-[#818CF8] text-white font-bold text-[13px] uppercase tracking-widest transition-all shadow-lg shadow-[#6366F1]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : mode === "signin" ? (
                "Continue to Dashboard"
              ) : (
                "Create Master Account"
              )}
            </button>
          </form>

          {/* Switch */}
          <div className="mt-8 text-center">
            <button
              onClick={switchMode}
              className="text-[#94A3B8] hover:text-white text-[12px] font-bold uppercase tracking-widest transition-all"
            >
              {mode === "signin" ? "Need an account?" : "Back to Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
