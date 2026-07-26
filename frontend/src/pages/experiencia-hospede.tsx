import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  DoorOpen,
  ExternalLink,
  FileText,
  Home,
  Lightbulb,
  LockKeyhole,
  MapPin,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  UserRoundCheck,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../components/layout/page-header";
import { HotelMonacoLogo } from "../components/branding/hotel-monaco-logo";
import { SectionHeading } from "../components/layout/section-heading";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { SegmentedControl } from "../components/ui/segmented-control";
import { Switch } from "../components/ui/switch";
import { useToast } from "../components/ui/toast";
import { getDemoPublicUrl } from "../lib/demo-public-url";

type PreviewTab = "inicio" | "acesso" | "conforto" | "guia";

const previewTabs: Array<{ value: PreviewTab; label: string }> = [
  { value: "inicio", label: "Início" },
  { value: "acesso", label: "Acesso" },
  { value: "conforto", label: "Conforto" },
  { value: "guia", label: "Guia" },
];

const journeyItems = [
  { icon: QrCode, title: "Link e QR Code", description: "Acesso temporário à jornada da estadia.", status: "Disponível na prévia" },
  { icon: UserRoundCheck, title: "Check-in digital", description: "Confirmação de dados e orientações de chegada.", status: "Fluxo demonstrativo" },
  { icon: Wifi, title: "Wi-Fi e informações", description: "Credenciais e detalhes essenciais sempre visíveis.", status: "Disponível na prévia" },
  { icon: LockKeyhole, title: "Acesso inteligente", description: "Senha temporária e validade do acesso.", status: "Simulação visual" },
  { icon: Lightbulb, title: "Conforto e automação", description: "Controles independentes do fabricante.", status: "Simulação visual" },
];

