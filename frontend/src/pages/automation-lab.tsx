import {
  Activity,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  CircleOff,
  ClipboardList,
  Cpu,
  FileCheck2,
  Gauge,
  Play,
  PlugZap,
  RotateCcw,
  ShieldCheck,
  Square,
  TerminalSquare,
  TimerReset,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AUTOMATION_LAB_SCENARIOS,
  automationLabProviders,
  clearAutomationSessions,
  createAutomationSession,
  createLabLog,
  endAutomationSession,
  loadAutomationSessions,
  saveAutomationSessions,
  type AutomationSession,
  type CertificationStatus,
  type DeviceMode,
  type LabLog,
  type LabScenario,
  type ProviderDiagnostic,
} from "../automation-lab/automation-lab";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Modal } from "../components/ui/modal";
import { Select } from "../components/ui/select";
import { Switch } from "../components/ui/switch";

type Section = "dashboard" | "scenarios" | "sessions" | "providers" | "devices" | "logs" | "diagnostics" | "reports";

const sections: Array<{ id: Section; label: string; icon: typeof Gauge }> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "scenarios", label: "Cenários", icon: Boxes },
  { id: "sessions", label: "Automation Sessions", icon: TimerReset },
  { id: "providers", label: "Providers", icon: PlugZap },
  { id: "devices", label: "Dispositivos", icon: Cpu },
  { id: "logs", label: "Logs", icon: TerminalSquare },
  { id: "diagnostics", label: "Diagnóstico", icon: Activity },
  { id: "reports", label: "Relatórios", icon: FileCheck2 },
];

const certificationLabels: Record<CertificationStatus, string> = {
  compatible: "Compatível",
  homologated: "Homologado",
  in_validation: "Em validação",
  experimental: "Experimental",
  deprecated: "Descontinuado",
};

const certificationVariant: Record<CertificationStatus, "success" | "info" | "warning" | "muted"> = {
  compatible: "info",
  homologated: "success",
  in_validation: "warning",
  experimental: "muted",
  deprecated: "muted",
};

const deviceModeLabels: Record<DeviceMode, string> = {
  disabled: "Desabilitado",
  read_only: "Somente leitura",
  simulated: "Simulado",
  real: "Real",
};

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Ainda não validado";
}

function scenarioNumber(id: string) {
  return `Scenario ${id.slice(-2)}`;
}

function scenarioProvider(scenario: LabScenario) {
  return automationLabProviders.get(scenario.providerId);
}

