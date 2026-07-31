const categories = {
  smart_lock: new Set(["lock", "smart_lock", "door_lock", "ms"]),
  switch: new Set(["switch", "kg"]),
  socket: new Set(["socket", "cz"]),
  gateway: new Set(["gateway", "hub", "zigbee_gateway", "wg2"]),
  sensor: new Set(["sensor", "pir"]),
  thermostat: new Set(["thermostat", "wk", "air_conditioner", "airconditioner"]),
  light: new Set(["light", "dj"]),
};

function text(device) {
  return [device.name, device.product_name, device.productName, device.model, device.product_id, device.productId, device.node_id, device.nodeId].filter(Boolean).join(" ").toLowerCase();
}

export function classifyTuyaDevice(device) {
  const category = String(device.category || "").toLowerCase();
  for (const [type, values] of Object.entries(categories)) if (values.has(category)) return type;
  const fallback = text(device);
  if (/\b(lock|doorlock|t429z)\b|fechadura/.test(fallback)) return "smart_lock";
  if (/\b(socket|outlet|plug)\b|tomada/.test(fallback)) return "socket";
  if (/\b(switch|relay)\b|interruptor/.test(fallback)) return "switch";
  if (/\b(gateway|hub|zigbee)\b/.test(fallback)) return "gateway";
  if (/\b(sensor|detector)\b/.test(fallback)) return "sensor";
  if (/\b(thermostat|climate)\b/.test(fallback)) return "thermostat";
  if (/\b(light|lamp|bulb)\b|luz/.test(fallback)) return "light";
  return "other";
}

export function mapTuyaDevice(device, { propertyId = null, unitId = null, allowedDeviceIds = new Set() } = {}) {
  const capabilities = Array.isArray(device.functions) ? device.functions.map((item) => item.code).filter(Boolean) : [];
  const connectivity = device.online ?? device.isOnline ?? device.is_online;
  return { id: `ekaza:${device.id}`, provider: "ekaza", providerDeviceId: device.id, name: device.name || device.custom_name || "Dispositivo Ekaza", type: classifyTuyaDevice(device), online: connectivity === undefined || connectivity === null ? null : Boolean(connectivity), capabilities, propertyId, unitId, guestControllable: false, enabled: allowedDeviceIds.size === 0 ? false : allowedDeviceIds.has(device.id) };
}
