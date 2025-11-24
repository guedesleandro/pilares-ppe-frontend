"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import {
  ApiError,
  type Medication,
  createMedication as createMedicationRequest,
  deleteMedication as deleteMedicationRequest,
  updateMedication as updateMedicationRequest,
} from "@/lib/api";

export type { Medication } from "@/lib/api";

type MedicationsListProps = {
  medications: Medication[];
};

export function MedicationsList({ medications }: MedicationsListProps) {
  const [items, setItems] = useState<Medication[]>(medications);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [addNameValue, setAddNameValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItems(medications);
  }, [medications]);

  const handleOpenEditDialog = (medication: Medication) => {
    setSelectedMedication(medication);
    setNameValue(medication.name);
    setFormError(null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedMedication(null);
    setNameValue("");
    setFormError(null);
    setIsSaving(false);
  };

  const handleOpenAddDialog = () => {
    setAddNameValue("");
    setAddFormError(null);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setAddNameValue("");
    setAddFormError(null);
    setIsAdding(false);
  };

  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = addNameValue.trim();
    if (!trimmedName) {
      setAddFormError("O nome da medicação é obrigatório.");
      return;
    }

    setIsAdding(true);
    setAddFormError(null);

    try {
      const newMedication = await createMedicationRequest({ name: trimmedName });
      setItems((prev) => [...prev, newMedication].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Medicação criada com sucesso.");
      handleCloseAddDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        const message =
          error.message ?? "Não foi possível criar a medicação. Tente novamente.";
        setAddFormError(message);
        toast.error(message);
      } else {
        console.error("Erro ao criar medicação:", error);
        toast.error("Erro inesperado ao criar a medicação.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedMedication) return;

    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setFormError("O nome da medicação é obrigatório.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const updatedMedication = await updateMedicationRequest(
        selectedMedication.id,
        { name: trimmedName },
      );
      setItems((prev) =>
        prev.map((item) =>
          item.id === updatedMedication.id ? updatedMedication : item,
        ),
      );
      toast.success("Medicação atualizada com sucesso.");
      handleCloseEditDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message ??
            "Não foi possível atualizar a medicação. Verifique os dados e tente novamente.",
        );
      } else {
        console.error("Erro ao atualizar medicação:", error);
        toast.error("Erro inesperado ao atualizar a medicação.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteDialog = (medication: Medication) => {
    setMedicationToDelete(medication);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMedicationToDelete(null);
    setIsDeleting(false);
  };

  const handleDelete = async () => {
    if (!medicationToDelete) return;

    setIsDeleting(true);

    try {
      await deleteMedicationRequest(medicationToDelete.id);
      setItems((prev) => prev.filter((item) => item.id !== medicationToDelete.id));
      toast.success("Medicação removida com sucesso.");
      handleCloseDeleteDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message ?? "Não foi possível remover a medicação.");
      } else {
        console.error("Erro ao remover medicação:", error);
        toast.error("Erro inesperado ao remover a medicação.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Medicações</h1>
          <p className="text-sm text-muted-foreground">
            {/* Comentário em pt-BR: copy introdutório da tela */}
            Consulte, edite e remova as medicações disponíveis para os pacientes.
          </p>
        </div>
        <Button
          onClick={handleOpenAddDialog}
          className="cursor-pointer self-start sm:self-auto"
        >
          <Plus className="mr-2 size-4" />
          Adicionar
        </Button>
      </div>

      {items.length === 0 ? (
        <Item variant="outline" className="justify-center">
          <ItemContent className="items-center text-sm text-muted-foreground">
            Nenhuma medicação registada até o momento.
          </ItemContent>
        </Item>
      ) : (
        <ItemGroup className="space-y-3">
          {items.map((medication) => (
            <Item key={medication.id} variant="outline" className="flex-wrap gap-4">
              <ItemContent>
                <ItemTitle>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-base font-medium"
                    onClick={() => handleOpenEditDialog(medication)}
                  >
                    {medication.name}
                  </Button>
                </ItemTitle>
              </ItemContent>
              <ItemActions className="ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleOpenDeleteDialog(medication)}
                  aria-label={`Remover ${medication.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <Dialog open={addDialogOpen} onOpenChange={(open) => (!open ? handleCloseAddDialog() : setAddDialogOpen(open))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar medicação</DialogTitle>
            <DialogDescription>
              Preencha o nome da nova medicação e salve para adicioná-la ao sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="add-medication-name">Nome da medicação</Label>
              <Input
                id="add-medication-name"
                value={addNameValue}
                onChange={(event) => setAddNameValue(event.target.value)}
                placeholder="Insira o nome da medicação"
              />
              {addFormError ? (
                <p className="text-sm text-destructive">{addFormError}</p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddDialog}
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Adicionando
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => (!open ? handleCloseEditDialog() : setEditDialogOpen(open))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar medicação</DialogTitle>
            <DialogDescription>
              Atualize o nome da medicação selecionada e salve para aplicar as alterações.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="medication-name">Nome da medicação</Label>
              <Input
                id="medication-name"
                value={nameValue}
                onChange={(event) => setNameValue(event.target.value)}
                placeholder="Insira o novo nome"
              />
              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Salvando
                  </>
                ) : (
                  "Salvar mudanças"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => (!open ? handleCloseDeleteDialog() : setDeleteDialogOpen(open))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover medicação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir{" "}
              <span className="font-medium">{medicationToDelete?.name}</span>? Essa ação
              não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={handleCloseDeleteDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Removendo
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


