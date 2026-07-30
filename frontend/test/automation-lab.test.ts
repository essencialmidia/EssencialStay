import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AUTOMATION_LAB_SCENARIOS,
  AUTOMATION_LAB_STORAGE_KEY,
  automationLabProviders,
  clearAutomationSessions,
  createAutomationSession,
  endAutomationSession,
  isAutomationSessionExpired,
  loadAutomationSessions,
  sanitizeLabLog,
  saveAutomationSessions,
} from "../src/automation-lab/automation-lab.ts";
import { EkazaScenarioProvider, maskProviderDeviceId } from "../src/automation-lab/ekaza-scenario.ts";
import { createCommercialValidation, decideHomologation, friendlyCapability } from "../src/automation-lab/commercial-validation.ts";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("Casa Mairiporã foi migrada para o Scenario 01 com provider Ekaza", () => {
  const scenario = AUTOMATION_LAB_SCENARIOS[0];
  assert.equal(scenario.id, "scenario-01-casa-mairipora");
  assert.equal(scenario.name, "Casa Mairiporã");
  assert.equal(scenario.providerId, "ekaza");
  assert.equal(scenario.environment, "laboratory");
  assert.equal(scenario.status, "active");
  assert.equal(scenario.certification, "in_validation");
  assert.equal(scenario.devices.length, 0);
});

test("sessões são temporárias, usam sessionStorage e nunca iniciam dispositivos em modo real", () => {
  const storage = new MemoryStorage();
  const session = createAutomationSession(AUTOMATION_LAB_SCENARIOS[0], new Date("2026-07-29T12:00:00Z"));

  assert.equal(session.status, "active");
  assert.ok(session.devices.every((device) => device.mode !== "real"));
  saveAutomationSessions(storage, [session]);
  assert.deepEqual(loadAutomationSessions(storage), [session]);
  assert.ok(storage.getItem(AUTOMATION_LAB_STORAGE_KEY));

  clearAutomationSessions(storage);
  assert.deepEqual(loadAutomationSessions(storage), []);
});

test("encerrar sessão desabilita todos os dispositivos", () => {
  const session = createAutomationSession(AUTOMATION_LAB_SCENARIOS[0], new Date("2026-07-29T12:00:00Z"));
  const ended = endAutomationSession(session, new Date("2026-07-29T12:30:00Z"));
  assert.equal(ended.status, "ended");
  assert.ok(ended.devices.every((device) => !device.enabled && device.mode === "disabled"));
});

test("sessão expirada bloqueia ações do cenário", () => {
  const session = createAutomationSession(AUTOMATION_LAB_SCENARIOS[0], new Date("2026-07-29T12:00:00Z"));
  assert.equal(isAutomationSessionExpired(session, new Date("2026-07-29T12:59:00Z")), false);
  assert.equal(isAutomationSessionExpired(session, new Date("2026-07-29T14:00:00Z")), true);
});

test("providers mantêm contratos e catálogos independentes", () => {
  const ekaza = automationLabProviders.get("ekaza");
  const akubela = automationLabProviders.get("provider-02");
  assert.ok(ekaza);
  assert.ok(akubela);
  assert.notEqual(ekaza, akubela);
  assert.equal(ekaza.listDevices(AUTOMATION_LAB_SCENARIOS[0]).length, 0);
  assert.equal(akubela.listDevices(AUTOMATION_LAB_SCENARIOS[0]).length, 0);
});

test("adapter Ekaza usa apenas endpoints de leitura e filtra a allowlist retornada pela API", async () => {
  const calls: string[] = [];
  const provider = new EkazaScenarioProvider("admin", async (input) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ devices: [
      { providerDeviceId: "authorized-device", name: "Luz", type: "light", online: true, capabilities: [], enabled: true },
      { providerDeviceId: "blocked-device", name: "Portão", type: "other", online: true, capabilities: [], enabled: false },
    ] }), { status: 200, headers: { "content-type": "application/json" } });
  }, "https://api.example");
  const devices = await provider.listDevices();
  assert.deepEqual(devices.map((item) => item.providerDeviceId), ["authorized-device"]);
  assert.ok(calls.every((path) => path.includes("/api/v1/integrations/ekaza/devices")));
  assert.equal(provider.realCommandsAvailable(), false);
  assert.equal(maskProviderDeviceId("authorized-device"), "aut••••ice");
});

