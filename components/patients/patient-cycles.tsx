"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Droplets,
  Loader2,
  NotebookText,
  Pill,
  PlusCircle,
  Trash2,
} from "lucide-react";

import type {
  CycleWithSessions,
  SessionDetails,
  Medication,
  Activator,
} from "@/lib/api";
import {
  ApiError,
  createCycleForPatient,
  createSession as createSessionRequest,
  deleteCycle as deleteCycleRequest,
  deleteSession as deleteSessionRequest,
  listActivators,
  listMedications,
} from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDatePt, formatNumberPt } from "@/lib/utils";

type PatientCyclesProps = {
  patientId: string;
  cycles: CycleWithSessions[];
  preferredMedicationId?: string | null;
};

type MedicationOption = Pick<Medication, "id" | "name">;
type ActivatorOption = Pick<Activator, "id" | "name">;

const PERIODICITY_LABELS: Record<
  CycleWithSessions["periodicity"],
  string
> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

const CYCLE_TYPE_LABELS: Record<CycleWithSessions["type"], string> = {
  normal: "Tratamento",
  maintenance: "Manutenção",
};

const NOTE_PREVIEW_LIMIT = 160;

const createCycleSchema = z.object({
  cycle_date: z
    .string()
    .min(1, "Selecione a data prevista para o ciclo"),
  max_sessions: z
    .number({
      message: "Informe o número de sessões",
    })
    .int("Use apenas números inteiros")
    .min(1, "Mínimo de 1 sessão")
    .max(12, "Máximo sugerido de 12 sessões"),
  periodicity: z.enum(["weekly", "biweekly", "monthly"]),
  type: z.enum(["normal", "maintenance"]),
});

type CreateCycleFormValues = z.infer<typeof createCycleSchema>;

const decimalStringField = (
  label: string,
  options: { min?: number; max?: number } = {},
) => {
  let schema = z
    .string()
    .min(1, `${label} é obrigatório`)
    .refine((value) => !Number.isNaN(parseDecimal(value)), {
      message: `${label} inválido`,
    });

  if (options.min !== undefined) {
    schema = schema.refine(
      (value) => parseDecimal(value) >= options.min!,
      { message: `Valor mínimo ${options.min}` },
    );
  }

  if (options.max !== undefined) {
    schema = schema.refine(
      (value) => parseDecimal(value) <= options.max!,
      { message: `Valor máximo ${options.max}` },
    );
  }

  return schema;
};

const integerStringField = (
  label: string,
  options: { min?: number; max?: number } = {},
) => {
  let schema = z
    .string()
    .min(1, `${label} é obrigatório`)
    .refine((value) => Number.isInteger(parseDecimal(value)), {
      message: `${label} deve ser um número inteiro`,
    });

  if (options.min !== undefined) {
    schema = schema.refine(
      (value) => parseDecimal(value) >= options.min!,
      { message: `Valor mínimo ${options.min}` },
    );
  }

  if (options.max !== undefined) {
    schema = schema.refine(
      (value) => parseDecimal(value) <= options.max!,
      { message: `Valor máximo ${options.max}` },
    );
  }

  return schema;
};

