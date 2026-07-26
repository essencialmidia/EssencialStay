import { Check } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { instaladoresAutomacao, marcasAutomacao, nomesInstaladores, nomesMarcas, nomesRecursos, nomesSituacaoAutomacao, nomesSituacaoInstalacao, recursosDisponiveis } from "../../lib/recursos-inteligentes";
import { cn } from "../../lib/utils";
import { salvarAutomacao, type AutomacaoComRecursos } from "../../services/automacao.service";
import type { InstaladorAutomacao, MarcaAutomacao, RecursoAutomacao, StatusAutomacao, StatusInstalacaoAutomacao } from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { useToast } from "../ui/toast";

type FormState = {
  possui: StatusAutomacao;
  marca: MarcaAutomacao;
  marcaOutro: string;
  modelo: string;
  situacao: StatusInstalacaoAutomacao | "";
  instalador: InstaladorAutomacao;
  instaladorOutro: string;
  recursos: RecursoAutomacao[];
};

const defaults: FormState = { possui: "nao_possui", marca: "nao_informada", marcaOutro: "", modelo: "", situacao: "", instalador: "nao_informado", instaladorOutro: "", recursos: [] };

type Props = { propriedadeId: string; value?: AutomacaoComRecursos | null; onSaved?: () => void | Promise<void>; readOnly?: boolean };

export function AutomationConfigForm({ propriedadeId, value, onSaved, readOnly = false }: Props) {
  const [form, setForm] = useState<FormState>(defaults);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setForm(value ? {
      possui: value.possui_automacao,
      marca: value.marca,
      marcaOutro: value.marca_outro ?? "",
      modelo: value.modelo ?? "",
      situacao: value.situacao_instalacao ?? "",
      instalador: value.instalador_responsavel,
      instaladorOutro: value.instalador_outro ?? "",
      recursos: value.recursos,
    } : defaults);
  }, [value]);

  function toggleResource(recurso: RecursoAutomacao) {
    setForm((current) => ({ ...current, recursos: current.recursos.includes(recurso) ? current.recursos.filter((item) => item !== recurso) : [...current.recursos, recurso] }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await salvarAutomacao({
        propriedade_id: propriedadeId,
        possui_automacao: form.possui,
        marca: form.possui === "nao_possui" ? "nao_informada" : form.marca,
        marca_outro: form.marca === "outra" ? form.marcaOutro.trim() || null : null,
        modelo: form.possui === "nao_possui" ? null : form.modelo.trim() || null,
        situacao_instalacao: form.possui === "nao_possui" ? null : form.possui === "instalacao_futura" ? "planejada" : form.situacao || null,
        instalador_responsavel: form.possui === "nao_possui" ? "nao_informado" : form.instalador,
        instalador_outro: form.instalador === "outro_fornecedor" ? form.instaladorOutro.trim() || null : null,
        recursos: form.possui === "nao_possui" ? [] : form.recursos,
      });
      showToast("Configuração de automação salva.");
      await onSaved?.();
    } catch (error) {
      console.error("[Automação] Falha ao salvar configuração", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar a automação.", "error");
    } finally { setSubmitting(false); }
  }

  return <form className="space-y-6" onSubmit={submit}>
    <fieldset disabled={readOnly || submitting} className="space-y-6 disabled:opacity-70">
      <div><p className="text-sm font-medium">A propriedade possui automação?</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[
        "nao_possui", "possui", "instalacao_futura",
      ].map((option) => <label key={option} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm font-medium", form.possui === option && "border-accent bg-accent/[0.06]")}><input className="sr-only" type="radio" checked={form.possui === option} onChange={() => setForm((current) => ({ ...current, possui: option as StatusAutomacao }))} /><span className={cn("grid size-5 place-items-center rounded-full border", form.possui === option && "border-accent bg-accent text-accent-foreground")}>{form.possui === option && <Check className="size-3" />}</span>{nomesSituacaoAutomacao[option as StatusAutomacao]}</label>)}</div></div>

      {form.possui !== "nao_possui" && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FormField label="Marca da automação"><Select value={form.marca} onChange={(event) => setForm((current) => ({ ...current, marca: event.target.value as MarcaAutomacao }))}>{marcasAutomacao.map((marca) => <option key={marca} value={marca}>{nomesMarcas[marca]}</option>)}</Select></FormField>
          <FormField label="Tipo ou modelo" optional><Input placeholder="Ex.: PG42, HyPanel, Tuya Cloud" value={form.modelo} onChange={(event) => setForm((current) => ({ ...current, modelo: event.target.value }))} /></FormField>
          <FormField label="Situação da instalação"><Select value={form.possui === "instalacao_futura" ? "planejada" : form.situacao} disabled={form.possui === "instalacao_futura"} onChange={(event) => setForm((current) => ({ ...current, situacao: event.target.value as StatusInstalacaoAutomacao }))}><option value="">Selecione</option>{Object.entries(nomesSituacaoInstalacao).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></FormField>
          <FormField label="Instalador responsável"><Select value={form.instalador} onChange={(event) => setForm((current) => ({ ...current, instalador: event.target.value as InstaladorAutomacao }))}>{instaladoresAutomacao.map((item) => <option key={item} value={item}>{nomesInstaladores[item]}</option>)}</Select></FormField>
          {form.marca === "outra" && <FormField label="Outra marca"><Input value={form.marcaOutro} onChange={(event) => setForm((current) => ({ ...current, marcaOutro: event.target.value }))} /></FormField>}
          {form.instalador === "outro_fornecedor" && <FormField label="Fornecedor"><Input value={form.instaladorOutro} onChange={(event) => setForm((current) => ({ ...current, instaladorOutro: event.target.value }))} /></FormField>}
        </div>
        <div><p className="text-sm font-medium">{form.possui === "instalacao_futura" ? "Recursos planejados" : "Recursos instalados"}</p><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{recursosDisponiveis.map((recurso) => <label key={recurso} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-secondary/50", form.recursos.includes(recurso) && "border-accent/40 bg-accent/[0.04]")}><Checkbox checked={form.recursos.includes(recurso)} onChange={() => toggleResource(recurso)} />{nomesRecursos[recurso]}</label>)}</div></div>
      </>}
    </fieldset>
    {!readOnly && <div className="flex justify-end border-t pt-5"><Button disabled={submitting}>{submitting ? "Salvando..." : "Salvar automação"}</Button></div>}
  </form>;
}
