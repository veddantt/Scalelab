"use client";

import type { ArchPreviewNode, ArchPreviewEdge } from "@/lib/problems";

const nodeColors: Record<ArchPreviewNode["type"], { bg: string; border: string; text: string; dot: string }> = {
  client:   { bg: "bg-slate-800/40", border: "border-slate-700/50", text: "text-slate-200", dot: "bg-slate-400" },
  gateway:  { bg: "bg-slate-800/60", border: "border-slate-600/50", text: "text-white",     dot: "bg-[#6366F1]" },
  service:  { bg: "bg-slate-900/60", border: "border-slate-800/60", text: "text-slate-300", dot: "bg-slate-500" },
  database: { bg: "bg-slate-900/80", border: "border-slate-800/80", text: "text-slate-200", dot: "bg-amber-500/40" },
  cache:    { bg: "bg-slate-900/80", border: "border-slate-800/80", text: "text-slate-200", dot: "bg-amber-400/30" },
  queue:    { bg: "bg-slate-900/60", border: "border-slate-800/60", text: "text-slate-300", dot: "bg-slate-500" },
  storage:  { bg: "bg-slate-900/80", border: "border-slate-800/80", text: "text-slate-200", dot: "bg-slate-400" },
};

interface MiniArchPreviewProps {
  nodes: ArchPreviewNode[];
  edges: ArchPreviewEdge[];
  compact?: boolean;
}

/**
 * Lightweight static architecture diagram — no ReactFlow.
 * Lays out nodes in a horizontal flow, showing connections as animated SVG arrows.
 */
export default function MiniArchPreview({ nodes, edges, compact = false }: MiniArchPreviewProps) {
  // Compute a left-to-right ordering based on edge traversal (simple BFS)
  const adjacency: Record<string, string[]> = {};
  nodes.forEach((n) => { adjacency[n.id] = []; });
  edges.forEach((e) => { adjacency[e.from]?.push(e.to); });

  // Find roots (no incoming edges)
  const hasIncoming = new Set(edges.map((e) => e.to));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0].id);

  // BFS to assign column (depth)
  const col: Record<string, number> = {};
  const queue = [...roots];
  roots.forEach((r) => { col[r] = 0; });
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of adjacency[cur] ?? []) {
      if (col[next] === undefined) {
        col[next] = (col[cur] ?? 0) + 1;
        queue.push(next);
      }
    }
  }
  nodes.forEach((n) => { if (col[n.id] === undefined) col[n.id] = 0; });

  // Group by column
  const maxCol = Math.max(...nodes.map((n) => col[n.id]));
  const cols: ArchPreviewNode[][] = Array.from({ length: maxCol + 1 }, () => []);
  nodes.forEach((n) => cols[col[n.id]].push(n));

  return (
    <div
      className={`w-full overflow-x-auto ${compact ? "py-2" : "py-4"}`}
      aria-label="Architecture preview diagram"
    >
      {/* Inline keyframes for connector animation */}
      <style>{`
        @keyframes flowPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.8; }
        }
        @keyframes dotTravel {
          0% { transform: translateX(-2px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(18px); opacity: 0; }
        }
        .connector-line { animation: flowPulse 2.5s ease-in-out infinite; }
        .connector-dot  { animation: dotTravel 1.8s ease-in-out infinite; }
      `}</style>

      <div className="flex items-center gap-0 min-w-max mx-auto w-fit">
        {cols.map((colNodes, ci) => (
          <div key={ci} className="flex items-center gap-0">
            {/* Node column — stack vertically if > 1 */}
            <div className={`flex flex-col gap-2 ${compact ? "" : "gap-3"}`}>
              {colNodes.map((node) => {
                const c = nodeColors[node.type] ?? nodeColors.service;
                return (
                  <div
                    key={node.id}
                    className={`
                      flex items-center gap-1.5
                      ${compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]"}
                      rounded-xl border ${c.bg} ${c.border} ${c.text}
                      font-semibold whitespace-nowrap
                      shadow-sm hover:shadow-md hover:scale-[1.03]
                      transition-all duration-300
                    `}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} animate-pulse`} />
                    {node.label}
                  </div>
                );
              })}
            </div>

            {/* Animated connector between columns */}
            {ci < cols.length - 1 && (
              <div className="flex items-center mx-1.5 shrink-0 relative">
                <svg
                  width={compact ? "24" : "32"}
                  height={compact ? "14" : "18"}
                  viewBox="0 0 32 18"
                  fill="none"
                  className="connector-line"
                >
                  <line x1="0" y1="9" x2="22" y2="9" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 2" />
                  <polyline points="18,5 24,9 18,13" stroke="#6366f1" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                </svg>
                {/* Travelling dot */}
                <svg
                  width={compact ? "24" : "32"}
                  height={compact ? "14" : "18"}
                  viewBox="0 0 32 18"
                  fill="none"
                  className="absolute inset-0"
                >
                  <circle cx="4" cy="9" r="2" fill="#818cf8" className="connector-dot" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
