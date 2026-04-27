"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import AuthModal from "@/features/auth/components/AuthModal";
import Link from "next/link";
import { Zap, History, LogOut, ChevronDown, User } from "lucide-react";

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [menuOpen, setMenuOpen] = useState(false);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#070B14]/80 backdrop-blur-xl shrink-0 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {/* Left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center shadow-lg shadow-[#6366F1]/20 group-hover:shadow-[#6366F1]/40 transition-all">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">ScaleLab</span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/problems"
              className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-white transition-colors"
            >
              Problems
            </Link>

            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-20 h-8 rounded-lg bg-[#1E293B] animate-pulse" />
              ) : user ? (
                /* ─── Logged in: avatar dropdown ─── */
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-[#94A3B8]/20 transition-all text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#1E293B] border border-[#1E293B] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </div>
                    <span className="text-[#94A3B8] text-[12px] font-bold max-w-[120px] truncate hidden sm:inline">
                      {user.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl z-50">
                        <div className="px-3 py-2 border-b border-[#1E293B]">
                          <p className="text-[10px] font-bold text-[#94A3B8] truncate">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/history"
                          className="flex items-center gap-2 px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <History className="w-4 h-4" />
                          History
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2.5 text-[12px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/5 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* ─── Logged out: Auth buttons ─── */
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAuth("signin")}
                    className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-white transition-colors px-3 py-1.5"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="px-4 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#818CF8] text-[11px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-[#6366F1]/20 active:scale-95"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal 
        open={authOpen} 
        onClose={() => setAuthOpen(false)} 
        initialMode={authMode}
      />
    </>
  );
}
