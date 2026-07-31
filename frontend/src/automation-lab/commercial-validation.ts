export type HomologationStatus = "not_started" | "testing" | "in_validation" | "homologated" | "homologated_with_restrictions" | "not_approved" | "archived";
export type PracticalResult = "worked" | "partial" | "failed" | "not_evaluated";
export type SetupEase = "very_easy" | "easy" | "reasonable" | "difficult" | "not_configured";
export type EquipmentMatch = "correct" | "missing" | "unknown" | null;

export type CommercialValidation = {
  environmentName: string;
  brand: string;
  productName: string;
  category: string;
  equipmentMatch: EquipmentMatch;
  practicalResult: PracticalResult;
  setupEase: SetupEase;
  realBenefit: "yes" | "maybe" | "no" | null;
  recommendedFor: string[];
  provenBenefits: string[];
  observation: string;
  status: HomologationStatus;
  portfolioAvailability: "yes" | "restricted" | "no" | "evaluating";
  commercialSuggestion: string;
  evaluatedAt: string | null;
};

export const COMMERCIAL_VALIDATION_STORAGE_KEY = "essencialstay:automation-lab:commercial-validation:v1";

export const accommodationOptions = [
  "Casa ou apartamento de Airbnb",
  "Pequena pousada",
  "Hotel",
  "Grande hotel",
  "Condomínio",
  "Área comum",
  "Ainda não definido",
];

export const benefitOptions = [
  "Melhora a experiência do hóspede",
  "Aumenta a segurança",
  "Reduz trabalho manual",
  "Ajuda na manutenção preventiva",
  "Reduz desperdícios",
  "Permite controle remoto",
  "Aumenta a eficiência operacional",
  "Melhora a acessibilidade",
  "Cria um diferencial para o hotel",
  "Pode gerar economia de energia",
  "Pode ser vendido como item adicional",
  "Outro benefício",
];

export function createCommercialValidation(): CommercialValidation {
  return {
    environmentName: "Casa Mairiporã",
    brand: "Ekaza",
    productName: "Equipamentos Ekaza",
    category: "Automação para hospedagem",
    equipmentMatch: null,
    practicalResult: "not_evaluated",
    setupEase: "reasonable",
    realBenefit: null,
    recommendedFor: [],
    provenBenefits: [],
    observation: "",
    status: "not_started",
    portfolioAvailability: "evaluating",
    commercialSuggestion: "",
    evaluatedAt: null,
  };
}

export function decideHomologation(validation: CommercialValidation, status: HomologationStatus, confirmed: boolean): CommercialValidation {
  const approval = status === "homologated" || status === "homologated_with_restrictions";
  if (approval && !confirmed) return validation;
  return {
    ...validation,
    status,
    portfolioAvailability: status === "homologated" ? "yes" : status === "homologated_with_restrictions" ? "restricted" : status === "not_approved" || status === "archived" ? "no" : "evaluating",
    evaluatedAt: new Date().toISOString(),
  };
}

export function saveCommercialValidation(storage: Pick<Storage, "setItem">, validation: CommercialValidation) {
  storage.setItem(COMMERCIAL_VALIDATION_STORAGE_KEY, JSON.stringify(validation));
}

export function loadCommercialValidation(storage: Pick<Storage, "getItem">): CommercialValidation {
  try {
    const value = storage.getItem(COMMERCIAL_VALIDATION_STORAGE_KEY);
    return value ? { ...createCommercialValidation(), ...JSON.parse(value) } : createCommercialValidation();
  } catch {
    return createCommercialValidation();
  }
}

export const capabilityLabels: Record<string, string> = {
  on_off: "Liga e desliga",
  switch: "Liga e desliga",
  switch_1: "Liga e desliga",
  status: "Consulta o estado",
  battery: "Mostra a bateria",
  battery_percentage: "Mostra a bateria",
  temporary_access: "Cria acesso temporário",
  volume_control: "Controla o volume",
  water_level: "Mostra o nível de água",
  energy: "Mede o consumo de energia",
  energy_meter: "Mede o consumo de energia",
  closed_opened: "Mostra se está aberto ou fechado",
  unlock: "Possível recurso de destravamento informado pelo fabricante, ainda não disponível no Essencial Stay",
};

export function friendlyCapability(code: string) {
  return capabilityLabels[code] ?? "Recurso técnico identificado";
}
