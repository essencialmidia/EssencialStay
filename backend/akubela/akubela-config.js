const asBoolean = (value) => String(value).toLowerCase() === "true";

export function loadAkubelaConfig(env = process.env) {
  return {
    enabled: asBoolean(env.AKUBELA_ENABLED),
    deviceReadEnabled: asBoolean(env.AKUBELA_DEVICE_READ_ENABLED),
    commandsEnabled: asBoolean(env.AKUBELA_COMMANDS_ENABLED),
    baseUrl: (env.AKUBELA_BASE_URL || "").trim().replace(/\/+$/, ""),
    clientId: (env.AKUBELA_CLIENT_ID || "").trim(),
    clientSecret: (env.AKUBELA_CLIENT_SECRET || "").trim(),
    username: (env.AKUBELA_USERNAME || "").trim(),
    password: (env.AKUBELA_PASSWORD || "").trim(),
    projectId: (env.AKUBELA_PROJECT_ID || "").trim(),
    adminApiKey: (env.AKUBELA_ADMIN_API_KEY || "").trim(),
    allowedDeviceIds: new Set((env.AKUBELA_ALLOWED_DEVICE_IDS || "").split(",").map((id) => id.trim()).filter(Boolean)),
    timeoutMs: Math.max(1000, Number(env.AKUBELA_REQUEST_TIMEOUT_MS) || 10000),
  };
}

export function isAkubelaConfigured(config) {
  return Boolean(config.baseUrl && config.clientId && config.clientSecret && config.username && config.password);
}
