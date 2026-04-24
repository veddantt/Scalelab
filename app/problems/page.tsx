import { scenarios } from "../../lib/scenarios";

export default function ProblemsPage() {
    return (
        <main className="min-h-screen bg-[#020617] text-white px-6 md:px-20 py-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-16">
                    <p className="text-purple-400 font-semibold tracking-wider uppercase text-sm mb-3">Scenario Library</p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Choose a Challenge
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl">
                        Select a system design problem to start your AI-powered mock interview.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenarios.map((scenario) => (
                        <a
                            key={scenario.id}
                            href={`/interview/${scenario.id}`}
                            className="group flex flex-col p-8 rounded-3xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:bg-gray-900/80 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                                    {scenario.title}
                                </h2>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                    scenario.difficulty === "Beginner" 
                                        ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                    : scenario.difficulty === "Intermediate"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}>
                                    {scenario.difficulty}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                                {scenario.description}
                            </p>

                            <div className="flex items-center text-sm font-semibold text-gray-500 group-hover:text-white transition-colors mt-auto">
                                Start Interview
                                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </main>
    );
}