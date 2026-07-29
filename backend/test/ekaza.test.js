import test from "node:test";
import assert from "node:assert/strict";
import { createTuyaSignature } from "../ekaza/tuya-auth.js";
import { TuyaClient } from "../ekaza/tuya-client.js";
import { EkazaProvider } from "../ekaza/ekaza-provider.js";
import { mapTuyaDevice } from "../ekaza/tuya-device-mapper.js";

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
