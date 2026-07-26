import { useEffect, useState } from "react";
import { demoAccessAdapter, demoAutomationAdapter, demoReservationAdapter } from "./guest-journey.adapters";
import type { AutomationCommand, DemoAutomationState, DemoStay } from "./guest-journey.types";

export function useDemoJourney() {
  const [stay, setStay] = useState<DemoStay | null>(null);
  const [automation, setAutomation] = useState<DemoAutomationState | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void demoReservationAdapter.getFeaturedStay().then(async (nextStay) => {
      setStay(nextStay);
      setAutomation(await demoAutomationAdapter.getState(nextStay.id));
    });
  }, []);

  async function revealPin() {
    if (!stay) return;
    setPin(await demoAccessAdapter.getTemporaryPin(stay.id));
  }

  async function commandAutomation(command: AutomationCommand) {
    if (!stay || busy) return;
    setBusy(true);
    try {
      setAutomation(await demoAutomationAdapter.execute(stay.id, command));
    } finally {
      setBusy(false);
    }
  }

  return { stay, automation, pin, revealPin, commandAutomation, busy };
}
