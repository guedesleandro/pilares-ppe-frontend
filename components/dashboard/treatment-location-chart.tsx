"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumberPt } from "@/lib/utils";
import type { TreatmentLocationDistributionItem } from "@/lib/api";

type TreatmentLocationChartProps = {
  data: TreatmentLocationDistributionItem[];
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
];

export function TreatmentLocationChart({ data }: TreatmentLocationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        Nenhum paciente cadastrado ainda
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.location,
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
            `${formatNumberPt(value, 0, 0)} pacientes`,
            "Quantidade",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

