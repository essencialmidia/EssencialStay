import assert from "node:assert/strict";
import test from "node:test";
import { completeDemoHotelCleaning, completeDemoHotelJourney, createDemoHotelJourney, demoHotelJourneyStorageKey, goToDemoHotelStep, loadDemoHotelJourney, requestDemoHotelCleaning, saveDemoHotelJourney, startDemoHotelCleaning, startDemoHotelJourney } from "../src/demo/demo-hotel-guided-journey.ts";
import { isDemoHotelOrganization } from "../src/demo/demo-organizations.ts";

test("a jornada do Demo Hotel começa com uma reserva PMS fictícia na Suíte 809", () => {
  const journey = createDemoHotelJourney(new Date("2026-07-30T12:00:00"));
  assert.equal(journey.status, "not_started");
  assert.equal(journey.currentStep, 1);
  assert.equal(journey.guest.name, "Claudio Demonstração");
  assert.equal(journey.guest.email, "hospede.demo@essencialstay.local");
  assert.equal(journey.reservation.unit, "Suíte 809");
  assert.equal(journey.reservation.channel, "PMS simulado");
});

test("a preparação, checkout e limpeza atualizam apenas o estado demonstrativo", () => {
  let journey = startDemoHotelJourney(createDemoHotelJourney());
  journey = goToDemoHotelStep(journey, 2);
  assert.equal(journey.preparationStatus, "preparada");
  assert.equal(journey.automationStatus, "preparada");
  journey = goToDemoHotelStep(journey, 4);
  journey = requestDemoHotelCleaning(journey);
  assert.equal(journey.cleaningStatus, "solicitada");
  journey = goToDemoHotelStep(journey, 5);
  assert.equal(journey.unitStatus, "aguardando_limpeza");
  journey = startDemoHotelCleaning(journey);
  assert.equal(journey.unitStatus, "em_limpeza");
  journey = completeDemoHotelCleaning(journey);
  assert.equal(journey.unitStatus, "disponivel");
  journey = completeDemoHotelJourney(goToDemoHotelStep(journey, 7));
  assert.equal(journey.status, "completed");
  assert.equal(journey.crmUpdated, true);
});

test("o atalho aparece somente para Hotel Summit Monaco e preserva os demais contextos", () => {
  assert.equal(isDemoHotelOrganization({ nome: "Hotel Summit Monaco", nome_fantasia: "Hotel Monaco" }), true);
  assert.equal(isDemoHotelOrganization({ nome: "Studio Vila Nova", nome_fantasia: "Studio Vila Nova" }), false);
  assert.equal(isDemoHotelOrganization({ nome: "Cliente real", nome_fantasia: "Pousada Real" }), false);
});

test("reiniciar recria um estado introdutório pronto para iniciar imediatamente", () => {
  const storage = new Map<string, string>();
  const fakeStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) };
  const previous = completeDemoHotelJourney(startDemoHotelJourney(createDemoHotelJourney()));
  saveDemoHotelJourney(previous, fakeStorage);
  const reset = createDemoHotelJourney(new Date("2026-07-30T12:00:00"));
  saveDemoHotelJourney(reset, fakeStorage);
  const loaded = loadDemoHotelJourney(fakeStorage);
  assert.equal(loaded?.status, "not_started");
  assert.equal(loaded?.currentStep, 1);
  assert.equal(startDemoHotelJourney(loaded!).status, "in_progress");
  assert.ok(storage.has(demoHotelJourneyStorageKey));
});

test("estado inválido na sessão não bloqueia a criação de uma nova demonstração", () => {
  const storage = { getItem: () => "{estado inválido", setItem: () => undefined };
  assert.equal(loadDemoHotelJourney(storage), null);
  assert.equal(startDemoHotelJourney(createDemoHotelJourney()).currentStep, 1);
});
