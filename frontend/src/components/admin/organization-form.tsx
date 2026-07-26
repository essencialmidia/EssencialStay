import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SalvarOrganizacaoInput } from "../../services/organizacoes.service";
import type { Organizacao } from "../../types/database";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

const schema = z.object({
  tipo: z.enum(["pessoa_fisica", "pessoa_juridica"]), nome: z.string().min(2, "Informe a razão social ou nome completo."), nome_fantasia: z.string().optional(), documento: z.string().optional(),
  email: z.string().email("Informe um e-mail válido.").optional().or(z.literal("")), telefone: z.string().optional(), status: z.enum(["ativo", "suspenso", "cancelado"]), logo: z.instanceof(FileList).optional(),
});
type Values = z.infer<typeof schema>;

export function OrganizationForm({ value, onSubmit, submitting, onCancel }: { value?: Organizacao | null; onSubmit: (input: SalvarOrganizacaoInput) => void | Promise<void>; submitting?: boolean; onCancel?: () => void }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { tipo: "pessoa_juridica", nome: "", nome_fantasia: "", documento: "", email: "", telefone: "", status: "ativo" } });
  useEffect(() => { if (value) form.reset({ tipo: value.tipo, nome: value.nome, nome_fantasia: value.nome_fantasia ?? "", documento: value.documento ?? "", email: value.email ?? "", telefone: value.telefone ?? "", status: value.status }); }, [form, value]);
  return <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit({ tipo: values.tipo, nome: values.nome.trim(), nome_fantasia: values.nome_fantasia?.trim() || null, documento: values.documento || null, email: values.email || null, telefone: values.telefone || null, status: values.status, logo: values.logo?.item(0) ?? null, logo_url: value?.logo_url }))}>
    <div className="grid gap-4 sm:grid-cols-2"><FormField label="Tipo de pessoa"><Select {...form.register("tipo")}><option value="pessoa_juridica">Pessoa jurídica</option><option value="pessoa_fisica">Pessoa física</option></Select></FormField><FormField label="Status"><Select {...form.register("status")}><option value="ativo">Ativo</option><option value="suspenso">Suspenso</option><option value="cancelado">Cancelado</option></Select></FormField></div>
    <FormField label={form.watch("tipo") === "pessoa_juridica" ? "Razão social" : "Nome completo"} error={form.formState.errors.nome?.message}><Input {...form.register("nome")} /></FormField>
    <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome fantasia" optional><Input {...form.register("nome_fantasia")} /></FormField><FormField label={form.watch("tipo") === "pessoa_juridica" ? "CNPJ" : "CPF"} optional><Input inputMode="numeric" {...form.register("documento")} /></FormField><FormField label="E-mail" optional error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></FormField><FormField label="Telefone" optional><Input inputMode="tel" {...form.register("telefone")} /></FormField></div>
    <FormField label="Logotipo" optional><Input type="file" accept="image/png,image/jpeg,image/webp" {...form.register("logo")} /></FormField>
    <div className="flex justify-end gap-2 border-t pt-5">{onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}<Button disabled={submitting}>{submitting ? "Salvando..." : value ? "Salvar alterações" : "Cadastrar empresa"}</Button></div>
  </form>;
}
