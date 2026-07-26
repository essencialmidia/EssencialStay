import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { criarUnidadesEmLote } from "../../services/unidades.service";
import { nomesTiposUnidade, tiposUnidade } from "../../types/database";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { useToast } from "../ui/toast";

const schema = z.object({
  prefixo: z.string().optional(),
  andar: z.string().optional(),
  numero_inicial: z.coerce.number().int().min(1, "Informe um número inicial válido."),
  numero_final: z.coerce.number().int().min(1, "Informe um número final válido."),
  tipo: z.enum(tiposUnidade),
  capacidade_hospedes: z.coerce.number().int().min(1, "A capacidade deve ser maior que zero."),
}).superRefine((values, context) => {
  if (values.numero_final < values.numero_inicial) context.addIssue({ code: z.ZodIssueCode.custom, path: ["numero_final"], message: "O número final deve ser maior ou igual ao inicial." });
  if (values.numero_final - values.numero_inicial + 1 > 500) context.addIssue({ code: z.ZodIssueCode.custom, path: ["numero_final"], message: "O lote pode conter no máximo 500 unidades." });
});

type Values = z.infer<typeof schema>;
type BulkUnitFormProps = { propriedadeId: string; onCancel?: () => void; onSaved: () => void | Promise<void> };

export function BulkUnitForm({ propriedadeId, onCancel, onSaved }: BulkUnitFormProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { prefixo: "", andar: "", numero_inicial: 101, numero_final: 110, tipo: "standard", capacidade_hospedes: 2 } });
  const inicio = form.watch("numero_inicial");
  const fim = form.watch("numero_final");
  const quantidade = useMemo(() => Number.isInteger(inicio) && Number.isInteger(fim) && fim >= inicio ? fim - inicio + 1 : 0, [fim, inicio]);

  async function submit(values: Values) {
    setSubmitting(true);
    try {
      const result = await criarUnidadesEmLote({ propriedade_id: propriedadeId, prefixo: values.prefixo, andar: values.andar, numero_inicial: values.numero_inicial, numero_final: values.numero_final, tipo: values.tipo, capacidade_hospedes: values.capacidade_hospedes });
      await onSaved();
      showToast(result.ignoradas > 0 ? `${result.criadas} unidades criadas; ${result.ignoradas} códigos já existentes foram ignorados.` : `${result.criadas} unidades criadas com sucesso.`);
      onCancel?.();
    } catch (error) {
      console.error("[Unidades] Falha no cadastro em lote", error);
      showToast(error instanceof Error ? error.message : "Não foi possível criar as unidades em lote.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
      <div className="flex items-center justify-between rounded-md border bg-surface px-4 py-3"><span className="text-sm text-muted-foreground">Unidades previstas</span><Badge variant="outline">{quantidade}</Badge></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prefixo" optional><Input placeholder="Ex.: A-" {...form.register("prefixo")} /></FormField>
        <FormField label="Andar" optional><Input placeholder="Ex.: 1" {...form.register("andar")} /></FormField>
        <FormField label="Número inicial" error={form.formState.errors.numero_inicial?.message}><Input type="number" min={1} {...form.register("numero_inicial")} /></FormField>
        <FormField label="Número final" error={form.formState.errors.numero_final?.message}><Input type="number" min={1} {...form.register("numero_final")} /></FormField>
        <FormField label="Tipo"><Select {...form.register("tipo")}>{tiposUnidade.map((tipo) => <option key={tipo} value={tipo}>{nomesTiposUnidade[tipo]}</option>)}</Select></FormField>
        <FormField label="Capacidade máxima de hóspedes" error={form.formState.errors.capacidade_hospedes?.message}><Input type="number" min={1} {...form.register("capacidade_hospedes")} /></FormField>
      </div>
      <div className="flex justify-end gap-2 border-t pt-5">{onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}<Button disabled={submitting || quantidade === 0}>{submitting ? "Criando..." : "Criar unidades"}</Button></div>
    </form>
  );
}
