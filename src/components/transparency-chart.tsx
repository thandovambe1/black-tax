"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0f5c46", "#c9a227", "#1f2937", "#5e7a6d", "#c56f3a"];

export function TransparencyChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("en-ZA").format(typeof value === "number" ? value : Number(value ?? 0))
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}