"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import AuthModal from "@/features/auth/components/AuthModal";
import { Zap, History, LogOut, ChevronDown, User } from "lucide-react";

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#020617]/80 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {/* Left */}
          <a href="/" className="flex items-center gap-2 group">
            <Zap className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition shrink-0" />
            <span className="hidden sm:inline text-sm font-bold tracking-wide">ScaleLab</span>
          </a>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="/problems"
              className="text-[13px] font-medium text-gray-500 hover:text-gray-300 transition"
            >
              Problems
            </a>

            {!loading && user && (
              <a
                href="/history"
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-300 transition"
              >
                <History className="w-3.5 h-3.5" />
                History
              </a>
            )}

            {loading ? (
              <div className="w-20 h-8 rounded-lg bg-gray-800/50 animate-pulse" />
            ) : user ? (
              /* ─── Logged in: avatar dropdown ─── */
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-gray-700 transition text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-300 text-[12px] max-w-[120px] truncate hidden sm:inline">
                    {user.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 py-1.5 bg-[#0a0f1e] border border-gray-800 rounded-xl shadow-2xl z-50">
                      <div className="px-3 py-2 border-b border-gray-800/50">
                        <p className="text-[11px] text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <a
                        href="/history"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900/60 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <History className="w-3.5 h-3.5" />
                        My History
                      </a>
                      <button
                        onClick={() => {
                          signOut();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-900/60 transition w-full text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ─── Logged out: sign in button ─── */
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-purple-500/30 text-[13px] font-medium text-gray-400 hover:text-white transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
