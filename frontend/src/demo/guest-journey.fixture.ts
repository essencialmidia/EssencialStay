import type { DemoAutomationState, DemoStay } from "./guest-journey.types";

// Dados estritamente fictícios. Não substituir por dados reais, tokens ou credenciais.
export const demoStay: DemoStay = {
  id: "demo-stay-monaco-901",
  company: "Hotel Mônaco",
  property: "Hotel Summit Monaco",
  city: "Guarulhos, SP",
  unit: "Suíte 901",
  guestFirstName: "Claudio",
  guestDisplayName: "Claudio Palombo",
  source: "PMS — Ambiente demonstrativo",
  checkIn: "29/07/2026 às 14:00",
  checkOut: "30/07/2026 às 12:00",
  checkoutTime: "12:00",
  checkInStatus: "Check-in preparado",
  experienceStatus: "Portal disponível",
  accessStatus: "Credencial temporária preparada",
  accessValidity: "29/07, 14:00 → 30/07, 12:00",
  temporaryPin: "290726",
  wifi: { network: "Monaco_Guest_Demo", password: "BemVindo901!" },
  receptionPhone: "(19) 3000-0901",
  breakfast: "06:30 às 10:00",
  journey: [
    { id: "reservation", label: "Reserva recebida", detail: "Origem PMS simulada", status: "complete" },
    { id: "unit", label: "Unidade identificada", detail: "Hotel Summit Monaco · Suíte 901", status: "complete" },
    { id: "access", label: "Acesso temporário preparado", detail: "Adapter Akubela demonstrativo", status: "complete" },
    { id: "portal", label: "Portal do Hóspede disponível", detail: "Link e QR Code prontos", status: "ready" },
    { id: "automation", label: "Automação disponível", detail: "Comandos simulados", status: "ready" },
    { id: "welcome", label: "Kit de Boas-vindas preparado", detail: "Wi-Fi, regras e guia local", status: "ready" },
  ],
};

export const demoAutomationInitialState: DemoAutomationState = {
  mainLight: true,
  readingLight: false,
  airConditioner: true,
  curtainOpen: true,
  temperature: 22,
  scene: "custom",
};
