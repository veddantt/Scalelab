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
  highestStep?: number;
  createdAt: string;
  attemptNumber?: number;
  originalSessionId?: string;
  practiceMode?: boolean;
  weakestAreas?: string[];
  improvementGoals?: string[];
  architecture?: {
    nodes: any[];
    edges: any[];
    summary?: string;
    score?: number;
    bottlenecks?: string[];
    tradeoffs?: string[];
    scalingRecommendations?: string[];
    isFallback?: boolean;
  };
  explanations?: Record<string, any>;
  review?: any;
  modelAnswer?: ModelAnswer;
};

export type ApiDesignEntry = {
  method: string;
  endpoint: string;
  purpose: string;
};

export type DataModelEntry = {
  entity: string;
  fields: string[];
  notes: string;
};

export type ArchitectureEntry = {
  component: string;
  responsibility: string;
};

export type ModelAnswer = {
  overview: string;
  requirements: string[];
  scaleAssumptions: string[];
  apiDesign: ApiDesignEntry[];
  dataModel: DataModelEntry[];
  architecture: ArchitectureEntry[];
  tradeoffs: string[];
  bottlenecks: string[];
  scalingPlan: string[];
  howToExplainInInterview: string;
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

export function clearSession(id: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`scalelab-session-${id}`);
}
