import { Activity, List, Loader2, PlugZap, Server, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/page-header";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

type HealthResponse = { configured: boolean; connected: boolean; provider: string; checkedAt: string; sanitizedErrorCode?: string };
type EkazaDevice = { provider: string; providerDeviceId: string; name: string; type: string; online: boolean };
type DeviceDetails = { id: string; name?: string; type: string; category?: string; productName?: string; productId?: string; model?: string; online: boolean; gatewayId?: string; updateTime?: number };
type DeviceStatus = { deviceId: string; online: boolean; type: string; status: Array<{ code: string; value: unknown; label?: string }>; checkedAt: string };
type Capability = { code: string; type?: string; values?: unknown; description?: string; writable?: boolean; readable?: boolean };
type Selection = { device: EkazaDevice; details?: DeviceDetails; status?: DeviceStatus; specifications?: { functions: Capability[]; status: Capability[] }; failures: Partial<Record<"DEVICE DETAILS" | "STATUS" | "SPECIFICATIONS", string>> };

const typeLabels: Record<string, string> = { smart_lock: "Fechadura", switch: "Interruptor", socket: "Tomada", gateway: "Hub/Gateway", sensor: "Sensor", thermostat: "Termostato", light: "Iluminação", other: "Outro" };
const defaultApiBaseUrl = "https://nodes-api.zgpzbm.easypanel.host";
const apiBaseUrl = (import.meta.env.VITE_EKAZA_API_BASE_URL?.trim() || defaultApiBaseUrl).replace(/\/+$/, "");

async function getJson<T>(path: string, key?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: key === undefined ? undefined : { "x-ekaza-admin-key": key } });
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) throw new Error(`A API respondeu com HTTP ${response.status}, mas não retornou JSON.`);
  if (!response.ok) throw new Error(`A API respondeu com status ${response.status}.`);
  return response.json() as Promise<T>;
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível consultar o dispositivo.";
  if (message.includes("401")) return "Chave administrativa inválida.";
  if (message.includes("404")) return "Dispositivo não encontrado.";
  if (message.includes("503")) return "A Tuya está temporariamente indisponível, em timeout ou não suporta este recurso.";
  return message;
}

