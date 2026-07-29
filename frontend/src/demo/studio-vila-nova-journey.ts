export type StudioVilaNovaJourneyReservation = {
  accessPrepared?: boolean;
  sent?: boolean;
};

const steps = ["Reserva confirmada", "PIN Yale", "QR Code", "Portal do Hóspede", "Mensagem"] as const;

export function isStudioVilaNovaJourney(unitId?: string) {
  return unitId === "studio-vila-nova";
}

export function getStudioVilaNovaJourney(reservation: StudioVilaNovaJourneyReservation) {
  const resourcesPrepared = Boolean(reservation.accessPrepared);
  const messageSent = Boolean(reservation.sent);
  const completed = [true, resourcesPrepared, resourcesPrepared, resourcesPrepared, messageSent];
  const completedSteps = completed.filter(Boolean).length;

  return {
    steps: steps.map((label, index) => ({ label, completed: completed[index] })),
    completedSteps,
    totalSteps: steps.length,
    progress: Math.round((completedSteps / steps.length) * 100),
    nextStep: messageSent
      ? "🎉 Hospedagem preparada e enviada ao hóspede"
      : resourcesPrepared
        ? "Tudo pronto para o envio. Confira as informações e envie ao hóspede."
        : "Preparar PIN Yale",
    guide: messageSent
      ? { step: 5, title: "Trabalho do anfitrião concluído", text: "A experiência foi enviada ao hóspede e a demonstração foi concluída." }
      : resourcesPrepared
        ? { step: 4, title: "Tudo pronto para o envio", text: "Confira as informações e envie ao hóspede." }
        : { step: 1, title: "Reserva confirmada", text: "Continue para configurar o PIN Yale do hóspede." },
    opensMessagePreview: resourcesPrepared && !messageSent,
    showMessageSuccessCard: messageSent,
  };
}
