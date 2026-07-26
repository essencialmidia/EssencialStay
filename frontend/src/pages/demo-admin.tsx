import { ArrowRight, Building2, CalendarDays, Check, CheckCircle2, Clock3, Expand, ExternalLink, Hotel, QrCode, Radio, Sparkles, UserRound } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/navigation/brand-mark";
import { HotelMonacoLogo } from "../components/branding/hotel-monaco-logo";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { demoStay } from "../demo/guest-journey.fixture";
import { getDemoPublicUrl } from "../lib/demo-public-url";

export function DemoAdminPage() {
  const portalPath = "/s/hotel-monaco-demo";
  const portalUrl = getDemoPublicUrl(portalPath);

  async function enterPresentationMode() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // O navegador pode bloquear tela cheia; a página já usa um layout limpo de apresentação.
    }
  }

  return (
    <main className="min-h-screen bg-surface-sunken">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void enterPresentationMode()}><Expand className="size-4" />Modo apresentação</Button>
            <Badge variant="highlight"><Radio className="size-3" />Ambiente demonstrativo</Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-8 overflow-hidden rounded-lg bg-sidebar px-6 py-8 text-white shadow-medium sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Experiência digital do hóspede</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Da reserva à estadia, tudo conectado.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">O PMS continua cuidando das reservas. A Essencial Stay prepara acesso, automação, informações e checkout em uma única jornada.</p>
          </div>
          <div className="shrink-0"><HotelMonacoLogo className="h-24 w-56" /></div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Summary icon={Building2} label="Empresa cliente" value={demoStay.company} />
          <Summary icon={Hotel} label="Propriedade" value={demoStay.property} />
          <Summary icon={CalendarDays} label="Nova hospedagem" value={demoStay.checkIn} />
          <Summary icon={Sparkles} label="Experiência" value={demoStay.experienceStatus} accent />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_.8fr]">
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="success">Nova hospedagem</Badge><Badge variant="muted">{demoStay.source}</Badge></div>
                  <h2 className="mt-3 text-xl font-semibold">{demoStay.guestDisplayName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{demoStay.property} · {demoStay.unit}</p>
                </div>
                <Link to={portalPath} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground shadow-xs transition hover:bg-accent/90">
                  Abrir portal <ExternalLink className="size-4" />
                </Link>
              </div>
              <div className="grid gap-px bg-border sm:grid-cols-3">
                <Detail icon={UserRound} label="Hóspede" value={demoStay.guestDisplayName} />
                <Detail icon={Clock3} label="Check-in" value={demoStay.checkIn} />
                <Detail icon={Clock3} label="Checkout" value={demoStay.checkOut} />
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <Status label="Status da experiência" value={demoStay.experienceStatus} />
                <Status label="Senha temporária" value={demoStay.accessStatus} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col items-center p-6 text-center">
              <div className="flex items-center gap-2 self-start"><QrCode className="size-5 text-accent" /><h2 className="font-semibold">Portal no celular</h2></div>
              <LocalPortalQr portalUrl={portalUrl} />
              <p className="mt-4 text-sm font-medium">Aponte a câmera para acessar</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{portalUrl}</p>
              <Link to={portalPath} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground shadow-xs transition hover:bg-accent/90">
                Abrir Portal do Hóspede <ExternalLink className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Preparação automática</p><h2 className="mt-1 text-xl font-semibold">Experiência pronta para receber Claudio</h2></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {demoStay.journey.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-success/[0.12] text-success"><Check className="size-4" /></div>
                  <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Etapa {index + 1}</p><p className="mt-1 text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/[0.07] p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-info" />
          <p><strong>Demonstração segura:</strong> reserva, PIN e comandos são fictícios. Nenhuma API de PMS, Akubela ou fechadura real é acionada.</p>
        </div>
      </div>
    </main>
  );
}

function LocalPortalQr({ portalUrl }: { portalUrl: string }) {
  const [source, setSource] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setUsingFallback(false);
    void QRCode.toDataURL(portalUrl, { width: 360, margin: 2, errorCorrectionLevel: "M", color: { dark: "#18201f", light: "#ffffff" } })
      .then((dataUrl) => active && setSource(dataUrl))
      .catch(() => {
        if (!active) return;
        setUsingFallback(true);
        setSource(`https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=14&data=${encodeURIComponent(portalUrl)}`);
      });
    return () => { active = false; };
  }, [portalUrl]);

  if (failed) {
    return (
      <div className="mt-5 flex min-h-48 w-48 flex-col items-center justify-center rounded-lg border border-warning/30 bg-warning/[0.07] p-4 text-center">
        <QrCode className="size-8 text-warning" />
        <p className="mt-3 text-sm font-semibold">QR Code indisponível</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Use o botão abaixo para abrir o portal.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-lg border bg-white p-2 shadow-xs">
      {source ? <img src={source} onError={() => setFailed(true)} alt="QR Code para abrir o Portal do Hóspede" className="size-44" /> : <div className="grid size-44 place-items-center text-xs text-muted-foreground">Gerando QR Code local…</div>}
      {usingFallback && <p className="mt-2 text-[10px] text-muted-foreground">Fallback online</p>}
    </div>
  );
}

function Summary({ icon: Icon, label, value, accent = false }: { icon: typeof Building2; label: string; value: string; accent?: boolean }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className={`grid size-10 shrink-0 place-items-center rounded-md ${accent ? "bg-accent/[0.12] text-accent" : "bg-secondary text-muted-foreground"}`}><Icon className="size-5" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div></CardContent></Card>;
}

function Detail({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="flex gap-3 bg-card p-5"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>;
}

function Status({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-md bg-surface p-3"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div><ArrowRight className="size-4 shrink-0 text-accent" /></div>;
}
