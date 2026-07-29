import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getAkubelaConfigurationIssue, loadAkubelaConfig, isAkubelaConfigured, parseAkubelaAllowedDeviceIds } from "../akubela/akubela-config.js";
import { AkubelaClient } from "../akubela/akubela-client.js";
import { AkubelaProvider } from "../akubela/akubela-provider.js";
import { mapAkubelaDevice } from "../akubela/akubela-device-mapper.js";

const config = {
  enabled: true, deviceReadEnabled: true, commandsEnabled: false,
  baseUrl: "https://api.example.akubela.com", clientId: "client", clientSecret: "secret",
  username: "manager", password: "password", projectId: "project-1", adminApiKey: "admin",
  allowedDeviceIds: new Set(["device-1"]), timeoutMs: 1000,
};

test("configuração centralizada mantém flags seguras e detecta campos ausentes", () => {
  const empty = loadAkubelaConfig({});
  assert.equal(empty.enabled, false);
  assert.equal(empty.deviceReadEnabled, false);
  assert.equal(empty.commandsEnabled, false);
  assert.equal(isAkubelaConfigured(empty), false);
  assert.equal(isAkubelaConfigured(config), true);
  assert.deepEqual(getAkubelaConfigurationIssue(empty), { code: "configuration_error", message: "A configuração Akubela necessária para esta operação está incompleta." });
  assert.equal(getAkubelaConfigurationIssue(config), null);
});

test("lista permitida é sanitizada sem registrar valores confidenciais", () => {
  const ids = parseAkubelaAllowedDeviceIds(" device-1,\n device-2\u0000, , device-1 ");
  assert.deepEqual([...ids], ["device-1", "device-2"]);
  const issue = getAkubelaConfigurationIssue(loadAkubelaConfig({ AKUBELA_CLIENT_SECRET: "private-secret", AKUBELA_PASSWORD: "private-password" }));
  assert.doesNotMatch(JSON.stringify(issue), /private-secret|private-password/);
});

test("servidor inicia sem credenciais Akubela quando a integração está desabilitada", async () => {
  const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const child = spawn(process.execPath, ["server.js"], { cwd: backendDirectory, env: { ...process.env, PORT: "0", AKUBELA_ENABLED: "false", AKUBELA_DEVICE_READ_ENABLED: "false", AKUBELA_CLIENT_SECRET: "", AKUBELA_PASSWORD: "" }, stdio: ["ignore", "pipe", "pipe"] });
  const output = await new Promise((resolveOutput, reject) => {
    const timeout = setTimeout(() => reject(new Error("server_start_timeout")), 3_000);
    child.stdout.once("data", (chunk) => { clearTimeout(timeout); resolveOutput(String(chunk)); });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`server_exited_${code}`)));
  });
  child.kill();
  assert.match(output, /Essencial Stay backend listening/);
});

test("Dockerfile copia o diretório Akubela com a mesma capitalização do import Linux", () => {
  const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dockerfile = readFileSync(resolve(backendDirectory, "Dockerfile"), "utf8");
  const server = readFileSync(resolve(backendDirectory, "server.js"), "utf8");
  assert.match(server, /"\.\/akubela\/akubela-config\.js"/);
  assert.match(server, /message: "akubela_request_failed"/);
  assert.match(dockerfile, /COPY --chown=node:node akubela \.\/akubela/);
  assert.match(dockerfile, /COPY --chown=node:node automation \.\/automation/);
});

test("autentica por password grant manager, guarda token e não o devolve nas respostas do provider", async () => {
  const requests = [];
  const client = new AkubelaClient(config, { now: () => 1_000, fetchImpl: async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ access_token: "private-token", refresh_token: "private-refresh", expires_in: 3600 }), { status: 200, headers: { "content-type": "application/json" } });
  } });
  assert.equal(await client.authenticate(), "private-token");
  assert.equal(await client.authenticate(), "private-token");
  assert.equal(requests.length, 1);
  assert.match(requests[0].init.body, /grant_type=password/);
  assert.match(requests[0].init.body, /scope=manager/);
});

test("falha de autenticação é classificada sem expor credenciais", async () => {
  const client = new AkubelaClient(config, { fetchImpl: async () => new Response(JSON.stringify({ error: "invalid_client", message: "denied" }), { status: 401 }) });
  await assert.rejects(() => client.authenticate(), (error) => error.code === "authentication_error" && !JSON.stringify(error.details).includes(config.clientSecret));
});

