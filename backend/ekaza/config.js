const asBoolean = (value) => String(value).toLowerCase() === "true";

export function loadEkazaConfig(env = process.env) {
  const mode = env.EKAZA_MODE === "real" ? "real" : "demo";
  const baseUrl = (env.TUYA_BASE_URL || "https://openapi.tuyaus.com").replace(/\/+$/, "");
  return {
    mode,
    baseUrl,
    clientId: (env.TUYA_CLIENT_ID || "").trim(),
    clientSecret: (env.TUYA_CLIENT_SECRET || "").trim(),
    uid: (env.TUYA_UID || "").trim(),
    spaceId: (env.TUYA_SPACE_ID || "").trim(),
    timeoutMs: Math.max(1000, Number(env.TUYA_TIMEOUT_MS) || 8000),
    realEnabled: asBoolean(env.EKAZA_REAL_ENABLED),
    deviceReadEnabled: asBoolean(env.EKAZA_DEVICE_READ_ENABLED),
    deviceCommandsEnabled: asBoolean(env.EKAZA_DEVICE_COMMANDS_ENABLED),
    temporaryAccessEnabled: asBoolean(env.EKAZA_TEMPORARY_ACCESS_ENABLED),
    guestPortalEnabled: asBoolean(env.EKAZA_GUEST_PORTAL_ENABLED),
    automaticRevocationEnabled: asBoolean(env.EKAZA_AUTOMATIC_REVOCATION_ENABLED),
    allowedDeviceIds: new Set((env.EKAZA_ALLOWED_DEVICE_IDS || "").split(",").map((id) => id.trim()).filter(Boolean)),
    adminApiKey: (env.EKAZA_ADMIN_API_KEY || "").trim(),
  };
}

export function isTuyaConfigured(config) {
  return Boolean(config.clientId && config.clientSecret && config.baseUrl);
}
