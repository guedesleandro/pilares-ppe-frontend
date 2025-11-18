"use client";

import { useState } from "react";
import Link from "next/link";
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

type PatientActionsProps = {
  patientId: string;
  patientName: string;
};

export function PatientActions({ patientId, patientName }: PatientActionsProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
      setIsDialogOpen(false);
      router.push("/dashboard/pacientes");
      router.refresh();
    } catch (error) {
      console.error("Erro ao remover paciente:", error);
      toast.error("Erro inesperado ao remover o paciente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/pacientes/${patientId}/editar`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
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

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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


