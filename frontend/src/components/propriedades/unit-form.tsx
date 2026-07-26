import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { CriarUnidadeInput } from "../../services/unidades.service";
import { nomesTiposUnidade, tiposUnidade, type Unidade } from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da unidade."),
  codigo: z.string().optional(),
  numero_identificacao: z.string().optional(),
  tipo: z.enum(tiposUnidade),
  andar: z.string().optional(),
  capacidade_hospedes: z.coerce.number().int().min(1, "A capacidade deve ser maior que zero."),
  ativo: z.boolean(),
});

type Values = z.infer<typeof schema>;
export type UnitFormInput = Omit<CriarUnidadeInput, "propriedade_id">;

const defaultValues: Values = {
  nome: "",
  codigo: "",
  numero_identificacao: "",
  tipo: "standard",
  andar: "",
  capacidade_hospedes: 2,
  ativo: true,
};

type UnitFormProps = {
  value?: Unidade | null;
  onSubmit: (input: UnitFormInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
};

export function UnitForm({ value, onSubmit, submitting = false, onCancel }: UnitFormProps) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    form.reset(value ? {
      nome: value.nome,
      codigo: value.codigo ?? "",
      numero_identificacao: value.numero_identificacao ?? "",
      tipo: value.tipo,
      andar: value.andar ?? "",
      capacidade_hospedes: value.capacidade_hospedes ?? 2,
      ativo: value.ativo,
    } : defaultValues);
  }, [form, value]);

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit({
      ...values,
      nome: values.nome.trim(),
      codigo: values.codigo?.trim() || null,
      numero_identificacao: values.numero_identificacao?.trim() || null,
      andar: values.andar?.trim() || null,
    }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome da unidade" error={form.formState.errors.nome?.message}><Input placeholder="Ex.: Suíte 101" {...form.register("nome")} /></FormField>
        <FormField label="Código" optional><Input placeholder="Ex.: S101" {...form.register("codigo")} /></FormField>
        <FormField label="Tipo da unidade"><Select {...form.register("tipo")}>{tiposUnidade.map((tipo) => <option key={tipo} value={tipo}>{nomesTiposUnidade[tipo]}</option>)}</Select></FormField>
        <FormField label="Capacidade máxima de hóspedes" error={form.formState.errors.capacidade_hospedes?.message}><Input type="number" min={1} {...form.register("capacidade_hospedes")} /></FormField>
        <FormField label="Andar" optional><Input placeholder="Ex.: 1" {...form.register("andar")} /></FormField>
        <FormField label="Número ou identificação" optional><Input placeholder="Ex.: 101" {...form.register("numero_identificacao")} /></FormField>
        <div className="flex items-end pb-2"><label className="flex items-center gap-3 text-sm font-medium"><Checkbox {...form.register("ativo")} />Unidade ativa</label></div>
      </div>
      <div className="flex justify-end gap-2 border-t pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Cadastrar unidade"}</Button>
      </div>
    </form>
  );
}
