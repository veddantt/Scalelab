"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import {
  Monitor,
  Shield,
  Server,
  Database,
  Zap,
  Layers,
  Cog,
  HardDrive,
  Globe,
  Activity,
} from "lucide-react";
import type { NodeType } from "@/lib/types";

interface NodeTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
}

export const nodeTypeConfig: Record<NodeType, NodeTypeConfig> = {
  client:     { icon: Monitor,   color: "text-blue-400",    border: "border-blue-500/30" },
  gateway:    { icon: Shield,    color: "text-purple-400",  border: "border-purple-500/30" },
  service:    { icon: Server,    color: "text-cyan-400",    border: "border-cyan-500/30" },
  database:   { icon: Database,  color: "text-amber-400",   border: "border-amber-500/30" },
  cache:      { icon: Zap,       color: "text-yellow-400",  border: "border-yellow-500/30" },
  queue:      { icon: Layers,    color: "text-orange-400",  border: "border-orange-500/30" },
  worker:     { icon: Cog,       color: "text-teal-400",    border: "border-teal-500/30" },
  storage:    { icon: HardDrive, color: "text-emerald-400", border: "border-emerald-500/30" },
  external:   { icon: Globe,     color: "text-indigo-400",  border: "border-indigo-500/30" },
  monitoring: { icon: Activity,  color: "text-pink-400",    border: "border-pink-500/30" },
};

interface CustomNodeData {
  label: string;
  type: NodeType;
  description?: string;
}

export const CustomNode = memo(({ data }: { data: CustomNodeData }) => {
  const config = nodeTypeConfig[data.type] ?? nodeTypeConfig.service;
  const Icon = config.icon;

  return (
    <div
      className={`px-4 py-3 rounded-2xl border ${config.border} bg-[#0f172a] shadow-lg hover:shadow-xl hover:border-opacity-60 transition-all duration-200 min-w-[170px] cursor-pointer group`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-600 !w-2 !h-2 !border-0" />
      <div className="flex items-center gap-2.5">
        <div className={`${config.color} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-white text-xs font-semibold leading-tight">
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-600 !w-2 !h-2 !border-0" />
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export const nodeTypes = { custom: CustomNode };
