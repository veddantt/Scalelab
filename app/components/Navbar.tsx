import { Zap } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-[#020617]/80 backdrop-blur-xl shrink-0">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <Zap className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition" />
          <span className="text-sm font-bold tracking-wide">ScaleLab</span>
        </a>
        <a
          href="/problems"
          className="text-[13px] font-medium text-gray-500 hover:text-gray-300 transition"
        >
          Problems
        </a>
      </div>
    </nav>
  );
}
