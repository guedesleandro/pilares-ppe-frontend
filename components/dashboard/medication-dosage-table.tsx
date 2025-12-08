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
import type { MedicationDosageItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MedicationDosageTableProps = {
  data: MedicationDosageItem[];
  startDate?: string | null;
  endDate?: string | null;
};

export function MedicationDosageTable({
  data,
  startDate,
  endDate,
}: MedicationDosageTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medicação e Dosagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Nenhuma medicação aplicada no período selecionado
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
        <CardTitle>Medicação e Dosagem</CardTitle>
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
              <TableHead>Medicação</TableHead>
              <TableHead className="text-right">Dosagem</TableHead>
              <TableHead className="text-right">Quantidade de Pacientes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={`${item.medication_name}-${item.dosage_mg}-${index}`}>
                <TableCell className="font-medium">{item.medication_name}</TableCell>
                <TableCell className="text-right">
                  {formatNumberPt(item.dosage_mg, 1, 1)} mg
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {item.patients_count} {item.patients_count === 1 ? "paciente" : "pacientes"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}






