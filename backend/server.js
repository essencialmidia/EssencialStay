import { createServer } from "node:http";
import { loadEkazaConfig } from "./ekaza/config.js";
import { TuyaClient } from "./ekaza/tuya-client.js";
import { EkazaProvider } from "./ekaza/ekaza-provider.js";
import { sanitizedErrorCode } from "./ekaza/tuya-errors.js";

const config = loadEkazaConfig();
const provider = new EkazaProvider(config, new TuyaClient(config));
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

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) response.setHeader("access-control-allow-origin", origin);
  response.setHeader("vary", "Origin");
  if (request.method === "OPTIONS") { response.writeHead(204, { "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "x-ekaza-admin-key" }); return response.end(); }
  if (request.method !== "GET") return sendJson(response, 405, { errorCode: "method_not_allowed" });
  if (isRateLimited(request)) return sendJson(response, 429, { errorCode: "rate_limited" });
  try {
    if (request.url === "/api/v1/integrations/ekaza/health") return sendJson(response, 200, await provider.health());
    if (request.url === "/api/v1/integrations/ekaza/devices") {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      return sendJson(response, 200, { provider: "ekaza", devices: await provider.listDevices() });
    }
    const statusMatch = /^\/api\/v1\/integrations\/ekaza\/devices\/([^/]+)\/status$/.exec(request.url || "");
    if (statusMatch) {
      if (!isAdminAuthorized(request)) return sendJson(response, 401, { errorCode: "unauthorized" });
      return sendJson(response, 200, { provider: "ekaza", providerDeviceId: decodeURIComponent(statusMatch[1]), status: await provider.getDeviceStatus(decodeURIComponent(statusMatch[1])) });
    }
    return sendJson(response, 404, { errorCode: "not_found" });
  } catch (error) { return sendJson(response, 503, { errorCode: sanitizedErrorCode(error) }); }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, "0.0.0.0", () => console.info(`Essencial Stay backend listening on ${port}`));
