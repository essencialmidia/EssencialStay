export type DemoStayBucket = "arrivals" | "in_house" | "departures" | "upcoming";
export type DemoStayStatus = "Aguardando check-in" | "Hospedado" | "Checkout solicitado" | "Confirmada";
export type DemoPreparationStatus = "Não iniciada" | "Em preparação" | "Pronta" | "Com pendência";
export type DemoCommunicationChannel = "WhatsApp" | "SMS" | "E-mail";
export type DemoReservationSource = "PMS simulado" | "Airbnb" | "Booking.com" | "Reserva direta" | "Indicação" | "WhatsApp" | "Outro";
export type DemoPropertyCapability = "Portal do hóspede" | "Automação Akubela" | "Concierge digital" | "Wi-Fi" | "Serviços do hotel" | "Acesso Yale" | "Guia local";

export type DemoPreparationItem = {
  label: string;
  status: "complete" | "pending";
  detail?: string;
};

export type DemoGuestStay = {
  id: string;
  bucket: DemoStayBucket;
  guest: {
    name: string;
    phone: string;
    email: string;
    partySize: number;
    notes?: string;
  };
  property: string;
  unit: string;
  checkIn: string;
  checkOut: string;
  periodLabel: string;
  status: DemoStayStatus;
  preparationStatus: DemoPreparationStatus;
  source: DemoReservationSource;
  externalCode?: string;
  communication: {
    channel: DemoCommunicationChannel;
    status: "Preparada" | "Enviada" | "Pendente";
    sentAt?: string;
  };
  capabilities: DemoPropertyCapability[];
  preparation: DemoPreparationItem[];
  portalPath?: string;
  featured?: boolean;
};

export type DemoShortStayBlueprint = {
  propertyType: "short_stay";
  capabilities: DemoPropertyCapability[];
  manualAccessFlow: {
    provider: "Yale";
    statusOptions: Array<"Senha temporária pendente" | "Senha temporária configurada" | "Acesso revogado">;
    instructions: string;
  };
};
