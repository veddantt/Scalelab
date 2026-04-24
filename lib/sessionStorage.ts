export type ScaleLabSession = {
  id: string;
  problem: string;
  messages: any[];
  scores: {
    clarity: number;
    depth: number;
    correctness: number;
  };
  currentStep: number;
  createdAt: string;
  architecture?: {
    nodes: any[];
    edges: any[];
  };
  explanations?: Record<string, any>;
};

export function saveSession(session: ScaleLabSession) {
  localStorage.setItem(`scalelab-session-${session.id}`, JSON.stringify(session));
}

export function getSession(id: string) {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`scalelab-session-${id}`);
  return raw ? JSON.parse(raw) : null;
}

export function getAllSessions() {
  if (typeof window === "undefined") return [];
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("scalelab-session-"))
    .map((key) => JSON.parse(localStorage.getItem(key)!));
}
