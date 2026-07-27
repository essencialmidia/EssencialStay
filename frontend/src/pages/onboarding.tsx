import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Check, ChevronLeft, ChevronRight, DoorOpen, Hotel, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { BrandMark } from "../components/navigation/brand-mark";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { FormField } from "../components/ui/form-field";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../contexts/auth-context";
import { useOrganization } from "../contexts/organization-context";
import { usePlatformAdmin } from "../contexts/platform-admin-context";
import { marcasAutomacao, nomesMarcas, nomesRecursos, recursosDisponiveis, mapearRecursosInteligentes } from "../lib/recursos-inteligentes";
import { cn } from "../lib/utils";
import { finalizarOnboarding, OnboardingOperationError, temOnboardingPendente } from "../services/onboarding.service";
import { nomesTiposPropriedade, nomesTiposUnidade, tiposPropriedade, tiposUnidade } from "../types/database";

const schema = z.object({
  empresaNome: z.string().min(2, "Informe a razão social ou nome completo."), empresaFantasia: z.string().optional(), empresaTipo: z.enum(["pessoa_fisica", "pessoa_juridica"]), empresaDocumento: z.string().optional(), empresaEmail: z.string().email("Informe um e-mail válido."), empresaTelefone: z.string().optional(), logo: z.instanceof(FileList).optional(),
  propriedadeNome: z.string().min(2, "Informe o nome da propriedade."), propriedadeTipo: z.enum(tiposPropriedade),
  automacaoStatus: z.enum(["nao_possui", "possui", "instalacao_futura"]), automacaoMarca: z.enum(marcasAutomacao), automacaoMarcaOutro: z.string().optional(), automacaoModelo: z.string().optional(), automacaoSituacao: z.enum(["funcionando", "parcial", "em_instalacao", "planejada"]).optional(), automacaoInstalador: z.enum(["essencial_stay", "parceiro", "outro_fornecedor", "proprietario", "nao_informado"]), recursos: z.array(z.enum(recursosDisponiveis)).optional(),
  unidadeNome: z.string().min(2, "Informe o nome da unidade."), unidadeCodigo: z.string().optional(), unidadeTipo: z.enum(tiposUnidade), unidadeCapacidade: z.coerce.number().int().min(1, "Informe a capacidade máxima."),
});
type Values = z.infer<typeof schema>;
const steps = [{ title: "Empresa cliente", description: "Tenant da operação", icon: Building2 }, { title: "Propriedade", description: "Primeira hospedagem", icon: Hotel }, { title: "Automação", description: "Configuração cadastral", icon: Sparkles }, { title: "Unidade", description: "Estrutura inicial", icon: DoorOpen }];
const fields: Array<Array<keyof Values>> = [["empresaNome", "empresaFantasia", "empresaTipo", "empresaDocumento", "empresaEmail", "empresaTelefone", "logo"], ["propriedadeNome", "propriedadeTipo"], ["automacaoStatus", "automacaoMarca", "automacaoMarcaOutro", "automacaoModelo", "automacaoSituacao", "automacaoInstalador", "recursos"], ["unidadeNome", "unidadeCodigo", "unidadeTipo", "unidadeCapacidade"]];

