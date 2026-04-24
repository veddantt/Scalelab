export default function Home() {
  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* subtle gradient glow */}
      <div className="pointer-events-none absolute top-1/3 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 text-center max-w-3xl">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
          ScaleLab
        </h1>

        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          Master system design interviews with AI. Practice, visualize, and simulate scalable architectures in real time.
        </p>

        <a
          href="/problems"
          className="inline-block px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-200 transition shadow-lg"
        >
          Start Practicing
        </a>
      </div>
    </main>
  );
}