test("renova uma vez e repete a leitura depois de 401", async () => {
  let tokenCalls = 0;
  let managerCalls = 0;
  const client = new AkubelaClient(config, { fetchImpl: async (url) => {
    if (url.endsWith("/oauth2/token")) {
      tokenCalls += 1;
      return new Response(JSON.stringify({ access_token: `token-${tokenCalls}`, refresh_token: "refresh", expires_in: 3600 }), { status: 200 });
    }
    managerCalls += 1;
    return managerCalls === 1 ? new Response(JSON.stringify({ code: "expired" }), { status: 401 }) : new Response(JSON.stringify({ data: { list: [] } }), { status: 200 });
  } });
  await client.read("get_project_list", { page_size: 100, page_index: 1 });
  assert.equal(tokenCalls, 2);
  assert.equal(managerCalls, 2);
});

test("cliente recusa qualquer comando fora da allowlist somente leitura", async () => {
  const client = new AkubelaClient(config, { fetchImpl: async () => { throw new Error("não deve chamar"); } });
  await assert.rejects(() => client.read("open_relay", {}), { code: "unsupported_operation" });
  assert.equal(typeof client.write, "undefined");
});

test("health separa configuração, autenticação e conexão", async () => {
  const provider = new AkubelaProvider(config, { authenticate: async () => "token" });
  const health = await provider.health();
  assert.equal(health.configured, true);
  assert.equal(health.authenticated, true);
  assert.equal(health.connected, true);
  assert.equal(health.capabilities.spaces, false);
});

test("lista projetos paginados como localizações oficiais", async () => {
  const provider = new AkubelaProvider(config, { read: async (command) => {
    assert.equal(command, "get_project_list");
    return { list: [{ project_id: "project-1", project_name: "Residencial" }] };
  } });
  const result = await provider.listLocations();
  assert.deepEqual(result.locations[0], { id: "project-1", name: "Residencial", providerType: "project" });
});

test("espaços retornam unsupported em vez de exceção", async () => {
  const provider = new AkubelaProvider(config, {});
  assert.deepEqual(await provider.listSpaces("project-1"), { supported: false, reason: "space_endpoint_not_confirmed" });
});

test("mapeia painel e módulo por tipo retornado, sem nomes específicos", () => {
  assert.equal(mapAkubelaDevice({ device_id: "a", device_type: "Indoor Monitor" }).type, "control_panel");
  assert.equal(mapAkubelaDevice({ device_id: "b", device_type: "Relay Module" }).type, "relay_module");
  assert.equal(mapAkubelaDevice({ device_id: "c", device_type: "unknown" }).type, "other");
});

test("preserva múltiplos canais declarados sem deduzir estados", () => {
  const device = mapAkubelaDevice({ device_id: "device-1", relays: [{ relay_id: "r1", relay_name: "Luz" }, { relay_id: "r2", relay_name: "Tomada" }] }, { allowedDeviceIds: config.allowedDeviceIds });
  assert.equal(device.channels.length, 2);
  assert.equal(device.channels[0].state, null);
  assert.equal(device.enabled, true);
});

test("listagem mostra todos, mas detalhes, status e capacidades exigem allowlist", async () => {
  const provider = new AkubelaProvider(config, { read: async () => ({ list: [{ device_id: "device-2", device_name: "Painel", device_type: "Indoor Monitor", online: true }] }) });
  assert.equal((await provider.listDevices({ locationId: "project-1" }))[0].enabled, false);
  await assert.rejects(() => provider.getDevice("device-2"), { code: "device_not_allowed" });
  await assert.rejects(() => provider.getStatus("device-2"), { code: "device_not_allowed" });
  await assert.rejects(() => provider.getCapabilities("device-2"), { code: "device_not_allowed" });
});

test("detalhes são sanitizados e status/capacidades usam apenas leitura real", async () => {
  const raw = { device_id: "device-1", device_name: "Módulo", device_type: "Relay Module", online: true, mac: "sensitive", ip: "sensitive", relays: [{ relay_id: "1", relay_name: "Canal 1", enable: true }] };
  const calls = [];
  const provider = new AkubelaProvider(config, { read: async (command, param) => { calls.push({ command, param }); return raw; } });
  const details = await provider.getDevice("device-1");
  const status = await provider.getStatus("device-1");
  const capabilities = await provider.getCapabilities("device-1");
  assert.equal(details.technical.mac, undefined);
  assert.equal(details.technical.ip, undefined);
  assert.equal(status.online, true);
  assert.equal(capabilities.channels[0].writable, true);
  assert.ok(calls.every(({ command }) => command === "get_device_info"));
});

test("timeout é classificado sem vazar segredo", async () => {
  const client = new AkubelaClient({ ...config, timeoutMs: 1 }, { fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))) });
  await assert.rejects(() => client.authenticate(), (error) => error.code === "timeout" && !JSON.stringify(error).includes(config.clientSecret));
});
