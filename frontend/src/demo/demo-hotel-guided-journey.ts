export const demoHotelJourneyStorageKey = "essencialstay:demo-hotel-guided-journey:v1";

export type DemoHotelJourneyStatus = "not_started" | "in_progress" | "completed";
export type DemoHotelUnitStatus = "reservada" | "ocupada" | "aguardando_limpeza" | "em_limpeza" | "disponivel";
export type DemoHotelCleaningStatus = "nao_solicitada" | "solicitada" | "em_andamento" | "concluida";

export type DemoHotelJourney = {
  demoId: "hotel-summit-monaco-guest-journey";
  status: DemoHotelJourneyStatus;
  currentStep: number;
  startedAt: string | null;
  guest: { name: string; email: string; phone: string };
  reservation: { code: string; unit: string; checkIn: string; checkOut: string; channel: string };
  unitStatus: DemoHotelUnitStatus;
  checkInStatus: "aguardando" | "concluido";
  preparationStatus: "pendente" | "preparada";
  communicationStatus: "pendente" | "preparada";
  automationStatus: "pendente" | "preparada" | "pos_checkout";
  cleaningStatus: DemoHotelCleaningStatus;
  crmUpdated: boolean;
};

export function createDemoHotelJourney(now = new Date()): DemoHotelJourney {
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  return {
    demoId: "hotel-summit-monaco-guest-journey", status: "not_started", currentStep: 1, startedAt: null,
    guest: { name: "Claudio Demonstração", email: "hospede.demo@essencialstay.local", phone: "(11) 9••••-0809" },
    reservation: { code: "PMS-DEMO-809", unit: "Suíte 809", checkIn: `${date} às 14:00`, checkOut: `${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(tomorrow)} às 12:00`, channel: "PMS simulado" },
    unitStatus: "reservada", checkInStatus: "aguardando", preparationStatus: "pendente", communicationStatus: "pendente", automationStatus: "pendente", cleaningStatus: "nao_solicitada", crmUpdated: false,
  };
}

export function startDemoHotelJourney(journey: DemoHotelJourney, startedAt = new Date().toISOString()): DemoHotelJourney { return { ...journey, status: "in_progress", startedAt, currentStep: 1 }; }
export function goToDemoHotelStep(journey: DemoHotelJourney, step: number): DemoHotelJourney {
  const currentStep = Math.min(7, Math.max(1, step));
  if (currentStep === 2) return { ...journey, currentStep, preparationStatus: "preparada", communicationStatus: "preparada", automationStatus: "preparada" };
  if (currentStep === 3 || currentStep === 4) return { ...journey, currentStep, unitStatus: "ocupada", checkInStatus: "concluido" };
  if (currentStep === 5) return { ...journey, currentStep, unitStatus: "aguardando_limpeza", automationStatus: "pos_checkout" };
  if (currentStep === 7) return { ...journey, currentStep, crmUpdated: true };
  return { ...journey, currentStep };
}
export function requestDemoHotelCleaning(journey: DemoHotelJourney): DemoHotelJourney { return { ...journey, cleaningStatus: "solicitada" }; }
export function startDemoHotelCleaning(journey: DemoHotelJourney): DemoHotelJourney { return { ...journey, cleaningStatus: "em_andamento", unitStatus: "em_limpeza" }; }
export function completeDemoHotelCleaning(journey: DemoHotelJourney): DemoHotelJourney { return { ...journey, cleaningStatus: "concluida", unitStatus: "disponivel" }; }
export function completeDemoHotelJourney(journey: DemoHotelJourney): DemoHotelJourney { return { ...journey, status: "completed", currentStep: 7, crmUpdated: true }; }

export function loadDemoHotelJourney(storage: Pick<Storage, "getItem"> | undefined = typeof sessionStorage === "undefined" ? undefined : sessionStorage): DemoHotelJourney | null {
  try { const value = storage?.getItem(demoHotelJourneyStorageKey); return value ? JSON.parse(value) as DemoHotelJourney : null; } catch { return null; }
}
export function saveDemoHotelJourney(journey: DemoHotelJourney, storage: Pick<Storage, "setItem"> | undefined = typeof sessionStorage === "undefined" ? undefined : sessionStorage) { try { storage?.setItem(demoHotelJourneyStorageKey, JSON.stringify(journey)); } catch { /* estado demonstrativo é opcional */ } }
export function clearDemoHotelJourney(storage: Pick<Storage, "removeItem"> | undefined = typeof sessionStorage === "undefined" ? undefined : sessionStorage) { try { storage?.removeItem(demoHotelJourneyStorageKey); } catch { /* estado demonstrativo é opcional */ } }