export function AdminEkazaPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [devices, setDevices] = useState<EkazaDevice[] | null>(null);
  const [administrativeKey, setAdministrativeKey] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [tab, setTab] = useState<"info" | "status" | "capabilities" | "technical">("info");
  const [loading, setLoading] = useState<"health" | "devices" | "details" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(kind: "health" | "devices" | "details", action: () => Promise<T>) { setLoading(kind); setError(null); try { return await action(); } catch (requestError) { setError(friendlyError(requestError)); return null; } finally { setLoading(null); } }
  async function checkHealth() { const result = await run("health", () => getJson<HealthResponse>("/api/v1/integrations/ekaza/health")); if (result) setHealth(result); }
  async function listDevices() { const result = await run("devices", () => getJson<{ devices: EkazaDevice[] }>("/api/v1/integrations/ekaza/devices", administrativeKey)); if (result) setDevices(result.devices); }
  async function viewDetails(device: EkazaDevice) {
    setTab("info");
    setSelection({ device, failures: {} });
    setLoading("details");
    setError(null);
    const path = `/api/v1/integrations/ekaza/devices/${encodeURIComponent(device.providerDeviceId)}`;
    const [detailsResult, statusResult, specificationsResult] = await Promise.allSettled([
      getJson<DeviceDetails>(path, administrativeKey),
      getJson<DeviceStatus>(`${path}/status`, administrativeKey),
      getJson<{ functions: Capability[]; status: Capability[] }>(`${path}/specifications`, administrativeKey),
    ]);
    const next: Selection = { device, failures: {} };
    if (detailsResult.status === "fulfilled") next.details = detailsResult.value; else next.failures["DEVICE DETAILS"] = friendlyError(detailsResult.reason);
    if (statusResult.status === "fulfilled") next.status = statusResult.value; else next.failures.STATUS = friendlyError(statusResult.reason);
    if (specificationsResult.status === "fulfilled") next.specifications = specificationsResult.value; else next.failures.SPECIFICATIONS = friendlyError(specificationsResult.reason);
    setSelection(next);
    const failed = Object.keys(next.failures);
    if (failed.length > 0) setError(`Falha ao carregar ${failed.join(" e ")}.`);
    setLoading(null);
  }

  return <div className="space-y-6">
    <PageHeader title="Teste de integração Ekaza" description="Área administrativa temporária para validar a comunicação com a API. Nenhum comando de dispositivo é enviado por esta página." badge="Teste" />
    <Card><CardHeader><CardTitle>Conectividade</CardTitle><CardDescription>Consulte o estado atual do serviço da integração.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-md bg-info/10 text-info"><Activity className="size-5" /></div><p className="text-sm text-muted-foreground">Endpoint: <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/api/v1/integrations/ekaza/health</code></p></div><Button onClick={() => void checkHealth()} disabled={loading !== null}>{loading === "health" ? <Loader2 className="size-4 animate-spin" /> : <Server className="size-4" />}Health</Button></CardContent>{health && <CardContent className="border-t pt-5"><Badge variant={health.connected ? "success" : "warning"}>{health.connected ? "Conectado" : "Não conectado"}</Badge><span className="ml-2 text-sm text-muted-foreground">{health.provider} · {new Date(health.checkedAt).toLocaleString("pt-BR")}</span></CardContent>}</Card>
    <Card><CardHeader><CardTitle>Dispositivos</CardTitle><CardDescription>Lista de dispositivos retornada pela integração Ekaza.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="mt-1 grid size-10 shrink-0 place-items-center rounded-md bg-highlight/[0.14] text-highlight-foreground"><PlugZap className="size-5" /></div><label className="grid min-w-0 flex-1 gap-1.5 text-sm font-medium">Chave administrativa<input type="password" value={administrativeKey} onChange={(event) => setAdministrativeKey(event.target.value)} autoComplete="off" className="h-10 rounded-md border bg-background px-3 text-sm font-normal outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /><span className="text-xs font-normal text-muted-foreground">Mantida somente nesta página e removida ao recarregar.</span></label></div><Button onClick={() => void listDevices()} disabled={loading !== null}>{loading === "devices" ? <Loader2 className="size-4 animate-spin" /> : <List className="size-4" />}Listar dispositivos</Button></CardContent>{devices && <CardContent className="border-t pt-5">{devices.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dispositivo retornado.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Nome</th><th className="px-3 py-3">Provider Device ID</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Online</th><th className="px-3 py-3">Marca</th><th className="px-3 py-3 text-right">Ações</th></tr></thead><tbody>{devices.map((device) => <tr key={device.providerDeviceId} className="border-b last:border-0"><td className="px-3 py-3"><button type="button" onClick={() => void viewDetails(device)} className="font-medium hover:text-accent hover:underline">{device.name}</button></td><td className="px-3 py-3 font-mono text-xs text-muted-foreground">{device.providerDeviceId}</td><td className="px-3 py-3">{typeLabels[device.type] ?? "Outro"}</td><td className="px-3 py-3"><Badge variant={device.online ? "success" : "muted"}>{device.online ? "Online" : "Offline"}</Badge></td><td className="px-3 py-3">Ekaza</td><td className="px-3 py-3 text-right"><Button size="sm" variant="outline" onClick={() => void viewDetails(device)} disabled={loading !== null}>{loading === "details" ? <Loader2 className="size-4 animate-spin" /> : null}Ver detalhes</Button></td></tr>)}</tbody></table></div>}</CardContent>}</Card>
    {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" /><p>{error}</p></div>}
    <DeviceDrawer selection={selection} tab={tab} onTab={setTab} onClose={() => setSelection(null)} />
  </div>;
}

