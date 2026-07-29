import { unsupported } from "../automation/provider-contract.js";
import { getAkubelaConfigurationIssue, isAkubelaConfigured } from "./akubela-config.js";
import { AkubelaError, akubelaErrorCode } from "./akubela-errors.js";
import { mapAkubelaCapabilities } from "./akubela-capability-mapper.js";
import { mapAkubelaDevice } from "./akubela-device-mapper.js";
import { mapAkubelaStatus } from "./akubela-status-mapper.js";

const PAGE_SIZE = 100;

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["list", "records", "items", "data"]) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function ensureRead(config) {
  if (!config.enabled || !config.deviceReadEnabled) throw new AkubelaError("device_read_disabled", "A leitura Akubela está desabilitada.");
  const issue = getAkubelaConfigurationIssue(config);
  if (issue) throw new AkubelaError(issue.code, issue.message, { source: "essencial_stay" });
}

function ensureAllowed(config, providerDeviceId) {
  ensureRead(config);
  if (!providerDeviceId || !config.allowedDeviceIds.has(providerDeviceId)) {
    throw new AkubelaError("device_not_allowed", "O dispositivo não está autorizado para diagnóstico.", { source: "essencial_stay", providerDeviceId });
  }
}

export class AkubelaProvider {
  constructor(config, client) {
    this.config = config;
    this.client = client;
  }

  async health() {
    const checkedAt = new Date().toISOString();
    const base = { provider: "akubela", checkedAt, configured: isAkubelaConfigured(this.config), authenticated: false, connected: false, capabilities: { locations: true, spaces: false, devices: true, status: true, capabilities: true } };
    if (!base.configured) return { ...base, errorCode: "configuration_error" };
    if (!this.config.enabled) return { ...base, errorCode: "integration_disabled" };
    const startedAt = Date.now();
    try {
      await this.client.authenticate();
      return { ...base, authenticated: true, connected: true, latency: Date.now() - startedAt };
    } catch (error) {
      return { ...base, errorCode: akubelaErrorCode(error) };
    }
  }

  async listLocations() {
    ensureRead(this.config);
    const locations = [];
    for (let pageIndex = 1; ; pageIndex += 1) {
      const payload = await this.client.read("get_project_list", { page_size: PAGE_SIZE, page_index: pageIndex });
      const page = extractList(payload);
      locations.push(...page.map((item) => ({ id: String(item.project_id), name: item.project_name ?? "Projeto Akubela", providerType: "project" })));
      if (page.length < PAGE_SIZE) break;
    }
    return { supported: true, locations };
  }

  async listSpaces() {
    ensureRead(this.config);
    return unsupported("space_endpoint_not_confirmed");
  }

  async listDevices({ locationId } = {}) {
    ensureRead(this.config);
    const projectId = locationId || this.config.projectId;
    if (!projectId) throw new AkubelaError("configuration_error", "Informe AKUBELA_PROJECT_ID ou locationId.");
    const devices = [];
    for (let pageIndex = 1; ; pageIndex += 1) {
      const payload = await this.client.read("get_device_list", { project_id: projectId, page_size: PAGE_SIZE, page_index: pageIndex });
      const page = extractList(payload);
      devices.push(...page.map((item) => mapAkubelaDevice(item, { allowedDeviceIds: this.config.allowedDeviceIds, locationId: projectId })));
      if (page.length < PAGE_SIZE) break;
    }
    return devices;
  }

  async getDevice(providerDeviceId) {
    ensureAllowed(this.config, providerDeviceId);
    const raw = await this.#getDeviceInfo(providerDeviceId);
    return mapAkubelaDevice(raw, { allowedDeviceIds: this.config.allowedDeviceIds, locationId: this.config.projectId });
  }

  async getStatus(providerDeviceId) {
    ensureAllowed(this.config, providerDeviceId);
    return mapAkubelaStatus(await this.#getDeviceInfo(providerDeviceId));
  }

  async getCapabilities(providerDeviceId) {
    ensureAllowed(this.config, providerDeviceId);
    return mapAkubelaCapabilities(await this.#getDeviceInfo(providerDeviceId));
  }

  async #getDeviceInfo(providerDeviceId) {
    const payload = await this.client.read("get_device_info", { project_id: this.config.projectId, device_id: providerDeviceId });
    return payload.data ?? payload.result ?? payload;
  }
}
