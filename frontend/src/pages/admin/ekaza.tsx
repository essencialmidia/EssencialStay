import { Activity, List, Loader2, PlugZap, Server, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";

type HealthResponse = {
  configured: boolean;
  connected: boolean;
  provider: string;
  checkedAt: string;
  sanitizedErrorCode?: string;
};

type EkazaDevice = {
  provider: string;
  providerDeviceId: string;
  name: string;
  type: string;
  online: boolean;
};

type DevicesResponse = { devices: EkazaDevice[] };
type DeviceDetails = { id: string; name?: string; type: string; category?: string; productName?: string; productId?: string; model?: string; online: boolean; subDevice?: boolean; gatewayId?: string; timeZone?: string; createTime?: number; updateTime?: number; activeTime?: number };
type DeviceStatus = { deviceId: string; online: boolean; type: string; status: Array<{ code: string; value: unknown; label?: string }>; checkedAt: string };
type Specifications = { deviceId: string; functions: Capability[]; status: Capability[] };
type Capability = { code: string; type?: string; values?: unknown; description?: string; writable?: boolean; readable?: boolean };

const typeLabels: Record<string, string> = { smart_lock: "Fechadura", switch: "Interruptor", socket: "Tomada", gateway: "Hub/Gateway", sensor: "Sensor", thermostat: "Termostato", light: "Iluminação", other: "Outro" };

const defaultApiBaseUrl = "https://nodes-api.zgpzbm.easypanel.host";
const apiBaseUrl = (import.meta.env.VITE_EKAZA_API_BASE_URL?.trim() || defaultApiBaseUrl).replace(/\/+$/, "");

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

async function getJson<T>(path: string, administrativeKey?: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: administrativeKey === undefined ? undefined : { "x-ekaza-admin-key": administrativeKey },
  });
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`A API respondeu com HTTP ${response.status}, mas não retornou JSON. Verifique a URL configurada para a API.`);
  }
  if (!response.ok) throw new Error(`A API respondeu com status ${response.status}.`);
  return response.json() as Promise<T>;
}

