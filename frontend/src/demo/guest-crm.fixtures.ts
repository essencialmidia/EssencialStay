import type { GuestCampaign, GuestProfile } from "./guest-crm.types";
import { getManualCrmGuests } from "./manual-airbnb-reservations";

const stay = (id: string, property: string, unit: string, checkIn: string, value: number, reason: string, services: string[] = []) => ({ id, property, unit, checkIn, checkOut: "2026-07-31", value, reason, channel: "Reserva direta", status: "Concluída", rating: 5, services });
const guest = (id: string, name: string, reason: string, segments: GuestProfile["segments"], count: number, value: number, extra: Partial<GuestProfile> = {}): GuestProfile => ({ id, name, email: `${id}@exemplo.com`, phone: "+55 (11) 9••••-••••", city: "Guarulhos, SP", language: "Português", stays: Array.from({ length: count }, (_, index) => stay(`${id}-${index}`, "Hotel Summit Monaco", index ? "Suíte 704" : "Suíte 901", index ? "2025-06-12" : "2026-07-29", Math.round(value / count), reason, ["Portal do hóspede", "Check-in digital"])), segments, preferences: ["Quarto silencioso"], marketing: { email: true, whatsapp: false, consentAt: "15/05/2026" }, opportunity: "Média", digital: ["Check-in digital concluído", "Portal acessado", "Acesso inteligente: utilizado", "Código de acesso: ••••"], notes: "Observação interna demonstrativa. Não visível ao hóspede.", campaignHint: "Oferta personalizada para próxima estadia", ...extra });

const monaco: GuestProfile[] = [
  guest("claudio-palombo", "Claudio Palombo", "Visita técnica", ["Fidelidade", "Corporativo"], 4, 8400, { opportunity: "Alta", preferences: ["Suíte", "Automação disponível"], digital: ["Check-in digital concluído", "Portal ativo", "Acesso inteligente: ativo", "Código de acesso: ••••"], campaignHint: "Acompanhar demonstração Essencial Stay" }),
  guest("mariana-ricardo", "Mariana e Ricardo Alves", "Dia dos Namorados", ["Casais", "Datas comemorativas"], 2, 3200, { preferences: ["Quarto silencioso", "Pacote romântico"], opportunity: "Alta", campaignHint: "Volte para o Dia dos Namorados" }),
  guest("fernanda-costa", "Fernanda Costa", "Feira de Cosméticos", ["Eventos", "Corporativo"], 3, 5100, { opportunity: "Alta", campaignHint: "Tarifa para a Feira de Cosméticos 2027" }),
  guest("carlos-mendes", "Carlos Mendes", "Trabalho", ["Corporativo", "Fidelidade"], 5, 7600, { preferences: ["Andar alto", "Café cedo"], opportunity: "Alta" }),
  guest("juliana-rocha", "Juliana Rocha", "Aniversário", ["Datas comemorativas"], 2, 2400, { opportunity: "Média", campaignHint: "Cupom de aniversário" }),
  guest("roberto-lima", "Roberto Lima", "Férias", ["Hóspedes inativos"], 1, 980, { marketing: { email: true, whatsapp: true, consentAt: "20/03/2025" }, opportunity: "Alta", campaignHint: "Sentimos sua falta" }),
  guest("ana-martins", "Ana Martins", "Família", ["Família"], 2, 3500, { preferences: ["Quarto familiar", "Cama extra"], opportunity: "Média" }),
  guest("pedro-santos", "Pedro Santos", "Trabalho", ["Fidelidade", "Alto valor"], 7, 11500, { opportunity: "Alta", campaignHint: "Benefício para hóspedes recorrentes" }),
];
const studio = [guest("bia-studio", "Beatriz Nunes", "Férias", ["Airbnb e curta temporada"], 1, 620), guest("lucas-studio", "Lucas Prado", "Trabalho", ["Corporativo"], 2, 1480), guest("marcos-studio", "Marcos Vieira", "Estadia prolongada", ["Airbnb e curta temporada", "Fidelidade"], 3, 3200)];

export function getGuestCrmDemo(organizationName?: string | null, organizationId?: string) { const key = (organizationName ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); if (key.includes("monaco") || key.includes("summit")) return monaco; if (key.includes("vila nova") || key.includes("studio")) return [...getManualCrmGuests(organizationId), ...studio]; return []; }
export const guestCampaigns: GuestCampaign[] = [
  { name: "Volte para o Dia dos Namorados", audience: "Casais e datas comemorativas", channel: "E-mail", subject: "Uma nova noite para celebrar", message: "Convidamos você para uma experiência especial.", discount: 15, validity: "14/06/2027" },
  { name: "Feira de Cosméticos 2027", audience: "Eventos e negócios", channel: "E-mail", subject: "Sua tarifa para o próximo evento", message: "Garanta condições especiais para sua próxima visita.", discount: 12, validity: "30/08/2027" },
  { name: "Sentimos sua falta", audience: "Hóspedes inativos", channel: "WhatsApp", subject: "Uma nova experiência espera por você", message: "Preparamos um benefício demonstrativo para seu retorno.", discount: 10, validity: "31/12/2026" },
  { name: "Benefício para hóspedes recorrentes", audience: "Fidelidade", channel: "E-mail", subject: "Obrigado por escolher o hotel", message: "Um benefício exclusivo para sua próxima estadia.", discount: 15, validity: "31/12/2026" },
  { name: "Cupom de aniversário", audience: "Datas comemorativas", channel: "E-mail", subject: "Celebre conosco", message: "Uma condição especial para sua data.", discount: 10, validity: "31/12/2026" },
];
