export type CertificationStatus = "compatible" | "homologated" | "in_validation" | "experimental" | "deprecated";
export type DeviceMode = "disabled" | "read_only" | "simulated" | "real";
export type SessionStatus = "active" | "ended";

export type LabDevice = {
  id: string;
  name: string;
  type: string;
  model: string;
  firmware: string;
  capabilities: string[];
  allowedCommands: string[];
  state: "online" | "offline";
  mode: DeviceMode;
  allowlisted: boolean;
};

export type LabScenario = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "planned";
  manufacturer: string;
  providerId: string;
  apiVersion: string;
  lastValidation: string | null;
  environment: "laboratory";
  certification: CertificationStatus;
  devices: LabDevice[];
  capabilities: string[];
  limitations: string[];
  notes: string;
  portalAvailable: boolean;
};

export type AutomationSession = {
  id: string;
  scenarioId: string;
  status: SessionStatus;
  startedAt: string;
  endsAt: string;
  endedAt?: string;
  fictionalGuestName?: string;
  technicalNotes?: string;
  portalEnabled?: boolean;
  simulatedMessageEnabled?: boolean;
  devices: Array<{ id: string; enabled: boolean; mode: DeviceMode }>;
};

export type LabLog = {
  id: string;
  sessionId: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  operation: string;
  detail: string;
};

export type ProviderDiagnostic = {
  providerId: string;
  healthy: boolean;
  latencyMs: number;
  checkedAt: string;
  notes: string[];
};

export type CommandResult = {
  accepted: boolean;
  mode: "SIMULATED" | "REAL";
  reason?: string;
  latencyMs?: number;
};

export interface AutomationLabProvider {
  id: string;
  name: string;
  certification: CertificationStatus;
  listDevices(scenario: LabScenario): LabDevice[];
  listCapabilities(device: LabDevice): string[];
  getState(device: LabDevice): LabDevice["state"];
  executeCommand(input: { scenario: LabScenario; deviceId: string; command: string; mode: DeviceMode; confirmed?: boolean }): Promise<CommandResult>;
  cancelCommand(deviceId: string): Promise<{ cancelled: boolean }>;
  getEvents(): Promise<Array<{ type: string; timestamp: string }>>;
  getDiagnostic(): Promise<ProviderDiagnostic>;
}

const casaMairiporaScenario: LabScenario = {
    id: "scenario-01-casa-mairipora",
    name: "Casa Mairiporã",
    description: "Cenário residencial e Airbnb para homologação controlada do ecossistema Ekaza.",
    category: "Residencial / Airbnb",
    status: "active",
    manufacturer: "Ekaza",
    providerId: "ekaza",
    apiVersion: "v2",
    lastValidation: "2026-07-29",
    environment: "laboratory",
    certification: "in_validation",
    devices: [],
    capabilities: ["device_inventory", "status", "capabilities", "diagnostics", "guest_portal_temporary"],
    limitations: ["Dispositivos são carregados somente da allowlist Ekaza.", "Comandos reais, PIN temporário e revogação ainda não possuem suporte comprovado."],
    notes: "Estrutura de testes Casa Mairiporã conectada ao provider Ekaza via API de diagnóstico.",
    portalAvailable: true,
};

const akubelaScenario: LabScenario = {
  id: "scenario-02", name: "Bancada Akubela PG42", description: "Inventário técnico do HyPanel Elite 7 (PG42) por provider abstrato somente leitura.", category: "Bancada de testes", status: "active", manufacturer: "Akubela", providerId: "akubela-repository", apiVersion: "OpenAPI aguardando credenciais", lastValidation: null, environment: "laboratory", certification: "compatible", devices: [], capabilities: ["device_inventory", "status", "capabilities", "diagnostics"], limitations: ["OpenAPI ainda não habilitada.", "Nenhum comando, PIN ou operação de escrita é disponibilizado."], notes: "Cenário 02 usa DeviceRepository e InventoryCache; o modo OpenAPI não efetua requisições sem credenciais.", portalAvailable: false,
};

