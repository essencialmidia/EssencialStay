import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SalvarConexaoIntegracaoInput } from "../../services/conexoes-integracao.service";
import {
  ambientesExecucaoIntegracao,
  nomesAmbientesExecucaoIntegracao,
  nomesStatusIntegracao,
  statusIntegracao,
  type ConexaoIntegracao,
  type Propriedade,
  type ProvedorIntegracao,
} from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

const schema = z.object({
  nome_exibicao: z.string().min(2, "Informe o nome da conexão."),
  provedor_id: z.string().min(1, "Selecione o provedor."),
  ambiente_execucao: z.enum(ambientesExecucaoIntegracao),
  status: z.enum(statusIntegracao),
  propriedade_ids: z.array(z.string()).min(1, "Selecione ao menos uma propriedade."),
});

type Values = z.infer<typeof schema>;
export type ConexaoIntegracaoFormInput = Omit<SalvarConexaoIntegracaoInput, "id" | "organizacao_id">;

type Props = {
  propriedades: Propriedade[];
  provedores: ProvedorIntegracao[];
  value?: ConexaoIntegracao | null;
  onSubmit: (input: ConexaoIntegracaoFormInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
};

export function ConexaoIntegracaoForm({ propriedades, provedores, value, onSubmit, submitting, onCancel }: Props) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome_exibicao: "",
      provedor_id: provedores[0]?.id ?? "",
      ambiente_execucao: "producao",
      status: "desconectada",
      propriedade_ids: propriedades[0] ? [propriedades[0].id] : [],
    },
  });

  useEffect(() => {
    form.reset(value ? {
      nome_exibicao: value.nome_exibicao,
      provedor_id: value.provedor_id,
      ambiente_execucao: value.ambiente_execucao,
      status: value.status,
      propriedade_ids: value.propriedades.filter((item) => item.ativo).map((item) => item.propriedade_id),
    } : {
      nome_exibicao: "",
      provedor_id: provedores[0]?.id ?? "",
      ambiente_execucao: "producao",
      status: "desconectada",
      propriedade_ids: propriedades[0] ? [propriedades[0].id] : [],
    });
  }, [form, propriedades, provedores, value]);

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit({ ...values, nome_exibicao: values.nome_exibicao.trim() }))}>
      <FormField label="Nome de exibição" error={form.formState.errors.nome_exibicao?.message}>
        <Input placeholder="Ex.: Automação do portfólio" {...form.register("nome_exibicao")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Provedor" error={form.formState.errors.provedor_id?.message}>
          <Select {...form.register("provedor_id")}>
            <option value="">Selecione</option>
            {provedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Ambiente">
          <Select {...form.register("ambiente_execucao")}>
            {ambientesExecucaoIntegracao.map((item) => <option key={item} value={item}>{nomesAmbientesExecucaoIntegracao[item]}</option>)}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...form.register("status")}>
            {statusIntegracao.map((item) => <option key={item} value={item}>{nomesStatusIntegracao[item]}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Propriedades atendidas" error={form.formState.errors.propriedade_ids?.message}>
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
          {propriedades.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-secondary/60">
              <Checkbox value={item.id} {...form.register("propriedade_ids")} />
              <span>{item.nome_fantasia || item.nome}</span>
            </label>
          ))}
        </div>
      </FormField>
      <div className="flex justify-end gap-2 border-t pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Criar conexão"}</Button>
      </div>
    </form>
  );
}
