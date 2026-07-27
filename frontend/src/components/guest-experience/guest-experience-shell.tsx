import { BedDouble, Car, Check, Coffee, Copy, DoorOpen, Lightbulb, LockKeyhole, Map, MapPin, Minus, Monitor, Phone, Plus, Sparkles, Thermometer, Utensils, Volume2, VolumeX, Wifi, Wind } from "lucide-react";
import { useState } from "react";
import { HotelMonacoLogo } from "../branding/hotel-monaco-logo";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

type Section = "inicio" | "acesso" | "conforto" | "guia";
type AutomationCommand = { kind: "toggle"; target: "mainLight" | "readingLight" | "airConditioner"; value: boolean } | { kind: "temperature"; value: number } | { kind: "scene"; value: "sleep" | "away" };

export type GuestExperienceShellProps = {
  embedded?: boolean;
  guestName?: string;
  hotelName?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  wifiNetwork: string;
  wifiPassword: string;
  receptionPhone: string;
  breakfast: string;
  checkoutTime: string;
  automation: { mainLight: boolean; readingLight: boolean; airConditioner: boolean; temperature: number; scene?: "sleep" | "away" | "custom" | null };
  onAutomationCommand?: (command: AutomationCommand) => void | Promise<void>;
  busy?: boolean;
  showToast: (message: string) => void;
};

