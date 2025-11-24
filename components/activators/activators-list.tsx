"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  type Activator,
  createActivator as createActivatorRequest,
  deleteActivator as deleteActivatorRequest,
  updateActivator as updateActivatorRequest,
} from "@/lib/api";

export type { Activator, ActivatorComposition } from "@/lib/api";

export type SubstanceOption = {
  id: string;
  name: string;
};

type ActivatorsListProps = {
  activators: Activator[];
  substances: SubstanceOption[];
};

type CompositionFormItem = {
  rowId: string;
  substance_id: string;
  volume_ml: string;
};

const generateRowId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2, 10)}`;
};

const createCompositionRow = (substanceId = ""): CompositionFormItem => ({
  rowId: generateRowId(),
  substance_id: substanceId,
  volume_ml: "",
});

const decimalFormatter = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ActivatorsList({ activators, substances }: ActivatorsListProps) {
  const [items, setItems] = useState<Activator[]>(() =>
    [...activators].sort((a, b) => a.name.localeCompare(b.name)),
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedActivator, setSelectedActivator] = useState<Activator | null>(null);
  const [activatorToDelete, setActivatorToDelete] = useState<Activator | null>(null);

  const [nameValue, setNameValue] = useState("");
  const [addNameValue, setAddNameValue] = useState("");

  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editCompositionError, setEditCompositionError] = useState<string | null>(null);
  const [addNameError, setAddNameError] = useState<string | null>(null);
  const [addCompositionError, setAddCompositionError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedSubstances = useMemo(() => {
    return [...substances].sort((a, b) => a.name.localeCompare(b.name));
  }, [substances]);

  const [addCompositions, setAddCompositions] = useState<CompositionFormItem[]>(() =>
    substances.length > 0 ? [createCompositionRow([...substances].sort((a, b) => a.name.localeCompare(b.name))[0].id)] : [],
  );
  const [editCompositions, setEditCompositions] = useState<CompositionFormItem[]>([]);

  useEffect(() => {
    setItems([...activators].sort((a, b) => a.name.localeCompare(b.name)));
  }, [activators]);

  const hasSubstances = substances.length > 0;

  const formatVolume = (value: number) => `${decimalFormatter.format(value)} ml`;

  const resetAddForm = () => {
    setAddNameValue("");
    setAddNameError(null);
    setAddCompositionError(null);
    setAddCompositions(
      sortedSubstances.length > 0 ? [createCompositionRow(sortedSubstances[0].id)] : [],
    );
    setIsAdding(false);
  };

  const handleOpenAddDialog = () => {
    resetAddForm();
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    resetAddForm();
  };

  const handleOpenEditDialog = (activator: Activator) => {
    setSelectedActivator(activator);
    setNameValue(activator.name);
    setEditNameError(null);
    setEditCompositionError(null);
    setEditCompositions(
      activator.compositions.map((composition) => ({
        rowId: generateRowId(),
        substance_id: composition.substance_id,
        volume_ml: composition.volume_ml.toString(),
      })),
    );
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedActivator(null);
    setNameValue("");
    setEditNameError(null);
    setEditCompositionError(null);
    setEditCompositions([]);
    setIsSaving(false);
  };

  const handleOpenDeleteDialog = (activator: Activator) => {
    setActivatorToDelete(activator);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setActivatorToDelete(null);
    setIsDeleting(false);
  };

  const handleAddCompositionRow = () => {
    setAddCompositions((prev) => [
      ...prev,
      createCompositionRow(sortedSubstances[0]?.id ?? ""),
    ]);
  };

  const handleEditCompositionRow = () => {
    setEditCompositions((prev) => [
      ...prev,
      createCompositionRow(sortedSubstances[0]?.id ?? ""),
    ]);
  };

  const handleRemoveAddCompositionRow = (rowId: string) => {
    setAddCompositions((prev) =>
      prev.length <= 1 ? prev : prev.filter((item) => item.rowId !== rowId),
    );
  };

  const handleRemoveEditCompositionRow = (rowId: string) => {
    setEditCompositions((prev) =>
      prev.length <= 1 ? prev : prev.filter((item) => item.rowId !== rowId),
    );
  };

  const handleAddCompositionChange = (
    rowId: string,
    field: keyof Omit<CompositionFormItem, "rowId">,
    value: string,
  ) => {
    setAddCompositions((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleEditCompositionChange = (
    rowId: string,
    field: keyof Omit<CompositionFormItem, "rowId">,
    value: string,
  ) => {
    setEditCompositions((prev) =>
      prev.map((item) =>
        item.rowId === rowId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const validateCompositions = (
    compositions: CompositionFormItem[],
    setError: (message: string | null) => void,
  ) => {
    if (compositions.length === 0) {
      setError("Adicione pelo menos uma composição.");
      return false;
    }

    for (const item of compositions) {
      if (!item.substance_id) {
        setError("Selecione uma substância para cada composição.");
        return false;
      }

      const value = Number(item.volume_ml);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Informe um volume em ml maior que zero para cada composição.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const buildPayload = (name: string, compositions: CompositionFormItem[]) => ({
    name,
    compositions: compositions.map((item) => ({
      substance_id: item.substance_id,
      volume_ml: Number(item.volume_ml),
    })),
  });

  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasSubstances) {
      toast.error("Cadastre ao menos uma substância antes de criar ativadores.");
      return;
    }

    const trimmedName = addNameValue.trim();
    let hasError = false;
    setAddNameError(null);

    if (!trimmedName) {
      setAddNameError("O nome do ativador é obrigatório.");
      hasError = true;
    }

    const compositionsValid = validateCompositions(
      addCompositions,
      setAddCompositionError,
    );

    if (hasError || !compositionsValid) {
      return;
    }

    setIsAdding(true);

    try {
      const newActivator = await createActivatorRequest(
        buildPayload(trimmedName, addCompositions),
      );
      setItems((prev) =>
        [...prev, newActivator].sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast.success("Ativador criado com sucesso.");
      handleCloseAddDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message || "Não foi possível criar o ativador. Tente novamente.",
        );
      } else {
        console.error("Erro ao criar ativador:", error);
        toast.error("Erro inesperado ao criar o ativador.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedActivator) {
      return;
    }

    const trimmedName = nameValue.trim();
    let hasError = false;
    setEditNameError(null);

    if (!trimmedName) {
      setEditNameError("O nome do ativador é obrigatório.");
      hasError = true;
    }

    const compositionsValid = validateCompositions(
      editCompositions,
      setEditCompositionError,
    );

    if (hasError || !compositionsValid) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedActivator = await updateActivatorRequest(
        selectedActivator.id,
        buildPayload(trimmedName, editCompositions),
      );
      setItems((prev) =>
        prev.map((item) => (item.id === updatedActivator.id ? updatedActivator : item)),
      );
      toast.success("Ativador atualizado com sucesso.");
      handleCloseEditDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(
          error.message ??
            "Não foi possível atualizar o ativador. Verifique os dados e tente novamente.",
        );
      } else {
        console.error("Erro ao atualizar ativador:", error);
        toast.error("Erro inesperado ao atualizar o ativador.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activatorToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteActivatorRequest(activatorToDelete.id);
      setItems((prev) => prev.filter((item) => item.id !== activatorToDelete.id));
      toast.success("Ativador removido com sucesso.");
      handleCloseDeleteDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message ?? "Não foi possível remover o ativador.");
      } else {
        console.error("Erro ao remover ativador:", error);
        toast.error("Erro inesperado ao remover o ativador.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCompositionRows = (
    compositions: CompositionFormItem[],
    onChange: (
      rowId: string,
      field: keyof Omit<CompositionFormItem, "rowId">,
      value: string,
    ) => void,
    onRemove: (rowId: string) => void,
  ) => (
    <div className="space-y-3">
      {compositions.map((composition) => (
        <div
          key={composition.rowId}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed p-3"
        >
          <div className="flex-1 min-w-[200px]">
            <Select
              value={composition.substance_id}
              onValueChange={(value) => onChange(composition.rowId, "substance_id", value)}
            >
              <SelectTrigger className="w-full justify-between">
                <SelectValue placeholder="Selecione a substância" />
              </SelectTrigger>
              <SelectContent>
                {sortedSubstances.map((substance) => (
                  <SelectItem key={substance.id} value={substance.id}>
                    {substance.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <Input
              id={`volume-${composition.rowId}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={composition.volume_ml}
              onChange={(event) => onChange(composition.rowId, "volume_ml", event.target.value)}
              placeholder="Volume (ml)"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(composition.rowId)}
            disabled={compositions.length === 1}
            aria-label="Remover composição"
            className="shrink-0"
          >
            <Minus className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-card/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ativadores Metabólicos</h1>
          <p className="text-sm text-muted-foreground">
            {/* Comentário em pt-BR: copy introdutório da tela */}
            Monte combinações de substâncias e volumes para uso nos protocolos clínicos.
          </p>
        </div>
        <Button
          onClick={handleOpenAddDialog}
          className="cursor-pointer self-start sm:self-auto"
          disabled={!hasSubstances}
          title={
            hasSubstances ? undefined : "Cadastre ao menos uma substância antes de criar ativadores."
          }
        >
          <Plus className="mr-2 size-4" />
          Adicionar
        </Button>
      </div>

      {!hasSubstances ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          Cadastre pelo menos uma substância para conseguir criar ativadores metabólicos.
        </div>
      ) : null}

      {items.length === 0 ? (
        <Item variant="outline" className="justify-center">
          <ItemContent className="items-center text-sm text-muted-foreground">
            Nenhum ativador cadastrado até o momento.
          </ItemContent>
        </Item>
      ) : (
        <ItemGroup className="space-y-3">
          {items.map((activator) => (
            <Item key={activator.id} variant="outline" className="flex-wrap gap-4">
              <ItemContent className="min-w-[240px]">
                <ItemTitle>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-base font-medium"
                    onClick={() => handleOpenEditDialog(activator)}
                  >
                    {activator.name}
                  </Button>
                </ItemTitle>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {activator.compositions.length === 0 ? (
                    <span>Sem composições cadastradas.</span>
                  ) : (
                    activator.compositions.map((composition, index) => (
                      <span
                        key={`${activator.id}-${composition.substance_id}-${composition.volume_ml}-${index}`}
                        className="rounded-full border border-border px-2 py-0.5"
                      >
                        {composition.substance_name} • {formatVolume(composition.volume_ml)}
                      </span>
                    ))
                  )}
                </div>
              </ItemContent>
              <ItemActions className="ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleOpenDeleteDialog(activator)}
                  aria-label={`Remover ${activator.name}`}
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
            <DialogTitle>Adicionar ativador metabólico</DialogTitle>
            <DialogDescription>
              Defina o nome e as composições que fazem parte deste ativador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="add-activator-name">Nome do ativador</Label>
              <Input
                id="add-activator-name"
                value={addNameValue}
                onChange={(event) => setAddNameValue(event.target.value)}
                placeholder="Informe o nome do ativador"
              />
              {addNameError ? <p className="text-sm text-destructive">{addNameError}</p> : null}
            </div>

            {renderCompositionRows(addCompositions, handleAddCompositionChange, handleRemoveAddCompositionRow)}

            {addCompositionError ? (
              <p className="text-sm text-destructive">{addCompositionError}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCompositionRow}
                disabled={!hasSubstances}
              >
                <Plus className="mr-2 size-4" />
                Adicionar composição
              </Button>
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
              <Button type="submit" disabled={isAdding || !hasSubstances}>
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
            <DialogTitle>Editar ativador metabólico</DialogTitle>
            <DialogDescription>
              Ajuste o nome e a composição deste ativador. É obrigatório manter ao menos uma substância.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="activator-name">Nome do ativador</Label>
              <Input
                id="activator-name"
                value={nameValue}
                onChange={(event) => setNameValue(event.target.value)}
                placeholder="Informe o novo nome"
              />
              {editNameError ? <p className="text-sm text-destructive">{editNameError}</p> : null}
            </div>

            {renderCompositionRows(editCompositions, handleEditCompositionChange, handleRemoveEditCompositionRow)}

            {editCompositionError ? (
              <p className="text-sm text-destructive">{editCompositionError}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleEditCompositionRow}
                disabled={!hasSubstances}
              >
                <Plus className="mr-2 size-4" />
                Adicionar composição
              </Button>
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
            <AlertDialogTitle>Remover ativador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir{" "}
              <span className="font-medium">{activatorToDelete?.name}</span>? Essa ação não poderá ser desfeita.
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



