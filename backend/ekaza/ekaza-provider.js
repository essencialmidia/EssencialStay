import { isTuyaConfigured } from "./config.js";
import { sanitizedErrorCode, TuyaError } from "./tuya-errors.js";
import { mapTuyaDevice } from "./tuya-device-mapper.js";

const statusLabels = { battery_percentage: "Bateria", residual_electricity: "Bateria", unlock_method: "Método de abertura", closed_opened: "Estado da porta", lock_motor_state: "Estado da fechadura", hijack: "Alerta de coação", alarm_lock: "Alarme", doorbell: "Campainha" };
const readEnabled = (config) => config.mode === "real" && config.realEnabled && config.deviceReadEnabled;
const available = (value) => value !== undefined && value !== null && value !== "";

function readError(config, providerDeviceId) {
  if (!readEnabled(config)) throw new TuyaError("device_read_disabled", "A leitura de dispositivos Ekaza está desabilitada.");
  if (!config.allowedDeviceIds.has(providerDeviceId)) throw new TuyaError("device_not_allowed", "O dispositivo não está autorizado para leitura.");
}

function sanitizeDevice(raw) {
  const mapped = mapTuyaDevice(raw);
  const result = { id: raw.id, name: raw.name || raw.custom_name, type: mapped.type, category: raw.category, productName: raw.product_name ?? raw.productName, productId: raw.product_id ?? raw.productId, model: raw.model, online: mapped.online, subDevice: raw.sub };
  const optional = { gatewayId: raw.gateway_id ?? raw.gatewayId ?? raw.parent_id ?? raw.parentId, timeZone: raw.time_zone ?? raw.timeZone, createTime: raw.create_time ?? raw.createTime, updateTime: raw.update_time ?? raw.updateTime, activeTime: raw.active_time ?? raw.activeTime };
  for (const [key, value] of Object.entries(optional)) if (available(value)) result[key] = value;
  return Object.fromEntries(Object.entries(result).filter(([key, value]) => key === "online" || available(value)));
}

function normalizeSpecification(items, writable, readable) {
  return (Array.isArray(items) ? items : []).map((item) => ({ code: item.code, type: item.type, values: item.values, description: item.desc ?? item.description ?? item.name, writable: item.writable ?? writable, readable: item.readable ?? readable })).filter((item) => item.code);
}

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
    if (!readEnabled(this.config)) throw new TuyaError("device_read_disabled", "A leitura de dispositivos Ekaza está desabilitada.");
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
    readError(this.config, providerDeviceId);
    const details = await this.getDeviceDetails(providerDeviceId);
    const response = await this.client.request("GET", `/v1.0/devices/${encodeURIComponent(providerDeviceId)}/status`);
    const status = Array.isArray(response.result) ? response.result.map(({ code, value }) => ({ code, value, ...(statusLabels[code] ? { label: statusLabels[code] } : {}) })) : [];
    return { deviceId: providerDeviceId, online: details.online, type: details.type, status, checkedAt: new Date().toISOString() };
  }

  async getDeviceDetails(providerDeviceId) {
    readError(this.config, providerDeviceId);
    const response = await this.client.request("GET", `/v2.0/cloud/thing/${encodeURIComponent(providerDeviceId)}`);
    return sanitizeDevice(response.result || {});
  }

  async getDeviceSpecifications(providerDeviceId) {
    readError(this.config, providerDeviceId);
    const response = await this.client.request("GET", `/v1.1/iot-03/devices/${encodeURIComponent(providerDeviceId)}/specification`);
    return { deviceId: providerDeviceId, functions: normalizeSpecification(response.result?.functions, true, false), status: normalizeSpecification(response.result?.status, false, true) };
  }
}
