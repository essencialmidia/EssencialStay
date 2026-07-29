import assert from "node:assert/strict";
import test from "node:test";
import { getStudioVilaNovaJourney, isStudioVilaNovaJourney } from "../src/demo/studio-vila-nova-journey.ts";

test("Studio Vila Nova começa com 1 de 5 etapas e não exibe Pré-check-in", () => {
  const journey = getStudioVilaNovaJourney({});
  assert.equal(journey.completedSteps, 1);
  assert.equal(journey.totalSteps, 5);
  assert.deepEqual(journey.steps.map((step) => step.label), ["Reserva confirmada", "PIN Yale", "QR Code", "Portal do Hóspede", "Mensagem"]);
});

test("confirmação do PIN conclui PIN, QR Code e Portal e abre a mensagem", () => {
  const journey = getStudioVilaNovaJourney({ accessPrepared: true });
  assert.equal(journey.completedSteps, 4);
  assert.deepEqual(journey.steps.map((step) => step.completed), [true, true, true, true, false]);
  assert.equal(journey.opensMessagePreview, true);
  assert.equal(journey.guide.text, "Confira as informações e envie ao hóspede.");
});

test("antes do envio a jornada não é concluída e depois do envio fica em 5 de 5", () => {
  const pending = getStudioVilaNovaJourney({ accessPrepared: true });
  const sent = getStudioVilaNovaJourney({ accessPrepared: true, sent: true });
  assert.equal(pending.showMessageSuccessCard, false);
  assert.equal(sent.completedSteps, 5);
  assert.equal(sent.progress, 100);
  assert.equal(sent.showMessageSuccessCard, true);
});

test("Demo Hotel não usa a projeção visual do Studio Vila Nova", () => {
  assert.equal(isStudioVilaNovaJourney("studio-vila-nova"), true);
  assert.equal(isStudioVilaNovaJourney("demo-hotel"), false);
  assert.equal(isStudioVilaNovaJourney(undefined), false);
});
