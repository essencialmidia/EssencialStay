import { demoAutomationInitialState, demoStay } from "./guest-journey.fixture";
import type { AccessAdapter, AutomationAdapter, AutomationCommand, DemoAutomationState, ReservationAdapter } from "./guest-journey.types";

const delay = (milliseconds = 180) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

class DemoReservationAdapter implements ReservationAdapter {
  async getFeaturedStay() {
    await delay(80);
    return demoStay;
  }
}

class DemoAccessAdapter implements AccessAdapter {
  async getTemporaryPin(stayId: string) {
    await delay();
    if (stayId !== demoStay.id) throw new Error("Hospedagem demonstrativa não encontrada.");
    return demoStay.temporaryPin;
  }
}

class DemoAutomationAdapter implements AutomationAdapter {
  private state = { ...demoAutomationInitialState };

  async getState(stayId: string) {
    await delay(80);
    if (stayId !== demoStay.id) throw new Error("Hospedagem demonstrativa não encontrada.");
    return { ...this.state };
  }

  async execute(stayId: string, command: AutomationCommand): Promise<DemoAutomationState> {
    await delay();
    if (stayId !== demoStay.id) throw new Error("Hospedagem demonstrativa não encontrada.");
    if (command.kind === "toggle") this.state = { ...this.state, [command.target]: command.value, scene: "custom" };
    if (command.kind === "temperature") this.state = { ...this.state, temperature: command.value, scene: "custom" };
    if (command.kind === "scene" && command.value === "sleep") {
      this.state = { ...this.state, mainLight: false, readingLight: true, airConditioner: true, curtainOpen: false, temperature: 21, scene: "sleep" };
    }
    if (command.kind === "scene" && command.value === "away") {
      this.state = { ...this.state, mainLight: false, readingLight: false, airConditioner: false, curtainOpen: false, scene: "away" };
    }
    return { ...this.state };
  }
}

export const demoReservationAdapter: ReservationAdapter = new DemoReservationAdapter();
export const demoAccessAdapter: AccessAdapter = new DemoAccessAdapter();
export const demoAutomationAdapter: AutomationAdapter = new DemoAutomationAdapter();
