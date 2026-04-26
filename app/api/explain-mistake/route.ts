import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { problemTitle, problemStatement, component, reasoning, userAnswers } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert system design coach. The user recently completed a mock interview for the problem: "${problemTitle}".
    
Problem Statement: ${problemStatement}

The user's architecture was evaluated and flagged with a weakness regarding a specific component/decision.
Component: ${component}
Reviewer's Reasoning: ${reasoning}

Based on the user's answers below, provide a detailed, supportive explanation of WHY their approach was suboptimal or missing, and how a senior engineer would think about this component in this specific system.
Keep it concise, actionable, and focus on trade-offs.

User's Answers During Interview:
${userAnswers}
`;

    const openRouterMessages = [{ role: "system", content: systemPrompt }];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "ScaleLab - Explain Mistake",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: openRouterMessages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[explain-mistake] OpenRouter API Error:", errorText);
      throw new Error(`OpenRouter API Error: ${res.status}`);
    }

    const data = await res.json();
    const explanation = data.choices[0]?.message?.content || "No explanation provided.";

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error("[explain-mistake]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
