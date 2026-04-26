// features/architecture/utils/layout.ts
// Dagre-based auto-layout for ReactFlow nodes.

import dagre from "dagre";
import { MarkerType } from "reactflow";

const NODE_W = 200;
const NODE_H = 65;

export function getLayoutedElements(nodes: any[], edges: any[]) {
  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 180 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const layoutedNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    if (!pos) return { ...n, position: n.position ?? { x: 0, y: 0 } };
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });

  return { nodes: layoutedNodes, edges };
}

export function prepareNodes(rawNodes: any[]) {
  return rawNodes.map((n: any) => ({
    id: String(n.id),
    type: "custom",
    data: {
      label: n.label || n.data?.label || "Unknown",
      type: n.type || "service",
      description: n.description || "",
    },
    position: n.position || { x: 0, y: 0 },
  }));
}

export function prepareEdges(rawEdges: any[]) {
  return rawEdges.map((e: any) => ({
    id: e.id || `e-${e.source}-${e.target}`,
    source: String(e.source),
    target: String(e.target),
    label: e.label || "",
    type: "default",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1", width: 18, height: 18 },
    style: { stroke: "#4f46e5", strokeWidth: 1.8, opacity: 0.6 },
    labelStyle: { fill: "#a5b4fc", fontSize: 9, fontWeight: 600, letterSpacing: "0.02em" },
    labelBgStyle: { fill: "#020617", fillOpacity: 0.95, rx: 6, ry: 6 },
    labelBgPadding: [6, 4] as [number, number],
  }));
}
