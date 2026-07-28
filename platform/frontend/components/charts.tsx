"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartDataPoint = {
  name: string;
  affinity: number;
  confidence: number;
  risk: number;
};

export function ScientificTrendChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="confidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="affinity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f3b57" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" stroke="#8aa5bb" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8aa5bb" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#08172b",
              border: "1px solid rgba(125, 211, 252, 0.22)",
              borderRadius: 8,
              color: "#f8fafc",
            }}
          />
          <Area type="monotone" dataKey="confidence" stroke="#22d3ee" fill="url(#confidence)" strokeWidth={2} />
          <Area type="monotone" dataKey="affinity" stroke="#34d399" fill="url(#affinity)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function plddtColor(score: number): string {
  if (score >= 90) return "#3b82f6";
  if (score >= 70) return "#22d3ee";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

export function PlddtChart({ scores }: { scores: number[] }) {
  const data = scores.map((s, i) => ({ pos: i + 1, plddt: Math.round(s) }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#1f3b57" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="pos"
            stroke="#8aa5bb"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.floor(data.length / 10))}
          />
          <YAxis domain={[0, 100]} stroke="#8aa5bb" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "#08172b",
              border: "1px solid rgba(125, 211, 252, 0.22)",
              borderRadius: 8,
              color: "#f8fafc",
              fontSize: 11,
            }}
            formatter={(value: number) => [`${value}`, "pLDDT"]}
            labelFormatter={(label) => `Residue ${label}`}
          />
          <Bar dataKey="plddt" radius={[1, 1, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={plddtColor(entry.plddt)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-center gap-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />Confident (&gt;90)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-cyan-400" />Good (70-90)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-yellow-400" />Low (50-70)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-500" />Very Low (&lt;50)</span>
      </div>
    </div>
  );
}
