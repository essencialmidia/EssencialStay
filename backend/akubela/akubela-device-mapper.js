const TYPES = new Set(["control_panel", "gateway", "relay_module", "switch", "socket", "light", "curtain", "thermostat", "hvac", "sensor", "smart_lock", "scene"]);
const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;

export function normalizeAkubelaType(providerType = "") {
  const value = String(providerType).toLowerCase();
  if (value.includes("indoor monitor") || value.includes("panel")) return "control_panel";
  if (value.includes("gateway")) return "gateway";
  if (value.includes("relay") || value.includes("module")) return "relay_module";
  if (value.includes("access control") || value.includes("lock")) return "smart_lock";
  for (const type of TYPES) if (value.includes(type.replace("_", " "))) return type;
  return "other";
}

export function mapAkubelaDevice(raw, { allowedDeviceIds = new Set(), locationId } = {}) {
  const providerDeviceId = clean(raw.device_id ?? raw.deviceId ?? raw.id) ?? "";
  const providerType = clean(raw.device_type ?? raw.deviceType ?? raw.product_name ?? raw.productName) ?? "unknown";
  const channels = mapRelayChannels(raw);
  return {
    id: `akubela:${providerDeviceId}`,
    provider: "akubela",
    providerDeviceId,
    name: clean(raw.device_name ?? raw.deviceName ?? raw.name) ?? "Dispositivo Akubela",
    manufacturer: clean(raw.manufacturer),
    model: clean(raw.model),
    productId: clean(raw.product_id ?? raw.productId),
    type: normalizeAkubelaType(providerType),
    providerType,
    online: typeof raw.online === "boolean" ? raw.online : null,
    locationId: clean(locationId ?? raw.project_id ?? raw.projectId),
    spaceId: clean(raw.space_id ?? raw.spaceId),
    parentId: clean(raw.parent_id ?? raw.parentId),
    gatewayId: clean(raw.gateway_id ?? raw.gatewayId),
    channels,
    capabilities: channels.map(({ id, type, readable, writable }) => ({ code: id, type, readable, writable })),
    enabled: allowedDeviceIds.has(providerDeviceId),
    technical: sanitizeTechnical(raw),
  };
}

export function mapRelayChannels(raw) {
  const relays = [...(Array.isArray(raw.relays) ? raw.relays : []), ...(Array.isArray(raw.security_relays) ? raw.security_relays : [])];
  return relays.map((relay, index) => ({
    id: String(relay.relay_id ?? relay.relay_number ?? index + 1),
    index: Number(relay.relay_number ?? index + 1),
    name: clean(relay.relay_name) ?? `Canal ${index + 1}`,
    type: "relay",
    state: null,
    readable: true,
    writable: relay.enable !== false,
  }));
}

export function sanitizeTechnical(raw) {
  const allowed = ["device_type", "product_name", "model", "firmware_version", "hardware_version", "created_time", "connected_time"];
  return Object.fromEntries(allowed.filter((key) => raw[key] !== undefined).map((key) => [key, raw[key]]));
}
