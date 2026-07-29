import { mapRelayChannels } from "./akubela-device-mapper.js";

export function mapAkubelaCapabilities(raw) {
  const channels = mapRelayChannels(raw);
  return {
    supported: channels.length > 0,
    reason: channels.length > 0 ? undefined : "capabilities_not_reported_by_provider",
    providerDeviceId: String(raw.device_id ?? raw.deviceId ?? raw.id ?? ""),
    channels,
    capabilities: channels.map(({ id, type, readable, writable }) => ({ code: id, type, readable, writable })),
  };
}
