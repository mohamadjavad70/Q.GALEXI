/**
 * Empire Monitoring Dashboard
 * ────────────────────────────
 * Integrity Ring (Doughnut) + Growth Vector (Line) + Module Status
 */

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar,
} from "recharts";
import { getEmpireSnapshot } from "@/lib/empireStats";

export default function EmpireDashboard() {
  const snapshot = useMemo(() => getEmpireSnapshot(), []);

  const integrityData = [
    { name: "Active", value: snapshot.activeModules },
    { name: "Inactive", value: snapshot.totalModules - snapshot.activeModules },
  ];

  const reachData = snapshot.globalReach.map(r => ({
    name: r.region,
    value: r.percent,
  }));

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Integrity", value: `${snapshot.integrity}%`, color: snapshot.integrity > 70 ? "text-emerald-400" : "text-amber-400" },
          { label: "Modules", value: `${snapshot.activeModules}/${snapshot.totalModules}`, color: "text-primary" },
          { label: "Readiness", value: `${snapshot.readinessAvg}%`, color: "text-foreground" },
          { label: "Status", value: snapshot.integrity > 60 ? "OPERATIONAL" : "DEGRADED", color: snapshot.integrity > 60 ? "text-emerald-400" : "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">{s.label}</p>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Integrity Ring */}
        <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-2xl p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
            System Integrity Ring
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={integrityData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={70}
                  dataKey="value"
                  startAngle={90} endAngle={-270}
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted) / 0.3)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            {snapshot.activeModules} ماژول فعال از {snapshot.totalModules}
          </p>
        </div>

        {/* Growth Vector */}
        <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-2xl p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
            Growth Vector
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.growthHistory}>
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border) / 0.2)",
                    borderRadius: "8px",
                    fontSize: "10px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "9px" }} />
                <Line type="monotone" dataKey="ai" stroke="#00ff41" strokeWidth={2} dot={false} name="AI Core" />
                <Line type="monotone" dataKey="security" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Security" />
                <Line type="monotone" dataKey="finance" stroke="#f59e0b" strokeWidth={2} dot={false} name="Finance" />
                <Line type="monotone" dataKey="creative" stroke="#ff6b9d" strokeWidth={2} dot={false} name="Creative" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Module Readiness Bars */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-2xl p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
          Module Readiness
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snapshot.modules} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                dataKey="nameFa"
                type="category"
                width={80}
                tick={{ fontSize: 9, fill: "hsl(var(--foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border) / 0.2)",
                  borderRadius: "8px",
                  fontSize: "10px",
                }}
              />
              <Bar dataKey="readiness" radius={[0, 4, 4, 0]}>
                {snapshot.modules.map((m, i) => (
                  <Cell key={i} fill={m.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global Reach */}
      <div className="grid grid-cols-5 gap-2">
        {snapshot.globalReach.map((r, i) => (
          <div key={i} className="bg-card/20 border border-border/10 rounded-xl p-3 text-center">
            <p className="text-[9px] text-muted-foreground/50">{r.region}</p>
            <p className="text-base font-black text-primary">{r.percent}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
