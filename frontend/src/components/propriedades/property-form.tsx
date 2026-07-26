import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { listarFusosHorarios } from "../../services/propriedades.service";
import type { CriarPropriedadeInput } from "../../services/propriedades.service";
import { nomesTiposPropriedade, tiposPropriedade, type FusoHorario, type Propriedade } from "../../types/database";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome da propriedade."),
  nome_fantasia: z.string().optional(),
  documento: z.string().optional(),
  tipo: z.enum(tiposPropriedade),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, "Use a sigla do estado.").optional(),
  cep: z.string().optional(),
  pais: z.string().min(2, "Informe o país."),
  fuso_horario: z.string().min(3, "Informe um fuso horário IANA válido."),
  horario_checkin: z.string().optional(),
  horario_checkout: z.string().optional(),
  status: z.enum(["ativa", "inativa"]),
});

type Values = z.infer<typeof schema>;
export type PropertyFormInput = Omit<CriarPropriedadeInput, "organizacao_id">;

const defaultValues: Values = {
  nome: "",
  nome_fantasia: "",
  documento: "",
  tipo: "hotel",
  descricao: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
  pais: "Brasil",
  fuso_horario: Intl.DateTimeFormat().resolvedOptions().timeZone,
  horario_checkin: "",
  horario_checkout: "",
  status: "ativa",
};

type PropertyFormProps = {
  value?: Propriedade | null;
  onSubmit: (input: PropertyFormInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
};

export function PropertyForm({ value, onSubmit, submitting = false, onCancel }: PropertyFormProps) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues });
  const [fusosHorarios, setFusosHorarios] = useState<FusoHorario[]>([]);

  useEffect(() => {
    let active = true;
    void listarFusosHorarios()
      .then((items) => { if (active) setFusosHorarios(items); })
      .catch(() => { if (active) setFusosHorarios([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    form.reset(value ? {
      nome: value.nome,
      nome_fantasia: value.nome_fantasia ?? "",
      documento: value.documento ?? "",
      tipo: value.tipo,
      descricao: value.descricao ?? "",
      endereco: value.endereco ?? "",
      numero: value.numero ?? "",
      complemento: value.complemento ?? "",
      bairro: value.bairro ?? "",
      cidade: value.cidade ?? "",
      estado: value.estado ?? "",
      cep: value.cep ?? "",
      pais: value.pais,
      fuso_horario: value.fuso_horario,
      horario_checkin: value.horario_checkin?.slice(0, 5) ?? "",
      horario_checkout: value.horario_checkout?.slice(0, 5) ?? "",
      status: value.status,
    } : defaultValues);
  }, [form, value]);

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit((values) => onSubmit({
      ...values,
      nome: values.nome.trim(),
      nome_fantasia: values.nome_fantasia?.trim() || null,
      documento: values.documento?.trim() || null,
      descricao: values.descricao?.trim() || null,
      endereco: values.endereco?.trim() || null,
      numero: values.numero?.trim() || null,
      complemento: values.complemento?.trim() || null,
      bairro: values.bairro?.trim() || null,
      cidade: values.cidade?.trim() || null,
      estado: values.estado?.trim().toLocaleUpperCase("pt-BR") || null,
      cep: values.cep?.replace(/\D/g, "") || null,
      pais: values.pais.trim() || "Brasil",
      fuso_horario: values.fuso_horario.trim(),
      horario_checkin: values.horario_checkin || null,
      horario_checkout: values.horario_checkout || null,
    }))}>
      <section className="space-y-4">
        <div><h3 className="text-sm font-semibold">Identificação</h3><p className="mt-1 text-xs text-muted-foreground">Dados que distinguem a propriedade dentro da empresa atual.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={form.formState.errors.nome?.message}><Input placeholder="Ex.: Hotel Centro" {...form.register("nome")} /></FormField>
          <FormField label="Nome fantasia ou identificação" optional><Input placeholder="Ex.: Unidade Limeira" {...form.register("nome_fantasia")} /></FormField>
          <FormField label="Tipo"><Select {...form.register("tipo")}>{tiposPropriedade.map((tipo) => <option key={tipo} value={tipo}>{nomesTiposPropriedade[tipo]}</option>)}</Select></FormField>
          <FormField label="Documento" optional><Input placeholder="CNPJ ou identificação fiscal" {...form.register("documento")} /></FormField>
        </div>
        <FormField label="Descrição" optional><Textarea {...form.register("descricao")} /></FormField>
      </section>

      <section className="space-y-4 border-t pt-5">
        <div><h3 className="text-sm font-semibold">Endereço</h3><p className="mt-1 text-xs text-muted-foreground">Localização completa para operação e experiência do hóspede.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FormField label="Endereço" optional><Input {...form.register("endereco")} /></FormField>
          <FormField label="Número" optional><Input {...form.register("numero")} /></FormField>
          <FormField label="Complemento" optional><Input {...form.register("complemento")} /></FormField>
          <FormField label="Bairro" optional><Input {...form.register("bairro")} /></FormField>
          <FormField label="Cidade" optional><Input {...form.register("cidade")} /></FormField>
          <FormField label="Estado" optional error={form.formState.errors.estado?.message}><Input maxLength={2} placeholder="SP" {...form.register("estado")} /></FormField>
          <FormField label="CEP" optional><Input inputMode="numeric" {...form.register("cep")} /></FormField>
          <FormField label="País"><Input {...form.register("pais")} /></FormField>
        </div>
      </section>

      <section className="space-y-4 border-t pt-5">
        <div><h3 className="text-sm font-semibold">Operação padrão</h3><p className="mt-1 text-xs text-muted-foreground">Horários e disponibilidade cadastral da propriedade.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FormField label="Check-in" optional><Input type="time" {...form.register("horario_checkin")} /></FormField>
          <FormField label="Check-out" optional><Input type="time" {...form.register("horario_checkout")} /></FormField>
          <FormField label="Fuso horário" error={form.formState.errors.fuso_horario?.message}>
            <Input list="fusos-horarios-iana" placeholder="Região/Cidade" {...form.register("fuso_horario")} />
            <datalist id="fusos-horarios-iana">{fusosHorarios.map((fuso) => <option key={fuso.nome} value={fuso.nome} />)}</datalist>
          </FormField>
          <FormField label="Status"><Select {...form.register("status")}><option value="ativa">Ativa</option><option value="inativa">Inativa</option></Select></FormField>
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t pt-5">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Cadastrar propriedade"}</Button>
      </div>
    </form>
  );
}
