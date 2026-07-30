import assert from "node:assert/strict";
import test from "node:test";
import { completeDemoHotelCleaning, completeDemoHotelJourney, createDemoHotelJourney, goToDemoHotelStep, requestDemoHotelCleaning, startDemoHotelCleaning, startDemoHotelJourney } from "../src/demo/demo-hotel-guided-journey.ts";
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
