# ScaleLab

**AI-powered system design interview simulator.**

ScaleLab puts you through a structured, pressure-tested system design interview — one question at a time — and evaluates your answers in real time. Built for engineers who understand system design concepts but struggle to communicate them clearly under interview conditions.

→ **Live:** [scalelab-ai.vercel.app](https://scalelab-ai.vercel.app)

---

## The Problem

Knowing system design and performing it in an interview are two different skills. Most engineers fail not because they lack knowledge, but because they can't structure and communicate their thinking clearly under pressure. Existing tools (courses, mock docs, YouTube) don't simulate that pressure — they teach, they don't test.

---

## What ScaleLab Does

ScaleLab acts as a strict AI interviewer — not a tutor. It asks one concise question at a time (max 12 words), gives no hints, and adapts its follow-up questions based on the quality of your response. After each answer, it scores you on clarity, depth, and correctness, then decides whether to push forward or probe deeper.

---

## Interview Flow

Each session walks through the standard system design structure:

1. Functional Requirements
2. Scale Estimation
3. API Design
4. Database Design
5. High-Level Architecture
6. Bottleneck Identification
7. Final Review

---

## Features

- **Adaptive AI questioning** — follow-ups are based on what you actually said, not a fixed script
- **Real-time scoring** — clarity, depth, and correctness evaluated per answer
- **AI model answers** — reference answers to compare against your own after each stage
- **Session tracking** — tracks attempts and surfaces your weakest stages
- **No hints mode** — simulates real interview conditions without guardrails

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| AI | OpenRouter (LLM Gateway) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel |

---

## Architecture

```
User Browser
    │
    ▼
Next.js Frontend (Vercel)
    │
    ▼
Serverless API Routes
    │
    ├──► Interview Orchestrator
    │         │
    │         ├──► Prompt Builder ──► LLM (OpenRouter) ──► Response
    │         │
    │         └──► Evaluation Engine ──► Scoring
    │
    └──► Supabase
              ├── Sessions
              ├── Attempts
              └── Auth
```

---

## Local Setup

```bash
git clone https://github.com/veddantt/Scalelab.git
cd Scalelab
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Roadmap

- [x] AI interview engine
- [x] Step-based system design flow
- [x] Real-time scoring and evaluation
- [x] AI model answers
- [ ] Supabase Auth and session persistence
- [ ] User dashboard with session history
- [ ] Weak area detection and trend tracking
- [ ] Performance analytics over time

---

## Author

**Vedant Patel**
[Portfolio](https://veddantt.vercel.app) · [GitHub](https://github.com/veddantt) · [LinkedIn](https://linkedin.com/in/vedantpateldev)
