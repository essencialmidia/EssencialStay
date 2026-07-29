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
  loadAutomationSessions,
  sanitizeLabLog,
  saveAutomationSessions,
} from "../src/automation-lab/automation-lab.ts";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("Casa Mairiporã foi migrada para o Scenario 01 com provider Ekaza", () => {
  const scenario = AUTOMATION_LAB_SCENARIOS[0];
  assert.equal(scenario.id, "scenario-01");
  assert.equal(scenario.name, "Casa Mairiporã");
  assert.equal(scenario.providerId, "ekaza");
  assert.equal(scenario.environment, "laboratory");
  assert.ok(scenario.devices.length >= 4);
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

test("provider nega dispositivo desconhecido, capability ausente e comando real sem confirmação", async () => {
  const scenario = AUTOMATION_LAB_SCENARIOS[0];
  const provider = automationLabProviders.get("ekaza");
  assert.ok(provider);

  const unknown = await provider.executeCommand({ scenario, deviceId: "unknown", command: "unlock", mode: "simulated" });
  assert.deepEqual(unknown, { accepted: false, mode: "SIMULATED", reason: "unknown_device" });

  const unsupported = await provider.executeCommand({ scenario, deviceId: "ekaza-sensor-01", command: "unlock", mode: "simulated" });
  assert.equal(unsupported.reason, "unsupported_capability");

  const unconfirmed = await provider.executeCommand({ scenario, deviceId: "ekaza-lock-01", command: "unlock", mode: "real" });
  assert.equal(unconfirmed.reason, "real_command_confirmation_required");
});

test("providers mantêm contratos e catálogos independentes", () => {
  const ekaza = automationLabProviders.get("ekaza");
  const akubela = automationLabProviders.get("provider-02");
  assert.ok(ekaza);
  assert.ok(akubela);
  assert.notEqual(ekaza, akubela);
  assert.equal(ekaza.listDevices(AUTOMATION_LAB_SCENARIOS[0]).length, 4);
  assert.equal(akubela.listDevices(AUTOMATION_LAB_SCENARIOS[0]).length, 0);
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
  assert.doesNotMatch(domain + page, /manual-airbnb-reservations|reservas\.repository|stays-demo|guest-crm|conexoes-integracao\.service/i);
  assert.match(page, /Não cria reserva/);
  assert.match(page, /Não envia PMS/);
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
