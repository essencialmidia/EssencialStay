export function mapAkubelaStatus(raw) {
  return {
    supported: true,
    provider: "akubela",
    providerDeviceId: String(raw.device_id ?? raw.deviceId ?? raw.id ?? ""),
    online: typeof raw.online === "boolean" ? raw.online : null,
    states: [],
    checkedAt: new Date().toISOString(),
    limitation: "A OpenAPI Manager documenta conectividade, mas não documenta estados individuais de canais.",
  };
}