export function OnboardingPage() {
  const { user } = useAuth(); const { organizacoes, loading, reloadOrganizacoes, setOrganizacaoAtualId } = useOrganization(); const { isPlatformAdmin, loading: adminLoading } = usePlatformAdmin(); const { showToast } = useToast(); const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const criandoNovaEmpresa = searchParams.get("modo") === "nova-empresa";
  const [step, setStep] = useState(0); const [submitting, setSubmitting] = useState(false); const [progress, setProgress] = useState(""); const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { empresaNome: typeof user?.user_metadata.nome_completo === "string" ? user.user_metadata.nome_completo : "", empresaFantasia: "", empresaTipo: "pessoa_juridica", empresaDocumento: "", empresaEmail: user?.email ?? "", empresaTelefone: "", propriedadeNome: "", propriedadeTipo: "hotel", automacaoStatus: "nao_possui", automacaoMarca: "nao_informada", automacaoMarcaOutro: "", automacaoModelo: "", automacaoInstalador: "nao_informado", recursos: [], unidadeNome: "", unidadeCodigo: "", unidadeTipo: "standard", unidadeCapacidade: 2 } });
  const automationStatus = form.watch("automacaoStatus"); const selectedBrand = form.watch("automacaoMarca");
  if (!user) return <Navigate to="/login" replace />;
  if (adminLoading) return <main className="grid min-h-screen place-items-center"><p className="text-sm text-muted-foreground">Validando acesso administrativo</p></main>;
  if (isPlatformAdmin && !criandoNovaEmpresa) return <Navigate to="/admin" replace />;
  const currentUser = user;
  if (!isPlatformAdmin && !loading && organizacoes.length > 0 && !temOnboardingPendente(currentUser.id)) return <Navigate to="/dashboard" replace />;
  async function next() { if (await form.trigger(fields[step])) { setError(null); setStep((current) => Math.min(current + 1, steps.length - 1)); } }
  async function submit(values: Values) {
    setSubmitting(true); setError(null);
    try {
      const result = await finalizarOnboarding({
        organizacao: { nome: values.empresaNome.trim(), nome_fantasia: values.empresaFantasia?.trim() || null, tipo: values.empresaTipo, documento: values.empresaDocumento || null, email: values.empresaEmail, telefone: values.empresaTelefone || null, logo: values.logo?.item(0) ?? null },
        propriedade: { nome: values.propriedadeNome.trim(), tipo: values.propriedadeTipo },
        automacao: mapearRecursosInteligentes({ situacao: values.automacaoStatus, marca: values.automacaoMarca, outraMarca: values.automacaoMarcaOutro, modelo: values.automacaoModelo, situacaoInstalacao: values.automacaoSituacao, instalador: values.automacaoInstalador, recursos: values.recursos }),
        unidade: { nome: values.unidadeNome.trim(), codigo: values.unidadeCodigo?.trim() || null, tipo: values.unidadeTipo, capacidade_hospedes: values.unidadeCapacidade },
      }, currentUser, { onProgress: setProgress });
      await reloadOrganizacoes(result.organizacao.id); setOrganizacaoAtualId(result.organizacao.id); showToast(result.logoPendente ? "Configuração concluída. Envie o logotipo depois." : "Empresa e operação inicial criadas."); navigate("/dashboard", { replace: true });
    } catch (submitError) { const message = submitError instanceof Error ? submitError.message : "Não foi possível concluir o onboarding."; setError(message); if (submitError instanceof OnboardingOperationError) setStep(submitError.formStep); }
    finally { setSubmitting(false); setProgress(""); }
  }
  return <main className="min-h-screen bg-background"><header className="border-b"><div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5"><BrandMark /><Badge variant="outline">{criandoNovaEmpresa ? "Nova empresa cliente" : "Configuração inicial"}</Badge></div></header><div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-8 lg:grid-cols-[260px_1fr] lg:py-12">
    <aside><p className="text-xs font-semibold uppercase text-muted-foreground">Etapa {step + 1} de {steps.length}</p><div className="mt-5 space-y-1">{steps.map((item, index) => <div key={item.title} className={cn("flex items-center gap-3 rounded-md px-3 py-3", index === step && "bg-secondary", index < step && "text-muted-foreground")}><div className={cn("grid size-8 place-items-center rounded-md border", index === step && "border-accent bg-accent text-accent-foreground", index < step && "bg-success text-white")} >{index < step ? <Check className="size-4" /> : <item.icon className="size-4" />}</div><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p></div></div>)}</div></aside>
    <Card><CardHeader><CardTitle>{steps[step].title}</CardTitle><CardDescription>{step === 0 ? "Cadastre a empresa cliente que será o tenant do Essencial Stay." : step === 1 ? "Adicione a primeira propriedade. Outras poderão ser incluídas depois." : step === 2 ? "Registre apenas o inventário de automação, sem conectar fabricantes." : "Crie a primeira unidade da propriedade."}</CardDescription></CardHeader><CardContent><form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
      {step === 0 && <><div className="grid gap-4 sm:grid-cols-2"><FormField label="Tipo de pessoa"><Select {...form.register("empresaTipo")}><option value="pessoa_juridica">Pessoa jurídica</option><option value="pessoa_fisica">Pessoa física</option></Select></FormField><FormField label={form.watch("empresaTipo") === "pessoa_juridica" ? "Razão social" : "Nome completo"} error={form.formState.errors.empresaNome?.message}><Input {...form.register("empresaNome")} /></FormField><FormField label="Nome fantasia" optional><Input {...form.register("empresaFantasia")} /></FormField><FormField label="CPF ou CNPJ" optional><Input {...form.register("empresaDocumento")} /></FormField><FormField label="E-mail" error={form.formState.errors.empresaEmail?.message}><Input type="email" {...form.register("empresaEmail")} /></FormField><FormField label="Telefone" optional><Input {...form.register("empresaTelefone")} /></FormField></div><FormField label="Logotipo" optional><Input type="file" accept="image/*" {...form.register("logo")} /></FormField></>}
      {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome da propriedade" error={form.formState.errors.propriedadeNome?.message}><Input placeholder="Ex.: Hotel Mônaco" {...form.register("propriedadeNome")} /></FormField><FormField label="Tipo"><Select {...form.register("propriedadeTipo")}>{tiposPropriedade.map((tipo) => <option key={tipo} value={tipo}>{nomesTiposPropriedade[tipo]}</option>)}</Select></FormField></div>}
      {step === 2 && <><FormField label="A propriedade possui automação?"><Select {...form.register("automacaoStatus")}><option value="nao_possui">Não possui</option><option value="possui">Já possui</option><option value="instalacao_futura">Será instalada</option></Select></FormField>{automationStatus !== "nao_possui" && <><div className="grid gap-4 sm:grid-cols-2"><FormField label="Marca da automação"><Select {...form.register("automacaoMarca")}>{marcasAutomacao.map((item) => <option value={item} key={item}>{nomesMarcas[item]}</option>)}</Select></FormField><FormField label="Tipo ou modelo" optional><Input placeholder="Ex.: PG42" {...form.register("automacaoModelo")} /></FormField>{selectedBrand === "outra" && <FormField label="Outra marca"><Input {...form.register("automacaoMarcaOutro")} /></FormField>}<FormField label="Situação da instalação"><Select {...form.register("automacaoSituacao")}><option value="">Selecione</option><option value="funcionando">Em funcionamento</option><option value="parcial">Instalada parcialmente</option><option value="em_instalacao">Em instalação</option><option value="planejada">Planejada</option></Select></FormField><FormField label="Instalador responsável"><Select {...form.register("automacaoInstalador")}><option value="essencial_stay">Essencial Stay</option><option value="parceiro">Parceiro</option><option value="outro_fornecedor">Outro fornecedor</option><option value="proprietario">Proprietário</option><option value="nao_informado">Não informado</option></Select></FormField></div><div><p className="text-sm font-medium">Recursos</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{recursosDisponiveis.map((item) => <label className="flex items-center gap-3 rounded-md border p-3 text-sm" key={item}><Checkbox value={item} {...form.register("recursos")} />{nomesRecursos[item]}</label>)}</div></div></>}</>}
      {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome da unidade" error={form.formState.errors.unidadeNome?.message}><Input placeholder="Ex.: Apartamento 101" {...form.register("unidadeNome")} /></FormField><FormField label="Código" optional><Input {...form.register("unidadeCodigo")} /></FormField><FormField label="Tipo da unidade"><Select {...form.register("unidadeTipo")}>{tiposUnidade.map((tipo) => <option key={tipo} value={tipo}>{nomesTiposUnidade[tipo]}</option>)}</Select></FormField><FormField label="Capacidade máxima de hóspedes" error={form.formState.errors.unidadeCapacidade?.message}><Input type="number" min={1} {...form.register("unidadeCapacidade")} /></FormField></div>}
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}{progress && <p className="text-sm text-muted-foreground">{progress}</p>}
      <div className="flex justify-between border-t pt-5"><Button type="button" variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep((current) => current - 1)}><ChevronLeft className="size-4" />Voltar</Button>{step < steps.length - 1 ? <Button type="button" onClick={() => void next()}>Continuar<ChevronRight className="size-4" /></Button> : <Button disabled={submitting}>{submitting ? "Concluindo..." : "Concluir configuração"}</Button>}</div>
    </form></CardContent></Card>
  </div></main>;
}
