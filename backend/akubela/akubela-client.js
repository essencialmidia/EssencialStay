import { randomUUID } from "node:crypto";
import { passwordGrantBody, refreshGrantBody, TOKEN_ENDPOINT } from "./akubela-auth.js";
import { AkubelaError } from "./akubela-errors.js";

const MANAGER_ENDPOINT = "/api/v1.0/invoke/open-ability/method/manager-commands";
const READ_COMMANDS = new Set(["get_project_list", "get_device_list", "get_device_info"]);

export class AkubelaClient {
  #accessToken = "";
  #refreshToken = "";
  #expiresAt = 0;

  constructor(config, { fetchImpl = fetch, now = () => Date.now() } = {}) {
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.now = now;
  }

  async authenticate(force = false) {
    if (!force && this.#accessToken && this.now() < this.#expiresAt) return this.#accessToken;
    const body = this.#refreshToken ? refreshGrantBody(this.config, this.#refreshToken) : passwordGrantBody(this.config);
    try {
      return await this.#requestToken(body);
    } catch (error) {
      if (!this.#refreshToken) throw error;
      this.#refreshToken = "";
      return this.#requestToken(passwordGrantBody(this.config));
    }
  }

  async read(command, param = {}) {
    if (!READ_COMMANDS.has(command)) throw new AkubelaError("unsupported_operation", "A operação não é permitida pelo cliente somente leitura.");
    return this.#managerRequest(command, param, false);
  }

  async #managerRequest(command, param, retried) {
    const token = await this.authenticate();
    try {
      const payload = await this.#fetchJson(MANAGER_ENDPOINT, {
        method: "POST",
        headers: { accept: "application/json", authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ command, id: randomUUID(), param }),
      });
      return payload.data ?? payload.result ?? payload;
    } catch (error) {
      if (!retried && error instanceof AkubelaError && error.details.status === 401) {
        await this.authenticate(true);
        return this.#managerRequest(command, param, true);
      }
      throw error;
    }
  }

  async #requestToken(body) {
    const payload = await this.#fetchJson(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const token = payload.access_token ?? payload.data?.access_token;
    if (!token) throw new AkubelaError("authentication_error", "A Akubela não retornou um token válido.", { endpoint: TOKEN_ENDPOINT });
    this.#accessToken = token;
    this.#refreshToken = payload.refresh_token ?? payload.data?.refresh_token ?? "";
    const expiresIn = Number(payload.expires_in ?? payload.data?.expires_in ?? 3600);
    this.#expiresAt = this.now() + Math.max(0, expiresIn - 60) * 1000;
    return token;
  }

  async #fetchJson(endpoint, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${endpoint}`, { ...init, signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      const providerCode = payload.code ?? payload.error ?? null;
      const providerMessage = payload.message ?? payload.msg ?? payload.error_description ?? null;
      if (!response.ok || payload.success === false) {
        throw new AkubelaError(response.status === 401 ? "authentication_error" : "provider_error", "A Akubela recusou a leitura.", {
          endpoint, status: response.status, providerCode, providerMessage,
        });
      }
      return payload;
    } catch (error) {
      if (error instanceof AkubelaError) throw error;
      if (error?.name === "AbortError") throw new AkubelaError("timeout", "A Akubela excedeu o tempo limite.", { endpoint, status: null }, error);
      throw new AkubelaError("provider_unavailable", "Não foi possível contactar a Akubela.", { endpoint, status: null }, error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