function DeviceDrawer({ selection, tab, onTab, onClose }: { selection: Selection | null; tab: "info" | "status" | "capabilities" | "technical"; onTab: (tab: "info" | "status" | "capabilities" | "technical") => void; onClose: () => void }) {
  if (!selection) return null;
  const { details, status, specifications } = selection;
  const tabs = [["info", "Informações"], ["status", "Status"], ["capabilities", "Capacidades"], ["technical", "Dados técnicos"]] as const;
  const information = [["Nome", details?.name ?? selection.device.name], ["Marca", "Ekaza"], ["Modelo", details?.model], ["Categoria", details?.category], ["Product ID", details?.productId], ["Device ID", details?.id ?? selection.device.providerDeviceId], ["Gateway", details?.gatewayId], ["Última atualização", details?.updateTime ? new Date(details.updateTime * 1000).toLocaleString("pt-BR") : undefined]];
  const failure = (label: keyof Selection["failures"]) => selection.failures[label] ? <p className="rounded-md border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive">Falha ao carregar {label}: {selection.failures[label]}</p> : null;
  return <div className="fixed inset-0 z-50"><button aria-label="Fechar detalhes" type="button" className="absolute inset-0 bg-foreground/25 backdrop-blur-[1px]" onClick={onClose} /><aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l bg-card shadow-floating" role="dialog" aria-modal="true" aria-label="Detalhes do dispositivo"><header className="border-b px-5 py-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{details?.name ?? selection.device.name}</h2><p className="mt-2 text-sm"><Badge variant={(status?.online ?? selection.device.online) ? "success" : "muted"}>🟢 {(status?.online ?? selection.device.online) ? "Online" : "Offline"}</Badge></p></div><Button size="icon" variant="ghost" onClick={onClose} aria-label="Fechar"><X className="size-4" /></Button></div><p className="mt-4 rounded-md border border-warning/30 bg-warning/[0.08] p-3 text-xs text-warning-foreground">Modo diagnóstico (somente leitura). Nenhum comando será enviado para a fechadura.</p></header><nav className="flex overflow-x-auto border-b px-3">{tabs.map(([id, label]) => <button key={id} type="button" onClick={() => onTab(id)} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${tab === id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>)}</nav><div className="flex-1 overflow-y-auto p-5">{tab === "info" && <>{failure("DEVICE DETAILS")}<div className="mt-3 grid gap-3 sm:grid-cols-2">{information.filter(([, value]) => value).map(([label, value]) => <div key={label} className="rounded-md border bg-surface p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{String(value)}</p></div>)}</div></>}{tab === "status" && <>{failure("STATUS")}{status && <div className="mt-3 space-y-2"><Badge variant={status.online ? "success" : "muted"}>Online</Badge>{status.status.map((item) => <div key={item.code} className="flex items-center justify-between gap-4 rounded-md border p-3"><div><p className="text-sm font-medium">{item.label ?? item.code}</p><p className="text-xs text-muted-foreground">{item.code}</p></div><Badge variant={statusTone(item.code, item.value)}>{formatStatusValue(item.value)}</Badge></div>)}</div>}</>}{tab === "capabilities" && <>{failure("SPECIFICATIONS")}{specifications && <div className="mt-3 space-y-5"><CapabilityList title="Funções" items={specifications.functions} /><CapabilityList title="Status" items={specifications.status} /></div>}</>}{tab === "technical" && <details open className="rounded-md border p-3"><summary className="cursor-pointer text-sm font-medium">JSON de diagnóstico sanitizado</summary><pre className="mt-3 overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(selection, null, 2)}</pre></details>}</div></aside></div>;
}

function statusTone(code: string, value: unknown) { if (code.includes("battery") || code.includes("electricity")) return "info"; if (typeof value === "boolean") return value ? "success" : "muted"; return "outline"; }
function formatStatusValue(value: unknown) { if (typeof value === "number" && value >= 0 && value <= 100) return `${value}%`; if (typeof value === "boolean") return value ? "Ativo" : "Inativo"; if (value === "closed") return "Porta fechada"; if (value === "opened" || value === "open") return "Porta aberta"; if (value === "locked") return "Travada"; if (value === "unlocked") return "Destravada"; return String(value); }
function CapabilityList({ title, items }: { title: string; items: Capability[] }) { return <section><h3 className="text-sm font-semibold">{title}</h3>{items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Não informado pela Tuya.</p> : <div className="mt-3 space-y-2">{items.map((item) => <div key={item.code} className="rounded-md border p-3"><p className="text-sm font-medium">{item.description ?? item.code}</p><p className="mt-1 font-mono text-xs text-muted-foreground">code: {item.code} · type: {item.type ?? "—"}</p><p className="mt-2 text-xs">read: {item.readable ? "sim" : "não"} · write: {item.writable ? "sim" : "não"}</p>{item.values !== undefined && <code className="mt-2 block break-all text-xs">values: {JSON.stringify(item.values)}</code>}</div>)}</div>}</section>; }
