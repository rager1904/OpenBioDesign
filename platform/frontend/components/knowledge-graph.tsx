"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getKnowledgeGraph } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Atom, GitBranch, Database, Cpu, FileText } from "lucide-react";

type ForceNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: string;
};

type ForceEdge = {
  source: string;
  target: string;
  label: string;
};

const NODE_CONFIGS: Record<string, { color: string; glowColor: string; icon: typeof Atom; gradient: [string, string] }> = {
  project: { color: "#22d3ee", glowColor: "#22d3ee40", icon: Cpu, gradient: ["#0e7490", "#22d3ee"] },
  experiment: { color: "#3b82f6", glowColor: "#3b82f640", icon: Atom, gradient: ["#1d4ed8", "#60a5fa"] },
  target: { color: "#34d399", glowColor: "#34d39940", icon: Database, gradient: ["#059669", "#6ee7b7"] },
  protein: { color: "#a78bfa", glowColor: "#a78bfa40", icon: GitBranch, gradient: ["#7c3aed", "#c4b5fd"] },
  publication: { color: "#f59e0b", glowColor: "#f59e0b40", icon: FileText, gradient: ["#d97706", "#fcd34d"] },
  default: { color: "#94a3b8", glowColor: "#94a3b840", icon: Atom, gradient: ["#475569", "#94a3b8"] },
};

function getNodeConfig(type: string) {
  return NODE_CONFIGS[type] || NODE_CONFIGS.default;
}

