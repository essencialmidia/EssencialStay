import { Activity, List, Loader2, PlugZap, Server, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

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
  const [loading, setLoading] = useState<"health" | "devices" | null>(null);
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
      {devices && <CardContent className="border-t pt-5">{devices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dispositivo retornado pela integração.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs font-medium uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Nome</th><th className="px-3 py-3">Provider Device ID</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Online</th><th className="px-3 py-3">Marca</th></tr></thead><tbody>{devices.map((device) => <tr key={device.providerDeviceId} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{device.name}</td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{device.providerDeviceId}</td><td className="px-3 py-3">{device.type}</td><td className="px-3 py-3"><Badge variant={device.online ? "success" : "muted"}>{device.online ? "Online" : "Offline"}</Badge></td><td className="px-3 py-3">{device.provider === "ekaza" ? "Ekaza" : device.provider}</td></tr>)}</tbody></table></div>}</CardContent>}
    </Card>

    {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><p>{error}</p></div>}
  </div>;
}