const plannedScenarios: Array<[string, string, string, string, string, CertificationStatus]> = [
  ["scenario-03", "Yale Connect", "Yale", "Controle de acesso", "Hub Connect", "in_validation"],
  ["scenario-04", "Shelly", "Shelly", "Energia e relés", "HTTP/MQTT", "experimental"],
  ["scenario-05", "Aqara", "Aqara", "Sensores e automação", "Cloud API", "experimental"],
  ["scenario-06", "GoodWe", "GoodWe", "Energia", "SEMS", "experimental"],
  ["scenario-07", "HITS PMS", "HITS", "PMS", "API", "compatible"],
  ["scenario-08", "Wubook", "Wubook", "Channel Manager", "API", "compatible"],
  ["scenario-09", "Stays.net", "Stays.net", "PMS / Channel Manager", "API", "compatible"],
];

export const AUTOMATION_LAB_SCENARIOS: LabScenario[] = [
  casaMairiporaScenario,
  akubelaScenario,
  ...plannedScenarios.map((entry, index) => {
  const [id, name, manufacturer, category, apiVersion, certification] = entry;
  return {
    id,
    name,
    description: `Cenário preparado para integração, diagnóstico e homologação de ${manufacturer}.`,
    category,
    status: "planned",
    manufacturer,
    providerId: id.replace("scenario-", "provider-"),
    apiVersion,
    lastValidation: null,
    environment: "laboratory",
    certification,
    devices: [],
    capabilities: [],
    limitations: ["Provider ainda não habilitado para execução neste cenário."],
    notes: `Cenário ${String(index + 1).padStart(2, "0")} reservado no catálogo permanente do laboratório.`,
    portalAvailable: false,
  } satisfies LabScenario;
  }),
];

class CatalogProvider implements AutomationLabProvider {
  readonly id: string;
  readonly name: string;
  readonly certification: CertificationStatus;

  constructor(
    id: string,
    name: string,
    certification: CertificationStatus,
  ) {
    this.id = id;
    this.name = name;
    this.certification = certification;
  }

  listDevices(scenario: LabScenario) {
    return scenario.providerId === this.id ? scenario.devices.map((item) => ({ ...item })) : [];
  }

  listCapabilities(deviceValue: LabDevice) {
    return [...deviceValue.capabilities];
  }

  getState(deviceValue: LabDevice) {
    return deviceValue.state;
  }

  async executeCommand(input: { scenario: LabScenario; deviceId: string; command: string; mode: DeviceMode; confirmed?: boolean }): Promise<CommandResult> {
    const knownDevice = this.listDevices(input.scenario).find((item) => item.id === input.deviceId);
    if (!knownDevice) return { accepted: false, mode: input.mode === "real" ? "REAL" : "SIMULATED", reason: "unknown_device" };
    if (!knownDevice.allowlisted) return { accepted: false, mode: input.mode === "real" ? "REAL" : "SIMULATED", reason: "device_not_allowlisted" };
    if (knownDevice.state !== "online") return { accepted: false, mode: input.mode === "real" ? "REAL" : "SIMULATED", reason: "device_offline" };
    if (!knownDevice.allowedCommands.includes(input.command)) return { accepted: false, mode: input.mode === "real" ? "REAL" : "SIMULATED", reason: "unsupported_capability" };
    if (input.mode === "disabled" || input.mode === "read_only") return { accepted: false, mode: "SIMULATED", reason: "device_mode_blocks_commands" };
    if (input.mode === "real" && !input.confirmed) return { accepted: false, mode: "REAL", reason: "real_command_confirmation_required" };
    return { accepted: true, mode: input.mode === "real" ? "REAL" : "SIMULATED", latencyMs: input.mode === "real" ? 420 : 48 };
  }

