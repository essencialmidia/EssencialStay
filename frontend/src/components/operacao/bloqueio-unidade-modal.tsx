import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { criarBloqueioUnidade } from "../../services/operacao.service";
import type { Propriedade, TipoBloqueioUnidade, Unidade } from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";

const schema = z.object({
  unidade_id: z.string().uuid("Selecione uma unidade."),
  tipo: z.enum(["manutencao", "manual"]),
  motivo: z.string().min(3, "Informe o motivo do bloqueio."),
  impeditivo: z.boolean(),
  inicio_em: z.string().optional(),
  fim_em: z.string().optional(),
  justificativa: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function BloqueioUnidadeModal({ open, propriedades, unidades, exigeJustificativa, onClose, onSaved }: { open: boolean; propriedades: Propriedade[]; unidades: Unidade[]; exigeJustificativa: boolean; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const { showToast } = useToast();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { unidade_id: "", tipo: "manutencao", motivo: "", impeditivo: true, inicio_em: "", fim_em: "", justificativa: "" } });

  useEffect(() => { if (open) form.reset({ unidade_id: "", tipo: "manutencao", motivo: "", impeditivo: true, inicio_em: "", fim_em: "", justificativa: "" }); }, [form, open]);
  const propertyName = (id: string) => propriedades.find((item) => item.id === id)?.nome_fantasia || propriedades.find((item) => item.id === id)?.nome || "Propriedade";

  async function submit(values: Values) {
    if (exigeJustificativa && (values.justificativa?.trim().length ?? 0) < 3) {
      form.setError("justificativa", { message: "A ação de suporte exige justificativa." });
      return;
    }
    try {
      await criarBloqueioUnidade({ unidadeId: values.unidade_id, tipo: values.tipo as TipoBloqueioUnidade, motivo: values.motivo, impeditivo: values.impeditivo, inicioEm: values.inicio_em ? new Date(values.inicio_em).toISOString() : null, fimEm: values.fim_em ? new Date(values.fim_em).toISOString() : null, justificativa: values.justificativa });
      await onSaved();
      showToast("Bloqueio registrado.");
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível criar o bloqueio.", "error");
    }
  }

  return (
    <Modal open={open} title="Novo bloqueio" description="A restrição não altera o estado real da jornada." onClose={onClose}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <FormField label="Unidade" error={form.formState.errors.unidade_id?.message}><Select {...form.register("unidade_id")}><option value="">Selecione</option>{unidades.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{propertyName(item.propriedade_id)} · {item.nome}</option>)}</Select></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo"><Select {...form.register("tipo")}><option value="manutencao">Manutenção</option><option value="manual">Bloqueio manual</option></Select></FormField>
          <div className="flex items-end pb-2"><label className="flex items-center gap-3 text-sm font-medium"><Checkbox {...form.register("impeditivo")} />Impede operação da unidade</label></div>
          <FormField label="Início" optional><Input type="datetime-local" {...form.register("inicio_em")} /></FormField>
          <FormField label="Fim" optional><Input type="datetime-local" {...form.register("fim_em")} /></FormField>
        </div>
        <FormField label="Motivo" error={form.formState.errors.motivo?.message}><Textarea {...form.register("motivo")} /></FormField>
        {exigeJustificativa && <FormField label="Justificativa de suporte" error={form.formState.errors.justificativa?.message}><Textarea {...form.register("justificativa")} /></FormField>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Registrando..." : "Registrar bloqueio"}</Button></div>
      </form>
    </Modal>
  );
}
