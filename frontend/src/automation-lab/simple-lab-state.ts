import type { LabLog } from "./automation-lab";
import type { EkazaDevice } from "./ekaza-scenario";

export type DevicePracticalResult = "pending" | "worked" | "partial" | "failed" | "not_tested";
export type PhysicalTestResult = "pending" | "yes" | "no";
export type ActionLocation = "pending" | "manufacturer_app" | "essencial_read_only" | "on_site" | "not_performed";
export type ValidationEase = "pending" | "very_easy" | "easy" | "reasonable" | "difficult" | "unable" | "not_applicable";
export type DeviceDecision = "pending" | "testing" | "homologated" | "homologated_with_restrictions" | "not_approved" | "archived" | "not_evaluated";
export type UnableReason = "offline" | "physical_test_not_performed" | "manufacturer_app_unavailable" | "site_access_unavailable" | "unsupported" | "other";

export type DeviceEvaluation = {
  deviceKey: string;
  practicalResult: DevicePracticalResult;
  physicalTest: PhysicalTestResult;
  actionLocation: ActionLocation;
  validationEase: ValidationEase;
  recommendedFor: string[];
  potentialBenefits: string[];
  provenBenefits: string[];
  practicalObservation: string;
  commercialSuggestion: string;
  systemLimitations: string[];
  additionalLimitations: string;
  decision: DeviceDecision;
  unableToEvaluate: boolean;
  unableReason: UnableReason | null;
  evaluatedAt: string | null;
};

export type SimpleLabInventoryItem = EkazaDevice & {
  deviceKey: string;
  maskedProviderDeviceId: string;
  lastReadAt: string | null;
  queryState: "found" | "updated" | "error";
};

export type SimpleLabState = {
  version: 2;
  step: number;
  sessionStatus: "not_started" | "active" | "ended";
  equipmentMatch: "correct" | "missing" | "unknown" | null;
  healthCheckedAt: string | null;
  inventory: SimpleLabInventoryItem[];
  selectedDeviceKey: string;
  evaluationsByDevice: Record<string, DeviceEvaluation>;
  logs: LabLog[];
};

export const SIMPLE_LAB_STATE_STORAGE_KEY = "essencialstay:automation-lab:simple-state:v2";

export const potentialBenefitOptions = [
  "Melhora a experiência do hóspede",
  "Aumenta a segurança",
  "Reduz trabalho manual",
  "Auxilia manutenção preventiva",
  "Reduz desperdícios",
  "Permite controle remoto",
  "Aumenta a eficiência operacional",
  "Gera economia de energia",
  "Cria diferencial comercial",
  "Pode ser vendido como solução adicional",
];

export const unableReasonLabels: Record<UnableReason, string> = {
  offline: "Equipamento offline",
  physical_test_not_performed: "Teste físico não realizado",
  manufacturer_app_unavailable: "Aplicativo oficial indisponível",
  site_access_unavailable: "Acesso ao local indisponível",
  unsupported: "Recurso não suportado",
  other: "Outro",
};