  async cancelCommand(deviceId: string) {
    return { cancelled: Boolean(deviceId) };
  }

  async getEvents() {
    return [{ type: "provider.checked", timestamp: new Date().toISOString() }];
  }

  async getDiagnostic(): Promise<ProviderDiagnostic> {
    return {
      providerId: this.id,
      healthy: true,
      latencyMs: this.id === "ekaza" ? 86 : 0,
      checkedAt: new Date().toISOString(),
      notes: ["Contrato provider-agnostic disponível.", "Nenhuma credencial foi incluída no diagnóstico."],
    };
  }
}

export const automationLabProviders = new Map<string, AutomationLabProvider>([
  ["ekaza", new CatalogProvider("ekaza", "Ekaza", "in_validation")],
  ["provider-03", new CatalogProvider("provider-03", "Yale", "in_validation")],
  ["provider-04", new CatalogProvider("provider-04", "Shelly", "experimental")],
  ["provider-05", new CatalogProvider("provider-05", "Aqara", "experimental")],
  ["provider-06", new CatalogProvider("provider-06", "GoodWe", "experimental")],
  ["provider-07", new CatalogProvider("provider-07", "HITS PMS", "compatible")],
  ["provider-08", new CatalogProvider("provider-08", "Wubook", "compatible")],
  ["provider-09", new CatalogProvider("provider-09", "Stays.net", "compatible")],
]);

export const AUTOMATION_LAB_STORAGE_KEY = "essencialstay:automation-lab:sessions:v1";

export function loadAutomationSessions(storage: Pick<Storage, "getItem">): AutomationSession[] {
  try {
    const value = storage.getItem(AUTOMATION_LAB_STORAGE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAutomationSessions(storage: Pick<Storage, "setItem">, sessions: AutomationSession[]) {
  storage.setItem(AUTOMATION_LAB_STORAGE_KEY, JSON.stringify(sessions));
}

export function createAutomationSession(scenario: LabScenario, now = new Date()): AutomationSession {
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: `lab-${now.getTime()}`,
    scenarioId: scenario.id,
    status: "active",
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    fictionalGuestName: `Teste ${scenario.name}`,
    technicalNotes: "Sessão automática do Modo Simples.",
    portalEnabled: false,
    simulatedMessageEnabled: false,
    devices: scenario.devices.map((item) => ({ id: item.id, enabled: true, mode: item.mode === "real" ? "simulated" : item.mode })),
  };
}

export function endAutomationSession(session: AutomationSession, now = new Date()): AutomationSession {
  return { ...session, status: "ended", endedAt: now.toISOString(), devices: session.devices.map((item) => ({ ...item, enabled: false, mode: "disabled" })) };
}

export function isAutomationSessionExpired(session: AutomationSession, now = new Date()) {
  return session.status !== "active" || new Date(session.endsAt).getTime() <= now.getTime();
}

export function clearAutomationSessions(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(AUTOMATION_LAB_STORAGE_KEY);
}

const sensitiveKey = /(pin|token|secret|senha|password|credential|telefone|phone|message|mensagem|mac|serial|device.?id|location.?id|project.?id)/i;

export function sanitizeLabLog(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (key, item) => {
    if (sensitiveKey.test(key)) return "[REDACTED]";
    if (typeof item === "string") {
      if (/bearer\s+[a-z0-9._-]+/i.test(item)) return "[REDACTED]";
      if (/\+?\d[\d\s().-]{8,}\d/.test(item)) return "[REDACTED]";
    }
    if (item && typeof item === "object") {
      if (seen.has(item)) return "[CIRCULAR]";
      seen.add(item);
    }
    return item;
  }) ?? "";
}

export function createLabLog(sessionId: string, operation: string, detail: unknown, level: LabLog["level"] = "info"): LabLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sessionId,
    timestamp: new Date().toISOString(),
    level,
    operation,
    detail: sanitizeLabLog(detail),
  };
}
