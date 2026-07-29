import { createServer } from "node:http";
import { loadEkazaConfig } from "./ekaza/config.js";
import { TuyaClient } from "./ekaza/tuya-client.js";
import { EkazaProvider } from "./ekaza/ekaza-provider.js";
import { sanitizedErrorCode } from "./ekaza/tuya-errors.js";
import { loadAkubelaConfig } from "./akubela/akubela-config.js";
import { AkubelaClient } from "./akubela/akubela-client.js";
import { AkubelaProvider } from "./akubela/akubela-provider.js";
import { AkubelaError, akubelaErrorCode } from "./akubela/akubela-errors.js";

const config = loadEkazaConfig();
const provider = new EkazaProvider(config, new TuyaClient(config));
const akubelaConfig = loadAkubelaConfig();
const akubelaProvider = new AkubelaProvider(akubelaConfig, new AkubelaClient(akubelaConfig));
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean));
const requests = new Map();

function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}

function isRateLimited(request) {
  const key = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - 60_000;
  const history = (requests.get(key) || []).filter((timestamp) => timestamp > windowStart);
  history.push(now);
  requests.set(key, history);
  return history.length > 30;
}

function isAdminAuthorized(request) {
  return Boolean(config.adminApiKey) && request.headers["x-ekaza-admin-key"] === config.adminApiKey;
}

function isAkubelaAdminAuthorized(request) {
  return Boolean(akubelaConfig.adminApiKey) && request.headers["x-akubela-admin-key"] === akubelaConfig.adminApiKey;
}

function logAkubelaFailure(operation, identifiers, error) {
  const details = error instanceof AkubelaError ? error.details : {};
  console.error("[Akubela read] request_failed", JSON.stringify({
    provider: "akubela",
    source: details.source ?? "akubela",
    operation,
    method: details.endpoint ? "POST" : "GET",
    endpoint: details.endpoint ?? undefined,
    status: details.status ?? undefined,
    code: details.providerCode ?? akubelaErrorCode(error),
    message: details.providerMessage ?? (error instanceof Error ? error.message : "unknown_error"),
    ...identifiers,
  }));
}

async function sendAkubela(response, operation, identifiers, action) {
  try {
    return sendJson(response, 200, await action());
  } catch (error) {
    logAkubelaFailure(operation, identifiers, error);
    const code = akubelaErrorCode(error);
    const status = code === "device_not_allowed" ? 403 : code === "configuration_error" || code === "device_read_disabled" ? 409 : 503;
    return sendJson(response, status, {
      errorCode: code,
      message: error instanceof AkubelaError ? error.message : "Não foi possível concluir a leitura Akubela.",
      source: error instanceof AkubelaError && error.details.source === "essencial_stay" ? "essencial_stay" : "akubela",
    });
  }
}

function logReadFailure(providerDeviceId, error) {
  console.error("[Ekaza read] request_failed", JSON.stringify({ method: "GET", endpoint: error?.details?.endpoint ?? null, status: error?.details?.status ?? null, code: error?.details?.tuyaCode ?? sanitizedErrorCode(error), msg: error?.details?.tuyaMessage ?? (error instanceof Error ? error.message : "unknown_error"), deviceId: providerDeviceId }));
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) response.setHeader("access-control-allow-origin", origin);
  response.setHeader("vary", "Origin");
  if (request.method === "OPTIONS") { response.writeHead(204, { "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "x-ekaza-admin-key, x-akubela-admin-key" }); return response.end(); }
  if (request.method !== "GET") return sendJson(response, 405, { errorCode: "method_not_allowed" });
  if (isRateLimited(request)) return sendJson(response, 429, { errorCode: "rate_limited" });
  try {
    if (request.url === "/api/v1/integrations/akubela/health") return sendJson(response, 200, await akubelaProvider.health());
    if (request.url === "/api/v1/integrations/akubela/locations") {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      return sendAkubela(response, "listLocations", {}, () => akubelaProvider.listLocations());
    }
    const spacesMatch = /^\/api\/v1\/integrations\/akubela\/locations\/([^/]+)\/spaces$/.exec(request.url || "");
    if (spacesMatch) {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const locationId = decodeURIComponent(spacesMatch[1]);
      return sendAkubela(response, "listSpaces", { locationId }, () => akubelaProvider.listSpaces(locationId));
    }
    if ((request.url || "").startsWith("/api/v1/integrations/akubela/devices?") || request.url === "/api/v1/integrations/akubela/devices") {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const locationId = new URL(request.url, "http://localhost").searchParams.get("locationId") || undefined;
      return sendAkubela(response, "listDevices", { locationId }, async () => ({ provider: "akubela", devices: await akubelaProvider.listDevices({ locationId }) }));
    }
    const akubelaStatusMatch = /^\/api\/v1\/integrations\/akubela\/devices\/([^/]+)\/status$/.exec(request.url || "");
    if (akubelaStatusMatch) {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(akubelaStatusMatch[1]);
      return sendAkubela(response, "getStatus", { providerDeviceId }, () => akubelaProvider.getStatus(providerDeviceId));
    }
    const capabilitiesMatch = /^\/api\/v1\/integrations\/akubela\/devices\/([^/]+)\/capabilities$/.exec(request.url || "");
    if (capabilitiesMatch) {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(capabilitiesMatch[1]);
      return sendAkubela(response, "getCapabilities", { providerDeviceId }, () => akubelaProvider.getCapabilities(providerDeviceId));
    }
    const akubelaDetailMatch = /^\/api\/v1\/integrations\/akubela\/devices\/([^/]+)$/.exec(request.url || "");
    if (akubelaDetailMatch) {
      if (!isAkubelaAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(akubelaDetailMatch[1]);
      return sendAkubela(response, "getDevice", { providerDeviceId }, () => akubelaProvider.getDevice(providerDeviceId));
    }
    if (request.url === "/api/v1/integrations/ekaza/health") return sendJson(response, 200, await provider.health());
    if (request.url === "/api/v1/integrations/ekaza/devices") {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      try {
        return sendJson(response, 200, { provider: "ekaza", devices: await provider.listDevices() });
      } catch (error) {
        logReadFailure(null, error);
        throw error;
      }
    }
    const detailMatch = /^\/api\/v1\/integrations\/ekaza\/devices\/([^/]+)$/.exec(request.url || "");
    if (detailMatch) {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(detailMatch[1]);
      try { return sendJson(response, 200, await provider.getDeviceDetails(providerDeviceId)); }
      catch (error) { logReadFailure(providerDeviceId, error); throw error; }
    }
    const statusMatch = /^\/api\/v1\/integrations\/ekaza\/devices\/([^/]+)\/status$/.exec(request.url || "");
    if (statusMatch) {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(statusMatch[1]);
      try { return sendJson(response, 200, await provider.getDeviceStatus(providerDeviceId)); }
      catch (error) { logReadFailure(providerDeviceId, error); throw error; }
    }
    const specificationsMatch = /^\/api\/v1\/integrations\/ekaza\/devices\/([^/]+)\/specifications$/.exec(request.url || "");
    if (specificationsMatch) {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      const providerDeviceId = decodeURIComponent(specificationsMatch[1]);
      try { return sendJson(response, 200, await provider.getDeviceSpecifications(providerDeviceId)); }
      catch (error) { logReadFailure(providerDeviceId, error); throw error; }
    }
    return sendJson(response, 404, { errorCode: "not_found" });
  } catch (error) { return sendJson(response, 503, { errorCode: sanitizedErrorCode(error) }); }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, "0.0.0.0", () => console.info(`Essencial Stay backend listening on ${port}`));
