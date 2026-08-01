import type { AkubelaCapabilities, AkubelaDevice, AkubelaStatus } from "./device-repository";

export type InventoryCacheEntry = {
  device: AkubelaDevice;
  status: AkubelaStatus | null;
  capabilities: AkubelaCapabilities | null;
  lastReadAt: string;
  origin: "mock" | "openapi";
  provider: "akubela";
  online: boolean | null;
};

export class InventoryCache {
  private readonly entries = new Map<string, InventoryCacheEntry>();

  set(entry: InventoryCacheEntry) { this.entries.set(entry.device.providerDeviceId, entry); return entry; }
  get(providerDeviceId: string) { return this.entries.get(providerDeviceId) ?? null; }
  list() { return [...this.entries.values()]; }
  clear() { this.entries.clear(); }
}
