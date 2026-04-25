import {
  Cpu,
  GitBranch,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI-Generated Architectures",
    description:
      "Gemini analyzes your interview answers and produces a production-grade system design diagram tailored to your choices.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: GitBranch,
    title: "Interactive System Diagrams",
    description:
      "Explore every node in your architecture. Click any component to see its purpose, scaling risks, and interview talking points.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: AlertTriangle,
    title: "Bottleneck Analysis",
    description:
      "Automatically identifies single points of failure, write contention, and cache-invalidation risks in your design.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: TrendingUp,
    title: "Scaling Recommendations",
    description:
      "Get actionable advice on read replicas, sharding strategies, async processing, and horizontal scaling patterns.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
];

const sampleNodes = [
  "Client App",
  "CDN",
  "API Gateway",
  "Auth Service",
  "Core Service",
  "PostgreSQL",
  "Redis Cache",
  "Kafka Queue",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* ─── HERO ─── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
        {/* Glow */}
        <div className="pointer-events-none absolute top-20 w-[700px] h-[700px] bg-purple-600/8 blur-[160px] rounded-full" />
        <div className="pointer-events-none absolute bottom-0 w-[500px] h-[300px] bg-blue-600/6 blur-[120px] rounded-full" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 text-xs font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            AI-Powered
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Practice System Design
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              With AI Feedback
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Practice system design interviews with AI-generated architecture
            reviews. Get interactive diagrams, bottleneck analysis, and scaling
            recommendations — all in real time.
          </p>

          <a
            href="/problems"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl shadow-white/5 hover:shadow-white/10"
          >
            Start Practicing
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need to ace system design
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`p-8 rounded-3xl border ${f.border} ${f.bg} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}
            >
              <div
                className={`w-12 h-12 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-5`}
              >
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ARCHITECTURE PREVIEW ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
            Preview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See what ScaleLab generates
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            A sample architecture for a URL Shortener — the kind of diagram and
            analysis you will get after every interview session.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-black/60 backdrop-blur-md p-8 shadow-2xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {sampleNodes.map((label) => (
              <div
                key={label}
                className="px-5 py-3 rounded-2xl border border-gray-700 bg-[#0f172a] text-sm font-medium text-gray-200 shadow-lg"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <p className="text-red-400 font-semibold mb-1">Bottleneck</p>
              <p className="text-gray-400">
                Single database write path creates contention under peak load.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <p className="text-blue-400 font-semibold mb-1">Tradeoff</p>
              <p className="text-gray-400">
                Chose SQL for consistency over NoSQL for flexible scaling.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
              <p className="text-green-400 font-semibold mb-1">
                Scaling Tip
              </p>
              <p className="text-gray-400">
                Add read replicas and partition the cache by key prefix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center px-6 pt-12 pb-28">
        <h2 className="text-3xl font-bold mb-4">Ready to practice?</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Pick a system design problem and get AI-powered feedback in minutes.
        </p>
        <a
          href="/problems"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-purple-500/20"
        >
          Browse Problems
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </section>
    </main>
  );
}