export function KnowledgeGraph() {
  const { data: kg } = useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: getKnowledgeGraph,
    staleTime: 30_000,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<ForceNode[]>([]);
  const animRef = useRef<number>(0);
  const [tick, setTick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });

  const rawNodes = kg?.nodes ?? [];
  const rawEdges = kg?.edges ?? [];

  const nodes = useMemo(() => {
    if (rawNodes.length === 0) return [];

    const existing = nodesRef.current;
    const nodeTypeByContent = (id: string): string => {
      if (id.includes("project")) return "project";
      if (/^[0-9a-f]{8}/.test(id)) return "experiment";
      if (id.includes("protein") || id.includes("target")) return "target";
      return "default";
    };

    return rawNodes.map((n, i) => {
      const existingNode = existing.find((e) => e.id === n.id);
      const type = nodeTypeByContent(n.id);
      const connectedCount = rawEdges.filter((e) => e.source === n.id || e.target === n.id).length;
      const radius = Math.max(12, Math.min(24, 8 + connectedCount * 3));

      if (existingNode) {
        return { ...existingNode, label: n.label, type, radius };
      }

      const angle = (i / Math.max(rawNodes.length, 1)) * 2 * Math.PI;
      const r = 80 + (i % 3) * 30;
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      return {
        id: n.id,
        label: n.label,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius,
        type,
      };
    });
  }, [rawNodes, rawEdges, dimensions]);

  const edges: ForceEdge[] = useMemo(
    () =>
      rawEdges.map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    [rawEdges]
  );

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parent = svg.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const ns = nodesRef.current;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    let frameCount = 0;
    const step = () => {
      frameCount++;
      const alpha = Math.max(0.001, 1 - frameCount / 300);

      for (let i = 0; i < ns.length; i++) {
        const a = ns[i];
        a.vx *= 0.85;
        a.vy *= 0.85;

        const dxCenter = cx - a.x;
        const dyCenter = cy - a.y;
        const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter) || 1;
        a.vx += (dxCenter / distCenter) * 0.15 * alpha;
        a.vy += (dyCenter / distCenter) * 0.15 * alpha;

        for (let j = i + 1; j < ns.length; j++) {
          const b = ns[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = a.radius + b.radius + 20;
          if (dist < minDist) {
            const force = (minDist - dist) / dist * 0.5;
            a.vx += dx * force;
            a.vy += dy * force;
            b.vx -= dx * force;
            b.vy -= dy * force;
          }
        }
      }

      for (const edge of edges) {
        const a = ns.find((n) => n.id === edge.source);
        const b = ns.find((n) => n.id === edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 100;
        const force = (dist - targetDist) / dist * 0.02 * alpha;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }

      for (const n of ns) {
        n.x += n.vx;
        n.y += n.vy;
        n.x = Math.max(n.radius + 10, Math.min(dimensions.width - n.radius - 10, n.x));
        n.y = Math.max(n.radius + 10, Math.min(dimensions.height - n.radius - 10, n.y));
      }

      if (frameCount % 2 === 0) {
        setTick((t) => t + 1);
      }

      if (alpha > 0.001) {
        animRef.current = requestAnimationFrame(step);
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes.length, edges, dimensions]);

  const handleDrag = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const onMove = (me: MouseEvent) => {
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node) return;
        node.x = me.clientX - svgRect.left;
        node.y = me.clientY - svgRect.top;
        node.vx = 0;
        node.vy = 0;
        setTick((t) => t + 1);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    []
  );

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const ids = new Set<string>();
    for (const e of edges) {
      if (e.source === hoveredNode) ids.add(e.target);
      if (e.target === hoveredNode) ids.add(e.source);
    }
    return ids;
  }, [hoveredNode, edges]);

  void tick;

  return (
    <div className="relative h-80 overflow-hidden rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900/60 to-slate-950 lab-grid-vignette">
      <svg
        ref={svgRef}
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="kg-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kg-glow-strong">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {Object.entries(NODE_CONFIGS).map(([type, cfg]) => (
            <linearGradient key={`grad-${type}`} id={`kg-node-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cfg.gradient[0]} />
              <stop offset="100%" stopColor={cfg.gradient[1]} />
            </linearGradient>
          ))}
          <marker
            id="kg-arrow"
            viewBox="0 0 10 6"
            refX="10"
            refY="3"
            markerWidth="8"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 3 L 0 6 z" fill="rgba(125, 211, 252, 0.4)" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const sNode = nodesRef.current.find((n) => n.id === edge.source);
          const tNode = nodesRef.current.find((n) => n.id === edge.target);
          if (!sNode || !tNode) return null;

          const isHighlighted = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
          const isDimmed = hoveredNode && !isHighlighted;

          return (
            <g key={`${edge.source}-${edge.target}`}>
              <line
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke={isHighlighted ? "#22d3ee" : "rgba(125, 211, 252, 0.2)"}
                strokeWidth={isHighlighted ? 2 : 0.8}
                strokeDasharray={isHighlighted ? "none" : "4,3"}
                markerEnd="url(#kg-arrow)"
                opacity={isDimmed ? 0.15 : 1}
                style={{ transition: "all 0.3s ease" }}
              />
              {isHighlighted && edge.label && (
                <text
                  x={(sNode.x + tNode.x) / 2}
                  y={(sNode.y + tNode.y) / 2 - 5}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const cfg = getNodeConfig(node.type);
          const isHovered = hoveredNode === node.id;
          const isConnected = connectedToHovered.has(node.id);
          const isDimmed = hoveredNode && !isHovered && !isConnected;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onMouseDown={(e) => handleDrag(node.id, e)}
              style={{
                cursor: "grab",
                opacity: isDimmed ? 0.25 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {isHovered && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 8}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#kg-glow-strong)"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={`url(#kg-node-${node.type === "default" ? "default" : node.type})`}
                stroke={isHovered ? cfg.color : "rgba(255,255,255,0.15)"}
                strokeWidth={isHovered ? 2 : 0.5}
                filter={isHovered ? "url(#kg-glow)" : undefined}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius - 3}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={node.radius > 16 ? "7" : "6"}
                fontWeight="600"
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {node.label.length > 12 ? node.label.slice(0, 12) + "..." : node.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
        {Object.entries(NODE_CONFIGS)
          .filter(([k]) => k !== "default")
          .map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5 rounded-md border border-slate-700/30 bg-slate-900/80 px-2 py-1 text-[10px] backdrop-blur-sm">
              <span className="size-2 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.glowColor}` }} />
              <span className="text-slate-400">{type}</span>
            </div>
          ))}
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex gap-2">
        <Badge tone="cyan" className="backdrop-blur-sm">{rawNodes.length} nodes</Badge>
        <Badge tone="emerald" className="backdrop-blur-sm">{rawEdges.length} edges</Badge>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl" style={{
        boxShadow: "inset 0 0 40px rgba(2, 6, 18, 0.4), inset 0 0 80px rgba(2, 6, 18, 0.2)"
      }} />
    </div>
  );
}
