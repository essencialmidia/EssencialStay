export type DemoJourneyStep = {
  id: "reservation" | "unit" | "access" | "portal" | "automation" | "welcome";
  label: string;
  detail: string;
  status: "complete" | "ready";
};

export type DemoStay = {
  id: string;
  company: string;
  property: string;
  city: string;
  unit: string;
  guestFirstName: string;
  guestDisplayName: string;
  source: string;
  checkIn: string;
  checkOut: string;
  checkoutTime: string;
  checkInStatus: string;
  experienceStatus: string;
  accessStatus: string;
  accessValidity: string;
  temporaryPin: string;
  wifi: { network: string; password: string };
  receptionPhone: string;
  breakfast: string;
  journey: DemoJourneyStep[];
};

export type DemoAutomationState = {
  mainLight: boolean;
  readingLight: boolean;
  airConditioner: boolean;
  curtainOpen: boolean;
  temperature: number;
  scene: "custom" | "sleep" | "away";
};

export type AutomationCommand =
  | { kind: "toggle"; target: "mainLight" | "readingLight" | "airConditioner" | "curtainOpen"; value: boolean }
  | { kind: "temperature"; value: number }
  | { kind: "scene"; value: "sleep" | "away" };

export interface ReservationAdapter {
  getFeaturedStay(): Promise<DemoStay>;
}

export interface AccessAdapter {
  getTemporaryPin(stayId: string): Promise<string>;
}

export interface AutomationAdapter {
  getState(stayId: string): Promise<DemoAutomationState>;
  execute(stayId: string, command: AutomationCommand): Promise<DemoAutomationState>;
}
