import type { AkubelaCapabilities, AkubelaDevice, AkubelaProject, AkubelaRepositoryHealth, AkubelaStatus, DeviceRepository } from "./device-repository";

const project: AkubelaProject = { id: "project-hotel-monaco-01", name: "Hotel Mônaco · Home", providerType: "project" };
const panelId = "akubela-pg42-hypanel-elite-7-01";
const channel = (id: string, index: number, name: string) => ({ id, index, name, type: "relay" as const, state: null, readable: true as const, writable: true });
const device = (providerDeviceId: string, name: string, type: AkubelaDevice["type"], providerType: string, model: string, parentId?: string, channels = [] as AkubelaDevice["channels"]): AkubelaDevice => ({
  id: `akubela:${providerDeviceId}`, provider: "akubela", providerDeviceId, name, manufacturer: "Akubela", model, productId: `product-${providerDeviceId}`, type, providerType, online: true, locationId: project.id, parentId, gatewayId: panelId, channels,
  capabilities: channels.map(({ id, type: channelType, readable, writable }) => ({ code: id, type: channelType, readable, writable })), enabled: true,
  technical: { device_type: providerType, model, firmware_version: "42.1.38.93", hardware_version: "PG42", connected_time: "simulated" },
});
const devices: AkubelaDevice[] = [
  device(panelId, "Painel PG42", "control_panel", "Indoor Monitor", "HyPanel Elite 7"),
  device("nova-digital-01", "Nova Digital · Módulo 1", "relay_module", "Relay Module", "Nova Digital", panelId, [channel("relay-1", 1, "Canal 1"), channel("relay-2", 2, "Canal 2")]),
  device("nova-digital-02", "Nova Digital · Módulo 2", "relay_module", "Relay Module", "Nova Digital", panelId, [channel("relay-3", 1, "Canal 1"), channel("relay-4", 2, "Canal 2")]),
  device("samsung-tv-01", "Samsung TV", "other", "Television", "Samsung TV"),
  device("door-lock-01", "Fechadura do apartamento modelo", "smart_lock", "Access Control", "Smart Lock"),
  device("sensor-01", "Sensor de presença", "sensor", "Presence Sensor", "Sensor"),
];

export class AkubelaMockRepository implements DeviceRepository {
  async getProjects() { return [project]; }
  async getDevices(projectId?: string) { return !projectId || projectId === project.id ? devices.map((item) => ({ ...item, channels: [...item.channels], capabilities: [...item.capabilities] })) : []; }
  async getDevice(providerDeviceId: string) { return (await this.getDevices()).find((item) => item.providerDeviceId === providerDeviceId) ?? null; }
  async getCapabilities(providerDeviceId: string): Promise<AkubelaCapabilities | null> { const current = await this.getDevice(providerDeviceId); return current ? { supported: current.channels.length > 0, reason: current.channels.length ? undefined : "capabilities_not_reported_by_provider", providerDeviceId, channels: current.channels, capabilities: current.capabilities } : null; }
  async getStatus(providerDeviceId: string): Promise<AkubelaStatus | null> { const current = await this.getDevice(providerDeviceId); return current ? { supported: true, provider: "akubela", providerDeviceId, online: current.online, states: [], checkedAt: new Date().toISOString(), limitation: "Simulação segue a limitação atual: estados individuais de canais não são publicados." } : null; }
  async getHealth(): Promise<AkubelaRepositoryHealth> { return { configured: false, authenticated: false, connected: true, provider: "akubela", checkedAt: new Date().toISOString(), latency: 24, origin: "mock" }; }
}
