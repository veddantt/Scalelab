"use client";

import { memo, useState } from "react";
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

/* ─── Config per node type ──────────────────────────────────── */

interface NodeTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  glow: string;
  bg: string;
  gradient: string;
}

export const nodeTypeConfig: Record<NodeType, NodeTypeConfig> = {
  client: {
    icon: Monitor,
    color: "text-blue-400",
    border: "border-[#6366F1]/30",
    glow: "shadow-blue-500/20",
    bg: "bg-[#6366F1]/5",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  gateway: {
    icon: Shield,
    color: "text-purple-400",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    bg: "bg-purple-500/5",
    gradient: "from-purple-500/20 to-purple-600/5",
  },
  service: {
    icon: Server,
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    bg: "bg-cyan-500/5",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  database: {
    icon: Database,
    color: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    bg: "bg-amber-500/5",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  cache: {
    icon: Zap,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    bg: "bg-yellow-500/5",
    gradient: "from-yellow-500/20 to-yellow-600/5",
  },
  queue: {
    icon: Layers,
    color: "text-orange-400",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    bg: "bg-orange-500/5",
    gradient: "from-orange-500/20 to-orange-600/5",
  },
  worker: {
    icon: Cog,
    color: "text-teal-400",
    border: "border-teal-500/30",
    glow: "shadow-teal-500/20",
    bg: "bg-teal-500/5",
    gradient: "from-teal-500/20 to-teal-600/5",
  },
  storage: {
    icon: HardDrive,
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/5",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  external: {
    icon: Globe,
    color: "text-indigo-400",
    border: "border-indigo-500/30",
    glow: "shadow-indigo-500/20",
    bg: "bg-indigo-500/5",
    gradient: "from-indigo-500/20 to-indigo-600/5",
  },
  monitoring: {
    icon: Activity,
    color: "text-pink-400",
    border: "border-pink-500/30",
    glow: "shadow-pink-500/20",
    bg: "bg-pink-500/5",
    gradient: "from-pink-500/20 to-pink-600/5",
  },
};

/* ─── Node data shape ───────────────────────────────────────── */

interface CustomNodeData {
  label: string;
  type: NodeType;
  description?: string;
  selected?: boolean;
}

/* ─── Component ─────────────────────────────────────────────── */

export const CustomNode = memo(
  ({ data, selected }: { data: CustomNodeData; selected?: boolean }) => {
    const [hovered, setHovered] = useState(false);
    const config = nodeTypeConfig[data.type] ?? nodeTypeConfig.service;
    const Icon = config.icon;
    const isActive = selected || hovered;

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          relative px-4 py-3 rounded-2xl border backdrop-blur-sm
          bg-gradient-to-br ${config.gradient}
          min-w-[180px] cursor-pointer group
          transition-all duration-300 ease-out
          ${config.border}
          ${
            isActive
              ? `shadow-xl ${config.glow} scale-[1.03] border-opacity-80 !bg-[#0f172a]`
              : "shadow-md shadow-black/20 bg-[#0f172a]/90"
          }
        `}
      >
        {/* Glow ring on selection */}
        {selected && (
          <div
            className={`absolute -inset-[2px] rounded-2xl border-2 ${config.border} opacity-60 animate-pulse pointer-events-none`}
          />
        )}

        <Handle
          type="target"
          position={Position.Left}
          className={`!w-2.5 !h-2.5 !border-2 !border-gray-700 !rounded-full transition-all duration-200 ${
            isActive ? "!bg-purple-400 !border-purple-500" : "!bg-gray-600"
          }`}
        />

        <div className="flex items-center gap-3">
          {/* Icon container */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} border ${config.border} transition-all duration-200 ${
              isActive ? "scale-110" : ""
            }`}
          >
            <Icon
              className={`w-4 h-4 ${config.color} transition-all duration-200`}
            />
          </div>

          {/* Label + type badge */}
          <div className="flex flex-col min-w-0">
            <span className="text-white text-[12px] font-semibold leading-tight truncate">
              {data.label}
            </span>
            <span
              className={`text-[9px] font-medium uppercase tracking-wider mt-0.5 ${config.color} opacity-60`}
            >
              {data.type}
            </span>
          </div>
        </div>

        {/* Hover tooltip with description */}
        {hovered && data.description && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none">
            <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 shadow-xl max-w-[220px]">
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {data.description}
              </p>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
          </div>
        )}

        <Handle
          type="source"
          position={Position.Right}
          className={`!w-2.5 !h-2.5 !border-2 !border-gray-700 !rounded-full transition-all duration-200 ${
            isActive ? "!bg-purple-400 !border-purple-500" : "!bg-gray-600"
          }`}
        />
      </div>
    );
  }
);

CustomNode.displayName = "CustomNode";

export const nodeTypes = { custom: CustomNode };
