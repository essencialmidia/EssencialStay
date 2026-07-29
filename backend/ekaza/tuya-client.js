import { createTuyaSignature } from "./tuya-auth.js";
import { TuyaError } from "./tuya-errors.js";

export class TuyaClient {
  #token = null;
  #expiresAt = 0;

  constructor(config, { fetchImpl = fetch, now = () => Date.now() } = {}) {
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.now = now;
  }

  async getAccessToken() {
    if (this.#token && this.now() < this.#expiresAt) return this.#token;
    const response = await this.#requestWithoutToken("GET", "/v1.0/token?grant_type=1");
    const token = response?.result?.access_token;
    const expiresInSeconds = Number(response?.result?.expire_time);
    if (!token || !Number.isFinite(expiresInSeconds)) throw new TuyaError("authentication_failed", "A Tuya não retornou um token válido.");
    this.#token = token;
    this.#expiresAt = this.now() + Math.max(0, expiresInSeconds - 60) * 1000;
    return token;
  }

  async request(method, path, body) {
    const token = await this.getAccessToken();
    return this.#request(method, path, body, token);
  }

  async #requestWithoutToken(method, path, body) { return this.#request(method, path, body, ""); }

  async #request(method, path, body, accessToken) {
    const bodyText = body === undefined ? "" : JSON.stringify(body);
    const timestamp = String(this.now());
    const sign = createTuyaSignature({ clientId: this.config.clientId, clientSecret: this.config.clientSecret, method, path, body: bodyText, timestamp, accessToken });
    const headers = { client_id: this.config.clientId, sign, t: timestamp, sign_method: "HMAC-SHA256" };
    if (accessToken) headers.access_token = accessToken;
    if (body !== undefined) headers["content-type"] = "application/json";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const url = `${this.config.baseUrl}${path}`;
      const response = await this.fetchImpl(url, { method, headers, body: body === undefined ? undefined : bodyText, signal: controller.signal });
      const errorPayload = await response.clone().json().catch(() => null);
      const details = { endpoint: path, status: response.status, tuyaCode: errorPayload?.code ?? null, tuyaMessage: errorPayload?.msg ?? errorPayload?.message ?? null };
      if (!response.ok) throw new TuyaError("provider_http_error", "A Tuya recusou a solicitação.", undefined, details);
      const payload = await response.json();
      if (!payload?.success) throw new TuyaError("provider_rejected", "A Tuya não concluiu a solicitação.", undefined, { ...details, tuyaCode: payload?.code ?? null, tuyaMessage: payload?.msg ?? payload?.message ?? null });
      return payload;
    } catch (error) {
      if (error instanceof TuyaError) throw error;
      if (error?.name === "AbortError") throw new TuyaError("timeout", "A Tuya excedeu o tempo limite.", error, { endpoint: path, status: null, tuyaCode: null, tuyaMessage: error.message });
      throw new TuyaError("provider_unavailable", "Não foi possível contactar a Tuya.", error, { endpoint: path, status: null, tuyaCode: null, tuyaMessage: error instanceof Error ? error.message : null });
    } finally { clearTimeout(timeout); }
  }
}
