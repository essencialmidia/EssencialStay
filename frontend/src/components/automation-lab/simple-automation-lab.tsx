import { ArrowRight, CheckCircle2, ChevronRight, CircleAlert, FlaskConical, Loader2, LockKeyhole, Printer, Settings2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  accommodationOptions,
  friendlyCapability,
} from "../../automation-lab/commercial-validation";
import { EkazaScenarioError, EkazaScenarioProvider, getEkazaSimpleError, maskProviderDeviceId, type EkazaCapabilities, type EkazaDetails, type EkazaDevice, type EkazaHealth, type EkazaStatus } from "../../automation-lab/ekaza-scenario";
import { AUTOMATION_LAB_SCENARIOS, clearAutomationSessions, createAutomationSession, createLabLog, isAutomationSessionExpired, loadAutomationSessions, saveAutomationSessions, type AutomationSession, type LabLog } from "../../automation-lab/automation-lab";
import {
  allDevicesEvaluated,
  clearSimpleLabState,
  consolidatedCounts,
  createDeviceKey,
  createSimpleLabState,
  decideDevice,
  initializeInventory,
  isDeviceEvaluationComplete,
  loadSimpleLabState,
  markDeviceNotEvaluated,
  potentialBenefitOptions,
  saveSimpleLabState,
  unableReasonLabels,
  updateDeviceEvaluation,
  type ActionLocation,
  type DeviceDecision,
  type DeviceEvaluation,
  type DevicePracticalResult,
  type PhysicalTestResult,
  type SimpleLabInventoryItem,
  type SimpleLabState,
  type UnableReason,
  type ValidationEase,
} from "../../automation-lab/simple-lab-state";
import { PageHeader } from "../layout/page-header";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Textarea } from "../ui/textarea";

type Props = { onOpenTechnicalMode: () => void };
type Detail = { device: SimpleLabInventoryItem; details?: EkazaDetails; status?: EkazaStatus; capabilities?: EkazaCapabilities };

const scenario = AUTOMATION_LAB_SCENARIOS.find((item) => item.id === "scenario-01-casa-mairipora") ?? AUTOMATION_LAB_SCENARIOS[0];
const typeLabels: Record<string, string> = { smart_lock: "Fechadura inteligente", switch: "Interruptor", socket: "Tomada inteligente", gateway: "Central de conexão", sensor: "Sensor", thermostat: "Controle de temperatura", light: "Iluminação", other: "Equipamento conectado" };
const decisionLabels: Record<DeviceDecision, string> = { pending: "Decisão pendente", testing: "Continuar testando", homologated: "Aprovado para o portfólio", homologated_with_restrictions: "Aprovado com restrições", not_approved: "Não aprovado", archived: "Avaliação arquivada", not_evaluated: "Não avaliado" };
const resultLabels: Record<DevicePracticalResult, string> = { pending: "Pendente", worked: "Funcionou", partial: "Funcionou parcialmente", failed: "Não funcionou", not_tested: "Não foi possível testar" };
const steps = ["Escolher o teste", "Encontrar equipamentos", "Conferir equipamentos", "Testar funcionamento", "Avaliar a utilidade", "Concluir"];

function storageSafe() { return typeof window === "undefined" ? null : window.sessionStorage; }
function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]; }
function functionLabel(device: Pick<EkazaDevice, "type">) { return typeLabels[device.type] ?? typeLabels.other; }
function errorCode(error: unknown) { return error instanceof EkazaScenarioError ? error.code : "api_unavailable"; }
function connectivityLabel(online: boolean | null | undefined) { return online === true ? "Online" : online === false ? "Offline" : "Status não confirmado"; }

