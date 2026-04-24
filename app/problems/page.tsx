const problems = [
    "Design Uber",
    "Design Twitter Feed",
    "Design Netflix",
    "Design WhatsApp",
    "Design URL Shortener",
    "Design Rate Limiter",
    "Design Food Delivery App",
    "Design Real-Time Chat App",
];

export default function ProblemsPage() {
    return (
        <main className="min-h-screen bg-black text-white px-6 md:px-20 py-16">

            <h1 className="text-4xl md:text-5xl font-bold mb-12">
                Choose a Problem
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {problems.map((problem, index) => (
                    <a
                        key={index}
                        href={`/interview/${index}`}
                        className="group p-8 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900/40 to-black hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-medium">
                                {problem}
                            </span>

                            <span className="opacity-0 group-hover:opacity-100 transition">
                                →
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </main>
    );
}