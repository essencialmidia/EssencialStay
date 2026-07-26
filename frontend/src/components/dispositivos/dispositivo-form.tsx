import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { listarOpcoesAmbiente } from "../../services/ambientes.service";
import type { CriarDispositivoInput } from "../../services/dispositivos.service";
import {
  nomesStatusCadastroDispositivo,
  statusCadastroDispositivo,
  type Ambiente,
  type CatalogoDispositivo,
  type Dispositivo,
  type Propriedade,
} from "../../types/database";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  propriedade_id: z.string().min(1, "Selecione a propriedade."),
  ambiente_id: z.string().optional(),
  catalogo_id: z.string().optional(),
  nome: z.string().min(2, "Informe o nome do dispositivo."),
  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  versao_firmware: z.string().optional(),
  status_cadastro: z.enum(statusCadastroDispositivo),
  metadados: z.string().refine((value) => {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, "Informe um objeto JSON válido."),
});

type Values = z.infer<typeof schema>;
export type DispositivoFormInput = Omit<CriarDispositivoInput, "organizacao_id">;

type Props = {
  organizacaoId: string;
  propriedades: Propriedade[];
  catalogo: CatalogoDispositivo[];
  value?: Dispositivo | null;
  onSubmit: (input: DispositivoFormInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
};

export function DispositivoForm({ organizacaoId, propriedades, catalogo, value, onSubmit, submitting, onCancel }: Props) {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      propriedade_id: propriedades[0]?.id ?? "",
      ambiente_id: "",
      catalogo_id: "",
      nome: "",
      fabricante: "",
      modelo: "",
      numero_serie: "",
      versao_firmware: "",
      status_cadastro: "ativo",
      metadados: "{}",
    },
  });

  useEffect(() => {
    form.reset(value ? {
      propriedade_id: value.propriedade_id,
      ambiente_id: value.ambiente_id ?? "",
      catalogo_id: value.catalogo_id ?? "",
      nome: value.nome,
      fabricante: value.fabricante ?? "",
      modelo: value.modelo ?? "",
      numero_serie: value.numero_serie ?? "",
      versao_firmware: value.versao_firmware ?? "",
      status_cadastro: value.status_cadastro,
      metadados: JSON.stringify(value.metadados, null, 2),
    } : {
      propriedade_id: propriedades[0]?.id ?? "",
      ambiente_id: "",
      catalogo_id: "",
      nome: "",
      fabricante: "",
      modelo: "",
      numero_serie: "",
      versao_firmware: "",
      status_cadastro: "ativo",
      metadados: "{}",
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

  const catalogRegister = form.register("catalogo_id");

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit({
      propriedade_id: values.propriedade_id,
      ambiente_id: values.ambiente_id || null,
      catalogo_id: values.catalogo_id || null,
      nome: values.nome.trim(),
      fabricante: values.fabricante?.trim() || null,
      modelo: values.modelo?.trim() || null,
      numero_serie: values.numero_serie?.trim() || null,
      versao_firmware: values.versao_firmware?.trim() || null,
      status_cadastro: values.status_cadastro,
      metadados: JSON.parse(values.metadados) as Record<string, unknown>,
    }))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Propriedade" error={form.formState.errors.propriedade_id?.message}>
          <Select disabled={Boolean(value)} {...form.register("propriedade_id")}>
            <option value="">Selecione</option>
            {propriedades.map((item) => <option key={item.id} value={item.id}>{item.nome_fantasia || item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Ambiente" optional>
          <Select {...form.register("ambiente_id")}>
            <option value="">Sem ambiente</option>
            {ambientes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </Select>
        </FormField>
        <FormField label="Catálogo" optional>
          <Select {...catalogRegister} onChange={(event) => {
            void catalogRegister.onChange(event);
            const item = catalogo.find((catalogItem) => catalogItem.id === event.target.value);
            if (item) {
              form.setValue("fabricante", item.fabricante);
              form.setValue("modelo", item.modelo);
            }
          }}>
            <option value="">Cadastro manual</option>
            {catalogo.map((item) => <option key={item.id} value={item.id}>{item.fabricante} · {item.modelo}</option>)}
          </Select>
        </FormField>
        <FormField label="Nome" error={form.formState.errors.nome?.message}>
          <Input placeholder="Ex.: Fechadura 101" {...form.register("nome")} />
        </FormField>
        <FormField label="Fabricante" optional><Input {...form.register("fabricante")} /></FormField>
        <FormField label="Modelo" optional><Input {...form.register("modelo")} /></FormField>
        <FormField label="Número de série" optional><Input {...form.register("numero_serie")} /></FormField>
        <FormField label="Versão do firmware" optional><Input {...form.register("versao_firmware")} /></FormField>
        <FormField label="Situação cadastral">
          <Select {...form.register("status_cadastro")}>
            {statusCadastroDispositivo.map((item) => <option key={item} value={item}>{nomesStatusCadastroDispositivo[item]}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Metadados não sensíveis" error={form.formState.errors.metadados?.message}>
        <Textarea className="min-h-28 font-mono text-xs" spellCheck={false} {...form.register("metadados")} />
      </FormField>
      <div className="flex justify-end gap-2 border-t pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Criar dispositivo"}</Button>
      </div>
    </form>
  );
}