export function SimpleAutomationLab({ onOpenTechnicalMode }: Props) {
  const storage = storageSafe();
  const savedSession = storage ? loadAutomationSessions(storage).find((item) => item.scenarioId === scenario.id && !isAutomationSessionExpired(item)) ?? null : null;
  const [session, setSession] = useState<AutomationSession | null>(savedSession);
  const [labState, setLabState] = useState<SimpleLabState>(() => storage ? loadSimpleLabState(storage) : createSimpleLabState());
  const [health, setHealth] = useState<EkazaHealth | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyOpen, setKeyOpen] = useState(false);
  const [loading, setLoading] = useState<"connection" | "devices" | "details" | null>(null);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const provider = useMemo(() => new EkazaScenarioProvider(adminKey), [adminKey]);

  const step = session ? labState.step : 0;
  const devices = labState.inventory;
  const selectedDevice = devices.find((device) => device.deviceKey === labState.selectedDeviceKey) ?? devices[0];
  const selectedEvaluation = selectedDevice ? labState.evaluationsByDevice[selectedDevice.deviceKey] : undefined;

  function persistSession(next: AutomationSession) {
    setSession(next);
    if (storage) saveAutomationSessions(storage, [next]);
  }
  function persistState(next: SimpleLabState) {
    setLabState(next);
    if (storage) saveSimpleLabState(storage, next);
  }
  function patchState(patch: Partial<SimpleLabState>) {
    persistState({ ...labState, ...patch });
  }
  function record(operation: string, detailValue: Record<string, unknown> = {}, level: LabLog["level"] = "info", state = labState) {
    const log = createLabLog(session?.id ?? "simple-lab", operation, detailValue, level);
    const next = { ...state, logs: [log, ...state.logs].slice(0, 100) };
    persistState(next);
    return next;
  }
  function patchEvaluation(deviceKey: string, patch: Partial<DeviceEvaluation>, logOperation?: string) {
    let next = updateDeviceEvaluation(labState, deviceKey, patch);
    if (logOperation) next = { ...next, logs: [createLabLog(session?.id ?? "simple-lab", logOperation, { deviceKey, observationRecorded: Boolean(patch.practicalObservation) }, "info"), ...next.logs].slice(0, 100) };
    persistState(next);
  }
  function startTest() {
    const nextSession = createAutomationSession(scenario);
    persistSession(nextSession);
    const initial = { ...createSimpleLabState(), step: 1, sessionStatus: "active" as const };
    const next = { ...initial, logs: [createLabLog(nextSession.id, "simple.test_started", { scenarioId: scenario.id }, "success")] };
    persistState(next);
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
      if (result.connected) {
        const next = { ...labState, step: 2, healthCheckedAt: result.checkedAt };
        record("simple.connection_tested", { connected: true }, "success", next);
      } else {
        const code = result.sanitizedErrorCode ?? "api_unavailable";
        setFriendlyError(getEkazaSimpleError(code));
        setTechnicalError(code);
        record("simple.connection_tested", { connected: false, errorCode: code }, "warning");
      }
    } catch (error) {
      const code = errorCode(error);
      setFriendlyError(getEkazaSimpleError(code));
      setTechnicalError(code);
      record("simple.connection_tested", { connected: false, errorCode: code }, "warning");
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
      const inventory = found.map((device) => ({
        ...device,
        deviceKey: createDeviceKey(device),
        maskedProviderDeviceId: maskProviderDeviceId(device.providerDeviceId),
        lastReadAt: new Date().toISOString(),
        queryState: "found" as const,
      }));
      const nextSession = { ...session, devices: inventory.map((device) => ({ id: device.deviceKey, enabled: true, mode: "read_only" as const })) };
      persistSession(nextSession);
      let next = initializeInventory({ ...labState, step: 3 }, inventory);
      next = { ...next, logs: [createLabLog(session.id, "simple.devices_found", { count: inventory.length, deviceKeys: inventory.map((item) => item.deviceKey) }, "success"), ...next.logs].slice(0, 100) };
      persistState(next);
    } catch (error) {
      const code = errorCode(error);
      setFriendlyError(getEkazaSimpleError(code));
      setTechnicalError(code);
      record("simple.devices_found", { count: 0, errorCode: code }, "warning");
    } finally {
      setLoading(null);
    }
  }
  async function updateReading(device: SimpleLabInventoryItem, showDetails = false) {
    if (!session || isAutomationSessionExpired(session) || !adminKey) return;
    if (showDetails) setDetail({ device });
    setLoading("details");
    try {
      const [details, status, capabilities] = await Promise.all([provider.getDetails(device.providerDeviceId), provider.getStatus(device.providerDeviceId), provider.getCapabilities(device.providerDeviceId)]);
      const inventory = devices.map((item) => item.deviceKey === device.deviceKey ? { ...item, online: status.online, lastReadAt: status.checkedAt, queryState: "updated" as const } : item);
      let next = { ...labState, inventory };
      next = { ...next, logs: [createLabLog(session.id, "simple.reading_updated", { deviceKey: device.deviceKey, online: status.online }, "success"), ...next.logs].slice(0, 100) };
      persistState(next);
      if (showDetails) setDetail({ device: inventory.find((item) => item.deviceKey === device.deviceKey) ?? device, details, status, capabilities });
    } catch {
      const inventory = devices.map((item) => item.deviceKey === device.deviceKey ? { ...item, queryState: "error" as const } : item);
      persistState({ ...labState, inventory });
      if (showDetails) setDetail({ device: { ...device, queryState: "error" } });
    } finally {
      setLoading(null);
    }
  }
  function markUnavailable(reason: UnableReason) {
    if (!selectedDevice) return;
    let next = markDeviceNotEvaluated(labState, selectedDevice.deviceKey, reason);
    next = { ...next, logs: [createLabLog(session?.id ?? "simple-lab", "simple.evaluation_recorded", { deviceKey: selectedDevice.deviceKey, unableReason: reason, observationRecorded: false }) , ...next.logs].slice(0, 100) };
    persistState(next);
  }
  function concludeEvaluation() {
    if (!allDevicesEvaluated(labState)) return;
    record("simple.evaluations_completed", { evaluatedCount: consolidatedCounts(labState).evaluated }, "success", { ...labState, step: 6 });
  }
  function decide(deviceKey: string, decision: DeviceDecision) {
    const requiresConfirmation = decision === "homologated" || decision === "homologated_with_restrictions" || decision === "not_approved";
    const confirmed = !requiresConfirmation || window.confirm(`Confirma a decisão “${decisionLabels[decision]}” para este equipamento?`);
    if (!confirmed) return;
    let next = decideDevice(labState, deviceKey, decision, confirmed);
    next = { ...next, logs: [createLabLog(session?.id ?? "simple-lab", "simple.decision_recorded", { deviceKey, decision }, "success"), ...next.logs].slice(0, 100) };
    persistState(next);
  }
  function endTest() {
    if (session) {
      const endedLog = createLabLog(session.id, "simple.test_ended", { sessionEnded: true }, "success");
      persistState({ ...labState, sessionStatus: "ended", logs: [endedLog, ...labState.logs].slice(0, 100) });
    }
    if (storage) {
      clearAutomationSessions(storage);
      clearSimpleLabState(storage);
    }
    setSession(null);
    setAdminKey("");
    setHealth(null);
    setLabState(createSimpleLabState());
  }

  const progress = step === 0 ? 0 : Math.round((Math.min(step, 6) / 6) * 100);

  return <div className="space-y-7">
    <PageHeader title="Automation Lab" description="Teste novas tecnologias em ambientes reais e descubra quais soluções podem fazer parte do portfólio da Essencial Stay." badge="Teste. Valide. Venda." actions={<Button variant="ghost" size="sm" onClick={onOpenTechnicalMode}><Settings2 className="size-4" />Modo técnico</Button>} />
    <div className="rounded-lg border border-info/20 bg-info/[0.05] px-4 py-3 text-sm"><p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-info" />AMBIENTE DE TESTE</p><p className="mt-1 text-muted-foreground">Este teste não cria reservas e não afeta hóspedes, PMS, CRM, FNRH, faturamento ou relatórios operacionais.</p></div>
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2"><Info label="AMBIENTE DO TESTE" value="Casa Mairiporã" /><Info label="INTEGRAÇÃO" value="Ekaza" /><p className="text-sm text-muted-foreground sm:col-span-2">O Automation Lab é independente: a empresa visualizada no cabeçalho não participa deste teste.</p></div>

    {step === 0 ? <StartScreen onStart={startTest} /> : <>
      <div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="font-medium">Validação em andamento</span><span className="text-muted-foreground">Etapa {step} de 6</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress}%` }} /></div><div className="hidden grid-cols-6 gap-2 md:grid">{steps.map((label, index) => <div key={label} className={`text-xs ${index + 1 <= step ? "font-medium text-primary" : "text-muted-foreground"}`}>{index + 1}. {label}</div>)}</div></div>

      {step === 1 && <GuidedCard number={1} title="Vamos verificar a conexão" description="Primeiro, vamos confirmar se a Casa Mairiporã consegue consultar a integração Ekaza. Nenhum equipamento será controlado."><Button size="lg" onClick={() => void testConnection()} disabled={loading !== null}>{loading === "connection" ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}Testar conexão</Button></GuidedCard>}
      {step === 2 && <GuidedCard number={2} title="Conexão realizada com sucesso" description="Agora vamos procurar somente os equipamentos autorizados da Casa Mairiporã. Nenhum comando será enviado."><div className="flex items-center gap-3 rounded-lg bg-success/[0.07] p-4 text-sm text-success"><CheckCircle2 className="size-5" />A Ekaza está disponível para consultas{health?.checkedAt || labState.healthCheckedAt ? ` desde ${new Date(health?.checkedAt ?? labState.healthCheckedAt!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}.</div><Button size="lg" onClick={requestEquipmentSearch} disabled={loading !== null}>{loading === "devices" ? <Loader2 className="size-5 animate-spin" /> : <FlaskConical className="size-5" />}Encontrar equipamentos</Button></GuidedCard>}
      {step === 3 && <GuidedCard number={3} title={devices.length ? `Encontramos ${devices.length} equipamento${devices.length === 1 ? "" : "s"}` : "Nenhum equipamento encontrado"} description="Confira se os equipamentos esperados apareceram. Os identificadores técnicos ficam ocultos nesta visão.">
        <DeviceList devices={devices} onDetails={(device) => void updateReading(device, true)} />
        <Choice label="Os equipamentos que você esperava encontrar apareceram?">{([["correct", "Sim, estão corretos"], ["missing", "Não, está faltando algum"], ["unknown", "Apareceu um equipamento desconhecido"]] as const).map(([value, label]) => <Option key={value} active={labState.equipmentMatch === value} onClick={() => patchState({ equipmentMatch: value })}>{label}</Option>)}</Choice>
        <Button size="lg" disabled={!labState.equipmentMatch || !devices.length} onClick={() => patchState({ step: 4 })}>Testar funcionamento<ArrowRight className="size-4" /></Button>
      </GuidedCard>}
      {step === 4 && <GuidedCard number={4} title="Testar funcionamento" description="A integração Ekaza encontrada neste ambiente é somente leitura. Nenhum comando será enviado pelo Essencial Stay.">
        <DeviceSelector state={labState} onSelect={(deviceKey) => patchState({ selectedDeviceKey: deviceKey })} />
        {selectedDevice && selectedEvaluation && <div className="space-y-5 rounded-lg border p-4"><div><p className="font-semibold">{selectedDevice.name}</p><p className="text-sm text-muted-foreground">{connectivityLabel(selectedDevice.online)} · {functionLabel(selectedDevice)}</p></div><Button variant="outline" size="sm" onClick={() => void updateReading(selectedDevice)}>Atualizar leitura</Button>
          <div className="rounded-lg border border-info/20 bg-info/[0.05] p-4 text-sm"><p className="font-semibold">Teste manual externo</p><p className="mt-1 text-muted-foreground">Opere o equipamento pelo aplicativo oficial e registre abaixo o resultado. O comando foi realizado fora do Essencial Stay.</p></div>
          <Choice label="O equipamento funcionou?">{([["worked", "Sim"], ["partial", "Parcialmente"], ["failed", "Não"], ["not_tested", "Não foi possível testar"]] as const).map(([value, label]) => <Option key={value} active={selectedEvaluation.practicalResult === value} onClick={() => patchEvaluation(selectedDevice.deviceKey, { practicalResult: value }, "simple.manual_test_recorded")}>{label}</Option>)}</Choice>
          <Choice label="Teste físico realizado?">{([["yes", "Sim"], ["no", "Não"]] as const).map(([value, label]) => <Option key={value} active={selectedEvaluation.physicalTest === value} onClick={() => patchEvaluation(selectedDevice.deviceKey, { physicalTest: value as PhysicalTestResult, provenBenefits: value === "no" ? [] : selectedEvaluation.provenBenefits })}>{label}</Option>)}</Choice>
          <Choice label="Onde a ação foi realizada?">{([["manufacturer_app", "Aplicativo oficial do fabricante"], ["essencial_read_only", "Apenas leitura no Essencial Stay"], ["on_site", "Teste presencial"], ["not_performed", "Não realizado"]] as const).map(([value, label]) => <Option key={value} active={selectedEvaluation.actionLocation === value} onClick={() => patchEvaluation(selectedDevice.deviceKey, { actionLocation: value as ActionLocation })}>{label}</Option>)}</Choice>
          <label className="block space-y-2 text-sm font-medium">Registre o que aconteceu ao testar pelo aplicativo oficial.<Textarea value={selectedEvaluation.practicalObservation} maxLength={500} onChange={(event) => patchEvaluation(selectedDevice.deviceKey, { practicalObservation: event.target.value })} placeholder="Observação curta deste equipamento" /></label>
        </div>}
        <Button size="lg" onClick={() => patchState({ step: 5 })}>Continuar para avaliar a utilidade<ArrowRight className="size-4" /></Button>
      </GuidedCard>}
      {step === 5 && <GuidedCard number={5} title="Esta tecnologia entrega benefícios reais?" description="Cada produto possui sua própria ficha. Alterar um equipamento não modifica os demais.">
        <DeviceSelector state={labState} onSelect={(deviceKey) => patchState({ selectedDeviceKey: deviceKey })} />
        {selectedDevice && selectedEvaluation && <EvaluationForm device={selectedDevice} evaluation={selectedEvaluation} onChange={(patch, operation) => patchEvaluation(selectedDevice.deviceKey, patch, operation)} onUnavailable={markUnavailable} />}
        {!allDevicesEvaluated(labState) && <p className="rounded-lg border border-warning/25 bg-warning/[0.06] p-3 text-sm">Avalie todos os equipamentos ou marque explicitamente “Não foi possível avaliar este equipamento”.</p>}
        <Button size="lg" disabled={!allDevicesEvaluated(labState)} onClick={concludeEvaluation}>Ver conclusão<ChevronRight className="size-4" /></Button>
      </GuidedCard>}
      {step === 6 && <Conclusion state={labState} onDecision={decide} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><p className="text-sm text-muted-foreground">{session && !isAutomationSessionExpired(session) ? `Este teste será encerrado automaticamente às ${new Date(session.endsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : "Sessão encerrada."}</p><Button variant="outline" onClick={endTest}>Encerrar teste</Button></div>
    </>}

    {friendlyError && <div className="rounded-lg border border-destructive/25 bg-destructive/[0.05] p-4"><div className="flex gap-3"><XCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><div><p className="font-semibold text-destructive">{friendlyError}</p>{technicalError && <button type="button" className="mt-2 text-sm text-muted-foreground underline" onClick={() => setShowErrorDetails((value) => !value)}>Ver detalhes do erro</button>}{showErrorDetails && <p className="mt-2 rounded bg-surface p-2 font-mono text-xs text-muted-foreground">{technicalError}</p>}</div></div></div>}
    <Modal open={keyOpen} title="Confirme a chave do Automation Lab" description="Esta proteção é necessária para consultar os equipamentos autorizados." onClose={() => setKeyOpen(false)}><div className="space-y-4"><label className="block space-y-2 text-sm font-medium">Chave administrativa<Input type="password" value={adminKey} onChange={(event) => setAdminKey(event.target.value)} autoComplete="off" autoFocus /></label><p className="text-sm text-muted-foreground">Esta não é a senha da Ekaza nem o token da Tuya. É uma chave interna utilizada para proteger as consultas do Automation Lab.</p><Button className="w-full" disabled={!adminKey} onClick={() => void findEquipment()}><LockKeyhole className="size-4" />Continuar</Button></div></Modal>
    <DeviceDetails detail={detail} loading={loading} onClose={() => setDetail(null)} />
  </div>;
}

function EvaluationForm({ device, evaluation, onChange, onUnavailable }: { device: SimpleLabInventoryItem; evaluation: DeviceEvaluation; onChange: (patch: Partial<DeviceEvaluation>, operation?: string) => void; onUnavailable: (reason: UnableReason) => void }) {
  return <div className="space-y-5 rounded-lg border p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{device.name}</p><p className="text-sm text-muted-foreground">{functionLabel(device)} · {connectivityLabel(device.online)}</p></div><Badge variant={isDeviceEvaluationComplete(evaluation) ? "success" : "muted"}>{isDeviceEvaluationComplete(evaluation) ? "✓ Avaliação preenchida" : "Avaliação pendente"}</Badge></div>
    <Choice label="Não foi possível avaliar este equipamento">{Object.entries(unableReasonLabels).map(([value, label]) => <Option key={value} active={evaluation.unableToEvaluate && evaluation.unableReason === value} onClick={() => onUnavailable(value as UnableReason)}>{label}</Option>)}</Choice>
    {!evaluation.unableToEvaluate && <>
      <Choice label="O equipamento funcionou?">{([["worked", "Sim"], ["partial", "Parcialmente"], ["failed", "Não"], ["not_tested", "Não foi possível testar"]] as const).map(([value, label]) => <Option key={value} active={evaluation.practicalResult === value} onClick={() => onChange({ practicalResult: value }, "simple.manual_test_recorded")}>{label}</Option>)}</Choice>
      <Choice label="Teste físico realizado?">{([["yes", "Sim"], ["no", "Não"]] as const).map(([value, label]) => <Option key={value} active={evaluation.physicalTest === value} onClick={() => onChange({ physicalTest: value, provenBenefits: value === "no" ? [] : evaluation.provenBenefits, systemLimitations: value === "no" ? [...new Set([...evaluation.systemLimitations, "Teste físico não realizado", "Nenhuma alteração de estado confirmada"])] : evaluation.systemLimitations.filter((item) => item !== "Teste físico não realizado" && item !== "Nenhuma alteração de estado confirmada") })}>{label}</Option>)}</Choice>
      <Choice label="Onde a ação foi realizada?">{([["manufacturer_app", "Aplicativo oficial do fabricante"], ["essencial_read_only", "Apenas leitura no Essencial Stay"], ["on_site", "Teste presencial"], ["not_performed", "Não realizado"]] as const).map(([value, label]) => <Option key={value} active={evaluation.actionLocation === value} onClick={() => onChange({ actionLocation: value as ActionLocation })}>{label}</Option>)}</Choice>
      <Choice label="Foi fácil consultar e validar este equipamento?">{([["very_easy", "Muito fácil"], ["easy", "Fácil"], ["reasonable", "Razoável"], ["difficult", "Difícil"], ["unable", "Não foi possível validar"], ["not_applicable", "Não se aplica"]] as const).map(([value, label]) => <Option key={value} active={evaluation.validationEase === value} onClick={() => onChange({ validationEase: value as ValidationEase }, "simple.evaluation_recorded")}>{label}</Option>)}</Choice>
      <Choice label="Para quais tipos de hospedagem ele é indicado?">{accommodationOptions.map((option) => <Option key={option} active={evaluation.recommendedFor.includes(option)} onClick={() => onChange({ recommendedFor: toggle(evaluation.recommendedFor, option) })}>{option}</Option>)}</Choice>
      <Choice label="Benefícios potenciais">{potentialBenefitOptions.map((option) => <Option key={option} active={evaluation.potentialBenefits.includes(option)} onClick={() => onChange({ potentialBenefits: toggle(evaluation.potentialBenefits, option) })}>{option}</Option>)}</Choice>
      {evaluation.physicalTest !== "yes" && <p className="rounded-lg bg-info/[0.06] p-3 text-sm text-muted-foreground">Você pode registrar benefícios potenciais, mas benefícios comprovados exigem um teste prático.</p>}
      <Choice label="Benefícios comprovados no teste">{potentialBenefitOptions.map((option) => <Option key={option} active={evaluation.provenBenefits.includes(option)} onClick={() => evaluation.physicalTest === "yes" && onChange({ provenBenefits: toggle(evaluation.provenBenefits, option) })}>{option}</Option>)}</Choice>
      <label className="block space-y-2 text-sm font-medium">Observação prática deste equipamento<Textarea value={evaluation.practicalObservation} maxLength={500} onChange={(event) => onChange({ practicalObservation: event.target.value })} placeholder="Observação curta e específica" /></label>
      <div className="space-y-3"><p className="font-semibold">Limitações encontradas</p><Summary title="Identificadas automaticamente pelo sistema" values={evaluation.systemLimitations} /><label className="block space-y-2 text-sm font-medium">Observação adicional<Textarea value={evaluation.additionalLimitations} maxLength={500} onChange={(event) => onChange({ additionalLimitations: event.target.value })} placeholder="Complemento opcional às limitações identificadas" /></label></div>
      <label className="block space-y-2 text-sm font-medium">Sugestão comercial opcional<Input value={evaluation.commercialSuggestion} onChange={(event) => onChange({ commercialSuggestion: event.target.value })} placeholder="Ex.: Continuar testando antes de oferecer ao cliente." /></label>
    </>}
  </div>;
}

function DeviceSelector({ state, onSelect }: { state: SimpleLabState; onSelect: (deviceKey: string) => void }) {
  return <Choice label="Produto avaliado">{state.inventory.map((device) => { const evaluation = state.evaluationsByDevice[device.deviceKey]; return <Option key={device.deviceKey} active={state.selectedDeviceKey === device.deviceKey} onClick={() => onSelect(device.deviceKey)}><span>{device.name}</span>{isDeviceEvaluationComplete(evaluation) && <span className="ml-1">✓</span>}</Option>; })}</Choice>;
}

function DeviceList({ devices, onDetails }: { devices: SimpleLabInventoryItem[]; onDetails: (device: SimpleLabInventoryItem) => void }) {
  return <div className="space-y-3">{devices.map((device) => <div key={device.deviceKey} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{device.name}</p><p className="mt-1 text-sm text-muted-foreground">{functionLabel(device)} · {connectivityLabel(device.online)}</p>{device.online === false && <p className="mt-1 text-xs text-muted-foreground">Confira a energia e o gateway Zigbee.</p>}</div><Button variant="outline" size="sm" onClick={() => onDetails(device)}>Ver detalhes</Button></div>)}</div>;
}

function Conclusion({ state, onDecision }: { state: SimpleLabState; onDecision: (deviceKey: string, decision: DeviceDecision) => void }) {
  const counts = consolidatedCounts(state);
  return <div className="mx-auto max-w-5xl space-y-5"><Card><CardHeader><CardTitle>Conclusão da validação comercial</CardTitle><CardDescription>Cada produto mantém sua própria avaliação e decisão. Nenhuma homologação acontece automaticamente.</CardDescription></CardHeader></Card>
    {state.inventory.map((device, index) => { const evaluation = state.evaluationsByDevice[device.deviceKey]; return <Card key={device.deviceKey}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Produto {index + 1}</p><CardTitle className="mt-1">{device.name}</CardTitle><CardDescription>{functionLabel(device)} · {connectivityLabel(device.online)}</CardDescription></div><Badge variant={evaluation.decision === "homologated" ? "success" : evaluation.decision === "not_approved" ? "warning" : "info"}>{decisionLabels[evaluation.decision]}</Badge></div></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Info label="Resultado" value={resultLabels[evaluation.practicalResult]} /><Info label="Teste físico" value={evaluation.physicalTest === "yes" ? "Realizado" : "Não realizado"} /><Info label="Identificador" value={device.maskedProviderDeviceId} /></div><div className="grid gap-5 md:grid-cols-2"><Summary title="Recursos validados" values={["Identificação", "Inventário", "Consulta pela integração"]} /><Summary title="Benefícios potenciais" values={evaluation.potentialBenefits} /><Summary title="Benefícios comprovados" values={evaluation.provenBenefits} /><Summary title="Limitações" values={[...evaluation.systemLimitations, ...(evaluation.additionalLimitations ? [evaluation.additionalLimitations] : [])]} /></div>{evaluation.practicalObservation && <InfoBlock title="Observação prática" value={evaluation.practicalObservation} />}{evaluation.commercialSuggestion && <InfoBlock title="Sugestão comercial" value={evaluation.commercialSuggestion} />}<div className="border-t pt-4"><p className="mb-3 font-semibold">Decisão deste equipamento</p><div className="flex flex-wrap gap-2">{([["testing", "Continuar testando"], ["homologated", "Aprovar para o portfólio"], ["homologated_with_restrictions", "Aprovar com restrições"], ["not_approved", "Não aprovar"], ["archived", "Arquivar avaliação"], ["not_evaluated", "Não avaliado"]] as const).map(([value, label]) => <Button key={value} variant={evaluation.decision === value ? "accent" : value === "not_approved" ? "destructive" : "outline"} onClick={() => onDecision(device.deviceKey, value)}>{label}</Button>)}</div></div></CardContent></Card>; })}
    <Card><CardHeader><CardTitle>Resumo do cenário</CardTitle><CardDescription>Casa Mairiporã · Ekaza</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Equipamentos encontrados" value={String(counts.found)} /><Info label="Equipamentos avaliados" value={String(counts.evaluated)} /><Info label="Equipamentos homologados" value={String(counts.homologated)} /><Info label="Precisam continuar em teste" value={String(counts.testing)} /></div><p className="rounded-lg border border-warning/25 bg-warning/[0.06] p-4 text-sm">A integração atual permite localizar e consultar os equipamentos, mas ainda não possui comandos reais comprovados.</p><Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />Imprimir fichas</Button></CardContent></Card>
  </div>;
}

function DeviceDetails({ detail, loading, onClose }: { detail: Detail | null; loading: string | null; onClose: () => void }) {
  const capabilities = detail?.capabilities?.functions ?? [];
  const known = capabilities.filter((item) => friendlyCapability(item.code) !== "Recurso técnico identificado");
  const unknownCount = capabilities.length - known.length;
  return <Modal open={Boolean(detail)} title={detail?.device.name ?? "Detalhes do equipamento"} description="Informações adicionais da leitura atual." onClose={onClose} size="medium">{detail && <div className="space-y-4 text-sm">{loading === "details" ? <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Consultando informações...</div> : <><div className="grid gap-3 sm:grid-cols-2">{[["Marca", "Ekaza"], ["Modelo", detail.details?.model ?? detail.details?.productName ?? "Não informado"], ["Tipo", functionLabel(detail.device)], ["Estado", connectivityLabel(detail.status?.online ?? detail.device.online)], ["Última atualização", detail.status?.checkedAt ? new Date(detail.status.checkedAt).toLocaleString("pt-BR") : "Não informada"], ["Identificador", detail.device.maskedProviderDeviceId]].map(([label, value]) => <Info key={label} label={label} value={value} />)}</div><div><p className="font-semibold">Recursos identificados</p><div className="mt-2 flex flex-wrap gap-2">{known.map((item) => <Badge key={item.code} variant="outline">{friendlyCapability(item.code)}</Badge>)}{unknownCount > 0 && <Badge variant="outline">{unknownCount} recursos técnicos identificados — detalhes disponíveis no Modo Técnico.</Badge>}{!capabilities.length && <span className="text-muted-foreground">Nenhum recurso adicional informado.</span>}</div></div>{detail.device.type === "smart_lock" && <p className="rounded-lg bg-warning/[0.08] p-3 text-warning-foreground">Acesso temporário, PIN, travamento e destravamento ainda não estão disponíveis no Essencial Stay.</p>}</>}</div>}</Modal>;
}

function StartScreen({ onStart }: { onStart: () => void }) { return <div className="mx-auto max-w-4xl"><Card><CardContent className="grid gap-8 p-7 md:grid-cols-[1.2fr_0.8fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Validação tecnológica e comercial</p><h2 className="mt-3 text-3xl font-semibold">Descubra se uma tecnologia funciona na prática e merece entrar no portfólio.</h2><p className="mt-4 leading-7 text-muted-foreground">Em poucos minutos, você verifica os equipamentos, registra os benefícios e toma uma decisão comercial clara.</p><Button className="mt-7" size="lg" onClick={onStart}>Iniciar teste<ArrowRight className="size-5" /></Button></div><div className="space-y-3 rounded-xl bg-surface p-5"><Info label="Ambiente de teste" value="Casa Mairiporã" /><Info label="Integração disponível" value="Ekaza" /><Info label="Status" value="Pronto para iniciar" success /></div></CardContent></Card></div>; }
function GuidedCard({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) { return <Card className="mx-auto max-w-4xl"><CardHeader><div className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">{number}</span><div><CardTitle className="text-xl">{title}</CardTitle><CardDescription className="mt-2 max-w-2xl">{description}</CardDescription></div></div></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>; }
function Choice({ label, children }: { label: string; children: React.ReactNode }) { return <fieldset className="space-y-3"><legend className="text-sm font-semibold">{label}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>; }
function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40 hover:bg-surface"}`}>{children}</button>; }
function Info({ label, value, success }: { label: string; value: string; success?: boolean }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${success ? "text-success" : ""}`}>{value}</p></div>; }
function InfoBlock({ title, value }: { title: string; value: string }) { return <div><p className="text-sm font-semibold">{title}</p><p className="mt-2 rounded-lg bg-surface p-4 text-sm text-muted-foreground">{value}</p></div>; }
function Summary({ title, values }: { title: string; values: string[] }) { return <div><p className="text-sm font-semibold">{title}</p>{values.length ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{values.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />{item}</li>)}</ul> : <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CircleAlert className="size-4" />Nenhum neste teste.</p>}</div>; }