export function AdminEkazaPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [devices, setDevices] = useState<EkazaDevice[] | null>(null);
  const [administrativeKey, setAdministrativeKey] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<{ details: DeviceDetails; status: DeviceStatus; specifications: Specifications } | null>(null);
  const [loading, setLoading] = useState<"health" | "devices" | "details" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkHealth() {
    setLoading("health");
    setError(null);
    try {
      setHealth(await getJson<HealthResponse>("/api/v1/integrations/ekaza/health"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível consultar o health da integração.");
    } finally {
      setLoading(null);
    }
  }

  async function listDevices() {
    setLoading("devices");
    setError(null);
    try {
      const result = await getJson<DevicesResponse>("/api/v1/integrations/ekaza/devices", administrativeKey);
      setDevices(result.devices);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível listar os dispositivos.");
    } finally {
      setLoading(null);
    }
  }

  async function viewDetails(device: EkazaDevice) {
    setLoading("details");
    setError(null);
    try {
      const path = `/api/v1/integrations/ekaza/devices/${encodeURIComponent(device.providerDeviceId)}`;
      const [details, status, specifications] = await Promise.all([
        getJson<DeviceDetails>(path, administrativeKey),
        getJson<DeviceStatus>(`${path}/status`, administrativeKey),
        getJson<Specifications>(`${path}/specifications`, administrativeKey),
      ]);
      setSelectedDevice({ details, status, specifications });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Não foi possível consultar o dispositivo.";
      setError(message.includes("401") ? "Chave administrativa inválida." : message.includes("404") ? "Dispositivo não encontrado." : message.includes("503") ? "A Tuya está temporariamente indisponível ou o recurso não é suportado." : message);
    } finally {
      setLoading(null);
    }
  }

  return <div className="space-y-6">
    <PageHeader title="Teste de integração Ekaza" description="Área administrativa temporária para validar a comunicação com a API. Nenhum comando de dispositivo é enviado por esta página." badge="Teste" />

    <Card>
      <CardHeader><CardTitle>Conectividade</CardTitle><CardDescription>Consulte o estado atual do serviço da integração.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-md bg-info/10 text-info"><Activity className="size-5" /></div><p className="text-sm text-muted-foreground">Endpoint: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/api/v1/integrations/ekaza/health</code></p></div>
        <Button onClick={() => void checkHealth()} disabled={loading !== null}>{loading === "health" ? <Loader2 className="size-4 animate-spin" /> : <Server className="size-4" />}Health</Button>
      </CardContent>
      {health && <CardContent className="border-t pt-5"><div className="flex flex-wrap gap-2"><Badge variant={health.connected ? "success" : "warning"}>{health.connected ? "Conectado" : "Não conectado"}</Badge><Badge variant={health.configured ? "info" : "muted"}>{health.configured ? "Configurado" : "Não configurado"}</Badge><span className="text-sm text-muted-foreground">Provider: {health.provider} · verificado em {new Date(health.checkedAt).toLocaleString("pt-BR")}</span></div>{health.sanitizedErrorCode && <p className="mt-3 text-sm text-muted-foreground">Status: {health.sanitizedErrorCode}</p>}</CardContent>}
    </Card>

    <Card>
      <CardHeader><CardTitle>Dispositivos</CardTitle><CardDescription>Lista os dispositivos retornados pela integração Ekaza.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3"><div className="mt-1 grid size-10 shrink-0 place-items-center rounded-md bg-highlight/[0.14] text-highlight-foreground"><PlugZap className="size-5" /></div><label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">Chave administrativa<input type="password" value={administrativeKey} onChange={(event) => setAdministrativeKey(event.target.value)} autoComplete="off" className="h-10 w-full rounded-md border bg-background px-3 text-sm font-normal outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20" /><span className="text-xs font-normal text-muted-foreground">Usada apenas nesta requisição e removida ao recarregar a página.</span></label></div>
        <Button onClick={() => void listDevices()} disabled={loading !== null}>{loading === "devices" ? <Loader2 className="size-4 animate-spin" /> : <List className="size-4" />}Listar dispositivos</Button>
      </CardContent>
      {devices && <CardContent className="border-t pt-5">{devices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dispositivo retornado pela integração.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b text-xs font-medium uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Nome</th><th className="px-3 py-3">Provider Device ID</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Online</th><th className="px-3 py-3">Marca</th><th className="px-3 py-3" /></tr></thead><tbody>{devices.map((device) => <tr key={device.providerDeviceId} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{device.name}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{device.providerDeviceId}</td><td className="px-3 py-3">{typeLabels[device.type] ?? "Outro"}</td><td className="px-3 py-3"><Badge variant={device.online ? "success" : "muted"}>{device.online ? "Online" : "Offline"}</Badge></td><td className="px-3 py-3">{device.provider === "ekaza" ? "Ekaza" : device.provider}</td><td className="px-3 py-3 text-right"><Button size="sm" variant="outline" onClick={() => void viewDetails(device)} disabled={loading !== null}>{loading === "details" ? <Loader2 className="size-4 animate-spin" /> : null}Ver detalhes</Button></td></tr>)}</tbody></table></div>}</CardContent>}
    </Card>

    {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><p>{error}</p></div>}
    <Modal open={selectedDevice !== null} onClose={() => setSelectedDevice(null)} title={selectedDevice?.details.name ?? "Detalhes do dispositivo"} description="Modo diagnóstico somente leitura. Comandos e gestão de PINs estão desabilitados nesta etapa." size="large">
      {selectedDevice && <div className="space-y-6"><section><h3 className="text-sm font-semibold">Informações</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["ID do dispositivo", selectedDevice.details.id], ["Marca", "Ekaza"], ["Categoria Tuya", selectedDevice.details.category], ["Tipo Essencial Stay", typeLabels[selectedDevice.details.type] ?? "Outro"], ["Modelo", selectedDevice.details.model], ["Product ID", selectedDevice.details.productId], ["Gateway associado", selectedDevice.details.gatewayId], ["Última atualização", selectedDevice.details.updateTime ? new Date(selectedDevice.details.updateTime * 1000).toLocaleString("pt-BR") : undefined]].filter(([, value]) => value).map(([label, value]) => <div key={String(label)} className="rounded-md border bg-surface p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{String(value)}</p></div>)}</div></section><section><h3 className="text-sm font-semibold">Status atual <Badge className="ml-2 align-middle" variant={selectedDevice.status.online ? "success" : "muted"}>{selectedDevice.status.online ? "Online" : "Offline"}</Badge></h3><div className="mt-3 space-y-2">{selectedDevice.status.status.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum status retornado pela Tuya.</p> : selectedDevice.status.status.map((item) => <div key={item.code} className="flex items-start justify-between gap-4 rounded-md border p-3"><div><p className="text-sm font-medium">{item.label ?? item.code}</p>{item.label && <p className="text-xs text-muted-foreground">{item.code}</p>}</div><code className="max-w-[55%] break-all text-right text-xs">{JSON.stringify(item.value)}</code></div>)}</div></section><section><h3 className="text-sm font-semibold">Capacidades da Tuya</h3><CapabilityList title="Funções disponíveis" items={selectedDevice.specifications.functions} /><CapabilityList title="Status disponíveis" items={selectedDevice.specifications.status} /></section><details className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium">Dados técnicos</summary><pre className="mt-3 overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(selectedDevice, null, 2)}</pre></details></div>}
    </Modal>
  </div>;
}

function CapabilityList({ title, items }: { title: string; items: Capability[] }) {
  return <div className="mt-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Não informado pela Tuya.</p> : <div className="mt-2 space-y-2">{items.map((item) => <div key={item.code} className="rounded-md border p-3"><p className="text-sm font-medium">{item.description ?? item.code}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.code} · {item.type ?? "tipo não informado"}</p>{item.values !== undefined && <code className="mt-2 block break-all text-xs">{JSON.stringify(item.values)}</code>}</div>)}</div>}</div>;
}
