export type AutomationLabReadDevice = { providerDeviceId: string; enabled: boolean };

export interface AutomationLabReadProvider<Health, Device extends AutomationLabReadDevice, Details, Status, Capabilities, Diagnostic> {
  readonly providerId: string;
  health(): Promise<Health>;
  listDevices(): Promise<Device[]>;
  getDetails(providerDeviceId: string): Promise<Details>;
  getStatus(providerDeviceId: string): Promise<Status>;
  getCapabilities(providerDeviceId: string): Promise<Capabilities>;
  diagnose(): Promise<Diagnostic>;
  realCommandsAvailable(): boolean;
}
