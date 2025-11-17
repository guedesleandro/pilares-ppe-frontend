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

export type Substance = {
  id: string;
  name: string;
  created_at: string;
};

type SubstancesListProps = {
  substances: Substance[];
};

export function SubstancesList({ substances }: SubstancesListProps) {
  const [items, setItems] = useState<Substance[]>(substances);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubstance, setSelectedSubstance] = useState<Substance | null>(null);
  const [substanceToDelete, setSubstanceToDelete] = useState<Substance | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [addNameValue, setAddNameValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItems(substances);
  }, [substances]);

  const handleOpenEditDialog = (substance: Substance) => {
    setSelectedSubstance(substance);
    setNameValue(substance.name);
    setFormError(null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedSubstance(null);
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
      setAddFormError("O nome da substância é obrigatório.");
      return;
    }

    setIsAdding(true);
    setAddFormError(null);

    try {
      const response = await fetch("/api/substances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail =
          typeof errorData?.detail === "string"
            ? errorData.detail
            : "Não foi possível criar a substância.";
        setAddFormError(detail);
        toast.error(detail);
        return;
      }

      const newSubstance = (await response.json()) as Substance;
      setItems((prev) => [...prev, newSubstance].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Substância criada com sucesso.");
      handleCloseAddDialog();
    } catch (error) {
      console.error("Erro ao criar substância:", error);
      toast.error("Erro inesperado ao criar a substância.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSubstance) return;

    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      setFormError("O nome da substância é obrigatório.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/substances/${selectedSubstance.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail =
          typeof errorData?.detail === "string"
            ? errorData.detail
            : "Não foi possível atualizar a substância.";
        toast.error(detail);
        return;
      }

      const updatedSubstance = (await response.json()) as Substance;
      setItems((prev) =>
        prev.map((item) => (item.id === updatedSubstance.id ? updatedSubstance : item)),
      );
      toast.success("Substância atualizada com sucesso.");
      handleCloseEditDialog();
    } catch (error) {
      console.error("Erro ao atualizar substância:", error);
      toast.error("Erro inesperado ao atualizar a substância.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteDialog = (substance: Substance) => {
    setSubstanceToDelete(substance);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSubstanceToDelete(null);
    setIsDeleting(false);
  };

  const handleDelete = async () => {
    if (!substanceToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/substances/${substanceToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail =
          typeof errorData?.detail === "string"
            ? errorData.detail
            : "Não foi possível remover a substância.";
        toast.error(detail);
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== substanceToDelete.id));
      toast.success("Substância removida com sucesso.");
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Erro ao remover substância:", error);
      toast.error("Erro inesperado ao remover a substância.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Substâncias</h1>
          <p className="text-sm text-muted-foreground">
            {/* Comentário em pt-BR: copy introdutório da tela */}
            Cadastre, edite e remova as substâncias utilizadas nos protocolos clínicos.
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
            Nenhuma substância registada até o momento.
          </ItemContent>
        </Item>
      ) : (
        <ItemGroup className="space-y-3">
          {items.map((substance) => (
            <Item key={substance.id} variant="outline" className="flex-wrap gap-4">
              <ItemContent>
                <ItemTitle>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-base font-medium"
                    onClick={() => handleOpenEditDialog(substance)}
                  >
                    {substance.name}
                  </Button>
                </ItemTitle>
              </ItemContent>
              <ItemActions className="ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleOpenDeleteDialog(substance)}
                  aria-label={`Remover ${substance.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => (!open ? handleCloseAddDialog() : setAddDialogOpen(open))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar substância</DialogTitle>
            <DialogDescription>
              Preencha o nome da nova substância e salve para adicioná-la ao sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="add-substance-name">Nome da substância</Label>
              <Input
                id="add-substance-name"
                value={addNameValue}
                onChange={(event) => setAddNameValue(event.target.value)}
                placeholder="Insira o nome da substância"
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

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => (!open ? handleCloseEditDialog() : setEditDialogOpen(open))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar substância</DialogTitle>
            <DialogDescription>
              Atualize o nome da substância selecionada e salve para aplicar as alterações.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="substance-name">Nome da substância</Label>
              <Input
                id="substance-name"
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
            <AlertDialogTitle>Remover substância</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir{" "}
              <span className="font-medium">{substanceToDelete?.name}</span>? Essa ação
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



