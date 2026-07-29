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
    if (!this.config.uid) throw new TuyaError("device_context_missing", "A integração Ekaza não possui um contexto de dispositivos configurado.");
    const response = await this.client.request("GET", `/v1.0/users/${this.config.uid}/devices`);
    const devices = Array.isArray(response.result) ? response.result : [];
    return devices.map((device) => mapTuyaDevice(device, { ...context, allowedDeviceIds: this.config.allowedDeviceIds }));
  }

  async getDeviceStatus(providerDeviceId) {
    if (this.config.mode !== "real" || !this.config.realEnabled || !this.config.deviceReadEnabled) throw new TuyaError("device_read_disabled", "A leitura de dispositivos Ekaza está desabilitada.");
    if (!this.config.allowedDeviceIds.has(providerDeviceId)) throw new TuyaError("device_not_allowed", "O dispositivo não está autorizado para leitura.");
    const response = await this.client.request("GET", `/v1.0/devices/${encodeURIComponent(providerDeviceId)}/status`);
    return Array.isArray(response.result) ? response.result.map(({ code, value }) => ({ code, value })) : [];
  }
}
