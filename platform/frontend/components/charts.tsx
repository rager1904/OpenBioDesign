"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
