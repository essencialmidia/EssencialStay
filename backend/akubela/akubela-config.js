const asBoolean = (value) => String(value).toLowerCase() === "true";

const sanitizeDeviceId = (value) => String(value ?? "").trim().replace(/[\u0000-\u001F\u007F]/g, "");

export function parseAkubelaAllowedDeviceIds(value) {
  return new Set(String(value ?? "").split(",").map(sanitizeDeviceId).filter((id) => id.length > 0 && id.length <= 200));
}

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
    allowedDeviceIds: parseAkubelaAllowedDeviceIds(env.AKUBELA_ALLOWED_DEVICE_IDS),
    timeoutMs: Math.max(1000, Number(env.AKUBELA_REQUEST_TIMEOUT_MS) || 10000),
  };
}

export function isAkubelaConfigured(config) {
  return Boolean(config.baseUrl && config.clientId && config.clientSecret && config.username && config.password);
}

export function getAkubelaConfigurationIssue(config) {
  if (isAkubelaConfigured(config)) return null;
  return { code: "configuration_error", message: "A configuração Akubela necessária para esta operação está incompleta." };
}
