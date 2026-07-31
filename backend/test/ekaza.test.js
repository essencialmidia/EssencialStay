import test from "node:test";
import assert from "node:assert/strict";
import { createTuyaSignature } from "../ekaza/tuya-auth.js";
import { TuyaClient } from "../ekaza/tuya-client.js";
import { EkazaProvider } from "../ekaza/ekaza-provider.js";
import { classifyTuyaDevice, mapTuyaDevice } from "../ekaza/tuya-device-mapper.js";

const config = { baseUrl: "https://tuya.example", clientId: "client", clientSecret: "01234567890123456789012345678901", timeoutMs: 1000, mode: "real", realEnabled: true, deviceReadEnabled: true, allowedDeviceIds: new Set(["device-1"]), uid: "user-1" };

test("assina a requisição Tuya em HMAC-SHA256", () => {
  const sign = createTuyaSignature({ clientId: "client", clientSecret: config.clientSecret, method: "GET", path: "/v1.0/token?grant_type=1", timestamp: "123" });
  assert.match(sign, /^[A-F0-9]{64}$/);
});

test("reutiliza token em cache", async () => {
  let calls = 0;
  const client = new TuyaClient(config, { now: () => 1_000, fetchImpl: async () => { calls += 1; return new Response(JSON.stringify({ success: true, result: { access_token: "token", expire_time: 3600 } }), { status: 200 }); } });
  assert.equal(await client.getAccessToken(), "token");
  assert.equal(await client.getAccessToken(), "token");
  assert.equal(calls, 1);
});

test("mapeia dispositivo e não o habilita fora da allowlist", () => {
  const device = mapTuyaDevice({ id: "device-2", name: "Luz", category: "light", online: true, functions: [{ code: "switch_led" }] }, config);
  assert.equal(device.type, "light");
  assert.equal(device.enabled, false);
  assert.equal(device.guestControllable, false);
});

test("ausência de conectividade permanece não confirmada, sem virar offline", () => {
  const device = mapTuyaDevice({ id: "device-1", name: "Interruptor touch", category: "kg" }, config);
  assert.equal(device.online, null);
});

test("classifica a fechadura T429Z e categorias comuns", () => {
  assert.equal(classifyTuyaDevice({ name: "EKAZA Fechadura Digital Zigbee T429Z", category: "ms" }), "smart_lock");
  assert.equal(classifyTuyaDevice({ category: "cz" }), "socket");
  assert.equal(classifyTuyaDevice({ category: "kg" }), "switch");
  assert.equal(classifyTuyaDevice({ category: "wg2" }), "gateway");
  assert.equal(classifyTuyaDevice({ category: "desconhecida" }), "other");
});

test("lista dispositivos do projeto em páginas sem exigir UID ou space ID", async () => {
  const paths = [];
  const firstPage = Array.from({ length: 20 }, (_, index) => ({ id: `device-${index + 1}`, name: `Dispositivo ${index + 1}`, category: "light", isOnline: true }));
  const provider = new EkazaProvider({ ...config, uid: "", spaceId: "" }, {
    request: async (_method, path) => {
      paths.push(path);
      return { result: path.includes("last_id=device-20") ? [{ id: "device-21", name: "Dispositivo 21", category: "light", isOnline: false }] : firstPage };
    },
  });
  const devices = await provider.listDevices();
  assert.deepEqual(paths, ["/v2.0/cloud/thing/device?page_size=20", "/v2.0/cloud/thing/device?page_size=20&last_id=device-20"]);
  assert.equal(devices.length, 21);
  assert.equal(devices[0].online, true);
  assert.equal(devices[20].online, false);
  assert.equal(devices[0].enabled, true);
});

test("modo real desligado não chama a Tuya no health check", async () => {
  const disabled = { ...config, realEnabled: false };
  const provider = new EkazaProvider(disabled, { getAccessToken: async () => { throw new Error("não deve chamar"); } });
  const health = await provider.health();
  assert.equal(health.connected, false);
  assert.equal(health.sanitizedErrorCode, "real_mode_disabled");
});

test("nega status de dispositivo fora da allowlist", async () => {
  const provider = new EkazaProvider(config, { request: async () => { throw new Error("não deve chamar"); } });
  await assert.rejects(() => provider.getDeviceStatus("device-2"), { code: "device_not_allowed" });
});

test("retorna detalhes, status e specifications sanitizados apenas por GET", async () => {
  const calls = [];
  const provider = new EkazaProvider(config, {
    request: async (method, path) => {
      calls.push({ method, path });
      if (path.endsWith("/status")) return { result: [{ code: "battery_percentage", value: 82 }, { code: "unknown", value: true }] };
      if (path.endsWith("/specification")) return { result: { functions: [{ code: "unlock", type: "Boolean", values: "{}", desc: "Unlock" }], status: [{ code: "closed_opened", type: "Enum", values: "{}" }] } };
      return { result: { id: "device-1", name: "EKAZA Fechadura Digital Zigbee T429Z", category: "ms", is_online: true, product_id: "product-1", local_key: "never-returned" } };
    },
  });
  const details = await provider.getDeviceDetails("device-1");
  const status = await provider.getDeviceStatus("device-1");
  const specifications = await provider.getDeviceSpecifications("device-1");
  assert.equal(details.type, "smart_lock");
  assert.equal("localKey" in details, false);
  assert.equal(status.status[0].label, "Bateria");
  assert.equal(status.status[1].value, true);
  assert.equal(specifications.functions[0].writable, true);
  assert.equal(specifications.status[0].readable, true);
  assert.ok(calls.every((call) => call.method === "GET"));
});
