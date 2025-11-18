"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PatientEditDialog } from "./patient-edit-dialog";

type PatientActionsProps = {
  patientId: string;
  patientName: string;
  patientData?: {
    name: string;
    gender: "male" | "female";
    birth_date: string;
    process_number?: string | null;
    treatment_location: "clinic" | "home";
    preferred_medication_id?: string | null;
  };
};

export function PatientActions({ patientId, patientName, patientData }: PatientActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail =
          typeof errorData?.detail === "string"
            ? errorData.detail
            : "Não foi possível remover o paciente.";
        toast.error(detail);
        return;
      }

      toast.success("Paciente removido com sucesso.");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard/pacientes");
      router.refresh();
    } catch (error) {
      console.error("Erro ao remover paciente:", error);
      toast.error("Erro inesperado ao remover o paciente.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEditSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Pencil className="size-4" />
          Editar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Excluindo
            </>
          ) : (
            <>
              <Trash2 className="size-4" />
              Excluir
            </>
          )}
        </Button>
      </div>

      <PatientEditDialog
        patientId={patientId}
        patientName={patientName}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleEditSuccess}
        initialData={patientData}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover{" "}
              <span className="font-medium">{patientName}</span>? Essa ação não
              poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Removendo
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Confirmar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


