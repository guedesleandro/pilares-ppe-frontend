"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDatePt, applyDateMask, createMaskedInputHandler } from "@/lib/utils";
import {
  ApiError,
  createPatient as createPatientRequest,
  listMedications,
  type Medication,
} from "@/lib/api";

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
] as const;

const TREATMENT_LOCATION_OPTIONS = [
  { value: "clinic", label: "Clínica" },
  { value: "home", label: "Domiciliar" },
] as const;

type MedicationOption = Pick<Medication, "id" | "name">;

const patientCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  gender: z.enum(["male", "female"]),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória").refine(
    (value) => {
      const parsed = parseDatePt(value);
      return parsed !== null;
    },
    "Data inválida. Use o formato dd/mm/yyyy"
  ),
  process_number: z.string().optional(),
  treatment_location: z.enum(["clinic", "home"]),
  preferred_medication_id: z.string().optional(),
});

type PatientCreateFormData = z.infer<typeof patientCreateSchema>;

type PatientCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientCreateDialog({
  open,
  onOpenChange,
}: PatientCreateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<MedicationOption[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);
  const router = useRouter();

  const form = useForm<PatientCreateFormData>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: {
      name: "",
      gender: "male",
      birth_date: "",
      process_number: "",
      treatment_location: "clinic",
      preferred_medication_id: "none",
    },
  });

  // Carregar medicações disponíveis
  useEffect(() => {
    async function loadMedications() {
      setIsLoadingMedications(true);
      try {
        const data = await listMedications();
        setMedications(data || []);
      } catch (error) {
        console.error("Erro ao carregar medicações:", error);
        setMedications([]);
      } finally {
        setIsLoadingMedications(false);
      }
    }

    if (open) {
      loadMedications();
    }
  }, [open]);

  async function onSubmit(data: PatientCreateFormData) {
    setIsLoading(true);

    try {
      const parsedDate = parseDatePt(data.birth_date);
      if (!parsedDate) {
        toast.error("Data de nascimento inválida");
        return;
      }

      const payload = {
        name: data.name,
        gender: data.gender,
        birth_date: parsedDate.toISOString().split('T')[0], // yyyy-mm-dd format
        process_number: data.process_number || null,
        treatment_location: data.treatment_location,
        preferred_medication_id: data.preferred_medication_id === "none" ? null : data.preferred_medication_id || null,
      };

      const newPatient = await createPatientRequest(payload);
      toast.success("Paciente criado com sucesso.");
      onOpenChange(false);

      // Redirecionar para a página do paciente
      router.push(`/dashboard/pacientes/${newPatient.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message ?? "Não foi possível criar o paciente. Tente novamente.",
        );
      } else {
        console.error("Erro ao criar paciente:", error);
        toast.error("Erro inesperado ao criar o paciente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar paciente</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo paciente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="process_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Processo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: PROC-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="dd/mm/yyyy"
                        value={field.value}
                        onChange={createMaskedInputHandler(field.onChange, applyDateMask)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="treatment_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local de tratamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o local" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TREATMENT_LOCATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_medication_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicação Preferencial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma medicação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {isLoadingMedications ? (
                          <SelectItem value="loading" disabled>
                            Carregando medicações...
                          </SelectItem>
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
            </div>

            <DialogFooter className="mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Criando
                  </>
                ) : (
                  "Criar paciente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
