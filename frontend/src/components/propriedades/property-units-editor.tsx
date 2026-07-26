import { BedDouble, Plus, Power, RotateCcw, Rows3, Users } from "lucide-react";
import { useState } from "react";
import { atualizarUnidade, criarUnidade } from "../../services/unidades.service";
import { nomesStatusOperacionalUnidade, nomesTiposUnidade, type Unidade } from "../../types/database";
import { EmptyState } from "../feedback/empty-state";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import { BulkUnitForm } from "./bulk-unit-form";
import { UnitForm, type UnitFormInput } from "./unit-form";

type PropertyUnitsEditorProps = {
  propriedadeId: string;
  unidades: Unidade[];
  onSaved?: () => void | Promise<void>;
};

export function PropertyUnitsEditor({ propriedadeId, unidades, onSaved }: PropertyUnitsEditorProps) {
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [confirming, setConfirming] = useState<Unidade | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const activeUnits = unidades.filter((unidade) => unidade.ativo);

  async function create(input: UnitFormInput) {
    setProcessingId("new");
    try {
      await criarUnidade({ propriedade_id: propriedadeId, ...input });
      await onSaved?.();
      setCreating(false);
      showToast("Unidade cadastrada.");
    } catch (error) {
      console.error("[Unidades] Falha ao cadastrar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível cadastrar a unidade.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  async function changeActive(unidade: Unidade, ativo: boolean) {
    setProcessingId(unidade.id);
    try {
      await atualizarUnidade({ id: unidade.id, ativo });
      await onSaved?.();
      setConfirming(null);
      showToast(ativo ? "Unidade reativada." : "Unidade inativada. A quantidade ativa foi atualizada.");
    } catch (error) {
      console.error("[Unidades] Falha ao alterar ativação", error);
      showToast(error instanceof Error ? error.message : "Não foi possível alterar a unidade.", "error");
    } finally {
      setProcessingId(null);
    }
  }

  if (creating) {
    return <div className="space-y-5"><div><h3 className="text-sm font-semibold">Adicionar unidade</h3><p className="mt-1 text-xs text-muted-foreground">A nova unidade aumentará a quantidade ativa da propriedade.</p></div><UnitForm onSubmit={create} submitting={processingId === "new"} onCancel={() => setCreating(false)} /></div>;
  }

  if (bulkCreating) {
    return <div className="space-y-5"><div><h3 className="text-sm font-semibold">Cadastro em lote</h3><p className="mt-1 text-xs text-muted-foreground">Crie várias unidades com o mesmo tipo e capacidade.</p></div><BulkUnitForm propriedadeId={propriedadeId} onCancel={() => setBulkCreating(false)} onSaved={async () => { await onSaved?.(); }} /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <UnitMetric label="Unidades ativas" value={activeUnits.length} />
        <UnitMetric label="Total cadastrado" value={unidades.length} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setBulkCreating(true)}><Rows3 className="size-4" />Cadastro em lote</Button>
        <Button type="button" size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />Adicionar unidade</Button>
      </div>

      {unidades.length === 0 ? <EmptyState compact title="Nenhuma unidade" description="Adicione uma unidade ou use o cadastro em lote." icon={BedDouble} /> : (
        <div className="max-h-80 divide-y overflow-y-auto rounded-md border">
          {unidades.map((unidade) => (
            <div key={unidade.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{unidade.nome}</p><Badge variant={unidade.ativo ? "success" : "muted"}>{unidade.ativo ? "Ativa" : "Inativa"}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{unidade.codigo || "Sem código"} · {nomesTiposUnidade[unidade.tipo]} · {nomesStatusOperacionalUnidade[unidade.status_operacional]} · <span className="inline-flex items-center gap-1"><Users className="size-3" />{unidade.capacidade_hospedes ?? "—"}</span></p>
              </div>
              <Button type="button" size="sm" variant="ghost" disabled={processingId === unidade.id} onClick={() => unidade.ativo ? setConfirming(unidade) : void changeActive(unidade, true)}>{unidade.ativo ? <Power className="size-4" /> : <RotateCcw className="size-4" />}{unidade.ativo ? "Inativar" : "Reativar"}</Button>
            </div>
          ))}
        </div>
      )}

      {confirming && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/25 bg-destructive/[0.05] p-4"><div><p className="text-sm font-semibold text-destructive">Diminuir quantidade ativa</p><p className="mt-1 text-xs text-muted-foreground">A unidade {confirming.nome} será inativada e permanecerá no histórico.</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="ghost" disabled={processingId === confirming.id} onClick={() => setConfirming(null)}>Cancelar</Button><Button type="button" size="sm" variant="destructive" disabled={processingId === confirming.id} onClick={() => void changeActive(confirming, false)}>{processingId === confirming.id ? "Inativando..." : "Inativar unidade"}</Button></div></div>}
    </div>
  );
}

function UnitMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border bg-surface p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>;
}
