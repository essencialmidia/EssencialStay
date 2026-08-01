import type { AkubelaCapabilities, AkubelaDevice, AkubelaProject, AkubelaRepositoryHealth, AkubelaStatus, DeviceRepository } from "./device-repository";

export class AkubelaOpenApiRepository implements DeviceRepository {
  private unavailable(): never { throw new Error("openapi_credentials_unavailable"); }
  async getProjects(): Promise<AkubelaProject[]> { return this.unavailable(); }
  async getDevices(_projectId?: string): Promise<AkubelaDevice[]> { return this.unavailable(); }
  async getDevice(_providerDeviceId: string): Promise<AkubelaDevice | null> { return this.unavailable(); }
  async getCapabilities(_providerDeviceId: string): Promise<AkubelaCapabilities | null> { return this.unavailable(); }
  async getStatus(_providerDeviceId: string): Promise<AkubelaStatus | null> { return this.unavailable(); }
  async getHealth(): Promise<AkubelaRepositoryHealth> { return { configured: false, authenticated: false, connected: false, provider: "akubela", checkedAt: new Date().toISOString(), latency: 0, origin: "openapi", message: "Aguardando credenciais OpenAPI Akubela." }; }
}
