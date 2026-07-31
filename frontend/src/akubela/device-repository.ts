export type AkubelaProject = { id: string; name: string; providerType: "project" };

export type AkubelaChannel = { id: string; index: number; name: string; type: "relay"; state: null; readable: true; writable: boolean };

export type AkubelaDevice = {
  id: string;
  provider: "akubela";
  providerDeviceId: string;
  name: string;
  manufacturer?: string;
  model?: string;
  productId?: string;
  type: "control_panel" | "relay_module" | "smart_lock" | "sensor" | "other";
  providerType: string;
  online: boolean | null;
  locationId?: string;
  spaceId?: string;
  parentId?: string;
  gatewayId?: string;
  channels: AkubelaChannel[];
  capabilities: Array<{ code: string; type: string; readable: boolean; writable: boolean }>;
  enabled: boolean;
  technical: Record<string, unknown>;
};

export type AkubelaStatus = { supported: true; provider: "akubela"; providerDeviceId: string; online: boolean | null; states: []; checkedAt: string; limitation: string };
export type AkubelaCapabilities = { supported: boolean; reason?: string; providerDeviceId: string; channels: AkubelaChannel[]; capabilities: AkubelaDevice["capabilities"] };
export type AkubelaRepositoryHealth = { configured: boolean; authenticated: boolean; connected: boolean; provider: "akubela"; checkedAt: string; latency: number; origin: "mock" | "openapi"; message?: string };

export interface DeviceRepository {
  getProjects(): Promise<AkubelaProject[]>;
  getDevices(projectId?: string): Promise<AkubelaDevice[]>;
  getDevice(providerDeviceId: string): Promise<AkubelaDevice | null>;
  getCapabilities(providerDeviceId: string): Promise<AkubelaCapabilities | null>;
  getStatus(providerDeviceId: string): Promise<AkubelaStatus | null>;
  getHealth(): Promise<AkubelaRepositoryHealth>;
}
