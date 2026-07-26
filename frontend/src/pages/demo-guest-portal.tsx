import { Bath, BedDouble, Car, Check, Coffee, Copy, DoorOpen, Eye, EyeOff, Hospital, Lightbulb, LockKeyhole, LogOut, Map, MapPin, Minus, Moon, Phone, Plus, ShoppingBag, Sparkles, Star, Store, Sun, Thermometer, Utensils, Wifi, Wind } from "lucide-react";
import { useState } from "react";
import { HotelMonacoLogo } from "../components/branding/hotel-monaco-logo";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useDemoJourney } from "../demo/use-demo-journey";

type PortalSection = "inicio" | "acesso" | "conforto" | "guia";

export function DemoGuestPortalPage() {
  const [section, setSection] = useState<PortalSection>("inicio");
  const [pinVisible, setPinVisible] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [bathroomLight, setBathroomLight] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const { stay, automation, pin, revealPin, commandAutomation, busy } = useDemoJourney();
  const { showToast } = useToast();

  if (!stay || !automation) return <PortalSkeleton />;

  async function showPin() {
    if (!pin) await revealPin();
    setPinVisible(true);
  }

  async function copy(value: string, message: string) {
    await navigator.clipboard?.writeText(value);
    showToast(message);
  }

  return (
    <main className="min-h-screen bg-surface-sunken pb-24">
      <header className="relative overflow-hidden bg-sidebar text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-highlight/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 pb-7 pt-5 sm:px-6">
          <div className="relative flex items-center justify-between gap-4"><HotelMonacoLogo /><div className="text-right"><p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Experiência digital por</p><p className="mt-1 text-xs font-semibold text-white/85">Essencial Stay</p></div></div>
          <div className="relative mt-9"><div className="flex flex-wrap items-center gap-2"><Badge className="border-white/15 bg-white/10 text-white" variant="outline">{stay.unit}</Badge><Badge className="border-success/25 bg-success/20 text-white" variant="outline"><Check className="size-3" />Check-in confirmado</Badge></div><p className="mt-5 text-sm text-white/60">Olá, {stay.guestFirstName}.</p><h1 className="mt-1 text-2xl font-semibold">Bem-vindo ao Hotel Summit Monaco</h1><p className="mt-2 text-sm text-white/75">Estamos felizes em receber você.</p><p className="mt-1 text-xs text-white/55">Todos os serviços da sua hospedagem em um único lugar.</p><p className="mt-4 flex items-center gap-2 text-sm text-white/65"><MapPin className="size-4" />Guarulhos, São Paulo</p></div>
          <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.07] p-3 text-xs backdrop-blur">
            <div><span className="text-white/50">Check-in</span><p className="mt-1 font-medium">29 jul · 14:00</p></div>
            <div><span className="text-white/50">Checkout</span><p className="mt-1 font-medium">30 jul · 12:00</p></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
        {section === "inicio" && (
          <>
            <div className="flex items-center gap-3 rounded-lg border bg-gradient-to-br from-card to-success/[0.04] p-5 shadow-xs"><div className="grid size-11 place-items-center rounded-full bg-success/[0.12] text-success"><Check className="size-5" /></div><div><p className="font-semibold">Bem-vindo</p><p className="text-sm text-muted-foreground">Sua experiência está pronta, Claudio.</p></div></div>
            <SectionCard title="Acesso rápido">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <QuickAction icon={DoorOpen} label="Abrir porta" onClick={() => { setSection("acesso"); showToast("Acesso temporário disponível."); }} />
                <QuickAction icon={Lightbulb} label="Luzes" onClick={() => setSection("conforto")} />
                <QuickAction icon={Wind} label="Climatização" onClick={() => setSection("conforto")} />
                <QuickAction icon={Wifi} label="Wi-Fi" onClick={() => setSection("guia")} />
                <QuickAction icon={Phone} label="Recepção" onClick={() => showToast("Recepção notificada em modo demonstrativo.")} />
                <QuickAction icon={Sparkles} label="Limpeza" onClick={() => showToast("Solicitação de limpeza registrada.")} />
                <QuickAction icon={Utensils} label="Restaurantes" onClick={() => setSection("guia")} />
                <QuickAction icon={Car} label="Uber" onClick={() => showToast("Transporte disponível em modo demonstrativo.")} />
                <QuickAction icon={Map} label="Guia da cidade" onClick={() => setSection("guia")} />
                <QuickAction icon={LogOut} label="Checkout" onClick={() => document.getElementById("checkout-demo")?.scrollIntoView({ behavior: "smooth" })} />
              </div>
            </SectionCard>
            <div className="grid grid-cols-2 gap-3"><QuickInfo icon={Wifi} label="Wi-Fi" value={stay.wifi.network} /><QuickInfo icon={Thermometer} label="Suíte" value={`${automation.temperature} °C`} /></div>
            <SectionCard title="Sua hospedagem"><InfoRow label="Recepção" value={stay.receptionPhone} /><InfoRow label="Café da manhã" value={stay.breakfast} /><InfoRow label="Checkout" value={`Até ${stay.checkoutTime}`} /></SectionCard>
            <SectionCard title="Checkout">
              <div id="checkout-demo">
                <p className="text-sm font-medium">Esperamos que sua hospedagem tenha sido excelente.</p>
                {checkoutDone ? <div className="mt-4 flex items-center gap-3 rounded-md bg-success/[0.1] p-3 text-sm text-success"><Check className="size-4" />Checkout demonstrativo solicitado.</div> : <div className="mt-4 grid gap-2 sm:grid-cols-2"><Button variant="accent" onClick={() => { setCheckoutDone(true); showToast("Checkout demonstrativo solicitado."); }}><LogOut className="size-4" />Solicitar checkout</Button><Button variant="outline" onClick={() => showToast("Obrigado por avaliar sua experiência.")}><Star className="size-4" />Avaliar experiência</Button></div>}
              </div>
            </SectionCard>
          </>
        )}

        {section === "acesso" && (
          <>
            <SectionCard title="Acesso temporário" badge="Credencial ativa">
              <p className="text-sm text-muted-foreground">Este acesso expira automaticamente ao final da hospedagem.</p>
              <div className="mt-5 rounded-lg bg-surface p-5 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">PIN demonstrativo</p>
                <p className="tabular-nums mt-3 text-3xl font-semibold tracking-[0.25em]">{pinVisible && pin ? `${pin.slice(0, 3)} ${pin.slice(3)}` : "••• •••"}</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => pinVisible ? setPinVisible(false) : void showPin()}>{pinVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{pinVisible ? "Ocultar PIN" : "Mostrar PIN"}</Button>
              </div>
              <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" disabled={!pinVisible || !pin} onClick={() => pin && void copy(pin, "PIN demonstrativo copiado.")}><Copy className="size-4" />Copiar</Button></div>
              <div className="mt-4 rounded-md border border-warning/25 bg-warning/[0.08] p-3 text-xs leading-5">Este código é temporário e fictício. Não compartilhe códigos reais fora da sua hospedagem.</div>
            </SectionCard>
            <SectionCard title="Validade"><InfoRow label="Início" value="29/07/2026 · 14:00" /><InfoRow label="Término" value="30/07/2026 · 12:00" /><InfoRow label="Tecnologia integrada" value="Akubela · simulação" /></SectionCard>
          </>
        )}

        {section === "conforto" && (
          <>
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Conforto</p><h2 className="mt-1 text-xl font-semibold">Seu ambiente</h2></div><Badge variant="highlight">Ambiente demonstrativo</Badge></div>
            <Control label="Luz principal" detail={automation.mainLight ? "Ligada" : "Desligada"} icon={Lightbulb} active={automation.mainLight} disabled={busy} onClick={() => void commandAutomation({ kind: "toggle", target: "mainLight", value: !automation.mainLight })} />
            <Control label="Luz de leitura" detail={automation.readingLight ? "Ligada" : "Desligada"} icon={BedDouble} active={automation.readingLight} disabled={busy} onClick={() => void commandAutomation({ kind: "toggle", target: "readingLight", value: !automation.readingLight })} />
            <Control label="Luz do banheiro" detail={bathroomLight ? "Ligada" : "Desligada"} icon={Bath} active={bathroomLight} disabled={busy} onClick={() => { setBathroomLight((value) => !value); showToast(`Luz do banheiro ${bathroomLight ? "desligada" : "ligada"}.`); }} />
            <Control label="Ar-condicionado" detail={automation.airConditioner ? `Ligado em ${automation.temperature} °C` : "Desligado"} icon={Wind} active={automation.airConditioner} disabled={busy} onClick={() => void commandAutomation({ kind: "toggle", target: "airConditioner", value: !automation.airConditioner })} />
            <Control label="Cortina" detail={automation.curtainOpen ? "Aberta" : "Fechada"} icon={Sun} active={automation.curtainOpen} disabled={busy} onClick={() => void commandAutomation({ kind: "toggle", target: "curtainOpen", value: !automation.curtainOpen })} />
            <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-xs"><div><p className="font-medium">Temperatura</p><p className="text-sm text-muted-foreground">Ajuste simulado</p></div><div className="flex items-center gap-3"><button aria-label="Diminuir temperatura" disabled={busy || automation.temperature <= 18} className="grid size-9 place-items-center rounded-md border disabled:opacity-40" onClick={() => void commandAutomation({ kind: "temperature", value: automation.temperature - 1 })}><Minus className="size-4" /></button><span className="tabular-nums w-10 text-center font-semibold">{automation.temperature}°</span><button aria-label="Aumentar temperatura" disabled={busy || automation.temperature >= 25} className="grid size-9 place-items-center rounded-md border disabled:opacity-40" onClick={() => void commandAutomation({ kind: "temperature", value: automation.temperature + 1 })}><Plus className="size-4" /></button></div></div>
            <div className="grid grid-cols-3 gap-3"><Scene icon={Moon} label="Dormir" active={automation.scene === "sleep"} onClick={() => { setCinemaMode(false); void commandAutomation({ kind: "scene", value: "sleep" }); showToast("Modo dormir ativado."); }} /><Scene icon={Sparkles} label="Sair" active={automation.scene === "away"} onClick={() => { setCinemaMode(false); void commandAutomation({ kind: "scene", value: "away" }); showToast("Modo sair ativado."); }} /><Scene icon={Star} label="Cinema" active={cinemaMode} onClick={() => { setCinemaMode(true); showToast("Modo cinema ativado."); }} /></div>
          </>
        )}

        {section === "guia" && (
          <>
            <SectionCard title="Wi-Fi"><p className="mb-3 text-sm text-muted-foreground">Conecte-se automaticamente.</p><InfoRow label="Rede" value={stay.wifi.network} /><InfoRow label="Senha fictícia" value={stay.wifi.password} /><Button variant="accent" size="sm" className="mt-3 w-full" onClick={() => void copy(stay.wifi.password, "Senha de Wi-Fi copiada.")}><Copy className="size-4" />Copiar senha</Button></SectionCard>
            <SectionCard title="Informações úteis"><InfoRow label="Recepção" value={stay.receptionPhone} /><InfoRow label="Café da manhã" value={stay.breakfast} /><InfoRow label="Silêncio" value="Após as 22:00" /><InfoRow label="Limpeza" value="Solicite até 10:00 na recepção" /><InfoRow label="Emergências" value="Procure a recepção imediatamente" /></SectionCard>
            <SectionCard title="Guia local"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Guide icon={Utensils} label="Restaurantes" /><Guide icon={Coffee} label="Cafés" /><Guide icon={Store} label="Mercado" /><Guide icon={ShoppingBag} label="Farmácia" /><Guide icon={Car} label="Transporte" /><Guide icon={Hospital} label="Hospital" /></div><p className="mt-3 text-xs text-muted-foreground">Sugestões selecionadas para esta demonstração.</p></SectionCard>
            <Button variant="outline" className="w-full"><Phone className="size-4" />Falar com a recepção</Button>
          </>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-2">
          <NavButton label="Início" icon={BedDouble} active={section === "inicio"} onClick={() => setSection("inicio")} />
          <NavButton label="Acesso" icon={LockKeyhole} active={section === "acesso"} onClick={() => setSection("acesso")} />
          <NavButton label="Conforto" icon={Lightbulb} active={section === "conforto"} onClick={() => setSection("conforto")} />
          <NavButton label="Guia" icon={MapPin} active={section === "guia"} onClick={() => setSection("guia")} />
        </div>
      </nav>
      <footer className="pb-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Ambiente demonstrativo</footer>
    </main>
  );
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-card p-5 shadow-xs"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{badge && <Badge variant="success">{badge}</Badge>}</div><div className="mt-4">{children}</div></section>;
}
function QuickInfo({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) { return <div className="rounded-lg border bg-card p-4 shadow-xs"><Icon className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>; }
function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Wifi; label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-background p-3 text-center transition duration-product ease-product hover:-translate-y-0.5 hover:border-highlight/40 hover:shadow-soft active:translate-y-0"><span className="grid size-9 place-items-center rounded-full bg-highlight/[0.1] text-highlight transition group-hover:bg-highlight group-hover:text-highlight-foreground"><Icon className="size-[18px]" /></span><span className="text-xs font-medium">{label}</span></button>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b py-3 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>; }
function Control({ label, detail, icon: Icon, active, disabled, onClick }: { label: string; detail: string; icon: typeof Lightbulb; active: boolean; disabled: boolean; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-xs transition duration-product hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"><div className={`grid size-10 place-items-center rounded-md transition ${active ? "bg-accent/[0.12] text-accent" : "bg-secondary text-muted-foreground"}`}><Icon className="size-5" /></div><div className="flex-1"><p className="font-medium">{label}</p><p className="text-sm text-muted-foreground">{detail}</p></div><span className={`h-6 w-11 rounded-full p-0.5 transition ${active ? "bg-accent" : "bg-input"}`}><span className={`block size-5 rounded-full bg-white shadow transition ${active ? "translate-x-5" : ""}`} /></span></button>; }
function Scene({ icon: Icon, label, active, onClick }: { icon: typeof Moon; label: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-lg border p-4 text-left shadow-xs ${active ? "border-accent bg-accent/[0.08]" : "bg-card"}`}><Icon className="size-5 text-accent" /><p className="mt-3 text-sm font-semibold">{label}</p></button>; }
function Guide({ icon: Icon, label }: { icon: typeof MapPin; label: string }) { return <button type="button" className="flex items-center gap-2 rounded-md bg-surface p-3 text-left text-xs font-medium"><Icon className="size-4 text-accent" />{label}</button>; }
function NavButton({ label, icon: Icon, active, onClick }: { label: string; icon: typeof BedDouble; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium ${active ? "text-accent" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>; }
function PortalSkeleton() { return <div className="min-h-screen animate-pulse bg-surface-sunken"><div className="h-80 bg-sidebar" /><div className="mx-auto max-w-3xl space-y-4 px-4 py-5"><div className="h-24 rounded-lg bg-card" /><div className="grid grid-cols-2 gap-3"><div className="h-28 rounded-lg bg-card" /><div className="h-28 rounded-lg bg-card" /></div><div className="h-48 rounded-lg bg-card" /></div><span className="sr-only">Preparando sua experiência</span></div>; }
