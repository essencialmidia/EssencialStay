import { useState } from "react";
import { SimpleAutomationLab } from "../components/automation-lab/simple-automation-lab";
import { AutomationLabTechnicalMode } from "./automation-lab-technical";

export function AutomationLabPage() {
  const [technicalMode, setTechnicalMode] = useState(false);
  return technicalMode
    ? <AutomationLabTechnicalMode onExitTechnicalMode={() => setTechnicalMode(false)} />
    : <SimpleAutomationLab onOpenTechnicalMode={() => setTechnicalMode(true)} />;
}
