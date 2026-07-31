import { ArrowRight, Check, CheckCircle2, ChevronRight, CircleAlert, FlaskConical, Loader2, LockKeyhole, Printer, Settings2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  accommodationOptions,
  benefitOptions,
  createCommercialValidation,
  decideHomologation,
  friendlyCapability,
  loadCommercialValidation,
  saveCommercialValidation,
  type CommercialValidation,
  type HomologationStatus,
} from "../../automation-lab/commercial-validation";
import { EkazaScenarioError, EkazaScenarioProvider, getEkazaSimpleError, maskProviderDeviceId, type EkazaCapabilities, type EkazaDetails, type EkazaDevice, type EkazaHealth, type EkazaStatus } from "../../automation-lab/ekaza-scenario";
import { AUTOMATION_LAB_SCENARIOS, clearAutomationSessions, createAutomationSession, isAutomationSessionExpired, loadAutomationSessions, saveAutomationSessions, type AutomationSession } from "../../automation-lab/automation-lab";
import { PageHeader } from "../layout/page-header";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

type Props = { onOpenTechnicalMode: () => void };
type Detail = { device: EkazaDevice; details?: EkazaDetails; status?: EkazaStatus; capabilities?: EkazaCapabilities };

const scenario = AUTOMATION_LAB_SCENARIOS.find((item) => item.id === "scenario-01-casa-mairipora") ?? AUTOMATION_LAB_SCENARIOS[0];
const typeLabels: Record<string, string> = { smart_lock: "Fechadura inteligente", switch: "Interruptor", socket: "Tomada inteligente", gateway: "Central de conexão", sensor: "Sensor", thermostat: "Controle de temperatura", light: "Iluminação", other: "Equipamento conectado" };
const statusLabels: Record<HomologationStatus, string> = { not_started: "Não iniciado", testing: "Em teste", in_validation: "Em validação", homologated: "Homologado", homologated_with_restrictions: "Homologado com restrições", not_approved: "Não aprovado", archived: "Arquivado" };
const resultLabels = { not_evaluated: "Ainda não avaliado", worked: "Funcionou", partial: "Funcionou parcialmente", failed: "Não funcionou" };
const steps = ["Escolher o teste", "Encontrar equipamentos", "Conferir equipamentos", "Testar funcionamento", "Avaliar a utilidade", "Concluir"];

function storageSafe() { return typeof window === "undefined" ? null : window.sessionStorage; }
function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function functionLabel(device: EkazaDevice) { return typeLabels[device.type] ?? typeLabels.other; }
function errorCode(error: unknown) { return error instanceof EkazaScenarioError ? error.code : "api_unavailable"; }
function connectivityLabel(online: boolean | null | undefined) { return online === true ? "Online" : online === false ? "Offline" : "Status não confirmado"; }

