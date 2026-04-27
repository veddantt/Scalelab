# ScaleLab 🧪

**The Production-Grade AI System Design Interview Simulator.**

ScaleLab is a premium, data-driven platform designed to bridge the gap between knowing system design theory and performing under the pressure of a real engineering interview. It puts you through a structured, adaptive interview simulation—evaluating your architecture, tradeoffs, and communication in real time.

[**Visit ScaleLab**](https://scalelab-ai.vercel.app)

---

## ✨ Key Features

### 🤖 Adaptive AI Interviewer
Not just a chatbot—a strict interviewer. ScaleLab asks concise, high-pressure questions (max 12 words), adapts its follow-ups to your specific answers, and probes for deeper technical tradeoffs when it senses ambiguity.

### 📊 Dynamic System Profiles
Every challenge is unique. Problems like **Real-Time Chat**, **Distributed Job Scheduler**, and **URL Shortener** feature unique engineering constraints:
- **Scale**: 10M to 2B+ DAU
- **Throughput**: RPS from 10k to 1M+
- **Architectural Realism**: Problem-specific recommended stacks (e.g., WebSockets, Kafka, Redis, Base62).
- **Latency Targets**: Ultra-low latency vs. high-throughput tradeoffs.

### 🔄 The Learning Loop
- **Real-Time Scoring**: Get evaluated on **Clarity, Depth, and Correctness** after every single answer.
- **AI Model Answers**: Compare your logic against production-grade reference solutions after each stage.
- **Step-by-Step Evolution**: Move through Requirements, Scale, API, DB, and High-Level Architecture in a logical flow.

### 🎨 Premium Engineering UI
- **Glassmorphism Design**: A sleek, dark-mode interface built with Tailwind CSS v4.
- **Architecture Previews**: Real-time visualization of system components using a neutralized, professional design system.
- **Responsive & Accessible**: Optimized for everything from 390px mobile screens to 1920px wide monitors.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 (Modern CSS-first approach), Framer Motion |
| **AI Engine** | OpenRouter (LLM Gateway), Gemini 1.5 Pro/Flash |
| **Backend** | Next.js Server Actions & API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password, Google) |
| **Icons & Visuals** | Lucide React, React Flow (Architecture Previews) |

---

## 📁 Project Structure

```text
/app             # Next.js App Router (Pages, API Routes)
/components      # Reusable UI components (Navbar, Sidebar, Previews)
/features        # Domain-specific logic (Interview engine, Auth, Review)
/lib             # Core utilities, types, and the Problem Meta source of truth
/server          # Server-side logic (AI prompts, DB handlers)
/public          # Static assets and branding
```

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/veddantt/Scalelab.git
cd Scalelab
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your local instance.

---

## 🏛️ Architecture Philosophy

ScaleLab is built on the **Strict Interviewer** principle. Unlike standard learning tools, it:
1. **Never gives hints** during the session.
2. **Never accepts vague answers** (e.g., "I'll use a database").
3. **Always forces tradeoffs** (e.g., "Why PostgreSQL instead of Cassandra for this specific scale?").

---

## 🤝 Contributing

ScaleLab is an ongoing experiment in AI-driven education. If you're an engineer interested in improving the prompt engineering, adding new challenges to `lib/problems.ts`, or refining the evaluation engine, feel free to open a PR.

---

## 👤 Author

**Vedant Patel**
[Portfolio](https://veddantt.vercel.app) · [GitHub](https://github.com/veddantt) · [LinkedIn](https://linkedin.com/in/vedantpateldev)

---

*Built with ❤️ for the system design community.*
