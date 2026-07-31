import { useEffect, useMemo, useState } from "react";
import { AkubelaMockRepository } from "../../akubela/akubela-mock-repository";
import { AkubelaOpenApiRepository } from "../../akubela/akubela-openapi-repository";
import { mapAkubelaToEssencialStayDevice } from "../../akubela/akubela-mapper";
import { maskAkubelaIdentifier } from "../../akubela/akubela-sanitizer";
import { InventoryCache } from "../../akubela/inventory-cache";
import type { AkubelaDevice, DeviceRepository } from "../../akubela/device-repository";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type Mode = "simulated" | "openapi";
const cache = new InventoryCache();

export function AkubelaScenarioPanel() {
  const [mode, setMode] = useState<Mode>("simulated");
  const [devices, setDevices] = useState<AkubelaDevice[]>([]);
  const [selected, setSelected] = useState<AkubelaDevice | null>(null);
  const repository = useMemo<DeviceRepository>(() => mode === "simulated" ? new AkubelaMockRepository() : new AkubelaOpenApiRepository(), [mode]);
  const health = useMemo(() => repository.getHealth(), [repository]);

  async function loadInventory() {
    if (mode === "openapi") return;
    const [project] = await repository.getProjects();
    const inventory = await repository.getDevices(project?.id);
    await Promise.all(inventory.map(async (item) => cache.set({ device: item, status: await repository.getStatus(item.providerDeviceId), capabilities: await repository.getCapabilities(item.providerDeviceId), lastReadAt: new Date().toISOString(), origin: "mock", provider: "akubela", online: item.online })));
    setDevices(inventory);
    setSelected(inventory.find((item) => item.type === "control_panel") ?? null);
  }

  return <Card><CardHeader><CardTitle>Cenário 02 · Akubela PG42</CardTitle><CardDescription>Inventário técnico estritamente somente leitura, isolado da operação e pronto para alternar de provider.</CardDescription></CardHeader><CardContent className="space-y-5">
    <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-medium">Modo</span><label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "simulated"} onChange={() => { setMode("simulated"); setDevices([]); setSelected(null); }} />Simulado</label><label className="flex items-center gap-2 text-sm"><input type="radio" checked={mode === "openapi"} onChange={() => { setMode("openapi"); setDevices([]); setSelected(null); }} />OpenAPI</label><Button variant="outline" size="sm" disabled={mode === "openapi"} onClick={() => void loadInventory()}>Carregar inventário</Button></div>
    {mode === "openapi" ? <div className="rounded-lg border border-info/20 bg-info/[0.05] p-4 text-sm">Aguardando credenciais OpenAPI Akubela.</div> : <Inventory health={health} devices={devices} selected={selected} onSelect={setSelected} />}
  </CardContent></Card>;
}

function Inventory({ health, devices, selected, onSelect }: { health: Promise<{ latency: number; origin: string }>; devices: AkubelaDevice[]; selected: AkubelaDevice | null; onSelect: (device: AkubelaDevice) => void }) {
  const [latency, setLatency] = useState<number | null>(null);
  useEffect(() => { void health.then((value) => setLatency(value.latency)); }, [health]);
  const cached = selected ? cache.get(selected.providerDeviceId) : null;
  return <div className="space-y-4">{devices.length === 0 ? <p className="text-sm text-muted-foreground">Carregue o inventário simulado para revisar o contrato Akubela.</p> : <div className="grid gap-3 md:grid-cols-2">{devices.map((item) => <button type="button" key={item.providerDeviceId} onClick={() => onSelect(item)} className={`rounded-lg border p-4 text-left ${selected?.providerDeviceId === item.providerDeviceId ? "border-primary bg-primary/[0.05]" : "hover:bg-surface"}`}><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{mapAkubelaToEssencialStayDevice(item).kind} · {item.online ? "Online" : "Status não informado"}</p></button>)}</div>}{selected && <div className="rounded-lg border bg-surface p-4"><p className="font-semibold">Painel técnico</p><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">{[["Modelo", selected.model ?? "Não informado"], ["Firmware", String(selected.technical.firmware_version ?? "Não informado")], ["Hardware", String(selected.technical.hardware_version ?? "Não informado")], ["Provider", selected.provider], ["Device ID", maskAkubelaIdentifier(selected.providerDeviceId)], ["Online", cached?.online ? "Online" : "Não informado"], ["Última atualização", cached ? new Date(cached.lastReadAt).toLocaleString("pt-BR") : "Não informada"], ["Capabilities", String(cached?.capabilities?.capabilities.length ?? 0)], ["Latência", latency === null ? "—" : `${latency} ms`], ["Origem", cached?.origin ?? "mock"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><div className="mt-4"><Badge variant="info">Somente leitura</Badge></div></div>}</div>;
}