const sessionFormSchema = z.object({
  session_date: z
    .string()
    .min(1, "Informe a data e hora da sessão"),
  medication_id: z.string().min(1, "Selecione a medicação"),
  activator_id: z.string().optional(),
  dosage_mg: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (!Number.isNaN(Number(value)) && Number(value) > 0),
      {
        message: "A dosagem deve ser um número positivo",
      },
    ),
  notes: z
    .string()
    .max(500, "Limite de 500 caracteres")
    .optional(),
  body_composition: z.object({
    weight_kg: decimalStringField("Peso (kg)", { min: 1 }),
    fat_percentage: decimalStringField("Gordura (%)", { min: 1, max: 80 }),
    fat_kg: decimalStringField("Gordura (kg)", { min: 1 }),
    muscle_mass_percentage: decimalStringField("Massa muscular (%)", { min: 1, max: 100 }),
    h2o_percentage: decimalStringField("H2O (%)", { min: 1, max: 80 }),
    metabolic_age: integerStringField("Idade metabólica", { min: 10, max: 120 }),
    visceral_fat: integerStringField("Gordura visceral", { min: 1, max: 40 }),
  }),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function PatientCycles({ patientId, cycles, preferredMedicationId }: PatientCyclesProps) {
  const router = useRouter();
  const [openCycles, setOpenCycles] = useState<Set<string>>(
    () => new Set(cycles[0] ? [cycles[0].id] : []),
  );
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [activators, setActivators] = useState<ActivatorOption[]>([]);
  const [isCycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [sessionDialog, setSessionDialog] = useState<{
    cycleId: string | null;
    slotIndex: number | null;
  }>({ cycleId: null, slotIndex: null });
  const [isLoadingOptions, setLoadingOptions] = useState(false);
  const [isSessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [isCycleSubmitting, setCycleSubmitting] = useState(false);
  const [isSessionSubmitting, setSessionSubmitting] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [isDeletingCycle, setIsDeletingCycle] = useState<string | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);

  useEffect(() => {
    if (!cycles.length) {
      setOpenCycles(new Set());
      return;
    }

    setOpenCycles((prev) => {
      if (prev.size > 0) {
        return prev;
      }
      return new Set([cycles[0].id]);
    });
  }, [cycles]);

  useEffect(() => {
    let isMounted = true;
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [meds, activatorsData] = await Promise.all([
          listMedications(),
          listActivators(),
        ]);

        if (isMounted) {
          setMedications(meds ?? []);
          setActivators(
            activatorsData.map(({ id, name }) => ({
              id,
              name,
            })),
          );
        }
      } catch (error) {
        console.error("Erro ao carregar listas auxiliares:", error);
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const cycleForm = useForm<CreateCycleFormValues>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: {
      cycle_date: buildDateInputValue(new Date()),
      max_sessions: 8,
      periodicity: "weekly",
      type: "normal",
    },
  });

  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      session_date: buildDateTimeLocalValue(),
      medication_id: "",
      activator_id: undefined,
      dosage_mg: "",
      notes: "",
      body_composition: {
        weight_kg: "",
        fat_percentage: "",
        fat_kg: "",
        muscle_mass_percentage: "",
        h2o_percentage: "",
        metabolic_age: "",
        visceral_fat: "",
      },
    },
  });

  const selectedCycleForSession = useMemo(() => {
    if (!sessionDialog.cycleId) {
      return null;
    }

    return (
      cycles.find((cycle) => cycle.id === sessionDialog.cycleId) ?? null
    );
  }, [cycles, sessionDialog.cycleId]);

  const handleToggleCycle = (cycleId: string, isOpen: boolean) => {
    setOpenCycles((prev) => {
      const next = new Set(prev);
      if (isOpen) {
        next.add(cycleId);
      } else {
        next.delete(cycleId);
      }
      return next;
    });
  };

  const handleToggleNotes = (sessionId: string) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const openSessionDialog = (cycleId: string, slotIndex: number | null) => {
    setSessionDialog({ cycleId, slotIndex });
    setSessionDialogOpen(true);
    sessionForm.reset({
      session_date: buildDateTimeLocalValue(),
      medication_id: preferredMedicationId ?? "",
      activator_id: undefined,
      dosage_mg: "",
      notes: "",
      body_composition: {
        weight_kg: "",
        fat_percentage: "",
        fat_kg: "",
        muscle_mass_percentage: "",
        h2o_percentage: "",
        metabolic_age: "",
        visceral_fat: "",
      },
    });
  };

  const closeSessionDialog = () => {
    setSessionDialogOpen(false);
    setSessionDialog({ cycleId: null, slotIndex: null });
  };

  const onCreateCycle = async (values: CreateCycleFormValues) => {
    setCycleSubmitting(true);
    try {
      await createCycleForPatient(patientId, {
        cycle_date: buildCycleDateIso(values.cycle_date),
        max_sessions: values.max_sessions,
        periodicity: values.periodicity,
        type: values.type,
      });
      toast.success("Ciclo criado com sucesso!");
      setCycleDialogOpen(false);
      cycleForm.reset({
        cycle_date: buildDateInputValue(new Date()),
        max_sessions: 8,
        periodicity: "weekly",
        type: "normal",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message ?? "Não foi possível criar o ciclo. Tente novamente.",
        );
      } else {
        console.error("Erro inesperado ao criar ciclo:", error);
        toast.error("Erro inesperado ao criar o ciclo.");
      }
    } finally {
      setCycleSubmitting(false);
    }
  };

  const onCreateSession = async (values: SessionFormValues) => {
    if (!selectedCycleForSession) {
      toast.error("Selecione um ciclo válido.");
      return;
    }

    setSessionSubmitting(true);
    try {
      const payload = buildSessionPayload(selectedCycleForSession.id, values);

      await createSessionRequest(selectedCycleForSession.id, payload);
      toast.success("Sessão registada com sucesso!");
      closeSessionDialog();
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message ??
            "Não foi possível registar a sessão. Verifique os dados e tente novamente.",
        );
      } else {
        console.error("Erro inesperado ao criar sessão:", error);
        toast.error("Erro inesperado ao criar a sessão.");
      }
    } finally {
      setSessionSubmitting(false);
    }
  };

  const onDeleteCycle = async (cycleId: string) => {
    setIsDeletingCycle(cycleId);
    try {
      await deleteCycleRequest(cycleId);
      toast.success("Ciclo deletado com sucesso!");
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message ?? "Não foi possível deletar o ciclo. Tente novamente.");
      } else {
        console.error("Erro inesperado ao deletar ciclo:", error);
        toast.error("Erro inesperado ao deletar o ciclo.");
      }
    } finally {
      setIsDeletingCycle(null);
    }
  };

  const onDeleteSession = async (sessionId: string) => {
    setIsDeletingSession(sessionId);
    try {
      await deleteSessionRequest(sessionId);
      toast.success("Sessão deletada com sucesso!");
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message ?? "Não foi possível deletar a sessão. Tente novamente.");
      } else {
        console.error("Erro inesperado ao deletar sessão:", error);
        toast.error("Erro inesperado ao deletar a sessão.");
      }
    } finally {
      setIsDeletingSession(null);
    }
  };

  return (
    <>
      <div className="border-none shadow-none p-0">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <CardTitle className="text-xl">Ciclos e sessões</CardTitle>
          </div>

          <Button onClick={() => setCycleDialogOpen(true)}>
            <PlusCircle className="mr-2 size-4" />
            Novo ciclo
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {cycles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 p-8 text-center">
              <ClipboardList className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  Nenhum ciclo registado ainda
                </p>
                <p className="text-sm text-muted-foreground">
                  Registe o primeiro ciclo para organizar as sessões planeadas deste paciente.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setCycleDialogOpen(true)}>
                <PlusCircle className="mr-2 size-4" />
                Criar primeiro ciclo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cycles.map((cycle) => {
                const sessions = cycle.sessions ?? [];
                const completedSessions = sessions.length;
                const remainingSessions = Math.max(
                  cycle.max_sessions - completedSessions,
                  0,
                );

                const isOpen = openCycles.has(cycle.id);

                return (
                  <Collapsible
                    key={cycle.id}
                    open={isOpen}
                    onOpenChange={(open) => handleToggleCycle(cycle.id, open)}
                  >
                    <div className="rounded-xl border border-border/70 bg-card shadow-sm">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition hover:bg-muted/50"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>
                                Ciclo iniciado em{" "}
                                {formatDatePt(cycle.cycle_date, {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                }) ?? "Data não informada"}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {CYCLE_TYPE_LABELS[cycle.type]}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {PERIODICITY_LABELS[cycle.periodicity]}
                              </span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              Sessões {completedSessions}/{cycle.max_sessions}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {remainingSessions > 0 && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {remainingSessions} sessão{remainingSessions > 1 ? "s" : ""} restante{remainingSessions > 1 ? "s" : ""}
                              </span>
                            )}
                            <ChevronDown
                              className={cn(
                                "size-5 text-muted-foreground transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-4 border-t border-border/70 px-4 py-5">
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <div>
                              {/* <p className="text-sm font-medium text-muted-foreground">
                                Visão geral
                              </p> */}
                              {/* <p className="text-sm text-muted-foreground">
                                Última atualização em{" "}
                                {formatDatePt(cycle.created_at, {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) ?? "—"}
                              </p> */}
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isDeletingCycle === cycle.id}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    {isDeletingCycle === cycle.id ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="mr-2 size-4" />
                                    )}
                                    Deletar ciclo
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja deletar este ciclo? Esta ação irá remover o ciclo e todas as sessões associadas a ele. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDeleteCycle(cycle.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Deletar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              {remainingSessions > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openSessionDialog(cycle.id, completedSessions)}
                                >
                                  <PlusCircle className="mr-2 size-4" />
                                  Nova sessão
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-5 md:grid-cols-2">
                            {sessions.map((session, index) => (
                              <SessionCard
                                key={session.id}
                                index={index}
                                session={session}
                                sessions={sessions}
                                expanded={expandedNotes[session.id] ?? false}
                                onToggleNotes={() => handleToggleNotes(session.id)}
                                onDeleteSession={onDeleteSession}
                                isDeletingSession={isDeletingSession}
                              />
                            ))}
                          </div>

                          {remainingSessions > 0 && (
                              <div className="grid gap-3 md:grid-cols-5">
                                {Array.from({ length: remainingSessions }).map((_, slotIndex) => {
                                  const absoluteIndex = completedSessions + slotIndex;
                                  return (
                                    <PlannedSessionCard
                                      key={`${cycle.id}-planned-${absoluteIndex}`}
                                      slotNumber={absoluteIndex + 1}
                                      onCreate={() => openSessionDialog(cycle.id, absoluteIndex)}
                                    />
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>

      <Dialog open={isCycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo ciclo</DialogTitle>
            <DialogDescription>
              Defina a data de início e o planeamento geral das sessões deste ciclo.
            </DialogDescription>
          </DialogHeader>

          <Form {...cycleForm}>
            <form
              className="space-y-4"
              onSubmit={cycleForm.handleSubmit(onCreateCycle)}
            >
              <FormField
                control={cycleForm.control}
                name="cycle_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do ciclo</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={cycleForm.control}
                  name="max_sessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de sessões</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const incomingValue = event.target.value;
                            field.onChange(
                              incomingValue === ""
                                ? undefined
                                : Number(incomingValue),
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={cycleForm.control}
                  name="periodicity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodicidade</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={cycleForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de ciclo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">Tratamento</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCycleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isCycleSubmitting || isRefreshing}
                >
                  {isCycleSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    "Salvar ciclo"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSessionDialogOpen}
        onOpenChange={(open) => {
          setSessionDialogOpen(open);
          if (!open) {
            setSessionDialog({ cycleId: null, slotIndex: null });
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registar sessão</DialogTitle>
            <DialogDescription>
              Preencha os dados da sessão e as novas medições de composição corporal.
            </DialogDescription>
          </DialogHeader>

          {selectedCycleForSession ? (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {CYCLE_TYPE_LABELS[selectedCycleForSession.type]} ·{" "}
                {PERIODICITY_LABELS[selectedCycleForSession.periodicity]} · Sessão{" "}
                {(sessionDialog.slotIndex ?? selectedCycleForSession.sessions.length) + 1} de{" "}
                {selectedCycleForSession.max_sessions}
              </p>
              <p>
                Ciclo iniciado em{" "}
                {formatDatePt(selectedCycleForSession.cycle_date, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) ?? "Data não informada"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Não foi possível identificar o ciclo selecionado. Recarregue a página.
            </p>
          )}

          <Form {...sessionForm}>
            <form
              className="space-y-5"
              onSubmit={sessionForm.handleSubmit(onCreateSession)}
            >
              <div className="flex gap-4">
                <FormField
                  control={sessionForm.control}
                  name="session_date"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Data e hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sessionForm.control}
                  name="medication_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Medicação</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingOptions}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {medications.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Nenhuma medicação cadastrada.
                            </div>
                          ) : (
                            medications.map((medication) => (
                              <SelectItem key={medication.id} value={medication.id}>
                                {medication.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sessionForm.control}
                  name="dosage_mg"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Dosagem (mg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={sessionForm.control}
                  name="activator_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ativador</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => field.onChange(value || undefined)}
                        disabled={isLoadingOptions}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activators.map((activator) => (
                            <SelectItem key={activator.id} value={activator.id}>
                              {activator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-border/60 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Composição corporal
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Registe as medidas aferidas nesta sessão.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.weight_kg"
                    label="Peso (kg)"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.fat_percentage"
                    label="Gordura (%)"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.fat_kg"
                    label="Gordura (kg)"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.muscle_mass_percentage"
                    label="Massa muscular (%)"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.h2o_percentage"
                    label="H2O (%)"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.metabolic_age"
                    label="Idade metabólica"
                  />
                  <CompositionFieldInput
                    control={sessionForm.control}
                    name="body_composition.visceral_fat"
                    label="Gordura visceral"
                  />
                </div>
              </div>

              <FormField
                control={sessionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações detalhadas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional · até 500 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeSessionDialog}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSessionSubmitting ||
                    isRefreshing ||
                    medications.length === 0
                  }
                >
                  {isSessionSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    "Registar sessão"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

type CompositionFieldInputProps = {
  control: Control<SessionFormValues>;
  name: `body_composition.${keyof SessionFormValues["body_composition"]}`;
  label: string;
  placeholder?: string;
};

function CompositionFieldInput({
  control,
  name,
  label,
  placeholder,
}: CompositionFieldInputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type SessionCardProps = {
  session: SessionDetails;
  index: number;
  sessions: SessionDetails[];
  expanded: boolean;
  onToggleNotes: () => void;
  onDeleteSession: (sessionId: string) => void;
  isDeletingSession: string | null;
};

function calculateCompositionDifference(
  currentValue: string | number | null | undefined,
  previousValue: string | number | null | undefined,
): { difference: number | null; isIncrease: boolean } {
  if (currentValue == null || previousValue == null) {
    return { difference: null, isIncrease: false };
  }

  const current = typeof currentValue === 'string' ? parseFloat(currentValue) : currentValue;
  const previous = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;

  if (isNaN(current) || isNaN(previous)) {
    return { difference: null, isIncrease: false };
  }

  const diff = current - previous;
  return {
    difference: Math.abs(diff),
    isIncrease: diff > 0,
  };
}

function SessionCard({ session, index, sessions, expanded, onToggleNotes, onDeleteSession, isDeletingSession }: SessionCardProps) {
  // Obter sessão anterior para calcular diferenças
  const previousSession = index > 0 ? sessions[index - 1] : null;

  const weightLabel = formatNumberPt(session.body_composition?.weight_kg, 1, 1);
  const weightDiff = calculateCompositionDifference(
    session.body_composition?.weight_kg,
    previousSession?.body_composition?.weight_kg,
  );

  const fatPercentage = formatNumberPt(
    session.body_composition?.fat_percentage,
    1,
    1,
  );
  const fatPercentageDiff = calculateCompositionDifference(
    session.body_composition?.fat_percentage,
    previousSession?.body_composition?.fat_percentage,
  );

  const muscleMass = formatNumberPt(
    session.body_composition?.muscle_mass_percentage,
    1,
    1,
  );
  const muscleMassDiff = calculateCompositionDifference(
    session.body_composition?.muscle_mass_percentage,
    previousSession?.body_composition?.muscle_mass_percentage,
  );

  const h2oPercentage = formatNumberPt(
    session.body_composition?.h2o_percentage,
    1,
    1,
  );
  const h2oPercentageDiff = calculateCompositionDifference(
    session.body_composition?.h2o_percentage,
    previousSession?.body_composition?.h2o_percentage,
  );

  const metabolicAge = formatNumberPt(
    session.body_composition?.metabolic_age,
    0,
    0,
  );
  const metabolicAgeDiff = calculateCompositionDifference(
    session.body_composition?.metabolic_age,
    previousSession?.body_composition?.metabolic_age,
  );

  const visceralFat = formatNumberPt(
    session.body_composition?.visceral_fat,
    0,
    0,
  );
  const visceralFatDiff = calculateCompositionDifference(
    session.body_composition?.visceral_fat,
    previousSession?.body_composition?.visceral_fat,
  );

  const notes = session.notes?.trim();

  const renderCompositionSpan = (
    label: string,
    value: string | null,
    diff: { difference: number | null; isIncrease: boolean },
  ) => {
    if (!value) return null;

    const hasDifference = diff.difference !== null && diff.difference !== 0;
    const differenceText = hasDifference ? formatNumberPt(diff.difference, 1, 1) : null;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground",
          hasDifference && (diff.isIncrease ? "text-red-600" : "text-green-600"),
        )}
      >
        {label} {value}
        {hasDifference && differenceText && (
          <>
            {diff.isIncrease ? (
              <ArrowUp className="size-3 text-red-500" />
            ) : (
              <ArrowDown className="size-3 text-green-500" />
            )}
            <span className="text-xs">({differenceText})</span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-background p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Sessão {index + 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={isDeletingSession === session.id}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                {isDeletingSession === session.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar esta sessão? Esta ação irá remover permanentemente os dados da sessão, incluindo a composição corporal. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteSession(session.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Realizada
          </span>
        </div>
      </div>

      <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <SessionMeta
          icon={<Pill className="size-4" />}
          label="Medicação"
          value={session.medication?.name ?? "Não informado"}
        />
        <SessionMeta
          icon={<Droplets className="size-4" />}
          label="Ativador"
          value={session.activator?.name ?? "Sem ativador"}
        />
        <SessionMeta
          icon={<ClipboardList className="size-4" />}
          label="Dosagem"
          value={
            session.dosage_mg
              ? `${formatNumberPt(session.dosage_mg, 1, 2)} mg`
              : "Não informado"
          }
        />
        <SessionMeta
          icon={<CalendarDays className="size-4" />}
          label="Registado em"
          value={
            formatDatePt(session.session_date, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) ?? "—"
          }
        />
      </div>

      {session.body_composition ? (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
          {/* <p className="font-medium text-foreground">Composição</p> */}
          <div className="mt-1 flex flex-wrap gap-3">
            {renderCompositionSpan("Peso", weightLabel ? `${weightLabel} kg` : null, weightDiff)}
            {renderCompositionSpan("Gordura", fatPercentage ? `${fatPercentage}%` : null, fatPercentageDiff)}
            {renderCompositionSpan("Massa muscular", muscleMass ? `${muscleMass}%` : null, muscleMassDiff)}
            {renderCompositionSpan("H2O", h2oPercentage ? `${h2oPercentage}%` : null, h2oPercentageDiff)}
            {renderCompositionSpan("Idade metabólica", metabolicAge, metabolicAgeDiff)}
            {renderCompositionSpan("Gordura visceral", visceralFat, visceralFatDiff)}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground">
          Sem composição corporal vinculada.
        </div>
      )}

      {notes ? (
        <SessionNotes
          notes={notes}
          expanded={expanded}
          onToggle={onToggleNotes}
        />
      ) : (
        <div className="rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Nenhuma observação registada.
        </div>
      )}
    </div>
  );
}

type SessionMetaProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function SessionMeta({ icon, label, value }: SessionMetaProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2">
      <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

type SessionNotesProps = {
  notes: string;
  expanded: boolean;
  onToggle: () => void;
};

function SessionNotes({ notes, expanded, onToggle }: SessionNotesProps) {
  const shouldTruncate = notes.length > NOTE_PREVIEW_LIMIT;
  const preview = shouldTruncate
    ? `${notes.slice(0, NOTE_PREVIEW_LIMIT)}…`
    : notes;

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <NotebookText className="size-4 text-muted-foreground" />
        Notas da sessão
      </div>
      <p className="text-sm text-muted-foreground">
        {expanded ? notes : preview}
      </p>
      {shouldTruncate && (
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={onToggle}
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  );
}

type PlannedSessionCardProps = {
  slotNumber: number;
  onCreate: () => void;
};

function PlannedSessionCard({ slotNumber, onCreate }: PlannedSessionCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">
          Sessão {slotNumber}
        </p>
        <p className="text-sm text-muted-foreground">
          Aguardando.
        </p>
      </div>
      <Button className="mt-4" size="sm" variant="secondary" onClick={onCreate}>
        <PlusCircle className="mr-2 size-4" />
        Registar sessão
      </Button>
    </div>
  );
}

function parseDecimal(value: string): number {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return Number.NaN;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function buildSessionPayload(
  cycleId: string,
  values: SessionFormValues,
) {
  return {
    cycle_id: cycleId,
    session_date: new Date(values.session_date).toISOString(),
    notes: values.notes?.trim() ? values.notes.trim() : null,
    medication_id: values.medication_id,
    activator_id: values.activator_id ? values.activator_id : null,
    dosage_mg: values.dosage_mg ? parseDecimal(values.dosage_mg) : null,
    body_composition: {
      weight_kg: parseDecimal(values.body_composition.weight_kg),
      fat_percentage: parseDecimal(values.body_composition.fat_percentage),
      fat_kg: parseDecimal(values.body_composition.fat_kg),
      muscle_mass_percentage: parseDecimal(values.body_composition.muscle_mass_percentage),
      h2o_percentage: parseDecimal(values.body_composition.h2o_percentage),
      metabolic_age: parseDecimal(values.body_composition.metabolic_age),
      visceral_fat: parseDecimal(values.body_composition.visceral_fat),
    },
  };
}

function buildCycleDateIso(dateInput: string): string {
  const [year, month, day] = dateInput.split("-").map((value) => Number(value));
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return new Date().toISOString();
  }
  return new Date(Date.UTC(year, month - 1, day, 9, 0, 0)).toISOString();
}

function buildDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateTimeLocalValue(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


