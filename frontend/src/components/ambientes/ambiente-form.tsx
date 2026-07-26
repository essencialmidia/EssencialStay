import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { listarOpcoesAmbiente } from "../../services/ambientes.service";
import type { CriarAmbienteInput } from "../../services/ambientes.service";
import type { Ambiente, Propriedade, Unidade } from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  propriedade_id: z.string().min(1, "Selecione a propriedade."),
  unidade_id: z.string().optional(),
  ambiente_pai_id: z.string().optional(),
  nome: z.string().min(2, "Informe o nome do ambiente."),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type Values = z.infer<typeof schema>;
export type AmbienteFormInput = Omit<CriarAmbienteInput, "organizacao_id">;

type Props = {
  organizacaoId: string;
  propriedades: Propriedade[];
  unidades: Unidade[];
  value?: Ambiente | null;
  onSubmit: (input: AmbienteFormInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
};

export function AmbienteForm({ organizacaoId, propriedades, unidades, value, onSubmit, submitting, onCancel }: Props) {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { propriedade_id: propriedades[0]?.id ?? "", unidade_id: "", ambiente_pai_id: "", nome: "", descricao: "", ativo: true },
  });

  useEffect(() => {
    form.reset(value ? {
      propriedade_id: value.propriedade_id,
      unidade_id: value.unidade_id ?? "",
      ambiente_pai_id: value.ambiente_pai_id ?? "",
      nome: value.nome,
      descricao: value.descricao ?? "",
      ativo: value.ativo,
    } : {
      propriedade_id: propriedades[0]?.id ?? "",
      unidade_id: "",
      ambiente_pai_id: "",
      nome: "",
      descricao: "",
      ativo: true,
    });
  }, [form, propriedades, value]);

  const propriedadeId = form.watch("propriedade_id");
  useEffect(() => {
    if (!propriedadeId) {
      setAmbientes([]);
      return;
    }
    let active = true;
    void listarOpcoesAmbiente(organizacaoId, propriedadeId)
      .then((items) => { if (active) setAmbientes(items); })
      .catch(() => { if (active) setAmbientes([]); });
    return () => { active = false; };
  }, [organizacaoId, propriedadeId]);

  const unidadesDisponiveis = unidades.filter((item) => item.propriedade_id === propriedadeId && item.ativo);
  const ambientesDisponiveis = useMemo(() => {
    if (!value) return ambientes;
    const bloqueados = new Set([value.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const ambiente of ambientes) {
        if (ambiente.ambiente_pai_id && bloqueados.has(ambiente.ambiente_pai_id) && !bloqueados.has(ambiente.id)) {
          bloqueados.add(ambiente.id);
          changed = true;
        }
      }
    }
    return ambientes.filter((item) => !bloqueados.has(item.id));
  }, [ambientes, value]);

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit({
      ...values,
      unidade_id: values.unidade_id || null,
      ambiente_pai_id: values.ambiente_pai_id || null,
      nome: values.nome.trim(),
      descricao: values.descricao?.trim() || null,
    }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Propriedade" error={form.formState.errors.propriedade_id?.message}>
          <Select disabled={Boolean(value)} {...form.register("propriedade_id")}>
            <option value="">Selecione</option>
            {propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Unidade" optional>
          <Select {...form.register("unidade_id")}>
            <option value="">Área comum da propriedade</option>
            {unidadesDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Ambiente superior" optional>
          <Select {...form.register("ambiente_pai_id")}>
            <option value="">Sem ambiente superior</option>
            {ambientesDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Nome" error={form.formState.errors.nome?.message}>
          <Input placeholder="Ex.: Recepção" {...form.register("nome")} />
        </FormField>
      </div>
      <FormField label="Descrição" optional>
        <Textarea placeholder="Identificação operacional do ambiente" {...form.register("descricao")} />
      </FormField>
      <label className="flex items-center gap-3 text-sm font-medium"><Checkbox {...form.register("ativo")} />Ambiente ativo</label>
      <div className="flex justify-end gap-2 border-t pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Criar ambiente"}</Button>
      </div>
    </form>
  );
}