export function createDeviceKey(device: Pick<EkazaDevice, "provider" | "providerDeviceId">) {
  const input = `${device.provider}:${device.providerDeviceId}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `device-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function systemLimitationsFor(device: Pick<EkazaDevice, "type" | "online">) {
  const limitations = ["Integração somente leitura", "Controle remoto pelo Essencial Stay ainda não disponível"];
  if (device.online === false) limitations.unshift("Equipamento offline");
  if (device.online == null) limitations.unshift("Status não confirmado");
  if (device.type === "smart_lock") limitations.push("Criação de PIN não disponível", "Travar ou destravar não comprovado");
  if (device.type === "switch") limitations.push("Ligar ou desligar pelo Essencial Stay ainda não disponível");
  return limitations;
}

export function createDeviceEvaluation(device: Pick<SimpleLabInventoryItem, "deviceKey" | "type" | "online">): DeviceEvaluation {
  return {
    deviceKey: device.deviceKey,
    practicalResult: "pending",
    physicalTest: "pending",
    actionLocation: "pending",
    validationEase: "pending",
    recommendedFor: [],
    potentialBenefits: [],
    provenBenefits: [],
    practicalObservation: "",
    commercialSuggestion: "",
    systemLimitations: systemLimitationsFor(device),
    additionalLimitations: "",
    decision: "pending",
    unableToEvaluate: false,
    unableReason: null,
    evaluatedAt: null,
  };
}

export function createSimpleLabState(): SimpleLabState {
  return {
    version: 2,
    step: 0,
    sessionStatus: "not_started",
    equipmentMatch: null,
    healthCheckedAt: null,
    inventory: [],
    selectedDeviceKey: "",
    evaluationsByDevice: {},
    logs: [],
  };
}

export function initializeInventory(state: SimpleLabState, inventory: SimpleLabInventoryItem[]): SimpleLabState {
  const evaluationsByDevice = { ...state.evaluationsByDevice };
  for (const device of inventory) evaluationsByDevice[device.deviceKey] ??= createDeviceEvaluation(device);
  return {
    ...state,
    inventory,
    selectedDeviceKey: inventory.some((item) => item.deviceKey === state.selectedDeviceKey) ? state.selectedDeviceKey : inventory[0]?.deviceKey ?? "",
    evaluationsByDevice,
  };
}

export function updateDeviceEvaluation(state: SimpleLabState, deviceKey: string, patch: Partial<DeviceEvaluation>): SimpleLabState {
  const current = state.evaluationsByDevice[deviceKey];
  if (!current) return state;
  return {
    ...state,
    evaluationsByDevice: {
      ...state.evaluationsByDevice,
      [deviceKey]: {
        ...current,
        ...patch,
        evaluatedAt: new Date().toISOString(),
      },
    },
  };
}

export function markDeviceNotEvaluated(state: SimpleLabState, deviceKey: string, reason: UnableReason): SimpleLabState {
  return updateDeviceEvaluation(state, deviceKey, {
    unableToEvaluate: true,
    unableReason: reason,
    practicalResult: "not_tested",
    physicalTest: "no",
    actionLocation: "not_performed",
    decision: "not_evaluated",
    systemLimitations: [...new Set([...(state.evaluationsByDevice[deviceKey]?.systemLimitations ?? []), unableReasonLabels[reason], "Teste físico não realizado"])],
  });
}

export function decideDevice(state: SimpleLabState, deviceKey: string, decision: DeviceDecision, confirmed: boolean): SimpleLabState {
  const requiresConfirmation = decision === "homologated"
    || decision === "homologated_with_restrictions"
    || decision === "not_approved";
  if (requiresConfirmation && !confirmed) return state;
  return updateDeviceEvaluation(state, deviceKey, { decision });
}

export function isDeviceEvaluationComplete(evaluation?: DeviceEvaluation) {
  if (!evaluation) return false;
  if (evaluation.unableToEvaluate) return Boolean(evaluation.unableReason);
  return evaluation.practicalResult !== "pending"
    && evaluation.physicalTest !== "pending"
    && evaluation.actionLocation !== "pending"
    && evaluation.validationEase !== "pending";
}

export function allDevicesEvaluated(state: SimpleLabState) {
  return state.inventory.length > 0 && state.inventory.every((device) => isDeviceEvaluationComplete(state.evaluationsByDevice[device.deviceKey]));
}

export function consolidatedCounts(state: SimpleLabState) {
  const evaluations = state.inventory.map((device) => state.evaluationsByDevice[device.deviceKey]).filter(Boolean);
  return {
    found: state.inventory.length,
    evaluated: evaluations.filter(isDeviceEvaluationComplete).length,
    homologated: evaluations.filter((item) => item.decision === "homologated" || item.decision === "homologated_with_restrictions").length,
    testing: evaluations.filter((item) => item.decision === "testing" || item.decision === "pending").length,
  };
}

export function loadSimpleLabState(storage: Pick<Storage, "getItem">): SimpleLabState {
  try {
    const raw = storage.getItem(SIMPLE_LAB_STATE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<SimpleLabState> : null;
    return parsed?.version === 2 ? { ...createSimpleLabState(), ...parsed } : createSimpleLabState();
  } catch {
    return createSimpleLabState();
  }
}

export function saveSimpleLabState(storage: Pick<Storage, "setItem">, state: SimpleLabState) {
  storage.setItem(SIMPLE_LAB_STATE_STORAGE_KEY, JSON.stringify(state));
}

export function clearSimpleLabState(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(SIMPLE_LAB_STATE_STORAGE_KEY);
}