export function GuestExperienceShell({ embedded = false, guestName = "Claudio", hotelName = "Hotel Summit Mônaco", location = "Guarulhos, São Paulo", checkIn = "29 jul · 14:00", checkOut = "30 jul · 12:00", wifiNetwork, wifiPassword, receptionPhone, breakfast, checkoutTime, automation, onAutomationCommand, busy = false, showToast }: GuestExperienceShellProps) {
  const [section, setSection] = useState<Section>("inicio");
  const [ledOn, setLedOn] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [tvOn, setTvOn] = useState(false);
  const [tvMuted, setTvMuted] = useState(false);
  const [volume, setVolume] = useState(16);
  const [channel, setChannel] = useState(12);

  async function copy(value: string, message: string) {
    await navigator.clipboard?.writeText(value);
    showToast(message);
  }

  const content = (
    <>
      <header className="relative overflow-hidden bg-sidebar text-white">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-highlight/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 pb-7 pt-5 sm:px-6">
          <div className="relative flex items-center justify-between gap-4"><HotelMonacoLogo /><div className="text-right"><p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Experiência digital por</p><p className="mt-1 text-xs font-semibold text-white/85">Essencial Stay</p></div></div>
          <div className="relative mt-9"><div className="flex flex-wrap items-center gap-2"><Badge className="border-white/15 bg-white/10 text-white" variant="outline">Suíte 809</Badge><Badge className="border-success/25 bg-success/20 text-white" variant="outline"><Check className="size-3" />Check-in confirmado</Badge></div><p className="mt-5 text-sm text-white/60">Bem-vindo, {guestName}!</p><h1 className="mt-1 text-2xl font-semibold">Sua suíte 809 está pronta.</h1><p className="mt-2 text-sm text-white/75">Aproveite sua estadia.</p><p className="mt-1 text-xs text-white/55">{hotelName}</p><p className="mt-4 flex items-center gap-2 text-sm text-white/65"><MapPin className="size-4" />{location}</p></div>
          <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.07] p-3 text-xs backdrop-blur"><div><span className="text-white/50">Check-in</span><p className="mt-1 font-medium">{checkIn}</p></div><div><span className="text-white/50">Checkout</span><p className="mt-1 font-medium">{checkOut}</p></div></div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
        {section === "inicio" && <>
          <SectionCard title="Acesso rápido"><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <QuickAction icon={DoorOpen} label="Abrir porta" onClick={() => { setSection("acesso"); showToast("Acesso temporário disponível."); }} />
            <QuickAction icon={Lightbulb} label="LED Cama" onClick={() => { setLedOn((value) => !value); showToast(`LED Cama ${ledOn ? "desligado" : "ligado"}.`); }} active={ledOn} />
            <QuickAction icon={Wind} label="Climatização" onClick={() => setSection("conforto")} />
            <QuickAction icon={Wifi} label="Wi-Fi" onClick={() => setWifiOpen(true)} />
            <QuickAction icon={Monitor} label="TV" onClick={() => setTvOpen(true)} />
            <QuickAction icon={Phone} label="Recepção" onClick={() => showToast("Recepção notificada em modo demonstrativo.")} />
            <QuickAction icon={Sparkles} label="Limpeza" onClick={() => showToast("Solicitação de limpeza registrada.")} />
            <QuickAction icon={Utensils} label="Restaurante" onClick={() => setRestaurantOpen(true)} />
            <QuickAction icon={Car} label="Uber" onClick={() => showToast("Transporte disponível em modo demonstrativo.")} />
            <QuickAction icon={Map} label="Guia da cidade" onClick={() => setSection("guia")} />
          </div></SectionCard>
          <div className="grid grid-cols-2 gap-3"><QuickInfo icon={Wifi} label="Wi-Fi" value={wifiNetwork} /><QuickInfo icon={Thermometer} label="Temperatura" value={`${automation.temperature} °C`} /></div>
          <SectionCard title="Sua hospedagem"><InfoRow label="Recepção" value={receptionPhone} /><InfoRow label="Café da manhã" value={breakfast} /><InfoRow label="Checkout" value={`Até ${checkoutTime}`} /></SectionCard>
        </>}
        {section === "acesso" && <><SectionCard title="Acesso temporário" badge="Credencial ativa"><p className="text-sm text-muted-foreground">Este acesso expira automaticamente ao final da hospedagem.</p><div className="mt-5 rounded-lg bg-surface p-5 text-center"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">PIN demonstrativo protegido</p><p className="tabular-nums mt-3 text-3xl font-semibold tracking-[0.25em]">••• •••</p><p className="mt-3 text-xs text-muted-foreground">Por segurança, o código permanece mascarado nesta demonstração.</p></div></SectionCard><SectionCard title="Validade"><InfoRow label="Início" value={checkIn} /><InfoRow label="Término" value={checkOut} /><InfoRow label="Tecnologia integrada" value="Simulação demonstrativa" /></SectionCard></>}
        {section === "conforto" && <><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Conforto</p><h2 className="mt-1 text-xl font-semibold">Seu ambiente</h2></div><Badge variant="highlight">Ambiente demonstrativo</Badge></div><Control label="Luz principal" detail={automation.mainLight ? "Ligada" : "Desligada"} icon={Lightbulb} active={automation.mainLight} disabled={busy} onClick={() => void onAutomationCommand?.({ kind: "toggle", target: "mainLight", value: !automation.mainLight })} /><Control label="Luz de leitura" detail={automation.readingLight ? "Ligada" : "Desligada"} icon={BedDouble} active={automation.readingLight} disabled={busy} onClick={() => void onAutomationCommand?.({ kind: "toggle", target: "readingLight", value: !automation.readingLight })} /><Control label="Ar-condicionado" detail={automation.airConditioner ? `Ligado em ${automation.temperature} °C` : "Desligado"} icon={Wind} active={automation.airConditioner} disabled={busy} onClick={() => void onAutomationCommand?.({ kind: "toggle", target: "airConditioner", value: !automation.airConditioner })} /><div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-xs"><div><p className="font-medium">Temperatura</p><p className="text-sm text-muted-foreground">Ajuste simulado</p></div><div className="flex items-center gap-3"><button type="button" aria-label="Diminuir temperatura" disabled={busy || automation.temperature <= 18} className="grid size-9 place-items-center rounded-md border disabled:opacity-40" onClick={() => void onAutomationCommand?.({ kind: "temperature", value: automation.temperature - 1 })}><Minus className="size-4" /></button><span className="tabular-nums w-10 text-center font-semibold">{automation.temperature}°</span><button type="button" aria-label="Aumentar temperatura" disabled={busy || automation.temperature >= 25} className="grid size-9 place-items-center rounded-md border disabled:opacity-40" onClick={() => void onAutomationCommand?.({ kind: "temperature", value: automation.temperature + 1 })}><Plus className="size-4" /></button></div></div></>}
        {section === "guia" && <><SectionCard title="Informações úteis"><InfoRow label="Recepção" value={receptionPhone} /><InfoRow label="Café da manhã" value={breakfast} /><InfoRow label="Silêncio" value="Após as 22:00" /><InfoRow label="Limpeza" value="Solicite até 10:00 na recepção" /></SectionCard><SectionCard title="Guia local"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Guide icon={Utensils} label="Restaurantes" /><Guide icon={Coffee} label="Cafés" /><Guide icon={Car} label="Transporte" /></div></SectionCard></>}
      </div>
      <nav className="sticky bottom-0 z-40 border-t bg-card/95 backdrop-blur"><div className="mx-auto grid max-w-3xl grid-cols-4 px-2 py-2"><NavButton label="Início" icon={BedDouble} active={section === "inicio"} onClick={() => setSection("inicio")} /><NavButton label="Acesso" icon={LockKeyhole} active={section === "acesso"} onClick={() => setSection("acesso")} /><NavButton label="Conforto" icon={Lightbulb} active={section === "conforto"} onClick={() => setSection("conforto")} /><NavButton label="Guia" icon={MapPin} active={section === "guia"} onClick={() => setSection("guia")} /></div></nav>
      <p className="pb-2 pt-3 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Ambiente demonstrativo</p>
      <WifiModal open={wifiOpen} onClose={() => setWifiOpen(false)} network={wifiNetwork} password={wifiPassword} onCopy={copy} />
      <TvModal open={tvOpen} onClose={() => setTvOpen(false)} on={tvOn} muted={tvMuted} volume={volume} channel={channel} setOn={setTvOn} setMuted={setTvMuted} setVolume={setVolume} setChannel={setChannel} />
      <RestaurantModal open={restaurantOpen} onClose={() => setRestaurantOpen(false)} />
    </>
  );
  return <main className={embedded ? "min-h-full bg-surface-sunken" : "min-h-screen bg-surface-sunken"}>{content}</main>;
}

function WifiModal({ open, onClose, network, password, onCopy }: { open: boolean; onClose: () => void; network: string; password: string; onCopy: (value: string, message: string) => Promise<void> }) { return <Modal open={open} onClose={onClose} title="Wi-Fi da hospedagem" description="Conecte-se sem sair da sua experiência."><div className="space-y-3"><InfoRow label="Rede" value={network} /><InfoRow label="Senha demonstrativa" value={password} /><div className="grid grid-cols-2 gap-2"><Button autoFocus variant="outline" onClick={() => void onCopy(network, "Rede copiada.")}><Copy className="size-4" />Copiar rede</Button><Button variant="accent" onClick={() => void onCopy(password, "Senha copiada.")}><Copy className="size-4" />Copiar senha</Button></div></div></Modal>; }
function TvModal({ open, onClose, on, muted, volume, channel, setOn, setMuted, setVolume, setChannel }: { open: boolean; onClose: () => void; on: boolean; muted: boolean; volume: number; channel: number; setOn: (value: boolean) => void; setMuted: (value: boolean) => void; setVolume: (value: number) => void; setChannel: (value: number) => void }) { const enabled = on ? "" : "opacity-50"; return <Modal open={open} onClose={onClose} title="TV da suíte" description="Controle demonstrativo, sem integração com dispositivos."><div className="space-y-4"><Button autoFocus className="w-full" variant={on ? "accent" : "outline"} onClick={() => setOn(!on)}>{on ? "Desligar" : "Ligar"}</Button><div className={`grid grid-cols-2 gap-3 ${enabled}`}><ControlButton label="Volume –" disabled={!on} onClick={() => setVolume(Math.max(0, volume - 1))} /><ControlButton label="Volume +" disabled={!on} onClick={() => setVolume(Math.min(30, volume + 1))} /><ControlButton label="Canal –" disabled={!on} onClick={() => setChannel(Math.max(1, channel - 1))} /><ControlButton label="Canal +" disabled={!on} onClick={() => setChannel(channel + 1)} /><Button variant="outline" disabled={!on} className="col-span-2" onClick={() => setMuted(!muted)}>{muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}{muted ? "Ativar som" : "Mudo"}</Button></div><div className="flex justify-between rounded-md bg-surface p-3 text-sm"><span>Canal {channel}</span><span>{muted ? "Mudo" : `Volume ${volume}`}</span></div></div></Modal>; }
function RestaurantModal({ open, onClose }: { open: boolean; onClose: () => void }) { return <Modal open={open} onClose={onClose} title="Restaurante" description="Sabores preparados para a sua estadia."><div className="space-y-3"><InfoRow label="Café da manhã" value="07:00 às 10:00" /><InfoRow label="Almoço" value="12:00 às 15:00" /><InfoRow label="Jantar" value="19:00 às 22:30" /><div className="rounded-md bg-highlight/[0.1] p-3 text-sm"><p className="font-medium">Serviço de quarto</p><p className="mt-1 text-muted-foreground">Pedido pelo quarto em breve.</p></div><Button autoFocus variant="outline" className="w-full" onClick={onClose}>Fechar cardápio</Button></div></Modal>; }
function ControlButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) { return <Button variant="outline" disabled={disabled} onClick={onClick} aria-label={label}>{label}</Button>; }
function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) { return <section className="rounded-lg border bg-card p-5 shadow-xs"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{title}</h2>{badge && <Badge variant="success">{badge}</Badge>}</div><div className="mt-4">{children}</div></section>; }
function QuickInfo({ icon: Icon, label, value }: { icon: typeof Wifi; label: string; value: string }) { return <div className="rounded-lg border bg-card p-4 shadow-xs"><Icon className="size-5 text-accent" /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>; }
function QuickAction({ icon: Icon, label, onClick, active = false }: { icon: typeof Wifi; label: string; onClick: () => void; active?: boolean }) { return <button type="button" onClick={onClick} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border bg-background p-3 text-center transition duration-product ease-product hover:-translate-y-0.5 hover:border-highlight/40 hover:shadow-soft active:translate-y-0" aria-label={label}><span className={`grid size-9 place-items-center rounded-full transition ${active ? "bg-accent text-accent-foreground" : "bg-highlight/[0.1] text-highlight group-hover:bg-highlight group-hover:text-highlight-foreground"}`}><Icon className="size-[18px]" /></span><span className="text-xs font-medium">{label}</span></button>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b py-3 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>; }
function Control({ label, detail, icon: Icon, active, disabled, onClick }: { label: string; detail: string; icon: typeof Lightbulb; active: boolean; disabled: boolean; onClick: () => void }) { return <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left shadow-xs transition duration-product hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"><div className={`grid size-10 place-items-center rounded-md transition ${active ? "bg-accent/[0.12] text-accent" : "bg-secondary text-muted-foreground"}`}><Icon className="size-5" /></div><div className="flex-1"><p className="font-medium">{label}</p><p className="text-sm text-muted-foreground">{detail}</p></div><span className={`h-6 w-11 rounded-full p-0.5 transition ${active ? "bg-accent" : "bg-input"}`}><span className={`block size-5 rounded-full bg-white shadow transition ${active ? "translate-x-5" : ""}`} /></span></button>; }
function Guide({ icon: Icon, label }: { icon: typeof MapPin; label: string }) { return <button type="button" className="flex items-center gap-2 rounded-md bg-surface p-3 text-left text-xs font-medium"><Icon className="size-4 text-accent" />{label}</button>; }
function NavButton({ label, icon: Icon, active, onClick }: { label: string; icon: typeof BedDouble; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium ${active ? "text-accent" : "text-muted-foreground"}`}><Icon className="size-5" />{label}</button>; }
