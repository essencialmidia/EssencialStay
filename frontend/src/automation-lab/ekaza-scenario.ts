export type EkazaHealth = { configured: boolean; connected: boolean; provider: string; checkedAt: string; latency?: number; sanitizedErrorCode?: string };
export type EkazaDevice = { provider: string; providerDeviceId: string; name: string; type: string; online: boolean | null; capabilities: string[]; enabled: boolean };
export type EkazaDetails = { id: string; name?: string; type: string; category?: string; productName?: string; model?: string; online: boolean | null };
export type EkazaStatus = { deviceId: string; online: boolean | null; type: string; status: Array<{ code: string; value: unknown; label?: string }>; checkedAt: string };
export type EkazaCapabilities = { deviceId: string; functions: Array<{ code: string; writable?: boolean }>; status: Array<{ code: string; readable?: boolean }> };
export type EkazaDiagnostic = { healthy: boolean; checkedAt: string; latencyMs: number; notes: string[] };

const defaultApiBaseUrl = "https://nodes-api.zgpzbm.easypanel.host";
const configuredApiBaseUrl = (import.meta as ImportMeta & { env?: { VITE_EKAZA_API_BASE_URL?: string } }).env?.VITE_EKAZA_API_BASE_URL?.trim();
const browserFetch: typeof fetch = (...args) => globalThis.fetch(...args);

export type EkazaScenarioErrorCode = "admin_key_required" | "unauthorized" | "device_not_allowed" | "timeout" | "api_unavailable" | "network_or_cors";

export class EkazaScenarioError extends Error {
  readonly code: EkazaScenarioErrorCode;
  constructor(code: EkazaScenarioErrorCode) { super(code); this.name = "EkazaScenarioError"; this.code = code; }
}

export function getEkazaSimpleError(code: string) {
  if (code === "admin_key_required") return "Confirme a chave administrativa do Automation Lab para continuar.";
  if (code === "unauthorized") return "A chave administrativa não foi aceita. Confirme a chave e tente novamente.";
  if (code === "authentication_failed" || code === "invalid_credentials") return "A integração Ekaza precisa ter as credenciais revisadas antes de continuar.";
  if (code === "real_mode_disabled" || code === "device_read_disabled" || code === "integration_disabled") return "A integração Ekaza está desabilitada para consultas neste ambiente.";
  if (code === "timeout") return "A consulta demorou mais do que o esperado. Tente novamente.";
  if (code === "network_or_cors") return "Não foi possível acessar o serviço do Automation Lab. Verifique a conexão ou as permissões de acesso.";
  return "Não foi possível acessar o serviço do Automation Lab. Tente novamente em alguns instantes.";
}

export function maskProviderDeviceId(id: string) {
  if (id.length <= 6) return "••••••";
  return `${id.slice(0, 3)}••••${id.slice(-3)}`;
}

export class EkazaScenarioProvider implements AutomationLabReadProvider<EkazaHealth, EkazaDevice, EkazaDetails, EkazaStatus, EkazaCapabilities, EkazaDiagnostic> {
  readonly providerId = "ekaza";
  private readonly baseUrl: string;
  private readonly adminKey: string;
  private readonly fetchImpl: typeof fetch;
  constructor(adminKey: string, fetchImpl: typeof fetch = browserFetch, baseUrl = configuredApiBaseUrl || defaultApiBaseUrl) {
    this.adminKey = adminKey;
    this.fetchImpl = (...args) => fetchImpl.call(globalThis, ...args);
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async health() { return this.get<EkazaHealth>("/api/v1/integrations/ekaza/health", false); }
  async listDevices() { const response = await this.get<{ provider: string; devices: EkazaDevice[] }>("/api/v1/integrations/ekaza/devices"); return response.devices.filter((device) => device.enabled); }
  async getDetails(id: string) { return this.get<EkazaDetails>(`/api/v1/integrations/ekaza/devices/${encodeURIComponent(id)}`); }
  async getStatus(id: string) { return this.get<EkazaStatus>(`/api/v1/integrations/ekaza/devices/${encodeURIComponent(id)}/status`); }
  async getCapabilities(id: string) { return this.get<EkazaCapabilities>(`/api/v1/integrations/ekaza/devices/${encodeURIComponent(id)}/specifications`); }
  async diagnose(): Promise<EkazaDiagnostic> {
    const startedAt = Date.now();
    const health = await this.health();
    return { healthy: health.connected, checkedAt: health.checkedAt, latencyMs: health.latency ?? Date.now() - startedAt, notes: [health.connected ? "Provider Ekaza conectado para leituras autorizadas." : `Provider indisponível: ${health.sanitizedErrorCode ?? "não conectado"}.`, "Comandos reais não estão implementados neste cenário."] };
  }
  realCommandsAvailable() { return false; }

  private async get<T>(path: string, requiresAdminKey = true): Promise<T> {
    if (requiresAdminKey && !this.adminKey) throw new EkazaScenarioError("admin_key_required");
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, { headers: requiresAdminKey ? { "x-ekaza-admin-key": this.adminKey } : undefined });
    } catch (error) {
      if (error instanceof EkazaScenarioError) throw error;
      const name = error instanceof Error ? error.name : "";
      throw new EkazaScenarioError(name === "AbortError" ? "timeout" : "network_or_cors");
    }
    if (!response.ok) throw new EkazaScenarioError(response.status === 401 ? "unauthorized" : response.status === 403 ? "device_not_allowed" : response.status === 408 || response.status === 504 ? "timeout" : "api_unavailable");
    return response.json() as Promise<T>;
  }
}
import type { AutomationLabReadProvider } from "./provider-contract";
