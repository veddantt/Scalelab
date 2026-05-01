# ScaleLab 🧪

[![Vercel Build](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://scalelab-ai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

**ScaleLab** is a production-grade AI system design interview simulator. It bridges the gap between theoretical knowledge and interview performance by putting engineers through structured, high-pressure simulations that evaluate architecture, tradeoffs, and communication in real time.

---

## 🚀 What the project does

ScaleLab acts as a **strict AI interviewer**—not a tutor. It simulates the exact flow of a professional system design interview:
- **Adaptive Questioning**: The AI asks concise, one-sentence questions (max 12 words) and adapts follow-ups based on your specific technical decisions.
- **Real-Time Evaluation**: Every response is scored on **Clarity, Depth, and Correctness**.
- **Architectural Visualization**: Dynamically generates system previews based on your problem selection.
- **Full Interview Lifecycle**: Guides you through Requirements, Scale Estimation, API Design, Database Design, and High-Level Architecture.

---

## ✨ Why the project is useful

- **Simulate Real Pressure**: Most engineers fail interviews due to poor structure and communication, not lack of knowledge. ScaleLab forces you to be precise and justify every tradeoff.
- **Problem-Specific Realism**: Unlike generic chatbots, ScaleLab uses dynamic metadata for 9+ distinct challenges (URL Shortener, Chat App, Job Scheduler, etc.), each with its own scale, throughput, and recommended stack.
- **Learning Loop**: After every stage, compare your answer with an **AI Model Answer** and get feedback on exactly where you missed critical bottlenecks.
- **Premium UX**: A sleek, dark-mode "Glassmorphism" interface designed for focus and clarity.

---

## 🛠️ How users can get started

### Prerequisites
- Node.js 18+
- A Supabase account (for database & auth)
- An OpenRouter API key (for LLM orchestration)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/veddantt/Scalelab.git
   cd Scalelab
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to start your first session.

---

## 🆘 Where users can get help

- **Documentation**: Detailed system design guides and internal component docs are located in the `docs/` directory (coming soon).
- **Issues**: Found a bug or have a feature request? Open an [Issue](https://github.com/veddantt/Scalelab/issues).
- **Discussions**: Join the community to discuss system design patterns and AI interviewing techniques.

---

## 🤝 Who maintains and contributes

ScaleLab is maintained by **Vedant Patel**.

### Contribution Guidelines
We welcome contributions! If you'd like to help improve the AI prompts, add new system design problems, or refine the UI:
1. Fork the repository.
2. Create a new feature branch.
3. Submit a Pull Request with a detailed description of your changes.

*Please refer to our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.*

---

**Vedant Patel**
[Portfolio](https://veddantt.vercel.app) · [GitHub](https://github.com/veddantt) · [LinkedIn](https://linkedin.com/in/vedantpateldev)

*Built for engineers who want to master the art of the system design interview.*
