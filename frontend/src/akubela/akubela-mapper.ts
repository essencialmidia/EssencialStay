import type { AkubelaDevice } from "./device-repository";

export type EssencialStayDevice = { id: string; kind: "PanelDevice" | "RelayDevice" | "DoorLockDevice" | "SensorDevice" | "MediaDevice" | "OtherDevice"; name: string; online: boolean | null; provider: "akubela" };

export function mapAkubelaToEssencialStayDevice(device: AkubelaDevice): EssencialStayDevice {
  const kind = device.type === "control_panel" ? "PanelDevice" : device.type === "relay_module" ? "RelayDevice" : device.type === "smart_lock" ? "DoorLockDevice" : device.type === "sensor" ? "SensorDevice" : /tv|television/i.test(`${device.providerType} ${device.model ?? ""}`) ? "MediaDevice" : "OtherDevice";
  return { id: device.id, kind, name: device.name, online: device.online, provider: device.provider };
}
