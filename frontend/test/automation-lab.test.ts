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
import { EkazaScenarioError, EkazaScenarioProvider, getEkazaSimpleError, maskProviderDeviceId } from "../src/automation-lab/ekaza-scenario.ts";
import { createCommercialValidation, decideHomologation, friendlyCapability } from "../src/automation-lab/commercial-validation.ts";
import {
  allDevicesEvaluated,
  clearSimpleLabState,
  consolidatedCounts,
  createDeviceKey,
  createSimpleLabState,
  decideDevice,
  initializeInventory,
  loadSimpleLabState,
  markDeviceNotEvaluated,
  saveSimpleLabState,
  updateDeviceEvaluation,
  type SimpleLabInventoryItem,
} from "../src/automation-lab/simple-lab-state.ts";

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

test("fetch injetado é executado com o contexto global do navegador", async () => {
  let receivedContext: unknown;
  let requestedUrl = "";
  function browserFetch(this: unknown, input: RequestInfo | URL, _init?: RequestInit) {
    receivedContext = this;
    requestedUrl = String(input);
    return Promise.resolve(new Response(JSON.stringify({ configured: true, connected: true, provider: "ekaza", checkedAt: "2026-07-30T12:00:00.000Z" }), { status: 200 }));
  }
  const provider = new EkazaScenarioProvider("", browserFetch as typeof fetch, "https://api.example");
  await provider.health();
  assert.equal(receivedContext, globalThis);
  assert.equal(requestedUrl, "https://api.example/api/v1/integrations/ekaza/health");
});

test("erros de API, autenticação, rede, CORS e timeout são sanitizados para o Modo Simples", async () => {
  const unauthorized = new EkazaScenarioProvider("admin", async () => new Response("", { status: 401 }), "https://api.example");
  await assert.rejects(() => unauthorized.listDevices(), (error: unknown) => error instanceof EkazaScenarioError && error.code === "unauthorized");
  const network = new EkazaScenarioProvider("", async () => { throw new TypeError("Failed to fetch"); }, "https://api.example");
  await assert.rejects(() => network.health(), (error: unknown) => error instanceof EkazaScenarioError && error.code === "network_or_cors");
  const timeout = new EkazaScenarioProvider("", async () => { throw Object.assign(new Error("aborted"), { name: "AbortError" }); }, "https://api.example");
  await assert.rejects(() => timeout.health(), (error: unknown) => error instanceof EkazaScenarioError && error.code === "timeout");
  assert.equal(getEkazaSimpleError("unauthorized"), "A chave administrativa não foi aceita. Confirme a chave e tente novamente.");
  assert.match(getEkazaSimpleError("network_or_cors"), /Não foi possível acessar o serviço/);
  assert.doesNotMatch(getEkazaSimpleError("network_or_cors"), /Failed to fetch|stack|token/i);
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
  assert.equal(friendlyCapability("switch_1"), "Liga e desliga");
  assert.match(friendlyCapability("unlock"), /ainda não disponível/);
  assert.equal(friendlyCapability("unknown_code"), "Recurso técnico identificado");
});

test("Modo Simples inclui teste manual entre a conferência e a avaliação, sem comando real", () => {
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /"Conferir equipamentos", "Testar funcionamento", "Avaliar a utilidade"/);
  assert.match(simple, /Status não confirmado/);
  assert.match(simple, /Status não confirmado/);
  assert.match(simple, /Teste manual externo/);
  assert.match(simple, /O comando foi realizado fora do Essencial Stay/);
  assert.doesNotMatch(simple, /Destravar|Confirmar e destravar|Sim, executar teste/);
});

test("conectividade ausente não é apresentada como offline e comandos seguem indisponíveis", async () => {
  const provider = new EkazaScenarioProvider("admin", async () => new Response(JSON.stringify({ devices: [{ providerDeviceId: "switch-1", name: "Interruptor", type: "switch", online: null, capabilities: ["switch_1"], enabled: true }] }), { status: 200 }), "https://api.example");
  const [device] = await provider.listDevices();
  assert.equal(device.online, null);
  assert.equal(provider.realCommandsAvailable(), false);
});

test("falhas são amigáveis e a chave é solicitada somente quando necessária", () => {
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /getEkazaSimpleError/);
  assert.match(simple, /Ver detalhes do erro/);
  assert.doesNotMatch(simple, /error\.stack|stack trace/i);
  assert.match(simple, /if \(!adminKey\) setKeyOpen\(true\)/);
  assert.match(simple, /Esta não é a senha da Ekaza nem o token da Tuya/);
  assert.doesNotMatch(simple, /createLabLog\([^)]*adminKey|console\.[a-z]+\([^)]*adminKey/);
});

test("Modo Simples deixa Casa Mairiporã independente do contexto global da empresa", () => {
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /AMBIENTE DO TESTE/);
  assert.match(simple, /Casa Mairiporã/);
  assert.match(simple, /O Automation Lab é independente: a empresa visualizada no cabeçalho não participa deste teste/);
  assert.doesNotMatch(simple, /Hotel Summit Monaco/);
});

test("avaliação registra benefícios e indicações sem homologar automaticamente", () => {
  const validation = createCommercialValidation();
  assert.equal(validation.status, "not_started");
  assert.equal(decideHomologation(validation, "homologated", false).status, "not_started");
  assert.equal(decideHomologation(validation, "homologated", true).portfolioAvailability, "yes");
  assert.equal(decideHomologation(validation, "homologated_with_restrictions", true).portfolioAvailability, "restricted");
  const simple = readFileSync(new URL("../src/components/automation-lab/simple-automation-lab.tsx", import.meta.url), "utf8");
  assert.match(simple, /Os equipamentos que você esperava encontrar apareceram/);
  assert.match(simple, /Benefícios comprovados no teste/);
  assert.match(simple, /Para quais tipos de hospedagem/);
  assert.match(simple, /window\.confirm/);
  assert.match(simple, /Modo técnico/);
});

