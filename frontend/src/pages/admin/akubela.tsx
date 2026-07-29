import { Activity, List, Loader2, Server, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

type Health = { configured: boolean; authenticated: boolean; connected: boolean; latency?: number; checkedAt: string };
type Location = { id: string; name: string; providerType: string };
type Channel = { id: string; index: number; name: string; type: string; state: unknown; readable: boolean; writable: boolean };
type Device = { providerDeviceId: string; name: string; type: string; providerType: string; model?: string; online: boolean | null; locationId?: string; spaceId?: string; parentId?: string; gatewayId?: string; channels: Channel[]; capabilities: unknown[]; enabled: boolean; technical: Record<string, unknown> };
type Status = { supported: boolean; online: boolean | null; states: unknown[]; limitation?: string };
type Capabilities = { supported: boolean; reason?: string; channels: Channel[]; capabilities: unknown[] };
type DetailSelection = { device: Device; details?: Device; status?: Status; capabilities?: Capabilities; failures: string[] };

const defaultApiBaseUrl = "https://nodes-api.zgpzbm.easypanel.host";
const apiBaseUrl = (import.meta.env.VITE_AKUBELA_API_BASE_URL?.trim() || defaultApiBaseUrl).replace(/\/+$/, "");

async function getJson<T>(path: string, key?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: key === undefined ? undefined : { "x-akubela-admin-key": key } });
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new Error(`HTTP ${response.status}: a API não retornou JSON.`);
  const payload = await response.json() as T & { message?: string };
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${payload.message ?? "falha na consulta"}`);
  return payload;
}

export function AdminAkubelaPage() {
  const [key, setKey] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [spacesMessage, setSpacesMessage] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [selection, setSelection] = useState<DetailSelection | null>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function run(label: string, action: () => Promise<void>) {
    setLoading(label); setError("");
    try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha na consulta."); } finally { setLoading(""); }
  }

  async function loadHierarchy() {
    await run("hierarchy", async () => {
      const response = await getJson<{ locations: Location[] }>("/api/v1/integrations/akubela/locations", key);
      setLocations(response.locations);
      const selected = locationId || response.locations[0]?.id || "";
      setLocationId(selected);
      if (selected) {
        const spaces = await getJson<{ supported: boolean; reason?: string }>(`/api/v1/integrations/akubela/locations/${encodeURIComponent(selected)}/spaces`, key);
        setSpacesMessage(spaces.supported ? "Espaços retornados." : `Não suportado: ${spaces.reason}`);
      }
    });
  }

  async function loadDevices() {
    await run("devices", async () => {
      const query = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
      const response = await getJson<{ devices: Device[] }>(`/api/v1/integrations/akubela/devices${query}`, key);
      setDevices(response.devices);
    });
  }

  async function openDetails(device: Device) {
    setSelection({ device, failures: [] });
    await run("details", async () => {
      const base = `/api/v1/integrations/akubela/devices/${encodeURIComponent(device.providerDeviceId)}`;
      const results = await Promise.allSettled([getJson<Device>(base, key), getJson<Status>(`${base}/status`, key), getJson<Capabilities>(`${base}/capabilities`, key)]);
      const next: DetailSelection = { device, failures: [] };
      if (results[0].status === "fulfilled") next.details = results[0].value; else next.failures.push("DETALHES");
      if (results[1].status === "fulfilled") next.status = results[1].value; else next.failures.push("STATUS");
      if (results[2].status === "fulfilled") next.capabilities = results[2].value; else next.failures.push("CAPACIDADES");
      setSelection(next);
    });
  }

  return <div className="space-y-6">
    <PageHeader title="Diagnóstico Akubela" description="Descoberta somente leitura da OpenAPI Akubela. Nenhum comando é disponibilizado." badge="Fase 1" />
    <Card><CardHeader><CardTitle>Integração</CardTitle><CardDescription>Credenciais do provider permanecem exclusivamente no backend.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-[1fr_auto]"><label className="grid gap-1.5 text-sm font-medium">Chave administrativa temporária<input type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="off" className="h-10 rounded-md border bg-background px-3 font-normal" /><span className="text-xs font-normal text-muted-foreground">Mantida somente na memória desta página.</span></label><div className="flex flex-wrap items-end gap-2"><Button variant="outline" disabled={Boolean(loading)} onClick={() => void run("health", async () => setHealth(await getJson<Health>("/api/v1/integrations/akubela/health")))}>{loading === "health" ? <Loader2 className="size-4 animate-spin" /> : <Server className="size-4" />}Health</Button><Button variant="outline" disabled={Boolean(loading)} onClick={() => void loadHierarchy()}>{loading === "hierarchy" ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}Hierarquia</Button><Button disabled={Boolean(loading)} onClick={() => void loadDevices()}>{loading === "devices" ? <Loader2 className="size-4 animate-spin" /> : <List className="size-4" />}Dispositivos</Button></div></CardContent>{health && <CardContent className="border-t pt-5"><div className="flex flex-wrap gap-2"><Badge variant={health.configured ? "success" : "warning"}>Configurada: {health.configured ? "sim" : "não"}</Badge><Badge variant={health.authenticated ? "success" : "warning"}>Autenticada: {health.authenticated ? "sim" : "não"}</Badge><Badge variant={health.connected ? "success" : "warning"}>Conectada: {health.connected ? "sim" : "não"}</Badge>{health.latency !== undefined && <Badge variant="outline">{health.latency} ms</Badge>}</div></CardContent>}</Card>
    {locations.length > 0 && <Card><CardHeader><CardTitle>Hierarquia oficial</CardTitle><CardDescription>Projetos confirmados pela Manager API. Espaços aguardam confirmação da OpenAPI.</CardDescription></CardHeader><CardContent className="grid gap-3"><select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="h-10 rounded-md border bg-background px-3">{locations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.providerType})</option>)}</select>{spacesMessage && <p className="text-sm text-muted-foreground">{spacesMessage}</p>}</CardContent></Card>}
    <Card><CardHeader><CardTitle>Dispositivos</CardTitle><CardDescription>Painéis, módulos e canais são classificados somente conforme campos reais retornados.</CardDescription></CardHeader><CardContent>{devices.length === 0 ? <p className="text-sm text-muted-foreground">Execute a listagem para iniciar o diagnóstico.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr>{["Nome", "Provider Device ID", "Tipo", "Modelo", "Espaço", "Online", "Autorizado", "Ações"].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody>{devices.map((device) => <tr key={device.providerDeviceId} className="border-b"><td className="px-3 py-3 font-medium">{device.name}</td><td className="px-3 py-3 font-mono text-xs">{device.providerDeviceId}</td><td className="px-3 py-3">{device.type}<span className="block text-xs text-muted-foreground">{device.providerType}</span></td><td className="px-3 py-3">{device.model ?? "—"}</td><td className="px-3 py-3">{device.spaceId ?? "Não informado"}</td><td className="px-3 py-3"><Badge variant={device.online ? "success" : "muted"}>{device.online === null ? "Desconhecido" : device.online ? "Online" : "Offline"}</Badge></td><td className="px-3 py-3"><Badge variant={device.enabled ? "success" : "warning"}>{device.enabled ? "Autorizado" : "Não autorizado"}</Badge></td><td className="px-3 py-3"><Button size="sm" variant="outline" onClick={() => void openDetails(device)}>Ver detalhes</Button></td></tr>)}</tbody></table></div>}</CardContent></Card>
    {error && <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"><TriangleAlert className="size-4 shrink-0" />{error}</div>}
    {selection && <AkubelaDrawer selection={selection} close={() => setSelection(null)} />}
  </div>;
}

function AkubelaDrawer({ selection, close }: { selection: DetailSelection; close: () => void }) {
  const device = selection.details ?? selection.device;
  return <div className="fixed inset-0 z-50"><button type="button" aria-label="Fechar" className="absolute inset-0 bg-foreground/25" onClick={close} /><aside role="dialog" aria-modal="true" className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l bg-card p-5 shadow-floating"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{device.name}</h2><p className="text-sm text-muted-foreground">{device.providerType}</p></div><Button size="icon" variant="ghost" onClick={close}><X className="size-4" /></Button></div><p className="my-4 rounded-md border border-warning/30 bg-warning/[0.08] p-3 text-sm">Modo diagnóstico somente leitura. Nenhum comando será enviado ao sistema Akubela.</p>{selection.failures.length > 0 && <p className="mb-4 text-sm text-destructive">Falha ao carregar: {selection.failures.join(", ")}. As informações disponíveis foram preservadas.</p>}<section className="grid gap-3 sm:grid-cols-2">{[["Device ID", device.providerDeviceId], ["Tipo", device.type], ["Modelo", device.model ?? "Não informado"], ["Projeto", device.locationId ?? "Não informado"], ["Pai", device.parentId ?? "Não informado"], ["Gateway", device.gatewayId ?? "Não informado"]].map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-medium">{value}</p></div>)}</section><section className="mt-6"><h3 className="font-semibold">Status</h3><p className="mt-2 text-sm">{selection.status?.online === null ? "Conectividade não informada" : selection.status?.online ? "Online" : "Offline"}</p>{selection.status?.limitation && <p className="mt-1 text-xs text-muted-foreground">{selection.status.limitation}</p>}</section><section className="mt-6"><h3 className="font-semibold">Canais e capacidades</h3>{(selection.capabilities?.channels ?? device.channels).length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhum canal confirmado pela resposta.</p> : <div className="mt-2 space-y-2">{(selection.capabilities?.channels ?? device.channels).map((channel) => <div key={channel.id} className="rounded-md border p-3"><p className="font-medium">{channel.name}</p><p className="text-xs text-muted-foreground">Canal {channel.index} · leitura {channel.readable ? "sim" : "não"} · escrita declarada {channel.writable ? "sim" : "não"} (comandos desabilitados)</p></div>)}</div>}</section><details className="mt-6 rounded-md border p-3"><summary className="cursor-pointer font-medium">Dados técnicos sanitizados</summary><pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(device.technical, null, 2)}</pre></details></aside></div>;
}