export function SimpleAutomationLab({ onOpenTechnicalMode }: Props) {
  const storage = storageSafe();
  const savedSession = storage ? loadAutomationSessions(storage).find((item) => item.scenarioId === scenario.id && !isAutomationSessionExpired(item)) ?? null : null;
  const [session, setSession] = useState<AutomationSession | null>(savedSession);
  const [step, setStep] = useState(savedSession ? 1 : 0);
  const [health, setHealth] = useState<EkazaHealth | null>(null);
  const [devices, setDevices] = useState<EkazaDevice[]>([]);
  const [adminKey, setAdminKey] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [loading, setLoading] = useState<"connection" | "devices" | "details" | null>(null);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [validation, setValidation] = useState<CommercialValidation>(() => storage ? loadCommercialValidation(storage) : createCommercialValidation());
  const [selectedProductId, setSelectedProductId] = useState("");
  const provider = useMemo(() => new EkazaScenarioProvider(adminKey), [adminKey]);

  function persistSession(next: AutomationSession) {
    setSession(next);
    if (storage) saveAutomationSessions(storage, [next]);
  }
  function updateValidation(patch: Partial<CommercialValidation>) {
    const next = { ...validation, ...patch };
    setValidation(next);
    if (storage) saveCommercialValidation(storage, next);
  }
  function startTest() {
    const next = createAutomationSession(scenario);
    persistSession(next);
    updateValidation({ ...createCommercialValidation(), status: "testing" });
    setStep(1);
    setFriendlyError(null);
  }
  async function testConnection() {
    if (!session || isAutomationSessionExpired(session)) return;
    setLoading("connection");
    setFriendlyError(null);
    setTechnicalError(null);
    try {
      const result = await provider.health();
      setHealth(result);
      if (result.connected) setStep(2);
      else {
        const code = result.sanitizedErrorCode ?? "api_unavailable";
        setFriendlyError(getEkazaSimpleError(code));
        setTechnicalError(code);
      }
    } catch (error) {
      const code = errorCode(error);
      setFriendlyError(getEkazaSimpleError(code));
      setTechnicalError(code);
    } finally {
      setLoading(null);
    }
  }
  function requestEquipmentSearch() {
    if (!adminKey) setKeyOpen(true);
    else void findEquipment();
  }
  async function findEquipment() {
    if (!session || isAutomationSessionExpired(session) || !adminKey) return;
    setKeyOpen(false);
    setLoading("devices");
    setFriendlyError(null);
    try {
      const found = await provider.listDevices();
      setDevices(found);
      const nextSession = { ...session, devices: found.map((device) => ({ id: device.providerDeviceId, enabled: true, mode: "read_only" as const })) };
      persistSession(nextSession);
      if (found.length) {
        setSelectedProductId(found[0].providerDeviceId);
        updateValidation({ productName: found.length === 1 ? found[0].name : `${found.length} equipamentos Ekaza`, category: found.length === 1 ? functionLabel(found[0]) : "Automação para hospedagem" });
      }
      setStep(3);
    } catch (error) {
      const code = errorCode(error);
      setFriendlyError(getEkazaSimpleError(code));
      setTechnicalError(code);
    } finally {
      setLoading(null);
    }
  }
  async function openDetails(device: EkazaDevice) {
    if (!session || isAutomationSessionExpired(session)) return;
    setDetail({ device });
    setLoading("details");
    try {
      const [details, status, capabilities] = await Promise.all([provider.getDetails(device.providerDeviceId), provider.getStatus(device.providerDeviceId), provider.getCapabilities(device.providerDeviceId)]);
      setDetail({ device, details, status, capabilities });
    } catch {
      setDetail({ device });
    } finally {
      setLoading(null);
    }
  }
  function concludeEvaluation() {
    updateValidation({ status: "in_validation", evaluatedAt: new Date().toISOString() });
    setStep(6);
  }
  function decide(status: HomologationStatus) {
    const needsConfirmation = status === "homologated" || status === "homologated_with_restrictions";
    const confirmed = !needsConfirmation || window.confirm(status === "homologated" ? "Confirma que este produto foi aprovado explicitamente para o portfólio da Essencial Stay?" : "Confirma a homologação com restrições registradas nesta avaliação?");
    updateValidation(decideHomologation(validation, status, confirmed));
  }
  function endTest() {
    if (storage) clearAutomationSessions(storage);
    setSession(null);
    setAdminKey("");
    setDevices([]);
    setHealth(null);
    setStep(0);
  }

  const progress = step === 0 ? 0 : Math.round((Math.min(step, 6) / 6) * 100);
  const selectedDevice = devices.find((device) => device.providerDeviceId === selectedProductId) ?? devices[0];

  return <div className="space-y-7">
    <PageHeader
      title="Automation Lab"
      description="Teste novas tecnologias em ambientes reais e descubra quais soluções podem fazer parte do portfólio da Essencial Stay."
      badge="Teste. Valide. Venda."
      actions={<Button variant="ghost" size="sm" onClick={onOpenTechnicalMode}><Settings2 className="size-4" />Modo técnico</Button>}
    />

    <div className="rounded-lg border border-info/20 bg-info/[0.05] px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-info" />AMBIENTE DE TESTE</p>
      <p className="mt-1 text-muted-foreground">Este teste não cria reservas e não afeta hóspedes, PMS, CRM, FNRH, faturamento ou relatórios operacionais.</p>
    </div>

    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <Info label="AMBIENTE DO TESTE" value="Casa Mairiporã" />
      <Info label="INTEGRAÇÃO" value="Ekaza" />
      <p className="sm:col-span-2 text-sm text-muted-foreground">O Automation Lab é um ambiente independente e não altera a empresa atualmente visualizada.</p>
    </div>

    {step === 0 ? <StartScreen onStart={startTest} /> : <>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm"><span className="font-medium">Validação em andamento</span><span className="text-muted-foreground">Etapa {step} de 6</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="hidden grid-cols-6 gap-2 md:grid">{steps.map((label, index) => <div key={label} className={`text-xs ${index + 1 <= step ? "font-medium text-primary" : "text-muted-foreground"}`}>{index + 1}. {label}</div>)}</div>
      </div>

      {step === 1 && <GuidedCard number={1} title="Vamos verificar a conexão" description="Primeiro, vamos confirmar se a Casa Mairiporã consegue consultar a integração Ekaza. Nenhum equipamento será controlado.">
        <Button size="lg" onClick={() => void testConnection()} disabled={loading !== null}>{loading === "connection" ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}Testar conexão</Button>
      </GuidedCard>}

      {step === 2 && <GuidedCard number={2} title="Conexão realizada com sucesso" description="Agora vamos procurar somente os equipamentos autorizados da Casa Mairiporã. Nenhum comando será enviado.">
        <div className="flex items-center gap-3 rounded-lg bg-success/[0.07] p-4 text-sm text-success"><CheckCircle2 className="size-5" />A Ekaza está disponível para consultas{health?.checkedAt ? ` desde ${new Date(health.checkedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}.</div>
        <Button size="lg" onClick={requestEquipmentSearch} disabled={loading !== null}>{loading === "devices" ? <Loader2 className="size-5 animate-spin" /> : <FlaskConical className="size-5" />}Encontrar equipamentos</Button>
        {loading === "devices" && <p className="text-sm text-muted-foreground">Procurando os equipamentos autorizados da Casa Mairiporã...</p>}
      </GuidedCard>}

      {step === 3 && <GuidedCard number={3} title={devices.length ? `Encontramos ${devices.length} equipamento${devices.length === 1 ? "" : "s"}` : "Nenhum equipamento encontrado"} description="Confira se os equipamentos esperados apareceram. Os identificadores técnicos ficam ocultos nesta visão.">
        <div className="space-y-3">{devices.map((device) => <div key={device.providerDeviceId} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{device.name}</p><p className="mt-1 text-sm text-muted-foreground">{functionLabel(device)} · <span className={device.online === true ? "text-success" : "text-muted-foreground"}>{connectivityLabel(device.online)}</span></p>{device.online === null && <p className="mt-1 text-xs text-muted-foreground">Não foi possível confirmar se este equipamento está conectado.</p>}{device.online === false && <p className="mt-1 text-xs text-muted-foreground">Confira a energia e o gateway Zigbee.</p>}</div><Button variant="outline" size="sm" onClick={() => void openDetails(device)}>Ver detalhes</Button></div>)}</div>
        <div className="space-y-3 border-t pt-5"><p className="font-semibold">Os equipamentos que você esperava encontrar apareceram?</p>{[
          ["correct", "Sim, estão corretos"],
          ["missing", "Não, está faltando algum"],
          ["unknown", "Apareceu um equipamento desconhecido"],
        ].map(([value, label]) => <button key={value} type="button" onClick={() => updateValidation({ equipmentMatch: value as CommercialValidation["equipmentMatch"] })} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm ${validation.equipmentMatch === value ? "border-primary bg-primary/[0.05]" : "hover:bg-surface"}`}><span className={`grid size-5 place-items-center rounded-full border ${validation.equipmentMatch === value ? "border-primary bg-primary text-primary-foreground" : ""}`}>{validation.equipmentMatch === value && <Check className="size-3" />}</span>{label}</button>)}</div>
        {validation.equipmentMatch && validation.equipmentMatch !== "correct" && <p className="rounded-lg bg-warning/[0.08] p-3 text-sm text-warning-foreground">Revise a instalação e a lista de equipamentos autorizados. Os detalhes técnicos continuam disponíveis no Modo técnico.</p>}
        <Button size="lg" disabled={!validation.equipmentMatch || !devices.length} onClick={() => setStep(4)}>Testar funcionamento<ArrowRight className="size-4" /></Button>
      </GuidedCard>}

      {step === 4 && <GuidedCard number={4} title="Testar funcionamento" description="A integração Ekaza encontrada neste ambiente é somente leitura. Nenhum comando será enviado pelo Essencial Stay.">
        <div className="space-y-3">{devices.map((device) => <div key={device.providerDeviceId} className="rounded-lg border p-4"><p className="font-semibold">{device.name}</p><p className="mt-1 text-sm text-muted-foreground">{connectivityLabel(device.online)} · {functionLabel(device)}</p><p className="mt-3 text-sm">Este equipamento foi encontrado, mas o controle remoto ainda não está disponível nesta integração.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void openDetails(device)}>Atualizar estado</Button><Badge variant="info">Somente leitura</Badge></div></div>)}</div>
        <div className="rounded-lg border border-info/20 bg-info/[0.05] p-4 text-sm"><p className="font-semibold">Teste manual externo</p><p className="mt-1 text-muted-foreground">Opere o equipamento pelo aplicativo oficial e registre abaixo o resultado. O comando foi realizado fora do Essencial Stay.</p></div>
        <Choice label="O teste manual funcionou?"><Option active={validation.practicalResult === "worked"} onClick={() => updateValidation({ practicalResult: "worked" })}>Sim</Option><Option active={validation.practicalResult === "partial"} onClick={() => updateValidation({ practicalResult: "partial" })}>Parcialmente</Option><Option active={validation.practicalResult === "failed"} onClick={() => updateValidation({ practicalResult: "failed" })}>Não</Option></Choice>
        <Button size="lg" onClick={() => setStep(5)}>Continuar para avaliar a utilidade<ArrowRight className="size-4" /></Button>
      </GuidedCard>}

      {step === 5 && <GuidedCard number={5} title="Esta tecnologia entrega benefícios reais?" description="Registre a percepção prática. Você pode manter campos em aberto durante testes preliminares.">
        {devices.length > 1 && <Choice label="Produto avaliado">{devices.map((device) => <Option key={device.providerDeviceId} active={selectedProductId === device.providerDeviceId} onClick={() => { setSelectedProductId(device.providerDeviceId); updateValidation({ productName: device.name, category: functionLabel(device) }); }}>{device.name}</Option>)}</Choice>}
        <Choice label="O equipamento funcionou como esperado?"><Option active={validation.practicalResult === "worked"} onClick={() => updateValidation({ practicalResult: "worked" })}>Sim</Option><Option active={validation.practicalResult === "partial"} onClick={() => updateValidation({ practicalResult: "partial" })}>Parcialmente</Option><Option active={validation.practicalResult === "failed"} onClick={() => updateValidation({ practicalResult: "failed" })}>Não</Option></Choice>
        <Choice label="A configuração foi fácil?">{[
          ["very_easy", "Muito fácil"], ["easy", "Fácil"], ["reasonable", "Razoável"], ["difficult", "Difícil"], ["not_configured", "Não foi possível configurar"],
        ].map(([value, label]) => <Option key={value} active={validation.setupEase === value} onClick={() => updateValidation({ setupEase: value as CommercialValidation["setupEase"] })}>{label}</Option>)}</Choice>
        <Choice label="O produto oferece benefício real para hospedagem?"><Option active={validation.realBenefit === "yes"} onClick={() => updateValidation({ realBenefit: "yes" })}>Sim</Option><Option active={validation.realBenefit === "maybe"} onClick={() => updateValidation({ realBenefit: "maybe" })}>Talvez</Option><Option active={validation.realBenefit === "no"} onClick={() => updateValidation({ realBenefit: "no" })}>Não</Option></Choice>
        <Choice label="Para quais tipos de hospedagem ele é indicado?">{accommodationOptions.map((option) => <Option key={option} active={validation.recommendedFor.includes(option)} onClick={() => updateValidation({ recommendedFor: toggle(validation.recommendedFor, option) })}>{option}</Option>)}</Choice>
        <Choice label="Quais benefícios foram comprovados?">{benefitOptions.map((option) => <Option key={option} active={validation.provenBenefits.includes(option)} onClick={() => updateValidation({ provenBenefits: toggle(validation.provenBenefits, option) })}>{option}</Option>)}</Choice>
        <label className="block space-y-2 text-sm font-medium">Descreva o que foi percebido durante o teste.<Textarea value={validation.observation} maxLength={500} onChange={(event) => updateValidation({ observation: event.target.value })} placeholder="Observação curta e prática" /></label>
        <label className="block space-y-2 text-sm font-medium">Sugestão comercial opcional<Input value={validation.commercialSuggestion} onChange={(event) => updateValidation({ commercialSuggestion: event.target.value })} placeholder="Ex.: Pode ser oferecido como solução de eficiência operacional." /></label>
        <Button size="lg" onClick={concludeEvaluation}>Ver conclusão<ChevronRight className="size-4" /></Button>
      </GuidedCard>}

      {step === 6 && <Conclusion validation={validation} device={selectedDevice} onDecision={decide} />}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-sm text-muted-foreground">{session && !isAutomationSessionExpired(session) ? `Este teste será encerrado automaticamente às ${new Date(session.endsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : "Sessão encerrada."}</p>
        <Button variant="outline" onClick={endTest}>Encerrar teste</Button>
      </div>
    </>}

    {friendlyError && <div className="rounded-lg border border-destructive/25 bg-destructive/[0.05] p-4"><div className="flex gap-3"><XCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><div><p className="font-semibold text-destructive">{friendlyError}</p>{technicalError && <button type="button" className="mt-2 text-sm text-muted-foreground underline" onClick={() => setShowErrorDetails((value) => !value)}>Ver detalhes do erro</button>}{showErrorDetails && <p className="mt-2 rounded bg-surface p-2 font-mono text-xs text-muted-foreground">{technicalError}</p>}</div></div></div>}

    <Modal open={keyOpen} title="Confirme a chave do Automation Lab" description="Esta proteção é necessária para consultar os equipamentos autorizados." onClose={() => setKeyOpen(false)}>
      <div className="space-y-4"><label className="block space-y-2 text-sm font-medium">Chave administrativa<Input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} autoComplete="off" autoFocus /></label><p className="text-sm text-muted-foreground">Esta não é a senha da Ekaza nem o token da Tuya. É uma chave interna utilizada para proteger as consultas do Automation Lab.</p><Button className="w-full" disabled={!adminKey} onClick={() => void findEquipment()}><LockKeyhole className="size-4" />Continuar</Button></div>
    </Modal>

    <Modal open={Boolean(detail)} title={detail?.device.name ?? "Detalhes do equipamento"} description="Informações adicionais da leitura atual." onClose={() => setDetail(null)} size="medium">
      {detail && <div className="space-y-4 text-sm">{loading === "details" ? <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Consultando informações...</div> : <><div className="grid gap-3 sm:grid-cols-2">{[
        ["Marca", "Ekaza"], ["Modelo", detail.details?.model ?? detail.details?.productName ?? "Não informado"], ["Tipo", functionLabel(detail.device)], ["Estado", detail.status?.online ?? detail.device.online ? "Online" : "Offline"], ["Última atualização", detail.status?.checkedAt ? new Date(detail.status.checkedAt).toLocaleString("pt-BR") : "Não informada"], ["Identificador", maskProviderDeviceId(detail.device.providerDeviceId)],
      ].map(([label, value]) => <div key={label} className="rounded-lg bg-surface p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</div><div><p className="font-semibold">Recursos identificados</p><div className="mt-2 flex flex-wrap gap-2">{detail.capabilities?.functions.length ? detail.capabilities.functions.map((item) => <Badge key={item.code} variant="outline">{friendlyCapability(item.code)}</Badge>) : <span className="text-muted-foreground">Nenhum recurso adicional informado.</span>}</div></div>{detail.device.type === "smart_lock" && <p className="rounded-lg bg-warning/[0.08] p-3 text-warning-foreground">Acesso temporário ainda não disponível. O produto permanece em validação.</p>}</>}</div>}
    </Modal>
  </div>;
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return <div className="mx-auto max-w-4xl space-y-5"><Card className="overflow-hidden border-primary/15 shadow-soft"><CardContent className="grid gap-8 p-7 md:grid-cols-[1.2fr_0.8fr] md:p-10"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Validação tecnológica e comercial</p><h2 className="mt-3 text-3xl font-semibold leading-tight">Descubra se uma tecnologia funciona na prática e merece entrar no portfólio.</h2><p className="mt-4 max-w-xl leading-7 text-muted-foreground">Em poucos minutos, você verifica os equipamentos, registra os benefícios e toma uma decisão comercial clara.</p><Button className="mt-7" size="lg" onClick={onStart}>Iniciar teste<ArrowRight className="size-5" /></Button></div><div className="space-y-3 rounded-xl bg-surface p-5"><Info label="Ambiente de teste" value="Casa Mairiporã" /><Info label="Integração disponível" value="Ekaza" /><Info label="Status" value="Pronto para iniciar" success /><div className="border-t pt-4 text-sm text-muted-foreground"><p className="font-medium text-foreground">O que já podemos testar</p><p className="mt-2">Conexão, equipamentos encontrados, estado online ou offline e informações disponíveis.</p><p className="mt-4 font-medium text-foreground">Ainda não disponível</p><p className="mt-2">Controle real dos equipamentos e criação ou revogação de acesso temporário.</p></div></div></CardContent></Card></div>;
}

function GuidedCard({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return <Card className="mx-auto max-w-4xl"><CardHeader><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{number}</span><div><CardTitle className="text-xl">{title}</CardTitle><CardDescription className="mt-2 max-w-2xl">{description}</CardDescription></div></div></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>;
}
function Choice({ label, children }: { label: string; children: React.ReactNode }) { return <fieldset className="space-y-3"><legend className="text-sm font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>; }
function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40 hover:bg-surface"}`}>{children}</button>; }
function Info({ label, value, success }: { label: string; value: string; success?: boolean }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${success ? "text-success" : ""}`}>{value}</p></div>; }

function Conclusion({ validation, device, onDecision }: { validation: CommercialValidation; device?: EkazaDevice; onDecision: (status: HomologationStatus) => void }) {
  return <Card className="mx-auto max-w-4xl"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-xl">Ficha de validação comercial</CardTitle><CardDescription>Decisão interna da Essencial Stay. Nenhuma homologação acontece automaticamente.</CardDescription></div><Badge variant={validation.status === "homologated" ? "success" : validation.status === "not_approved" ? "warning" : "info"}>{statusLabels[validation.status]}</Badge></div></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
    ["Produto", validation.productName || device?.name || "Equipamentos Ekaza"], ["Marca", validation.brand], ["Categoria", validation.category], ["Ambiente de teste", validation.environmentName], ["Resultado prático", resultLabels[validation.practicalResult]], ["Pode entrar no portfólio", validation.portfolioAvailability === "yes" ? "Sim" : validation.portfolioAvailability === "restricted" ? "Com restrições" : validation.portfolioAvailability === "no" ? "Não" : "Ainda em avaliação"],
  ].map(([label, value]) => <Info key={label} label={label} value={value} />)}</div><div className="grid gap-5 md:grid-cols-2"><Summary title="Benefícios comprovados" values={validation.provenBenefits} /><Summary title="Indicado para" values={validation.recommendedFor} /></div>{validation.observation && <div><p className="text-sm font-semibold">Observações</p><p className="mt-2 rounded-lg bg-surface p-4 text-sm text-muted-foreground">{validation.observation}</p></div>}{validation.commercialSuggestion && <div><p className="text-sm font-semibold">Sugestão comercial</p><p className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.05] p-4 text-sm">{validation.commercialSuggestion}</p></div>}<div className="border-t pt-5"><p className="mb-3 font-semibold">Qual é a decisão da Essencial Stay?</p><div className="flex flex-wrap gap-2"><Button onClick={() => onDecision("testing")} variant="outline">Continuar testando</Button><Button onClick={() => onDecision("homologated")}>Aprovar para o portfólio</Button><Button onClick={() => onDecision("homologated_with_restrictions")} variant="accent">Aprovar com restrições</Button><Button onClick={() => onDecision("not_approved")} variant="destructive">Não aprovar</Button><Button onClick={() => onDecision("archived")} variant="ghost">Arquivar avaliação</Button></div></div><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />Imprimir ficha</Button></CardContent></Card>;
}
function Summary({ title, values }: { title: string; values: string[] }) { return <div><p className="text-sm font-semibold">{title}</p>{values.length ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{values.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{item}</li>)}</ul> : <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CircleAlert className="size-4" />Ainda não informado.</p>}</div>; }