function sessionStorageSafe() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export function AutomationLabPage() {
  const storage = sessionStorageSafe();
  const [section, setSection] = useState<Section>("dashboard");
  const [selectedScenarioId, setSelectedScenarioId] = useState("scenario-01");
  const [sessions, setSessions] = useState<AutomationSession[]>(() => storage ? loadAutomationSessions(storage) : []);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => sessions.find((item) => item.status === "active")?.id ?? null);
  const [logs, setLogs] = useState<LabLog[]>([]);
  const [diagnostics, setDiagnostics] = useState<ProviderDiagnostic[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [commandDeviceId, setCommandDeviceId] = useState("ekaza-lock-01");
  const [command, setCommand] = useState("lock");

  const selectedScenario = AUTOMATION_LAB_SCENARIOS.find((item) => item.id === selectedScenarioId) ?? AUTOMATION_LAB_SCENARIOS[0];
  const activeSession = sessions.find((item) => item.id === selectedSessionId && item.status === "active") ?? null;
  const activeScenario = activeSession ? AUTOMATION_LAB_SCENARIOS.find((item) => item.id === activeSession.scenarioId) ?? selectedScenario : selectedScenario;
  const provider = scenarioProvider(activeScenario);
  const selectedDevice = activeScenario.devices.find((item) => item.id === commandDeviceId) ?? activeScenario.devices[0];
  const selectedSessionDevice = activeSession?.devices.find((item) => item.id === selectedDevice?.id);

  const stats = useMemo(() => ({
    scenarios: AUTOMATION_LAB_SCENARIOS.length,
    active: AUTOMATION_LAB_SCENARIOS.filter((item) => item.status === "active").length,
    providers: automationLabProviders.size,
    sessions: sessions.filter((item) => item.status === "active").length,
  }), [sessions]);

  function persist(next: AutomationSession[]) {
    setSessions(next);
    if (storage) saveAutomationSessions(storage, next);
  }

  function addLog(operation: string, detail: unknown, level: LabLog["level"] = "info") {
    const sessionId = activeSession?.id ?? "lab-catalog";
    setLogs((current) => [createLabLog(sessionId, operation, detail, level), ...current].slice(0, 100));
  }

  function startSession() {
    const session = createAutomationSession(selectedScenario);
    persist([session, ...sessions]);
    setSelectedSessionId(session.id);
    setCommandDeviceId(selectedScenario.devices[0]?.id ?? "");
    addLog("session.started", { scenarioId: selectedScenario.id, mode: "temporary" }, "success");
    setSection("sessions");
  }

  function finishSession() {
    if (!activeSession) return;
    const ended = endAutomationSession(activeSession);
    persist(sessions.map((item) => item.id === ended.id ? ended : item));
    addLog("session.ended", { sessionId: activeSession.id }, "success");
    setSelectedSessionId(null);
  }

  function clearSessions() {
    if (storage) clearAutomationSessions(storage);
    setSessions([]);
    setSelectedSessionId(null);
    setLogs([]);
  }

  function updateSessionDevice(deviceId: string, patch: Partial<AutomationSession["devices"][number]>) {
    if (!activeSession) return;
    persist(sessions.map((session) => session.id !== activeSession.id ? session : {
      ...session,
      devices: session.devices.map((item) => item.id === deviceId ? { ...item, ...patch } : item),
    }));
  }

  async function runCommand() {
    if (!activeSession || !provider || !selectedDevice || !selectedSessionDevice?.enabled) return;
    const isReal = selectedSessionDevice.mode === "real";
    const confirmed = !isReal || window.confirm("Este comando está marcado como REAL. Confirma a execução controlada no dispositivo allowlisted?");
    const result = await provider.executeCommand({
      scenario: activeScenario,
      deviceId: selectedDevice.id,
      command,
      mode: selectedSessionDevice.mode,
      confirmed,
    });
    addLog("command.executed", { deviceId: selectedDevice.id, command, mode: result.mode, accepted: result.accepted, reason: result.reason }, result.accepted ? "success" : "warning");
  }

  async function runDiagnostic(scenario = selectedScenario) {
    const targetProvider = scenarioProvider(scenario);
    if (!targetProvider) return;
    const diagnostic = await targetProvider.getDiagnostic();
    setDiagnostics((current) => [diagnostic, ...current.filter((item) => item.providerId !== diagnostic.providerId)]);
    addLog("diagnostic.completed", { providerId: targetProvider.id, healthy: diagnostic.healthy, latencyMs: diagnostic.latencyMs }, "success");
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Automation Lab"
        description="Ambiente permanente e independente para integração, homologação, certificação e testes controlados de providers e dispositivos."
        badge="Ambiente isolado"
        actions={<Button onClick={startSession} disabled={selectedScenario.status !== "active"}><Play className="size-4" />Nova Automation Session</Button>}
      />

      <div className="rounded-lg border bg-card p-2 shadow-xs">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Seções do Automation Lab">
          {sections.map((item) => <button key={item.id} type="button" role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)} className={`flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${section === item.id ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><item.icon className="size-4" />{item.label}</button>)}
        </div>
      </div>

      {section === "dashboard" && <Dashboard stats={stats} onNavigate={setSection} />}
      {section === "scenarios" && <Scenarios selectedId={selectedScenarioId} onSelect={setSelectedScenarioId} onStart={startSession} />}
      {section === "sessions" && <Sessions sessions={sessions} activeSession={activeSession} activeScenario={activeScenario} onSelect={setSelectedSessionId} onFinish={finishSession} onClear={clearSessions} onDeviceChange={updateSessionDevice} />}
      {section === "providers" && <Providers />}
      {section === "devices" && <Devices scenario={activeScenario} session={activeSession} />}
      {section === "logs" && <Logs logs={logs} />}
      {section === "diagnostics" && <Diagnostics diagnostics={diagnostics} scenario={selectedScenario} onRun={() => void runDiagnostic()} />}
      {section === "reports" && <Reports scenario={selectedScenario} diagnostics={diagnostics} onGenerate={() => { setReportOpen(true); addLog("report.generated", { scenarioId: selectedScenario.id }, "success"); }} />}

      {activeSession && selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle>Console de comandos controlados</CardTitle>
            <CardDescription>O provider valida dispositivo, allowlist, capability, estado e confirmação antes de aceitar um comando.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1.5 text-sm font-medium">Dispositivo<Select value={selectedDevice.id} onChange={(event) => { setCommandDeviceId(event.target.value); const nextDevice = activeScenario.devices.find((item) => item.id === event.target.value); setCommand(nextDevice?.allowedCommands[0] ?? ""); }}>{activeScenario.devices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
            <label className="space-y-1.5 text-sm font-medium">Comando<Select value={command} onChange={(event) => setCommand(event.target.value)}>{selectedDevice.allowedCommands.length ? selectedDevice.allowedCommands.map((item) => <option key={item} value={item}>{item}</option>) : <option value="">Sem comandos suportados</option>}</Select></label>
            <Button disabled={!selectedSessionDevice?.enabled || !command || selectedSessionDevice.mode === "disabled" || selectedSessionDevice.mode === "read_only"} onClick={() => void runCommand()}><Play className="size-4" />Executar {selectedSessionDevice?.mode === "real" ? "REAL" : "SIMULADO"}</Button>
          </CardContent>
        </Card>
      )}

      <Modal open={reportOpen} title="Relatório técnico do cenário" description="Relatório temporário, sem impacto nos relatórios operacionais." onClose={() => setReportOpen(false)} size="large">
        <TechnicalReport scenario={selectedScenario} diagnostic={diagnostics.find((item) => item.providerId === selectedScenario.providerId)} />
      </Modal>
    </div>
  );
}

function Dashboard({ stats, onNavigate }: { stats: { scenarios: number; active: number; providers: number; sessions: number }; onNavigate: (section: Section) => void }) {
  const items = [
    ["Cenários catalogados", stats.scenarios, Boxes, "scenarios"],
    ["Cenários ativos", stats.active, CheckCircle2, "scenarios"],
    ["Providers independentes", stats.providers, PlugZap, "providers"],
    ["Sessões ativas", stats.sessions, TimerReset, "sessions"],
  ] as const;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, Icon, target]) => <button key={label} type="button" onClick={() => onNavigate(target)} className="rounded-lg border bg-card p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-medium"><div className="flex items-center justify-between"><Icon className="size-5 text-primary" /><span className="text-2xl font-semibold">{value}</span></div><p className="mt-3 text-sm text-muted-foreground">{label}</p></button>)}</div><div className="grid gap-4 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>Laboratório independente</CardTitle><CardDescription>O Automation Lab trabalha com cenários e sessões temporárias — nunca com propriedades ou reservas reais.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{["Sem PMS, FNRH ou faturamento", "Sem CRM, histórico ou estatísticas", "SessionStorage temporário", "Comando real somente confirmado e allowlisted"].map((text) => <div key={text} className="flex gap-3 rounded-lg bg-surface p-3 text-sm"><ShieldCheck className="size-5 shrink-0 text-success" /><span>{text}</span></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Scenario 01</CardTitle><CardDescription>Estrutura atual homologável.</CardDescription></CardHeader><CardContent><p className="text-lg font-semibold">Casa Mairiporã</p><p className="mt-1 text-sm text-muted-foreground">Ekaza · API v2</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="warning">Em validação</Badge><Badge variant="outline">4 dispositivos</Badge><Badge variant="success">Portal disponível</Badge></div></CardContent></Card></div></div>;
}

function Scenarios({ selectedId, onSelect, onStart }: { selectedId: string; onSelect: (id: string) => void; onStart: () => void }) {
  const scenario = AUTOMATION_LAB_SCENARIOS.find((item) => item.id === selectedId) ?? AUTOMATION_LAB_SCENARIOS[0];
  return <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Card><CardHeader><CardTitle>Catálogo de cenários</CardTitle><CardDescription>Ambientes técnicos escaláveis, separados da operação de propriedades.</CardDescription></CardHeader><CardContent className="space-y-2">{AUTOMATION_LAB_SCENARIOS.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition ${selectedId === item.id ? "border-primary bg-primary/[0.05]" : "hover:bg-surface"}`}><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{scenarioNumber(item.id)}</p><p className="mt-1 font-semibold">{item.name}</p><p className="text-sm text-muted-foreground">{item.manufacturer} · {item.category}</p></div><div className="text-right"><Badge variant={certificationVariant[item.certification]}>{certificationLabels[item.certification]}</Badge><p className="mt-2 text-xs text-muted-foreground">{item.status === "active" ? "Ativo" : "Planejado"}</p></div></button>)}</CardContent></Card><Card className="h-fit xl:sticky xl:top-5"><CardHeader><CardTitle>{scenarioNumber(scenario.id)} · {scenario.name}</CardTitle><CardDescription>{scenario.description}</CardDescription></CardHeader><CardContent className="space-y-5"><dl className="grid grid-cols-2 gap-4 text-sm">{[["Fabricante", scenario.manufacturer], ["Provider", scenarioProvider(scenario)?.name ?? "Reservado"], ["API", scenario.apiVersion], ["Ambiente", "Laboratório"], ["Última validação", dateTime(scenario.lastValidation)], ["Dispositivos", String(scenario.devices.length)]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><div><p className="text-sm font-semibold">Capabilities</p><div className="mt-2 flex flex-wrap gap-2">{scenario.capabilities.length ? scenario.capabilities.map((item) => <Badge key={item} variant="outline">{item}</Badge>) : <span className="text-sm text-muted-foreground">Aguardando provider.</span>}</div></div><div><p className="text-sm font-semibold">Limitações</p><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{scenario.limitations.map((item) => <li key={item} className="flex gap-2"><CircleOff className="mt-0.5 size-4 shrink-0" />{item}</li>)}</ul></div><Button className="w-full" disabled={scenario.status !== "active"} onClick={onStart}><Play className="size-4" />Iniciar sessão temporária</Button></CardContent></Card></div>;
}

function Sessions({ sessions, activeSession, activeScenario, onSelect, onFinish, onClear, onDeviceChange }: { sessions: AutomationSession[]; activeSession: AutomationSession | null; activeScenario: LabScenario; onSelect: (id: string) => void; onFinish: () => void; onClear: () => void; onDeviceChange: (id: string, patch: Partial<AutomationSession["devices"][number]>) => void }) {
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Automation Sessions</h2><p className="text-sm text-muted-foreground">Sessões locais, temporárias e sem qualquer vínculo com reservas oficiais.</p></div><Button variant="outline" disabled={!sessions.length} onClick={onClear}><RotateCcw className="size-4" />Limpar sessionStorage</Button></div>{sessions.length === 0 ? <Card><CardContent className="py-12 text-center"><TimerReset className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">Nenhuma sessão temporária</p><p className="mt-1 text-sm text-muted-foreground">Inicie uma sessão a partir de um cenário ativo.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-[320px_1fr]"><Card><CardContent className="space-y-2">{sessions.map((item) => <button key={item.id} type="button" onClick={() => item.status === "active" && onSelect(item.id)} className={`w-full rounded-lg border p-3 text-left ${activeSession?.id === item.id ? "border-primary bg-primary/[0.05]" : ""}`}><div className="flex items-center justify-between gap-2"><p className="font-medium">{AUTOMATION_LAB_SCENARIOS.find((scenario) => scenario.id === item.scenarioId)?.name}</p><Badge variant={item.status === "active" ? "success" : "muted"}>{item.status === "active" ? "Ativa" : "Encerrada"}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.id}</p><p className="mt-1 text-xs text-muted-foreground">Início: {dateTime(item.startedAt)}</p></button>)}</CardContent></Card><Card><CardHeader><CardTitle>{activeSession ? `${scenarioNumber(activeScenario.id)} · ${activeScenario.name}` : "Selecione uma sessão ativa"}</CardTitle>{activeSession && <CardDescription>Expira em {dateTime(activeSession.endsAt)}. O encerramento desabilita todos os dispositivos.</CardDescription>}</CardHeader>{activeSession && <CardContent className="space-y-3">{activeScenario.devices.map((device) => { const value = activeSession.devices.find((item) => item.id === device.id); return <div key={device.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_180px] sm:items-center"><div><p className="font-medium">{device.name}</p><p className="text-sm text-muted-foreground">{device.type} · {device.model}</p></div><Switch checked={value?.enabled} aria-label={`Habilitar ${device.name}`} onClick={() => onDeviceChange(device.id, { enabled: !value?.enabled, mode: value?.enabled ? "disabled" : "simulated" })} /><Select value={value?.mode ?? "disabled"} disabled={!value?.enabled} onChange={(event) => onDeviceChange(device.id, { mode: event.target.value as DeviceMode })}>{(["disabled", "read_only", "simulated", "real"] as DeviceMode[]).map((mode) => <option key={mode} value={mode}>{deviceModeLabels[mode]}</option>)}</Select></div>; })}<div className="flex flex-wrap gap-2 pt-2"><Button variant="destructive" onClick={onFinish}><Square className="size-4" />Encerrar sessão</Button><Badge variant="outline">Não cria reserva</Badge><Badge variant="outline">Não envia PMS</Badge><Badge variant="outline">Não gera faturamento</Badge></div></CardContent>}</Card></div>}</div>;
}

function Providers() {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...automationLabProviders.values()].map((provider) => { const scenario = AUTOMATION_LAB_SCENARIOS.find((item) => item.providerId === provider.id); return <Card key={provider.id}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{provider.name}</CardTitle><Badge variant={certificationVariant[provider.certification]}>{certificationLabels[provider.certification]}</Badge></div><CardDescription>{scenario ? scenarioNumber(scenario.id) : "Provider disponível para cenários futuros"}</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2">{["devices", "capabilities", "state", "execute", "cancel", "events", "diagnostic"].map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><p className="mt-4 text-sm text-muted-foreground">Contrato independente; nenhuma lógica do fabricante reside na interface do laboratório.</p></CardContent></Card>; })}</div>;
}

function Devices({ scenario, session }: { scenario: LabScenario; session: AutomationSession | null }) {
  return <Card><CardHeader><CardTitle>Dispositivos · {scenario.name}</CardTitle><CardDescription>Inventário retornado pelo provider. Nenhum dispositivo inicia em modo real.</CardDescription></CardHeader><CardContent className="space-y-3">{scenario.devices.length ? scenario.devices.map((device) => { const value = session?.devices.find((item) => item.id === device.id); return <div key={device.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"><div><p className="font-medium">{device.name}</p><p className="text-xs text-muted-foreground">{device.id}</p></div><p className="text-sm">{device.type}<span className="block text-xs text-muted-foreground">{device.model} · {device.firmware}</span></p><div className="flex flex-wrap gap-1">{device.capabilities.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><div className="flex gap-2"><Badge variant={device.state === "online" ? "success" : "muted"}>{device.state}</Badge><Badge variant={value?.mode === "real" ? "warning" : "info"}>{deviceModeLabels[value?.mode ?? device.mode]}</Badge></div></div>; }) : <p className="py-8 text-center text-sm text-muted-foreground">O provider deste cenário ainda não publicou dispositivos.</p>}</CardContent></Card>;
}

function Logs({ logs }: { logs: LabLog[] }) {
  return <Card><CardHeader><CardTitle>Logs técnicos temporários</CardTitle><CardDescription>Dados sensíveis são sanitizados antes do registro e os logs desaparecem ao recarregar a sessão do navegador.</CardDescription></CardHeader><CardContent>{logs.length ? <div className="space-y-2 font-mono text-xs">{logs.map((log) => <div key={log.id} className="grid gap-1 rounded-lg border bg-surface p-3 md:grid-cols-[150px_130px_1fr]"><span className="text-muted-foreground">{dateTime(log.timestamp)}</span><span className={log.level === "error" ? "text-destructive" : log.level === "success" ? "text-success" : "text-foreground"}>{log.operation}</span><span className="break-all text-muted-foreground">{log.detail}</span></div>)}</div> : <div className="py-12 text-center"><TerminalSquare className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">Nenhum evento temporário</p><p className="mt-1 text-sm text-muted-foreground">Inicie uma sessão, execute um diagnóstico ou gere um relatório.</p></div>}</CardContent></Card>;
}

function Diagnostics({ diagnostics, scenario, onRun }: { diagnostics: ProviderDiagnostic[]; scenario: LabScenario; onRun: () => void }) {
  const diagnostic = diagnostics.find((item) => item.providerId === scenario.providerId);
  return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>Diagnóstico provider-agnostic</CardTitle><CardDescription>Consulta saúde, latência e contrato sem revelar credenciais.</CardDescription></CardHeader><CardContent>{diagnostic ? <div className="space-y-4"><div className="flex items-center gap-3"><CheckCircle2 className="size-7 text-success" /><div><p className="font-semibold">Provider saudável</p><p className="text-sm text-muted-foreground">Latência {diagnostic.latencyMs} ms · {dateTime(diagnostic.checkedAt)}</p></div></div>{diagnostic.notes.map((note) => <p key={note} className="rounded-lg bg-surface p-3 text-sm">{note}</p>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Execute o primeiro diagnóstico deste cenário.</p>}</CardContent></Card><Card><CardHeader><CardTitle>{scenario.name}</CardTitle><CardDescription>{scenarioProvider(scenario)?.name ?? "Provider reservado"} · {scenario.apiVersion}</CardDescription></CardHeader><CardContent><Button className="w-full" disabled={!scenarioProvider(scenario)} onClick={onRun}><Activity className="size-4" />Executar diagnóstico</Button></CardContent></Card></div>;
}

function Reports({ scenario, diagnostics, onGenerate }: { scenario: LabScenario; diagnostics: ProviderDiagnostic[]; onGenerate: () => void }) {
  const last = diagnostics.find((item) => item.providerId === scenario.providerId);
  return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>Relatórios de homologação</CardTitle><CardDescription>Documentos técnicos do laboratório, separados dos relatórios de Produção.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{["Fabricante, modelo e firmware", "Versão da API e capabilities", "Comandos suportados e bloqueados", "Latência, erros e observações"].map((item) => <div key={item} className="flex gap-3 rounded-lg bg-surface p-4 text-sm"><ClipboardList className="size-5 shrink-0 text-primary" />{item}</div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>{scenarioNumber(scenario.id)}</CardTitle><CardDescription>{scenario.name}</CardDescription></CardHeader><CardContent className="space-y-3"><Badge variant={certificationVariant[scenario.certification]}>{certificationLabels[scenario.certification]}</Badge><p className="text-sm text-muted-foreground">{last ? `Último diagnóstico: ${dateTime(last.checkedAt)}` : "Relatório pode ser gerado sem diagnóstico; a ausência será indicada."}</p><Button className="w-full" onClick={onGenerate}><BookOpenCheck className="size-4" />Gerar relatório temporário</Button></CardContent></Card></div>;
}

function TechnicalReport({ scenario, diagnostic }: { scenario: LabScenario; diagnostic?: ProviderDiagnostic }) {
  const supported = scenario.devices.flatMap((item) => item.allowedCommands);
  return <div className="space-y-5 text-sm"><div className="rounded-lg border bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Essencial Stay Certified · relatório preliminar</p><h3 className="mt-2 text-xl font-semibold">{scenario.manufacturer} · {scenario.name}</h3><p className="mt-1 text-muted-foreground">{scenarioNumber(scenario.id)} · Ambiente de laboratório</p></div><dl className="grid gap-4 sm:grid-cols-2">{[["Fabricante", scenario.manufacturer], ["Versão API", scenario.apiVersion], ["Modelos", scenario.devices.map((item) => item.model).join(", ") || "Não informado"], ["Firmware", scenario.devices.map((item) => item.firmware).join(", ") || "Não informado"], ["Capabilities", scenario.capabilities.join(", ") || "Não publicadas"], ["Comandos suportados", [...new Set(supported)].join(", ") || "Nenhum"], ["Comandos não suportados", "Bloqueados pelo contrato do provider"], ["Tempo de resposta", diagnostic ? `${diagnostic.latencyMs} ms` : "Não medido"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><div><p className="font-semibold">Observações</p><ul className="mt-2 space-y-2 text-muted-foreground">{scenario.limitations.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/[0.06] p-4 text-success"><ShieldCheck className="size-5" />Sem reservas, dados pessoais, credenciais ou efeitos operacionais.</div></div>;
}
