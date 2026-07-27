export type GuestSegment = "Casais" | "Corporativo" | "Eventos" | "Família" | "Datas comemorativas" | "Fidelidade" | "Primeira hospedagem" | "Hóspedes inativos" | "Alto valor" | "Airbnb e curta temporada";
export type GuestOpportunity = "Alta" | "Média" | "Baixa" | "Sem ação recomendada";
export type GuestStay = { id: string; property: string; unit: string; checkIn: string; checkOut: string; value: number; reason: string; channel: string; status: string; rating?: number; services: string[] };
export type GuestProfile = { id: string; name: string; email: string; phone: string; city: string; language: string; stays: GuestStay[]; segments: GuestSegment[]; preferences: string[]; marketing: { email: boolean; whatsapp: boolean; consentAt?: string }; opportunity: GuestOpportunity; digital: string[]; notes: string; campaignHint: string };
export type GuestCampaign = { name: string; audience: string; channel: string; subject: string; message: string; discount: number; validity: string };