test("avaliações ficam isoladas por equipamento e sobrevivem à troca de seleção", () => {
  const inventory = [
    { provider: "ekaza", providerDeviceId: "lock-01", deviceKey: createDeviceKey({ provider: "ekaza", providerDeviceId: "lock-01" }), maskedProviderDeviceId: "loc••••-01", name: "Fechadura", type: "smart_lock", online: true, capabilities: ["battery"], enabled: true, lastReadAt: null, queryState: "found" },
    { provider: "ekaza", providerDeviceId: "switch-01", deviceKey: createDeviceKey({ provider: "ekaza", providerDeviceId: "switch-01" }), maskedProviderDeviceId: "swi••••-01", name: "Interruptor", type: "switch", online: false, capabilities: ["switch_1"], enabled: true, lastReadAt: null, queryState: "found" },
  ] as SimpleLabInventoryItem[];
  let state = initializeInventory(createSimpleLabState(), inventory);
  state = updateDeviceEvaluation(state, inventory[0].deviceKey, {
    practicalResult: "worked",
    physicalTest: "yes",
    actionLocation: "manufacturer_app",
    validationEase: "easy",
    practicalObservation: "Testado presencialmente",
    recommendedFor: ["Hotel"],
    potentialBenefits: ["Aumenta a segurança"],
    provenBenefits: ["Reduz trabalho manual"],
  });
  state = markDeviceNotEvaluated(state, inventory[1].deviceKey, "offline");

  assert.equal(state.evaluationsByDevice[inventory[0].deviceKey].practicalResult, "worked");
  assert.equal(state.evaluationsByDevice[inventory[1].deviceKey].practicalResult, "not_tested");
  assert.equal(state.evaluationsByDevice[inventory[1].deviceKey].unableReason, "offline");
  assert.match(state.evaluationsByDevice[inventory[1].deviceKey].systemLimitations.join(" "), /offline/i);
  assert.deepEqual(state.evaluationsByDevice[inventory[0].deviceKey].provenBenefits, ["Reduz trabalho manual"]);
  assert.equal(allDevicesEvaluated(state), true);
  assert.deepEqual(consolidatedCounts(state), { found: 2, evaluated: 2, homologated: 0, testing: 1 });
});

test("estado completo do laboratório persiste em sessionStorage sem chave administrativa", () => {
  const storage = new MemoryStorage();
  const device = { provider: "ekaza", providerDeviceId: "device-secret", deviceKey: createDeviceKey({ provider: "ekaza", providerDeviceId: "device-secret" }), maskedProviderDeviceId: "dev••••ret", name: "Sensor", type: "sensor", online: true, capabilities: ["status"], enabled: true, lastReadAt: "2026-07-30T12:00:00.000Z", queryState: "updated" } as SimpleLabInventoryItem;
  let state = initializeInventory({ ...createSimpleLabState(), step: 5, sessionStatus: "active" }, [device]);
  state = updateDeviceEvaluation(state, device.deviceKey, { practicalObservation: "Leitura confirmada", commercialSuggestion: "Usar em áreas comuns" });
  saveSimpleLabState(storage, state);
  const restored = loadSimpleLabState(storage);

  assert.equal(restored.step, 5);
  assert.equal(restored.selectedDeviceKey, device.deviceKey);
  assert.equal(restored.evaluationsByDevice[device.deviceKey].commercialSuggestion, "Usar em áreas comuns");
  assert.doesNotMatch(storage.getItem("essencialstay:automation-lab:simple-state:v2") ?? "", /adminKey|chave administrativa/i);
  clearSimpleLabState(storage);
  assert.equal(loadSimpleLabState(storage).inventory.length, 0);
});

test("decisão por equipamento exige confirmação e não substitui o consolidado", () => {
  const device = { provider: "ekaza", providerDeviceId: "device-1", deviceKey: "device-safe", maskedProviderDeviceId: "dev••••e-1", name: "Tomada", type: "socket", online: true, capabilities: [], enabled: true, lastReadAt: null, queryState: "found" } as SimpleLabInventoryItem;
  const initial = initializeInventory(createSimpleLabState(), [device]);
  assert.equal(decideDevice(initial, device.deviceKey, "homologated", false), initial);
  const decided = decideDevice(initial, device.deviceKey, "homologated_with_restrictions", true);
  assert.equal(decided.evaluationsByDevice[device.deviceKey].decision, "homologated_with_restrictions");
  assert.equal(consolidatedCounts(decided).homologated, 1);
});

test("modo técnico reutiliza inventário e logs sanitizados sem habilitar comandos", () => {
  const technical = readFileSync(new URL("../src/pages/automation-lab-technical.tsx", import.meta.url), "utf8");
  assert.match(technical, /loadSimpleLabState/);
  assert.match(technical, /sharedState\.inventory/);
  assert.match(technical, /allowedCommands: \[\]/);
  assert.match(technical, /mode: "read_only"/);
  assert.match(technical, /friendlyCapability/);
  assert.match(technical, /Cenário.*padStart/);
  assert.doesNotMatch(technical, /Scenario \$\{id\.slice/);
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
