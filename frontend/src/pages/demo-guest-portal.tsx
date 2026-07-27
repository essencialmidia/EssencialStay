import { GuestExperienceShell } from "../components/guest-experience/guest-experience-shell";
import { useToast } from "../components/ui/toast";
import { useDemoJourney } from "../demo/use-demo-journey";

export function DemoGuestPortalPage() {
  const { stay, automation, commandAutomation, busy } = useDemoJourney();
  const { showToast } = useToast();

  if (!stay || !automation) return <PortalSkeleton />;

  return <GuestExperienceShell
    guestName="Claudio"
    wifiNetwork={stay.wifi.network}
    wifiPassword={stay.wifi.password}
    receptionPhone={stay.receptionPhone}
    breakfast={stay.breakfast}
    checkoutTime={stay.checkoutTime}
    automation={automation}
    onAutomationCommand={commandAutomation}
    busy={busy}
    showToast={showToast}
  />;
}

function PortalSkeleton() {
  return <div className="min-h-screen animate-pulse bg-surface-sunken"><div className="h-80 bg-sidebar" /><div className="mx-auto max-w-3xl space-y-4 px-4 py-5"><div className="h-24 rounded-lg bg-card" /><div className="grid grid-cols-2 gap-3"><div className="h-28 rounded-lg bg-card" /><div className="h-28 rounded-lg bg-card" /></div><div className="h-48 rounded-lg bg-card" /></div><span className="sr-only">Preparando sua experiência</span></div>;
}
