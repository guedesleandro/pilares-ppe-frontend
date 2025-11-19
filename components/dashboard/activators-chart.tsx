"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatNumberPt } from "@/lib/utils";
import type { ActivatorUsageItem } from "@/app/api/dashboard/stats/route";

type ActivatorsChartProps = {
  data: ActivatorUsageItem[];
};

// Comentário em pt-BR: cores para o gráfico de pizza
// const COLORS = [
//   "#0088FE",
//   "#00C49F",
//   "#FFBB28",
//   "#FF8042",
//   "#8884d8",
//   "#82ca9d",
//   "#ffc658",
//   "#ff7c7c",
// ];

const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];


export function ActivatorsChart({ data }: ActivatorsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Nenhum ativador utilizado ainda
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.name,
    value: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${formatNumberPt(percent ? percent * 100 : 0, 0, 0)}%`
          }
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `${formatNumberPt(value, 0, 0)} utilizações`,
            "Quantidade",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

