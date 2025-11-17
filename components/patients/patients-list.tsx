"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import type { PatientsListResponse } from "@/app/api/patients/route";

type PatientsListProps = {
  initialData: PatientsListResponse | null;
  defaultPageSize?: number;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DEFAULT_STATE: PatientsListResponse = {
  items: [],
  page: 1,
  page_size: 10,
  total: 0,
  has_next: false,
};

export function PatientsList({
  initialData,
  defaultPageSize = 10,
}: PatientsListProps) {
  const [data, setData] = useState<PatientsListResponse>(
    initialData ?? { ...DEFAULT_STATE, page_size: defaultPageSize },
  );
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchValue), 400);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const skippedFirstFetchRef = useRef(false);

  useEffect(() => {
    if (debouncedSearch !== searchValue) {
      return;
    }

    if (!skippedFirstFetchRef.current) {
      skippedFirstFetchRef.current = true;
      return;
    }

    fetchPatients(1, debouncedSearch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, searchValue]);

  async function fetchPatients(page: number, search?: string) {
    setIsLoading(true);
    setErrorMessage(null);

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(data.page_size || defaultPageSize),
    });

    if (search) {
      params.set("search", search);
    }

    try {
      const response = await fetch(`/api/patients?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          typeof errorData?.detail === "string"
            ? errorData.detail
            : "Não foi possível carregar os pacientes.";
        setErrorMessage(message);
        return;
      }

      const payload = (await response.json()) as PatientsListResponse;
      setData(payload);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      setErrorMessage("Erro inesperado ao carregar pacientes.");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePreviousPage() {
    if (data.page <= 1 || isLoading) return;
    fetchPatients(data.page - 1, debouncedSearch);
  }

  function handleNextPage() {
    if (!data.has_next || isLoading) return;
    fetchPatients(data.page + 1, debouncedSearch);
  }

  const summaryText = useMemo(() => {
    if (data.total === 0) {
      return "Nenhum paciente encontrado.";
    }
    const start = (data.page - 1) * data.page_size + 1;
    const end = Math.min(data.page * data.page_size, data.total);
    return `Mostrando ${start} - ${end} de ${data.total} pacientes`;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">{summaryText}</div>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando pacientes...
        </div>
      )}

      {!isLoading && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-6 text-center text-muted-foreground">
          <Users className="h-6 w-6" />
          <p>Nenhum paciente encontrado para os filtros atuais.</p>
        </div>
      )}

      <ItemGroup className="space-y-2">
        {data.items.map((patient) => (
          <Item key={patient.id} asChild className="hover:bg-accent/40 border border-gray-200 border-opacity-50 rounded-md p-4">
            <Link href={`/dashboard/pacientes/${patient.id}`}>
              <ItemContent className="gap-1">
                <ItemTitle className="text-base font-semibold">
                  {patient.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    {patient.process_number
                      ? ` (#${patient.process_number})`
                      : ""}
                  </span>
                </ItemTitle>
                <ItemDescription className="text-sm text-muted-foreground">
                  {patient.age} anos ·{" "}
                  {patient.gender === "male" ? "Masculino" : "Feminino"} · {patient.current_cycle_number} Ciclos
                </ItemDescription>
                <ItemDescription className="text-sm text-muted-foreground">
                  Última sessão:{" "}
                  {patient.last_session_date
                    ? DATE_FORMATTER.format(new Date(patient.last_session_date))
                    : "Sem sessões realizadas"}
                </ItemDescription>
              </ItemContent>
            </Link>
          </Item>
        ))}
      </ItemGroup>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePreviousPage}
          disabled={data.page <= 1 || isLoading}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {data.page}
        </span>
        <Button
          variant="outline"
          onClick={handleNextPage}
          disabled={!data.has_next || isLoading}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}


