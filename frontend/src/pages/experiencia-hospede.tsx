import { ArrowRight, CheckCircle2, Copy, DoorOpen, ExternalLink, Lightbulb, LockKeyhole, QrCode, ShieldCheck, Smartphone, Sparkles, UserRoundCheck, Wifi } from "lucide-react";
import { useState } from "react";
import { GuestExperienceShell } from "../components/guest-experience/guest-experience-shell";
import { PageHeader } from "../components/layout/page-header";
import { SectionHeading } from "../components/layout/section-heading";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../components/ui/toast";
import { getDemoPublicUrl } from "../lib/demo-public-url";

const journeyItems = [
  { icon: QrCode, title: "Link e QR Code", description: "Acesso temporário à jornada da estadia.", status: "Disponível na prévia" },
  { icon: UserRoundCheck, title: "Check-in digital", description: "Confirmação de dados e orientações de chegada.", status: "Fluxo demonstrativo" },
  { icon: Wifi, title: "Wi-Fi e informações", description: "Credenciais e detalhes essenciais sempre visíveis.", status: "Disponível na prévia" },
  { icon: LockKeyhole, title: "Acesso inteligente", description: "Senha temporária e validade do acesso.", status: "Simulação visual" },
  { icon: Lightbulb, title: "Conforto e automação", description: "Controles independentes do fabricante.", status: "Simulação visual" },
];

export function ExperienciaHospedePage() {
  const { showToast } = useToast();
  function copyDemoLink() { void navigator.clipboard?.writeText(getDemoPublicUrl("/s/hotel-monaco-demo")); showToast("Link demonstrativo copiado."); }
  return <div className="space-y-8"><PageHeader title="Experiência do Hóspede" description="Desenhe uma jornada simples, acolhedora e útil para cada etapa da hospedagem, mesmo em propriedades sem automação." badge="Prévia demonstrativa" actions={<><Button variant="outline" onClick={copyDemoLink}><Copy className="size-4" />Copiar link</Button><Button onClick={() => window.open(getDemoPublicUrl("/s/hotel-monaco-demo"), "_blank", "noopener,noreferrer")}><ExternalLink className="size-4" />Abrir prévia</Button></>} />
    <div className="rounded-lg border border-accent/20 bg-accent/[0.07] px-4 py-3 text-sm text-foreground"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /><p><span className="font-semibold">Ambiente demonstrativo.</span> Claudio Palombo, Hotel Summit Mônaco, códigos e dispositivos abaixo são fictícios e não acionam serviços externos.</p></div></div>
    <section className="grid gap-6 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.45fr)]"><div className="space-y-5"><SectionHeading title="Jornada configurada" description="Uma visão do que o hóspede encontrará antes e durante a estadia." /><div className="space-y-2">{journeyItems.map((item) => <div key={item.title} className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-xs"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground"><item.icon className="size-[18px]" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p><p className="mt-2 text-xs font-medium text-accent">{item.status}</p></div><ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground" /></div>)}</div><Card variant="subtle"><CardContent className="flex items-center gap-4 p-5"><div className="grid size-10 shrink-0 place-items-center rounded-md bg-card text-accent shadow-xs"><ShieldCheck className="size-5" /></div><div><p className="text-sm font-semibold">Acesso com validade</p><p className="mt-1 text-sm leading-5 text-muted-foreground">A experiência futura respeitará o período da reserva e o isolamento entre hóspedes.</p></div></CardContent></Card></div>
      <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between gap-4 bg-surface/60"><div><CardTitle>Prévia do portal</CardTitle><CardDescription>Mesma base visual e interativa da experiência pública.</CardDescription></div><Badge variant="success"><span className="size-1.5 rounded-full bg-current" />Online</Badge></CardHeader><CardContent className="bg-surface-sunken p-4 sm:p-8"><div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[24px] border-[6px] border-foreground bg-card shadow-floating"><div className="flex h-7 items-center justify-center bg-foreground"><span className="h-1.5 w-16 rounded-full bg-background/30" /></div><GuestExperienceAdminPreview /></div></CardContent></Card>
    </section><section className="space-y-4"><SectionHeading title="Uma experiência independente de automação" description="A jornada mantém valor mesmo quando a propriedade não possui dispositivos conectados." /><div className="grid gap-4 md:grid-cols-3"><FeatureCard icon={Smartphone} title="Antes da chegada" description="Link temporário, check-in digital, localização e orientações claras." /><FeatureCard icon={DoorOpen} title="Durante a estadia" description="Acesso, Wi-Fi, regras, contato e conforto em um único lugar." /><FeatureCard icon={CheckCircle2} title="No checkout" description="Instruções objetivas e encerramento tranquilo da experiência." /></div></section>
  </div>;
}

function GuestExperienceAdminPreview() {
  const { showToast } = useToast();
  const [automation, setAutomation] = useState({ mainLight: true, readingLight: false, airConditioner: true, temperature: 22, scene: null as "sleep" | "away" | null });
  return <GuestExperienceShell embedded guestName="Claudio" wifiNetwork="Monaco_Guest_Demo" wifiPassword="monaco-demo-2026" receptionPhone="(11) 2440-8090" breakfast="07:00 às 10:00" checkoutTime="12:00" automation={automation} showToast={showToast} onAutomationCommand={(command) => setAutomation((current) => command.kind === "toggle" ? { ...current, [command.target]: command.value } : command.kind === "temperature" ? { ...current, temperature: command.value } : { ...current, scene: command.value })} />;
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Smartphone; title: string; description: string }) { return <Card variant="interactive"><CardContent className="p-5"><div className="grid size-10 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-5" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>; }