test("adapter exige chave administrativa e não expõe endpoints de comando", async () => {
  const provider = new EkazaScenarioProvider("", async () => { throw new Error("não deve chamar"); }, "https://api.example");
  await assert.rejects(() => provider.listDevices(), /admin_key_required/);
  const source = readFileSync(new URL("../src/automation-lab/ekaza-scenario.ts", import.meta.url), "utf8");
  const contract = readFileSync(new URL("../src/automation-lab/provider-contract.ts", import.meta.url), "utf8");
  assert.match(source, /implements AutomationLabReadProvider/);
  assert.match(contract, /health\(\).*listDevices\(\).*getDetails\(.*getStatus\(.*getCapabilities\(.*diagnose\(.*realCommandsAvailable/s);
  assert.doesNotMatch(source, /\/commands|temporary_access|unlock|lock/);
});

test("logs removem PIN, token, senha, telefone e mensagem completa", () => {
  const log = sanitizeLabLog({
    pin: "1234",
    token: "secret-token",
    password: "senha",
    phone: "+55 11 99999-9999",
    message: "Olá hóspede",
    safe: "diagnostic.completed",
  });
  assert.doesNotMatch(log, /1234|secret-token|senha|99999|Olá hóspede/);
  assert.match(log, /diagnostic\.completed/);
});

test("Automation Lab não importa reservas, PMS, CRM ou integrações operacionais", () => {
  const domain = readFileSync(new URL("../src/automation-lab/automation-lab.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/pages/automation-lab.tsx", import.meta.url), "utf8");
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(domain + page + simple, /manual-airbnb-reservations|reservas\.repository|stays-demo|guest-crm|conexoes-integracao\.service/i);
  assert.match(simple, /não cria reservas/i);
  assert.match(simple, /PMS, CRM, FNRH, faturamento/);
  assert.match(page, /SimpleAutomationLab/);
});

test("/automation-lab abre no Modo Simples e mantém o Modo Técnico acessível", () => {
  const route = readFileSync(new URL("../src/routes/router.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/pages/automation-lab.tsx", import.meta.url), "utf8");
  assert.match(route, /path: "automation-lab", element: <AutomationLabPage \/>/);
  assert.match(page, /technicalMode[\s\S]*AutomationLabTechnicalMode[\s\S]*SimpleAutomationLab/);
  assert.match(page, /useState\(false\)/);
});

test("Modo Simples inicia a sessão automaticamente por duas horas sem formulário técnico", () => {
  const session = createAutomationSession(AUTOMATION_LAB_SCENARIOS[0], new Date("2026-07-29T12:00:00Z"));
  assert.equal(session.startedAt, "2026-07-29T12:00:00.000Z");
  assert.equal(session.endsAt, "2026-07-29T14:00:00.000Z");
  assert.match(session.fictionalGuestName ?? "", /Teste Casa Mairiporã/);
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /Iniciar teste/);
  assert.match(simple, /createAutomationSession\(scenario\)/);
  assert.doesNotMatch(simple, /type="datetime-local"/);
});

test("fluxo simples usa health e allowlist reais, esconde IDs e traduz recursos", () => {
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /provider\.health\(\)/);
  assert.match(simple, /provider\.listDevices\(\)/);
  assert.doesNotMatch(simple, />\{device\.providerDeviceId\}</);
  assert.match(simple, /maskProviderDeviceId/);
  assert.equal(friendlyCapability("on_off"), "Liga e desliga");
  assert.equal(friendlyCapability("battery"), "Mostra a bateria");
  assert.equal(friendlyCapability("temporary_access"), "Cria acesso temporário");
  assert.equal(friendlyCapability("unknown_code"), "Recurso identificado");
});

test("falhas são amigáveis e a chave é solicitada somente quando necessária", () => {
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /Não foi possível conectar à Ekaza/);
  assert.match(simple, /Ver detalhes do erro/);
  assert.doesNotMatch(simple, /error\.stack|stack trace/i);
  assert.match(simple, /if \(!adminKey\) setKeyOpen\(true\)/);
  assert.match(simple, /Esta não é a senha da Ekaza nem o token da Tuya/);
  assert.doesNotMatch(simple, /createLabLog\([^)]*adminKey|console\.[a-z]+\([^)]*adminKey/);
});

test("avaliação registra benefícios e indicações sem homologar automaticamente", () => {
  const validation = createCommercialValidation();
  assert.equal(validation.status, "not_started");
  assert.equal(decideHomologation(validation, "homologated", false).status, "not_started");
  assert.equal(decideHomologation(validation, "homologated", true).portfolioAvailability, "yes");
  assert.equal(decideHomologation(validation, "homologated_with_restrictions", true).portfolioAvailability, "restricted");
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /Os equipamentos que você esperava encontrar apareceram/);
  assert.match(simple, /Quais benefícios foram comprovados/);
  assert.match(simple, /Para quais tipos de hospedagem/);
  assert.match(simple, /window\.confirm/);
  assert.match(simple, /Modo técnico/);
});

test("Studio Vila Nova e Demo Hotel continuam usando seus fluxos existentes", () => {
  const studio = readFileSync(new URL("../src/demo/studio-vila-nova-journey.ts", import.meta.url), "utf8");
  const demoOrganizations = readFileSync(new URL("../src/demo/demo-organizations.ts", import.meta.url), "utf8");
  assert.match(studio, /getStudioVilaNovaJourney/);
  assert.match(studio, /Reserva confirmada.*PIN Yale.*QR Code.*Portal do Hóspede.*Mensagem/s);
  assert.match(demoOrganizations, /isVilaNovaDemoOrganization/);
  assert.doesNotMatch(studio + demoOrganizations, /AutomationSession|automation-lab/i);
});

test("Casa Mairiporã deixa de ser uma propriedade especial do CRM demonstrativo", () => {
  const crmFixtures = readFileSync(new URL("../src/demo/guest-crm.fixtures.ts", import.meta.url), "utf8");
  assert.doesNotMatch(crmFixtures, /mairipora|familia-casa|carol-casa|bruno-casa/i);
});
