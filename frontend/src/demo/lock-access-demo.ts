export type DemoLockProvider = "yale" | "ekaza";
export type DemoLockMode = "assisted" | "automatic-demo";
export type DemoAccessStatus = "awaiting_manual_pin" | "generating" | "active" | "generation_failed";
export type DemoLockConfiguration = { id: string; provider: DemoLockProvider; mode: DemoLockMode; displayName: string; unitName: string };
export type DemoAccessRequest = { reservationId: string; unitId: string; guestName: string; validFrom: string; validUntil: string; simulateFailure?: boolean };
type DemoAccessResultBase = { accessId: string; maskedCode: string; provider: "ekaza"; demonstration: true };
export type DemoAccessResult =
  | (DemoAccessResultBase & { status: "active"; code: string })
  | (DemoAccessResultBase & { status: "failed" });

export const demoLockConfigurations: Record<string, DemoLockConfiguration> = {
  "studio-vila-nova": { id: "studio-vila-nova", provider: "yale", mode: "assisted", displayName: "Yale Hub Connect", unitName: "Studio Vila Nova" },
  "apartamento-demo-zigbee": { id: "apartamento-demo-zigbee", provider: "ekaza", mode: "automatic-demo", displayName: "Fechadura Zigbee Ekaza", unitName: "Apartamento Demo Zigbee" },
};

export const DemoAutomaticAccessProvider = {
  async createTemporaryAccess(request: DemoAccessRequest): Promise<DemoAccessResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (request.simulateFailure) return { accessId: `demo-access-${request.reservationId}`, status: "failed", maskedCode: "••••••", provider: "ekaza", demonstration: true };
    return { accessId: `demo-access-${request.reservationId}`, status: "active", code: "731942", maskedCode: "73••42", provider: "ekaza", demonstration: true };
  },
};
