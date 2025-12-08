"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumberPt } from "@/lib/utils";
import type { WeightGainRankingItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeightGainRankingTableProps = {
  data: WeightGainRankingItem[];
  startDate?: string | null;
  endDate?: string | null;
};

export function WeightGainRankingTable({
  data,
  startDate,
  endDate,
}: WeightGainRankingTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Ganho de Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Nenhum paciente com ganho de peso no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT");
    } catch {
      return dateStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Ganho de Peso</CardTitle>
        {(startDate || endDate) && (
          <p className="text-sm text-muted-foreground">
            Período: {startDate ? formatDate(startDate) : "Início"} até{" "}
            {endDate ? formatDate(endDate) : "Fim"}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="text-right">Peso Inicial</TableHead>
              <TableHead className="text-right">Peso Final</TableHead>
              <TableHead className="text-right">Ganho de Peso</TableHead>
              <TableHead className="text-right">Sessões</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.patient_id}>
                <TableCell className="font-medium">{item.rank}</TableCell>
                <TableCell>{item.patient_name}</TableCell>
                <TableCell className="text-right">
                  {formatNumberPt(item.initial_weight_kg, 1, 1)} kg
                </TableCell>
                <TableCell className="text-right">
                  {formatNumberPt(item.final_weight_kg, 1, 1)} kg
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  +{formatNumberPt(item.weight_gain_kg, 1, 1)} kg
                </TableCell>
                <TableCell className="text-right">{item.sessions_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}






