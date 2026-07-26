import type { DemoGuestStay, DemoShortStayBlueprint } from "./stays-demo.types";

const hotelCapabilities: DemoGuestStay["capabilities"] = ["Portal do hóspede", "Automação Akubela", "Concierge digital", "Wi-Fi", "Serviços do hotel"];

const readyPreparation: DemoGuestStay["preparation"] = [
  { label: "Reserva confirmada", status: "complete" },
  { label: "Unidade identificada", status: "complete" },
  { label: "Experiência criada", status: "complete" },
  { label: "Portal disponibilizado", status: "complete" },
  { label: "Automação preparada", status: "complete", detail: "Akubela · simulação" },
  { label: "Comunicação enviada", status: "complete" },
  { label: "Aguardando check-in", status: "pending" },
];

export const hotelSummitStaysFixture: DemoGuestStay[] = [
  {
    id: "stay-monaco-901",
    bucket: "arrivals",
    guest: { name: "Claudio Palombo", phone: "(11) 90000-0901", email: "claudio.demo@example.com", partySize: 2, notes: "Hóspede fictício da apresentação comercial." },
    property: "Hotel Summit Monaco",
    unit: "Apartamento 901",
    checkIn: "29/07/2026 às 14:00",
    checkOut: "31/07/2026 às 12:00",
    periodLabel: "29/07, 14h → 31/07, 12h",
    status: "Aguardando check-in",
    preparationStatus: "Pronta",
    source: "PMS simulado",
    externalCode: "PMS-DEMO-901",
    communication: { channel: "WhatsApp", status: "Enviada", sentAt: "29/07/2026 às 09:12" },
    capabilities: hotelCapabilities,
    preparation: readyPreparation,
    portalPath: "/s/hotel-monaco-demo",
    featured: true,
  },
  {
    id: "stay-monaco-508",
    bucket: "arrivals",
    guest: { name: "Renata Avelar", phone: "(19) 90000-0508", email: "renata.demo@example.com", partySize: 1 },
    property: "Hotel Summit Monaco", unit: "Apartamento 508", checkIn: "29/07/2026 às 15:00", checkOut: "30/07/2026 às 11:00", periodLabel: "29/07, 15h → 30/07, 11h",
    status: "Aguardando check-in", preparationStatus: "Com pendência", source: "PMS simulado", communication: { channel: "SMS", status: "Preparada" },
    capabilities: hotelCapabilities, preparation: readyPreparation.map((item) => item.label === "Comunicação enviada" ? { ...item, status: "pending", detail: "Aguardando envio" } : item),
  },
  {
    id: "stay-monaco-412",
    bucket: "in_house",
    guest: { name: "Eduardo Lima", phone: "(11) 90000-0412", email: "eduardo.demo@example.com", partySize: 2 },
    property: "Hotel Summit Monaco", unit: "Apartamento 412", checkIn: "27/07/2026 às 14:00", checkOut: "30/07/2026 às 12:00", periodLabel: "27/07, 14h → 30/07, 12h",
    status: "Hospedado", preparationStatus: "Pronta", source: "PMS simulado", communication: { channel: "WhatsApp", status: "Enviada", sentAt: "27/07/2026 às 10:20" },
    capabilities: hotelCapabilities, preparation: readyPreparation.map((item) => item.label === "Aguardando check-in" ? { label: "Hóspede em estadia", status: "complete" } : item),
  },
  {
    id: "stay-monaco-305",
    bucket: "departures",
    guest: { name: "Luciana Prado", phone: "(19) 90000-0305", email: "luciana.demo@example.com", partySize: 2 },
    property: "Hotel Summit Monaco", unit: "Apartamento 305", checkIn: "26/07/2026 às 14:00", checkOut: "29/07/2026 às 12:00", periodLabel: "26/07, 14h → 29/07, 12h",
    status: "Checkout solicitado", preparationStatus: "Pronta", source: "PMS simulado", communication: { channel: "E-mail", status: "Enviada", sentAt: "26/07/2026 às 08:45" },
    capabilities: hotelCapabilities, preparation: readyPreparation,
  },
  {
    id: "stay-monaco-704",
    bucket: "upcoming",
    guest: { name: "Marcos Tavares", phone: "(11) 90000-0704", email: "marcos.demo@example.com", partySize: 3 },
    property: "Hotel Summit Monaco", unit: "Apartamento 704", checkIn: "01/08/2026 às 14:00", checkOut: "03/08/2026 às 12:00", periodLabel: "01/08, 14h → 03/08, 12h",
    status: "Confirmada", preparationStatus: "Em preparação", source: "PMS simulado", communication: { channel: "WhatsApp", status: "Pendente" },
    capabilities: hotelCapabilities, preparation: readyPreparation.map((item, index) => ({ ...item, status: index < 2 ? "complete" : "pending" })),
  },
];

export const shortStayBlueprintFixture: DemoShortStayBlueprint = {
  propertyType: "short_stay",
  capabilities: ["Portal do hóspede", "Automação Akubela", "Acesso Yale", "Wi-Fi", "Guia local"],
  manualAccessFlow: {
    provider: "Yale",
    statusOptions: ["Senha temporária pendente", "Senha temporária configurada", "Acesso revogado"],
    instructions: "Abra o Yale Connect, gere a senha temporária para o período da hospedagem e retorne para confirmar a configuração.",
  },
};
