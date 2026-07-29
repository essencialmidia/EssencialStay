const typeByCategory = { lock: "lock", light: "light", air_conditioner: "air_conditioner", airconditioner: "air_conditioner", television: "television", switch: "switch", curtain: "curtain", scene: "scene", sensor: "sensor" };

export function mapTuyaDevice(device, { propertyId = null, unitId = null, allowedDeviceIds = new Set() } = {}) {
  const capabilities = Array.isArray(device.functions) ? device.functions.map((item) => item.code).filter(Boolean) : [];
  return {
    id: `ekaza:${device.id}`,
    provider: "ekaza",
    providerDeviceId: device.id,
    name: device.name || "Dispositivo Ekaza",
    type: typeByCategory[device.category] || "other",
    online: Boolean(device.online),
    capabilities,
    propertyId,
    unitId,
    guestControllable: false,
    enabled: allowedDeviceIds.size === 0 ? false : allowedDeviceIds.has(device.id),
  };
}