export function ExperienciaHospedePage() {
  const [previewTab, setPreviewTab] = useState<PreviewTab>("inicio");
  const [lightsOn, setLightsOn] = useState(true);
  const [airOn, setAirOn] = useState(true);
  const { showToast } = useToast();

  function copyDemoLink() {
    void navigator.clipboard?.writeText(getDemoPublicUrl("/s/hotel-monaco-demo"));
    showToast("Link demonstrativo copiado.");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Experiência do Hóspede"
        description="Desenhe uma jornada simples, acolhedora e útil para cada etapa da hospedagem, mesmo em propriedades sem automação."
        badge="Prévia demonstrativa"
        actions={
          <>
            <Button variant="outline" onClick={copyDemoLink}><Copy className="size-4" />Copiar link</Button>
            <Button onClick={() => showToast("Prévia aberta em modo demonstrativo.")}><ExternalLink className="size-4" />Abrir prévia</Button>
          </>
        }
      />

      <div className="rounded-lg border border-accent/20 bg-accent/[0.07] px-4 py-3 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p><span className="font-semibold">Ambiente demonstrativo.</span> Claudio Palombo, Hotel Summit Monaco, códigos e dispositivos abaixo são fictícios e não acionam serviços externos.</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.45fr)]">
        <div className="space-y-5">
          <SectionHeading title="Jornada configurada" description="Uma visão do que o hóspede encontrará antes e durante a estadia." />
          <div className="space-y-2">
            {journeyItems.map((item, index) => (
              <button key={item.title} type="button" className="group flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition duration-product ease-product hover:-translate-y-px hover:border-input hover:shadow-soft" onClick={() => setPreviewTab(index === 3 ? "acesso" : index === 4 ? "conforto" : index === 2 ? "guia" : "inicio")}>
                <div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground transition-colors group-hover:bg-accent/[0.12] group-hover:text-accent"><item.icon className="size-[18px]" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p><p className="mt-2 text-xs font-medium text-accent">{item.status}</p></div>
                <ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>

          <Card variant="subtle">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-card text-accent shadow-xs"><ShieldCheck className="size-5" /></div>
              <div><p className="text-sm font-semibold">Acesso com validade</p><p className="mt-1 text-sm leading-5 text-muted-foreground">A experiência futura respeitará o período da reserva e o isolamento entre hóspedes.</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-4 bg-surface/60">
            <div><CardTitle>Prévia do portal</CardTitle><CardDescription>Visualização responsiva do que o hóspede receberá.</CardDescription></div>
            <Badge variant="success"><span className="size-1.5 rounded-full bg-current" />Online</Badge>
          </CardHeader>
          <CardContent className="bg-surface-sunken p-4 sm:p-8">
            <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[24px] border-[6px] border-foreground bg-card shadow-floating">
              <div className="flex h-7 items-center justify-center bg-foreground"><span className="h-1.5 w-16 rounded-full bg-background/30" /></div>
              <div className="min-h-[640px] bg-background">
                <div className="relative overflow-hidden bg-sidebar px-5 pb-6 pt-5 text-white">
                  <div className="absolute right-[-36px] top-[-44px] size-36 rounded-full border border-white/10" />
                  <div className="absolute right-[-8px] top-[-16px] size-20 rounded-full border border-white/10" />
                  <div className="relative flex items-center justify-between gap-3"><HotelMonacoLogo compact /><Badge className="border-white/15 bg-white/10 text-white" variant="outline">Suíte 901</Badge></div>
                  <div className="relative mt-8"><p className="text-xs text-white/60">Olá, Claudio</p><h2 className="mt-1 text-xl font-semibold">Bem-vindo ao Hotel Summit Monaco</h2><p className="mt-1 text-xs text-white/70">Estamos felizes em receber você.</p><div className="mt-4 flex items-center gap-4 text-xs text-white/70"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />Check-in confirmado</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />Guarulhos, SP</span></div></div>
                </div>

                <div className="border-b bg-card px-4 py-3">
                  <SegmentedControl value={previewTab} options={previewTabs} onChange={setPreviewTab} ariaLabel="Seções da prévia do hóspede" className="w-full" />
                </div>

                <div className="space-y-3 p-4">
                  {previewTab === "inicio" && <GuestHomePreview onOpenAccess={() => setPreviewTab("acesso")} />}
                  {previewTab === "acesso" && <GuestAccessPreview />}
                  {previewTab === "conforto" && <GuestComfortPreview lightsOn={lightsOn} airOn={airOn} setLightsOn={setLightsOn} setAirOn={setAirOn} />}
                  {previewTab === "guia" && <GuestGuidePreview />}
                </div>

                <div className="sticky bottom-0 flex items-center justify-around border-t bg-card/95 px-3 py-3 text-muted-foreground backdrop-blur">
                  <button type="button" className="flex flex-col items-center gap-1 text-[10px] font-medium text-accent" onClick={() => setPreviewTab("inicio")}><Home className="size-4" />Início</button>
                  <button type="button" className="flex flex-col items-center gap-1 text-[10px] font-medium" onClick={() => setPreviewTab("acesso")}><LockKeyhole className="size-4" />Acesso</button>
                  <button type="button" className="flex flex-col items-center gap-1 text-[10px] font-medium" onClick={() => setPreviewTab("guia")}><FileText className="size-4" />Guia</button>
                  <button type="button" className="flex flex-col items-center gap-1 text-[10px] font-medium"><MessageCircle className="size-4" />Contato</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Uma experiência independente de automação" description="A jornada mantém valor mesmo quando a propriedade não possui dispositivos conectados." />
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard icon={Smartphone} title="Antes da chegada" description="Link temporário, check-in digital, localização e orientações claras." />
          <FeatureCard icon={DoorOpen} title="Durante a estadia" description="Acesso, Wi-Fi, regras, contato e conforto em um único lugar." />
          <FeatureCard icon={CheckCircle2} title="No checkout" description="Instruções objetivas e encerramento tranquilo da experiência." />
        </div>
      </section>
    </div>
  );
}

function GuestHomePreview({ onOpenAccess }: { onOpenAccess: () => void }) {
  return (
    <>
      <div className="rounded-lg border bg-card p-4 shadow-xs"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-success/[0.12] text-success"><Check className="size-4" /></div><div><p className="text-sm font-semibold">Bem-vindo</p><p className="text-xs text-muted-foreground">Todos os serviços da sua hospedagem em um único lugar.</p></div></div></div>
      <button type="button" className="flex w-full items-center gap-3 rounded-lg bg-accent p-4 text-left text-accent-foreground shadow-soft" onClick={onOpenAccess}><div className="grid size-10 place-items-center rounded-md bg-white/15"><LockKeyhole className="size-5" /></div><div className="flex-1"><p className="text-sm font-semibold">Acessar a suíte</p><p className="mt-0.5 text-xs opacity-75">Código válido até 22 jul, 11:00</p></div><ArrowRight className="size-4" /></button>
      <div className="grid grid-cols-2 gap-3"><InfoTile icon={Wifi} label="Wi-Fi" value="Monaco_Guest_Demo" /><InfoTile icon={Snowflake} label="Climatização" value="22 °C" /></div>
      <div className="rounded-lg border bg-card p-4 shadow-xs"><p className="text-xs font-medium text-muted-foreground">Próximo passo</p><p className="mt-1 text-sm font-semibold">Como chegar e estacionar</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Veja o mapa e as orientações preparadas pelo anfitrião.</p></div>
    </>
  );
}

function GuestAccessPreview() {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-xs"><div><p className="text-xs text-muted-foreground">Senha da fechadura</p><p className="tabular-nums mt-1 text-2xl font-semibold">482 913</p></div><div className="grid size-11 place-items-center rounded-md bg-accent/[0.12] text-accent"><LockKeyhole className="size-5" /></div></div>
      <div className="rounded-lg border bg-card p-4 shadow-xs"><div className="flex justify-center"><QrCode className="size-28 text-foreground" strokeWidth={1.4} /></div><p className="mt-2 text-center text-xs text-muted-foreground">QR Code demonstrativo de acesso</p></div>
      <div className="rounded-lg border bg-card p-4 text-sm shadow-xs"><p className="font-semibold">Validade do acesso</p><div className="mt-3 space-y-2 text-xs text-muted-foreground"><div className="flex justify-between"><span>Início</span><span className="font-medium text-foreground">20 jul, 15:00</span></div><div className="flex justify-between"><span>Término</span><span className="font-medium text-foreground">22 jul, 11:00</span></div></div></div>
    </>
  );
}

function GuestComfortPreview({ lightsOn, airOn, setLightsOn, setAirOn }: { lightsOn: boolean; airOn: boolean; setLightsOn: (value: boolean) => void; setAirOn: (value: boolean) => void }) {
  return (
    <>
      <div className="rounded-lg border bg-card p-4 shadow-xs"><p className="text-sm font-semibold">Conforto da suíte</p><p className="mt-1 text-xs text-muted-foreground">Controles apenas demonstrativos.</p></div>
      <ControlRow icon={Lightbulb} title="Luzes principais" detail={lightsOn ? "Ligadas" : "Desligadas"} checked={lightsOn} onChange={setLightsOn} />
      <ControlRow icon={Snowflake} title="Ar-condicionado" detail={airOn ? "Ligado em 22 °C" : "Desligado"} checked={airOn} onChange={setAirOn} />
      <button type="button" className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left shadow-xs"><div className="grid size-9 place-items-center rounded-md bg-highlight/[0.14] text-highlight-foreground"><Sparkles className="size-4" /></div><div className="flex-1"><p className="text-sm font-semibold">Cena relaxar</p><p className="text-xs text-muted-foreground">Luz suave e temperatura confortável</p></div><ArrowRight className="size-4 text-muted-foreground" /></button>
    </>
  );
}

function GuestGuidePreview() {
  return (
    <>
      <InfoTile icon={Wifi} label="Rede Wi-Fi" value="Monaco_Guest_Demo" full />
      <div className="rounded-lg border bg-card p-4 shadow-xs"><p className="text-sm font-semibold">Informações da hospedagem</p><div className="mt-3 space-y-3"><GuideRow title="Café da manhã" value="07:30 às 10:00" /><GuideRow title="Silêncio" value="Após as 22:00" /><GuideRow title="Checkout" value="Até as 11:00" /></div></div>
      <div className="rounded-lg border bg-card p-4 shadow-xs"><p className="text-sm font-semibold">Contato do anfitrião</p><p className="mt-1 text-xs text-muted-foreground">Equipe Aurora · resposta média em 5 min</p><Button variant="outline" size="sm" className="mt-3 w-full"><MessageCircle className="size-4" />Enviar mensagem</Button></div>
    </>
  );
}

function InfoTile({ icon: Icon, label, value, full = false }: { icon: typeof Wifi; label: string; value: string; full?: boolean }) {
  return <div className={`rounded-lg border bg-card p-3.5 shadow-xs ${full ? "col-span-2" : ""}`}><Icon className="size-4 text-accent" /><p className="mt-3 text-[11px] text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-xs font-semibold">{value}</p></div>;
}

function ControlRow({ icon: Icon, title, detail, checked, onChange }: { icon: typeof Lightbulb; title: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-xs"><div className="grid size-9 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-[18px]" /></div><div className="flex-1"><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div><Switch checked={checked} onClick={() => onChange(!checked)} aria-label={`Alternar ${title.toLowerCase()}`} /></div>;
}

function GuideRow({ title, value }: { title: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{title}</span><span className="font-medium">{value}</span></div>;
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof Smartphone; title: string; description: string }) {
  return <Card variant="interactive"><CardContent className="p-5"><div className="grid size-10 place-items-center rounded-md bg-secondary text-muted-foreground"><Icon className="size-5" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>;
}
