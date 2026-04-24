"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { saveSession, getSession } from "../../../lib/sessionStorage";

import { getScenario } from "../../../lib/scenarios";

const steps = [
    "Requirements",
    "Scale",
    "APIs",
    "Database",
    "Architecture",
    "Bottlenecks",
    "Review",
];

export default function InterviewPage() {
    const params = useParams();
    const problemId = params.id as string;
    const scenario = getScenario(problemId);
    const problem = scenario?.title || "System Design Problem";

    const [currentStep, setCurrentStep] = useState(0);

    const [scores, setScores] = useState({
        clarity: 0,
        depth: 0,
        correctness: 0,
    });

    const [messages, setMessages] = useState([
        {
            role: "ai",
            content: `Let's start with ${problem}. What are the functional requirements?`,
        },
    ]);

    const [input, setInput] = useState("");

    useEffect(() => {
        const session = getSession(String(problemId));
        if (session) {
            if (session.messages) setMessages(session.messages);
            if (session.scores) setScores(session.scores);
            if (session.currentStep !== undefined) setCurrentStep(session.currentStep);
        }
    }, [problemId]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user", content: input }];
        setMessages(newMessages);
        setInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: newMessages,
                    problem,
                    step: currentStep,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            const finalMessages = [
                ...newMessages,
                {
                    role: "ai",
                    content: data.reply,
                },
            ];

            setMessages(finalMessages);
            setScores(data.scores);

            const nextStep = data.shouldAdvance ? data.nextStep : currentStep;
            if (data.shouldAdvance) {
                setCurrentStep(data.nextStep);
            }

            saveSession({
                id: String(problemId),
                problem,
                messages: finalMessages,
                scores: data.scores,
                currentStep: nextStep,
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error(error);

            setMessages([
                ...newMessages,
                {
                    role: "ai",
                    content:
                        "Something went wrong while contacting the AI. Check your API key and terminal logs.",
                },
            ]);
        }
    };

    return (
        <main className="h-screen bg-black text-white flex">
            <div className="w-2/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-semibold">{problem}</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`max-w-xl ${msg.role === "ai" ? "text-blue-400" : "ml-auto text-white"
                                }`}
                        >
                            <div className="text-sm mb-1 opacity-70">
                                {msg.role === "ai" ? "AI" : "You"}
                            </div>

                            <div className="bg-gray-900 p-4 rounded-xl">{msg.content}</div>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-4 flex gap-4 justify-center">
                    <button
                        onClick={() => {
                            sessionStorage.setItem(`messages-${problemId}`, JSON.stringify(messages));
                            window.location.href = `/architecture/${problemId}`;
                        }}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold shadow-[0_0_15px_rgba(147,51,234,0.3)] transition text-center"
                    >
                        Generate Architecture →
                    </button>
                    <button
                        onClick={() => {
                            sessionStorage.setItem(`messages-${problemId}`, JSON.stringify(messages));
                            window.location.href = `/review/${problemId}`;
                        }}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold shadow-[0_0_15px_rgba(22,163,74,0.3)] transition text-center"
                    >
                        Generate Final Review →
                    </button>
                </div>

                <div className="p-4 border-t border-gray-800 flex gap-3">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-700"
                        placeholder="Type your answer..."
                    />

                    <button
                        onClick={sendMessage}
                        className="px-6 bg-white text-black rounded-xl font-medium"
                    >
                        Send
                    </button>

                    <button
                        onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 6))}
                        className="px-4 py-2 bg-gray-700 rounded-xl whitespace-nowrap"
                    >
                        Next Step →
                    </button>
                </div>
            </div>

            <div className="w-1/3 p-6">
                <h2 className="text-xl font-semibold mb-6">Interview Steps</h2>

                <ul className="space-y-4">
                    {steps.map((s, i) => (
                        <li
                            key={i}
                            className={
                                i === currentStep ? "text-white font-semibold" : "text-gray-500"
                            }
                        >
                            {s}
                        </li>
                    ))}
                </ul>

                <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
                    <h3 className="text-lg font-semibold mb-4">Live Score</h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Clarity</span>
                            <span>{scores.clarity}/10</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400">Depth</span>
                            <span>{scores.depth}/10</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-400">Correctness</span>
                            <span>{scores.correctness}/10</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}