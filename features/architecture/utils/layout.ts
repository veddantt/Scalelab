// features/architecture/utils/layout.ts
// Dagre-based auto-layout for ReactFlow nodes.

import dagre from "dagre";

const NODE_W = 190;
const NODE_H = 60;

export function getLayoutedElements(nodes: any[], edges: any[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 70, ranksep: 160 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const layoutedNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });

  return { nodes: layoutedNodes, edges };
}

export function prepareNodes(rawNodes: any[]) {
  return rawNodes.map((n: any) => ({
    id: n.id,
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
    source: e.source,
    target: e.target,
    label: e.label || "",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: "arrowclosed" },
    style: { stroke: "#475569", strokeWidth: 1.5 },
    labelStyle: { fill: "#94a3b8", fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: "#020617", fillOpacity: 0.9 },
  }));
}
