import { isTuyaConfigured } from "./config.js";
import { sanitizedErrorCode, TuyaError } from "./tuya-errors.js";
import { mapTuyaDevice } from "./tuya-device-mapper.js";

export class EkazaProvider {
  constructor(config, client) { this.config = config; this.client = client; }

  async health() {
    const checkedAt = new Date().toISOString();
    if (!isTuyaConfigured(this.config)) return { configured: false, connected: false, provider: "ekaza", checkedAt, sanitizedErrorCode: "not_configured" };
    if (this.config.mode !== "real" || !this.config.realEnabled) return { configured: true, connected: false, provider: "ekaza", checkedAt, sanitizedErrorCode: "real_mode_disabled" };
    const startedAt = Date.now();
    try { await this.client.getAccessToken(); return { configured: true, connected: true, provider: "ekaza", latency: Date.now() - startedAt, checkedAt }; }
    catch (error) { return { configured: true, connected: false, provider: "ekaza", checkedAt, sanitizedErrorCode: sanitizedErrorCode(error) }; }
  }

  async listDevices(context = {}) {
    if (this.config.mode !== "real" || !this.config.realEnabled || !this.config.deviceReadEnabled) throw new TuyaError("device_read_disabled", "A leitura de dispositivos Ekaza está desabilitada.");
    const pageSize = 20;
    const devices = [];
    let lastId = null;
    do {
      const query = new URLSearchParams({ page_size: String(pageSize) });
      if (lastId) query.set("last_id", lastId);
      const response = await this.client.request("GET", `/v2.0/cloud/thing/device?${query}`);
      const page = Array.isArray(response.result) ? response.result : [];
      devices.push(...page);
      const nextLastId = page.at(-1)?.id;
      if (page.length < pageSize || !nextLastId || nextLastId === lastId) break;
      lastId = nextLastId;
    } while (true);
    return devices.map((device) => mapTuyaDevice(device, { ...context, allowedDeviceIds: this.config.allowedDeviceIds }));
  }

  async getDeviceStatus(providerDeviceId) {
    if (this.config.mode !== "real" || !this.config.realEnabled || !this.config.deviceReadEnabled) throw new TuyaError("device_read_disabled", "A leitura de dispositivos Ekaza está desabilitada.");
    if (!this.config.allowedDeviceIds.has(providerDeviceId)) throw new TuyaError("device_not_allowed", "O dispositivo não está autorizado para leitura.");
    const response = await this.client.request("GET", `/v1.0/devices/${encodeURIComponent(providerDeviceId)}/status`);
    return Array.isArray(response.result) ? response.result.map(({ code, value }) => ({ code, value })) : [];
  }
}
