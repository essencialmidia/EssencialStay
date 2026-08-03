import { useState, type ComponentType, type SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircuitBoard,
  Cpu,
  DoorOpen,
  Droplets,
  Hotel,
  House,
  IdCard,
  KeyRound,
  Layers3,
  Menu,
  Network,
  QrCode,
  Radio,
  Sparkles,
  Store,
  TabletSmartphone,
  UsersRound,
  Volume2,
  X,
  Zap,
} from "lucide-react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const whatsappUrl = "https://wa.link/dalym4";

const navItems = [
  { label: "Soluções", href: "#solucoes" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Ecossistema", href: "#ecossistema" },
  { label: "Revendas", href: "#revendas" },
];

const markets: Array<{ icon: Icon; title: string; description: string; items: string[]; note?: string }> = [
  {
    icon: Hotel,
    title: "Hotéis e pousadas",
    description: "Tecnologia para elevar a experiência do hóspede e dar mais fluidez à operação.",
    items: ["Jornada digital do hóspede", "QR Code e portal do hóspede", "Automação dos quartos", "Integração com PMS e GRMS"],
  },
  {
    icon: Building2,
    title: "Condomínios",
    description: "Um ecossistema de soluções para projetos residenciais e áreas compartilhadas.",
    items: ["Controle de acesso", "Intercomunicação", "Segurança", "Automação de áreas comuns"],
    note: "Mercado atendido pelo ecossistema tecnológico.",
  },
  {
    icon: House,
    title: "Residências",
    description: "Conforto, controle e tecnologia integrados a projetos de alto padrão.",
    items: ["Painéis inteligentes", "Iluminação e climatização", "Segurança", "Automação de alto padrão"],
    note: "Mercado atendido pelo ecossistema tecnológico.",
  },
];

const journey: Array<{ icon: Icon; title: string; description: string }> = [
  { icon: CalendarCheck2, title: "Reserva", description: "O início da experiência" },
  { icon: IdCard, title: "Check-in", description: "Chegada mais fluida" },
  { icon: QrCode, title: "QR Code", description: "Acesso simples e direto" },
  { icon: TabletSmartphone, title: "Portal do hóspede", description: "Informações na palma da mão" },
  { icon: DoorOpen, title: "Quarto inteligente", description: "Conforto conectado" },
  { icon: Hotel, title: "Operação", description: "Visão organizada da estadia" },
];

const ecosystem: Array<{ icon: Icon; title: string; description: string }> = [
  { icon: CircuitBoard, title: "Automação e GRMS", description: "Inteligência para quartos, ambientes e experiências conectadas." },
  { icon: KeyRound, title: "Fechaduras e acesso", description: "Tecnologias para acesso seguro e jornadas mais simples." },
  { icon: Radio, title: "Sensores e módulos", description: "Infraestrutura para monitorar, conectar e responder." },
  { icon: Droplets, title: "Gestão de água", description: "Soluções que apoiam eficiência e uso consciente de recursos." },
  { icon: Volume2, title: "Sonorização e energia", description: "Mais conforto, ambientação e controle para cada projeto." },
  { icon: Network, title: "Integrações e serviços", description: "Especificação e suporte para unir tecnologias complementares." },
];

const resellerBenefits = [
  "Portfólio de tecnologias",
  "Apoio à especificação",
  "Capacitação",
  "Suporte técnico e comercial",
  "Proteção de oportunidades",
  "Receita recorrente com a plataforma em projetos de hospitalidade",
];

const resellerJourney = ["Contato inicial", "Alinhamento", "Capacitação", "Primeiro projeto", "Expansão"];

const primaryLink = "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-soft transition duration-fast ease-product hover:-translate-y-px hover:bg-accent/90 hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";
const outlineLink = "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-5 text-sm font-semibold text-white transition duration-fast ease-product hover:-translate-y-px hover:border-white/35 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

function Logo({ className = "" }: { className?: string }) {
  return <img src="/brand/essencial-stay-logo.png" alt="Essencial Stay — Plataforma e Ecossistema de Tecnologia" className={`h-auto w-[220px] object-contain ${className}`} />;
}

function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description: string; light?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-accent" : "text-accent"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl ${light ? "text-white" : "text-foreground"}`}>{title}</h2>
      <p className={`mt-4 max-w-2xl text-base leading-7 ${light ? "text-sidebar-foreground/70" : "text-muted-foreground"}`}>{description}</p>
    </div>
  );
}

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-sidebar/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <a href="#inicio" aria-label="Essencial Stay — início" className="focus-ring rounded-md">
            <Logo className="w-[188px] origin-left scale-[1.16] sm:w-[220px]" />
          </a>
          <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => <a key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-white/[0.06] hover:text-white focus-ring">{item.label}</a>)}
          </nav>
          <div className="hidden lg:block">
            <Link to="/login" className={outlineLink}>Entrar na plataforma <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </div>
          <button type="button" className="grid size-11 place-items-center rounded-md border border-white/15 text-white transition hover:bg-white/10 focus-ring lg:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="menu-mobile" onClick={() => setMenuOpen((current) => !current)}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-mobile" aria-label="Navegação mobile" className="border-t border-white/10 bg-sidebar px-4 pb-5 pt-3 lg:hidden">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
              {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-white/[0.06] hover:text-white focus-ring">{item.label}</a>)}
              <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground focus-ring">Entrar na plataforma <ArrowRight className="size-4" /></Link>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="relative scroll-mt-24 bg-sidebar pb-20 pt-28 text-white sm:pb-24 sm:pt-36 lg:min-h-[700px] lg:pb-24 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-48 -top-44 size-[620px] rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-64 -left-36 size-[560px] rounded-full bg-highlight/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-sidebar-foreground/80"><Sparkles className="size-3.5 shrink-0 text-highlight" /> Plataforma e ecossistema para hospitalidade</div>
            <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">A tecnologia que conecta o hóspede à <span className="text-accent">hospedagem</span></h1>
            <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-sidebar-foreground/75 sm:text-xl">A Essencial Stay integra a jornada do hóspede, o acesso e a automação para oferecer experiências mais inteligentes em hotéis, pousadas e imóveis por temporada.</p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-sidebar-foreground/55 sm:text-base">Um ecossistema de soluções, equipamentos e parceiros que também atende projetos de condomínios e residências inteligentes.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#solucoes" className={primaryLink}>Conheça as soluções <ArrowRight className="size-4" /></a>
              <Link to="/login" className="inline-flex h-11 items-center justify-center px-3 text-sm font-semibold text-sidebar-foreground/75 transition hover:text-white focus-ring">Entrar na plataforma <ChevronRight className="size-4" /></Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]" aria-label="Plataforma, ecossistema, dispositivos, revendas e projetos conectados">
            <div className="absolute inset-[12%] rounded-full border border-accent/25" />
            <div className="absolute inset-[25%] rounded-full border border-white/15" />
            <div className="relative grid aspect-square place-items-center rounded-full border border-white/10 bg-white/[0.025] p-8 shadow-floating backdrop-blur-sm sm:p-12">
              <div className="absolute right-[23%] top-[19%] h-px w-[18%] -rotate-[32deg] bg-accent/40" aria-hidden="true" />
              <div className="absolute left-[7%] top-[18%] rounded-lg border border-white/15 bg-sidebar-active/90 p-3 shadow-medium sm:p-4"><Layers3 className="size-6 text-accent sm:size-7" /><p className="mt-2 text-xs font-semibold sm:text-sm">Plataforma</p></div>
              <div className="absolute right-[5%] top-[5%] w-32 rounded-lg border border-white/15 bg-sidebar-active/95 p-3 shadow-medium sm:w-44 sm:p-4"><Cpu className="size-6 text-accent sm:size-7" aria-hidden="true" /><p className="mt-2 text-xs font-semibold sm:text-sm">Dispositivos</p><p className="mt-1 hidden text-[11px] leading-4 text-sidebar-foreground/60 sm:block">Painéis, fechaduras, sensores e módulos</p></div>
              <div className="absolute right-[2%] top-[38%] rounded-lg border border-white/15 bg-sidebar-active/90 p-3 shadow-medium sm:p-4"><Network className="size-6 text-highlight sm:size-7" /><p className="mt-2 text-xs font-semibold sm:text-sm">Ecossistema</p></div>
              <div className="absolute bottom-[10%] right-[19%] rounded-lg border border-white/15 bg-sidebar-active/90 p-3 shadow-medium sm:p-4"><Store className="size-6 text-accent sm:size-7" /><p className="mt-2 text-xs font-semibold sm:text-sm">Revendas</p></div>
              <div className="absolute bottom-[12%] left-[8%] rounded-lg border border-white/15 bg-sidebar-active/90 p-3 shadow-medium sm:p-4"><Zap className="size-6 text-highlight sm:size-7" /><p className="mt-2 text-xs font-semibold sm:text-sm">Projetos</p></div>
              <div className="grid size-32 place-items-center rounded-full border border-accent/35 bg-accent/15 shadow-[0_0_80px_hsl(var(--accent)/0.2)] sm:size-40"><img src="/brand/essencial-stay-logo.png" alt="" className="w-28 sm:w-36" /></div>
            </div>
          </div>
        </div>
      </section>

      <section id="solucoes" className="scroll-mt-24 bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Soluções por mercado" title="Tecnologia que se adapta a cada projeto" description="Uma visão integrada para hospitalidade, condomínios e residências, combinando plataforma, produtos e serviços especializados." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {markets.map(({ icon: MarketIcon, title, description, items, note }) => (
              <article key={title} className="group rounded-xl border bg-card p-6 shadow-xs transition duration-product hover:-translate-y-1 hover:border-accent/30 hover:shadow-medium sm:p-7">
                <div className="grid size-12 place-items-center rounded-lg bg-accent/10 text-accent"><MarketIcon className="size-6" aria-hidden="true" /></div>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                <ul className="mt-6 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" /><span>{item}</span></li>)}</ul>
                {note && <p className="mt-6 border-t pt-4 text-xs leading-5 text-muted-foreground">{note}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plataforma" className="scroll-mt-24 border-y bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Plataforma digital" title="Uma experiência conectada, da reserva ao quarto" description="A base digital organiza a operação e prepara cada etapa da experiência para evoluir com segurança, clareza e independência de tecnologia." />
          <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {journey.map(({ icon: JourneyIcon, title, description }, index) => <li key={title} className="relative rounded-lg border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-accent">0{index + 1}</span><div className="grid size-9 place-items-center rounded-md bg-accent/10 text-accent"><JourneyIcon className="size-[18px]" aria-hidden="true" /></div></div><p className="mt-5 text-sm font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>{index < journey.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full border bg-background text-muted-foreground lg:block" />}</li>)}
          </ol>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-success/20 bg-success/[0.06] p-5"><BadgeCheck className="size-5 text-success" /><p className="mt-4 font-semibold">Estrutura preparada para diferentes operações</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Uma base multiempresa para organizar empresas, propriedades e unidades com clareza.</p></div>
            <div className="rounded-lg border border-highlight/25 bg-highlight/[0.07] p-5"><Sparkles className="size-5 text-highlight" /><p className="mt-4 font-semibold">Experiências disponíveis para demonstração</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Jornadas e reservas apresentadas em cenários que permitem visualizar a experiência completa.</p></div>
            <div className="rounded-lg border border-info/20 bg-info/[0.06] p-5"><CircuitBoard className="size-5 text-info" /><p className="mt-4 font-semibold">Tecnologias em processo de validação</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Integrações e automações avaliadas por etapas para cada contexto e projeto.</p></div>
          </div>
        </div>
      </section>

      <section id="ecossistema" className="scroll-mt-24 bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Ecossistema" title="Tecnologias que se complementam em cada projeto" description="Selecionamos categorias, marcas e serviços que podem ser combinados conforme o contexto e os objetivos de cada oportunidade." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystem.map(({ icon: EcosystemIcon, title, description }) => <article key={title} className="flex gap-4 rounded-lg border bg-card p-5 shadow-xs"><div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-accent"><EcosystemIcon className="size-5" /></div><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div></article>)}
          </div>
          <div className="mt-10 rounded-xl border bg-surface p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tecnologias que podem compor cada projeto</p>
            <div className="mt-6 flex flex-wrap gap-3">{["Akubela", "Yale", "Ekaza", "Allas", "Savage"].map((brand) => <span key={brand} className="rounded-md border bg-card px-4 py-2.5 text-sm font-semibold shadow-xs">{brand}</span>)}</div>
            <p className="mt-5 max-w-3xl text-xs leading-5 text-muted-foreground">A presença no ecossistema não representa, por si só, integração técnica concluída com a plataforma. A composição e a disponibilidade são avaliadas para cada projeto.</p>
          </div>
        </div>
      </section>

      <section id="revendas" className="scroll-mt-24 bg-sidebar pb-16 pt-20 text-white sm:pb-20 sm:pt-24">
        <div className="mx-auto grid max-w-[1440px] gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <SectionHeading light eyebrow="Programa comercial" title="Mais soluções, serviços e oportunidades para sua revenda" description="Conecte seu relacionamento local a um ecossistema preparado para apoiar especificação, capacitação e crescimento comercial." />
            <div className="mt-9 grid gap-3 sm:grid-cols-2">{resellerBenefits.map((benefit) => <div key={benefit} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-sidebar-foreground/80"><Check className="mt-0.5 size-4 shrink-0 text-accent" /><span>{benefit}</span></div>)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-floating sm:p-8">
            <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-lg bg-accent/15 text-accent"><UsersRound className="size-5" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/50">Sua jornada</p><p className="mt-1 font-semibold">Do primeiro contato à expansão</p></div></div>
            <ol className="mt-8 space-y-1">{resellerJourney.map((item, index) => <li key={item} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border border-accent/35 bg-sidebar text-xs font-semibold text-accent">{index + 1}</div>{index < resellerJourney.length - 1 && <div className="absolute bottom-0 left-[17px] top-9 w-px bg-white/10" />}<div className="pt-2"><p className="text-sm font-semibold">{item}</p></div></li>)}</ol>
          </div>
        </div>
      </section>

      <section className="bg-accent py-14 text-accent-foreground sm:py-16">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Vamos conversar</p><h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Transforme oportunidades em projetos conectados</h2><p className="mt-4 max-w-2xl leading-7 opacity-80">Tecnologia, plataforma e suporte comercial para ampliar o valor de cada projeto.</p><div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-sidebar px-5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px hover:bg-sidebar/90 focus-ring">Falar com a Essencial Stay <ArrowRight className="size-4" /></a><Link to="/login" className="inline-flex h-11 items-center justify-center rounded-md border border-accent-foreground/25 px-5 text-sm font-semibold transition hover:bg-accent-foreground/10 focus-ring">Entrar na plataforma</Link></div></div>
          <aside className="grid gap-6 rounded-xl bg-white p-5 text-slate-900 shadow-medium sm:grid-cols-[1fr_164px] sm:items-center sm:p-6" aria-labelledby="whatsapp-title">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">WhatsApp oficial</p><h3 id="whatsapp-title" className="mt-2 text-xl font-semibold">Fale com a Essencial Stay</h3><p className="mt-3 text-sm leading-6 text-slate-600">Aponte a câmera do celular para o QR Code ou clique no botão para conversar pelo WhatsApp.</p><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 sm:w-auto">Conversar pelo WhatsApp <ArrowRight className="size-4" /></a></div>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mx-auto rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2" aria-label="Abrir WhatsApp da Essencial Stay pelo QR Code"><img src="/brand/whatsapp-essencial-stay-qr.png" alt="QR Code do WhatsApp da Essencial Stay" className="size-40 object-contain" /></a>
          </aside>
        </div>
      </section>

      <footer className="bg-sidebar py-12 text-sidebar-foreground">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 md:grid-cols-[1fr_auto_auto] lg:px-8">
          <div><Logo className="w-[250px]" /><p className="mt-4 max-w-sm text-sm leading-6 text-sidebar-foreground/55">Plataforma e Ecossistema de Tecnologia</p><div className="mt-5 flex flex-col gap-2 text-sm text-sidebar-foreground/70"><a href="https://essencialstay.com.br" className="hover:text-white focus-ring">essencialstay.com.br</a><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white focus-ring">(11) 98229-6051</a></div></div>
          <div><p className="text-sm font-semibold text-white">Navegue</p><nav aria-label="Navegação do rodapé" className="mt-4 flex flex-col gap-3">{navItems.map((item) => <a key={item.href} href={item.href} className="text-sm text-sidebar-foreground/60 hover:text-white focus-ring">{item.label}</a>)}</nav></div>
          <div><p className="text-sm font-semibold text-white">Acesso</p><div className="mt-4"><Link to="/login" className="text-sm text-sidebar-foreground/60 hover:text-white focus-ring">Entrar na plataforma</Link></div></div>
        </div>
        <div className="mx-auto mt-10 max-w-[1440px] border-t border-white/10 px-4 pt-6 text-xs text-sidebar-foreground/40 sm:px-6 lg:px-8">© {new Date().getFullYear()} Essencial Stay. Tecnologia para projetos conectados.</div>
      </footer>
    </main>
  );
}
