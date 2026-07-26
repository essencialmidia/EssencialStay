import { ArrowRight, CalendarCheck, CalendarClock, Check, CheckCircle2, Clock3, Copy, ExternalLink, Filter, Hotel, Mail, MessageCircle, Plus, Search, Send, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { FormField } from "../components/ui/form-field";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { SegmentedControl } from "../components/ui/segmented-control";
import { Select } from "../components/ui/select";
import { useToast } from "../components/ui/toast";
import { hotelSummitStaysFixture } from "../demo/stays-demo.fixtures";
import type { DemoCommunicationChannel, DemoGuestStay, DemoReservationSource, DemoStayBucket } from "../demo/stays-demo.types";
import { getDemoPublicUrl } from "../lib/demo-public-url";

type StayTab = DemoStayBucket | "all";
type FormState = { name: string; phone: string; email: string; partySize: string; unit: string; checkIn: string; checkOut: string; notes: string; source: DemoReservationSource | ""; externalCode: string };

const tabs: Array<{ value: StayTab; label: string }> = [
  { value: "arrivals", label: "Hoje chegam" }, { value: "in_house", label: "Hospedados" }, { value: "departures", label: "Hoje saem" }, { value: "upcoming", label: "Próximas" }, { value: "all", label: "Todas" },
];
const emptyForm: FormState = { name: "", phone: "", email: "", partySize: "1", unit: "Apartamento 901", checkIn: "2026-07-29T14:00", checkOut: "2026-07-31T12:00", notes: "", source: "", externalCode: "" };

export function ReservasPage() {
  const [stays, setStays] = useState(hotelSummitStaysFixture);
  const [tab, setTab] = useState<StayTab>("arrivals");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<DemoGuestStay | null>(null);
  const [messageStay, setMessageStay] = useState<DemoGuestStay | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const filtered = useMemo(() => stays.filter((stay) => (tab === "all" || stay.bucket === tab) && `${stay.guest.name} ${stay.unit}`.toLowerCase().includes(query.trim().toLowerCase())), [query, stays, tab]);
  const summary = [
    { label: "Chegam hoje", value: 2, icon: CalendarCheck, tone: "accent" },
    { label: "Hospedados", value: 6, icon: Hotel, tone: "success" },
    { label: "Saem hoje", value: 1, icon: Clock3, tone: "default" },
    { label: "Próximas hospedagens", value: 8, icon: CalendarClock, tone: "default" },
    { label: "Pendências de preparação", value: 1, icon: TriangleAlert, tone: "warning" },
  ];

  function updateCommunication(stay: DemoGuestStay, channel: DemoCommunicationChannel) {
    const now = "29/07/2026 às 10:24";
    setStays((current) => current.map((item) => item.id === stay.id ? { ...item, communication: { channel, status: "Enviada", sentAt: now } } : item));
    setDetail((current) => current?.id === stay.id ? { ...current, communication: { channel, status: "Enviada", sentAt: now } } : current);
    showToast(`Envio por ${channel} simulado com sucesso.`);
  }

  function createStay() {
    const created: DemoGuestStay = {
      id: `manual-${Date.now()}`, bucket: "upcoming",
      guest: { name: form.name || "Hóspede demonstrativo", phone: form.phone || "Não informado", email: form.email || "Não informado", partySize: Number(form.partySize), notes: form.notes || undefined },
      property: "Hotel Summit Monaco", unit: form.unit, checkIn: form.checkIn, checkOut: form.checkOut, periodLabel: `${formatLocalDate(form.checkIn)} → ${formatLocalDate(form.checkOut)}`,
      status: "Confirmada", preparationStatus: "Em preparação", source: form.source || "Reserva direta", externalCode: form.externalCode || undefined,
      communication: { channel: "WhatsApp", status: "Preparada" },
      capabilities: ["Portal do hóspede", "Automação Akubela", "Concierge digital", "Wi-Fi"],
      preparation: [
        { label: "Reserva confirmada", status: "complete" }, { label: "Unidade identificada", status: "complete" }, { label: "Experiência criada", status: "pending" },
        { label: "Portal disponibilizado", status: "pending" }, { label: "Automação preparada", status: "pending" }, { label: "Comunicação enviada", status: "pending" },
      ],
    };
    setStays((current) => [created, ...current]);
    setNewOpen(false); setFormStep(1); setForm(emptyForm); setTab("all");
    showToast("Hospedagem criada e preparação iniciada em modo demonstrativo.");
    setDetail(created);
  }

  return (
    <div className="space-y-7">
      <PageHeader title="Hospedagens" description="Acompanhe chegadas, estadias, saídas e a preparação da experiência de cada hóspede." badge="Ambiente demonstrativo" actions={<Button variant="accent" onClick={() => setNewOpen(true)}><Plus className="size-4" />Nova hospedagem</Button>} />

      <div className="rounded-lg border border-info/20 bg-info/[0.06] px-4 py-3 text-sm"><span className="font-semibold">Hotel Summit Monaco:</span> hospedagens recebidas automaticamente por PMS em modo simulado. O cadastro manual permanece disponível como contingência.</div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map((item) => <Card key={item.label}><CardContent className="flex items-center gap-4 p-4"><div className={`grid size-10 place-items-center rounded-md ${item.tone === "accent" ? "bg-accent/[0.12] text-accent" : item.tone === "success" ? "bg-success/[0.12] text-success" : item.tone === "warning" ? "bg-warning/[0.14] text-warning" : "bg-secondary text-muted-foreground"}`}><item.icon className="size-5" /></div><div><p className="text-2xl font-semibold tabular-nums">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <SegmentedControl value={tab} options={tabs} onChange={setTab} ariaLabel="Filtrar hospedagens por momento" className="w-full xl:w-auto" />
          <div className="flex gap-2"><div className="relative flex-1 xl:w-72"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar hóspede ou unidade" className="pl-9" /></div><Button variant="outline" size="icon" aria-label="Filtros demonstrativos" onClick={() => showToast("Filtros locais ativos.")}><Filter className="size-4" /></Button></div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((stay) => <StayCard key={stay.id} stay={stay} onDetails={() => setDetail(stay)} onMessage={() => setMessageStay(stay)} onResend={() => updateCommunication(stay, stay.communication.channel)} />)}
        </div>
        {filtered.length === 0 && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhuma hospedagem encontrada neste filtro.</div>}
      </section>

      <StayDetailsModal stay={detail} onClose={() => setDetail(null)} onMessage={() => { if (detail) setMessageStay(detail); setDetail(null); }} onResend={(channel) => detail && updateCommunication(detail, channel)} onExperience={() => navigate("/experiencia-hospede")} />
      <MessageModal stay={messageStay} onClose={() => setMessageStay(null)} onSend={(channel) => messageStay && updateCommunication(messageStay, channel)} />
      <NewStayModal open={newOpen} step={formStep} form={form} onForm={setForm} onStep={setFormStep} onClose={() => { setNewOpen(false); setFormStep(1); }} onCreate={createStay} />
    </div>
  );
}

function StayCard({ stay, onDetails, onMessage, onResend }: { stay: DemoGuestStay; onDetails: () => void; onMessage: () => void; onResend: () => void }) {
  const complete = stay.preparation.filter((item) => item.status === "complete").length;
  return <Card variant="interactive"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={stay.status === "Hospedado" ? "success" : stay.status === "Checkout solicitado" ? "warning" : "info"}>{stay.status}</Badge>{stay.featured && <Badge variant="highlight">Hospedagem principal</Badge>}</div><h2 className="mt-3 truncate text-lg font-semibold">{stay.guest.name}</h2><p className="mt-1 text-sm font-medium">{stay.unit}</p><p className="mt-1 text-sm text-muted-foreground">{stay.periodLabel}</p></div><PreparationBadge status={stay.preparationStatus} /></div><div className="mt-5"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Preparação da experiência</span><span className="font-medium">{complete}/{stay.preparation.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${stay.preparationStatus === "Com pendência" ? "bg-warning" : "bg-accent"}`} style={{ width: `${(complete / stay.preparation.length) * 100}%` }} /></div></div><div className="mt-4 flex items-center justify-between rounded-md bg-surface p-3 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="size-4" />{stay.communication.channel}</span><span className={stay.communication.status === "Enviada" ? "font-medium text-success" : "font-medium text-warning"}>{stay.communication.status}</span></div><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onDetails}>Ver detalhes</Button><Button variant="ghost" size="sm" onClick={onMessage}>Visualizar mensagem</Button>{stay.communication.status === "Enviada" && <Button variant="ghost" size="sm" onClick={onResend}>Reenviar</Button>}{stay.portalPath && <Link to={stay.portalPath} className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground">Ver portal <ExternalLink className="size-3.5" /></Link>}</div></CardContent></Card>;
}

function PreparationBadge({ status }: { status: DemoGuestStay["preparationStatus"] }) {
  return <Badge variant={status === "Pronta" ? "success" : status === "Com pendência" ? "warning" : "muted"}>{status}</Badge>;
}

function StayDetailsModal({ stay, onClose, onMessage, onResend, onExperience }: { stay: DemoGuestStay | null; onClose: () => void; onMessage: () => void; onResend: (channel: DemoCommunicationChannel) => void; onExperience: () => void }) {
  if (!stay) return null;
  return <Modal open title={`Hospedagem · ${stay.unit}`} description="Visão operacional completa em ambiente demonstrativo." onClose={onClose} size="large"><div className="space-y-6">
    <DetailSection title="Hóspede"><DetailGrid items={[["Nome", stay.guest.name], ["Telefone", stay.guest.phone], ["E-mail", stay.guest.email], ["Hóspedes", String(stay.guest.partySize)], ["Observações", stay.guest.notes || "Nenhuma observação"]]} /></DetailSection>
    <DetailSection title="Estadia"><DetailGrid items={[["Propriedade", stay.property], ["Unidade", stay.unit], ["Check-in", stay.checkIn], ["Checkout", stay.checkOut], ["Status", stay.status]]} /></DetailSection>
    <DetailSection title="Preparação da experiência"><div className="space-y-2">{stay.preparation.map((item, index) => <div key={item.label} className="flex items-start gap-3 rounded-md bg-surface p-3"><div className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${item.status === "complete" ? "bg-success/[0.12] text-success" : "bg-warning/[0.12] text-warning"}`}>{item.status === "complete" ? <Check className="size-3.5" /> : <span className="text-[10px] font-bold">{index + 1}</span>}</div><div><p className="text-sm font-medium">{item.label}</p>{item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}</div></div>)}</div></DetailSection>
    <DetailSection title="Comunicação"><div className="rounded-md border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">{stay.communication.channel} · {stay.communication.status}</p><p className="mt-1 text-xs text-muted-foreground">{stay.communication.sentAt || "Ainda não enviada"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={onMessage}>Pré-visualizar</Button><Button size="sm" variant="ghost" onClick={() => onResend(stay.communication.channel)}>Reenviar</Button></div></div></div></DetailSection>
    <DetailSection title="Recursos da propriedade"><div className="flex flex-wrap gap-2">{stay.capabilities.map((capability) => <Badge key={capability} variant="outline"><CheckCircle2 className="size-3" />{capability}</Badge>)}</div></DetailSection>
    <DetailSection title="Origem da reserva"><p className="text-sm">{stay.source === "PMS simulado" ? "Reserva recebida automaticamente — integração PMS simulada" : stay.source}{stay.externalCode && <span className="text-muted-foreground"> · {stay.externalCode}</span>}</p></DetailSection>
    {stay.featured && <><DetailSection title="Dados necessários do PMS"><CompactList items={["Identificador da reserva", "Nome e contato do hóspede", "Propriedade e unidade", "Check-in e checkout", "Status, alterações e cancelamentos"]} /></DetailSection><DetailSection title="Ações realizadas pela Essencial Stay"><CompactList items={["Identificação da unidade", "Preparação da experiência", "Disponibilização do portal", "Preparação da automação", "Geração da comunicação", "Acompanhamento até o checkout"]} /></DetailSection></>}
    <div className="flex flex-wrap justify-end gap-2 border-t pt-5">{stay.featured && <><Button variant="outline" onClick={onExperience}>Abrir Experiência do Hóspede</Button><Link to="/s/hotel-monaco-demo" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground">Abrir Portal Premium <ExternalLink className="size-4" /></Link></>}</div>
  </div></Modal>;
}

function MessageModal({ stay, onClose, onSend }: { stay: DemoGuestStay | null; onClose: () => void; onSend: (channel: DemoCommunicationChannel) => void }) {
  if (!stay) return null;
  const message = buildMessage(stay);
  return <Modal open title="Prévia da comunicação" description="Nenhuma mensagem real será enviada." onClose={onClose} size="large"><div className="space-y-4"><div className="rounded-lg border bg-surface p-5 whitespace-pre-line text-sm leading-6">{message}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(message); }}><Copy className="size-4" />Copiar mensagem</Button><Button variant="outline" onClick={() => onSend("WhatsApp")}><MessageCircle className="size-4" />Simular WhatsApp</Button><Button variant="outline" onClick={() => onSend("SMS")}><Send className="size-4" />Simular SMS</Button><Button variant="outline" onClick={() => onSend("E-mail")}><Mail className="size-4" />Simular e-mail</Button></div></div></Modal>;
}

function NewStayModal({ open, step, form, onForm, onStep, onClose, onCreate }: { open: boolean; step: number; form: FormState; onForm: (value: FormState) => void; onStep: (value: number) => void; onClose: () => void; onCreate: () => void }) {
  const set = (key: keyof FormState, value: string) => onForm({ ...form, [key]: value });
  return <Modal open={open} title="Nova hospedagem" description={`Etapa ${step} de 5 · cadastro manual demonstrativo`} onClose={onClose} size="large"><div className="space-y-5"><div className="grid grid-cols-5 gap-1">{[1,2,3,4,5].map((item) => <div key={item} className={`h-1.5 rounded-full ${item <= step ? "bg-accent" : "bg-secondary"}`} />)}</div>
    {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome completo"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Hóspede fictício" /></FormField><FormField label="Telefone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" /></FormField><FormField label="E-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@example.com" /></FormField><FormField label="Quantidade de hóspedes"><Input type="number" min="1" value={form.partySize} onChange={(e) => set("partySize", e.target.value)} /></FormField></div>}
    {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Propriedade"><Input value="Hotel Summit Monaco" disabled /></FormField><FormField label="Unidade"><Select value={form.unit} onChange={(e) => set("unit", e.target.value)}><option>Apartamento 901</option><option>Apartamento 508</option><option>Apartamento 704</option></Select></FormField><FormField label="Check-in"><Input type="datetime-local" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} /></FormField><FormField label="Checkout"><Input type="datetime-local" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} /></FormField><FormField label="Observações" optional className="sm:col-span-2"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></FormField></div>}
    {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Origem" optional description="Usada somente no cadastro e nos detalhes."><Select value={form.source} onChange={(e) => set("source", e.target.value)}><option value="">Não informada</option>{["Airbnb","Booking.com","Reserva direta","Indicação","WhatsApp","Outro"].map((value) => <option key={value}>{value}</option>)}</Select></FormField><FormField label="Código externo da reserva" optional><Input value={form.externalCode} onChange={(e) => set("externalCode", e.target.value)} /></FormField></div>}
    {step === 4 && <div><p className="text-sm font-medium">Recursos configurados para o Hotel Summit Monaco</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{["Portal do hóspede","Automação Akubela","Concierge digital","Wi-Fi"].map((item) => <div key={item} className="flex items-center gap-3 rounded-md border p-3"><CheckCircle2 className="size-5 text-success" /><span className="text-sm font-medium">{item}</span></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Para propriedades short stay, esta etapa poderá incluir acesso Yale manual e guia local.</p></div>}
    {step === 5 && <div className="rounded-lg bg-surface p-5"><h3 className="font-semibold">Revisão</h3><DetailGrid items={[["Hóspede", form.name || "Não informado"], ["Propriedade", "Hotel Summit Monaco"], ["Unidade", form.unit], ["Check-in", formatLocalDate(form.checkIn)], ["Checkout", formatLocalDate(form.checkOut)], ["Origem", form.source || "Não informada"]]} /></div>}
    <div className="flex justify-between border-t pt-5"><Button variant="ghost" onClick={step === 1 ? onClose : () => onStep(step - 1)}>{step === 1 ? "Cancelar" : "Voltar"}</Button>{step < 5 ? <Button variant="accent" onClick={() => onStep(step + 1)}>Continuar <ArrowRight className="size-4" /></Button> : <Button variant="accent" onClick={onCreate}><Sparkles className="size-4" />Criar hospedagem e preparar experiência</Button>}</div>
  </div></Modal>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>; }
function DetailGrid({ items }: { items: string[][] }) { return <dl className="grid gap-4 rounded-md bg-surface p-4 sm:grid-cols-2">{items.map(([label,value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>; }
function CompactList({ items }: { items: string[] }) { return <div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-success" />{item}</div>)}</div>; }
function formatLocalDate(value: string) { if (!value) return "Não informado"; const [date,time] = value.split("T"); const [year,month,day] = date.split("-"); return `${day}/${month}/${year}${time ? ` às ${time}` : ""}`; }
function buildMessage(stay: DemoGuestStay) { return `Olá, ${stay.guest.name.split(" ")[0]}!\n\nSua hospedagem no Hotel Summit Monaco está confirmada.\n\nDurante sua estadia, você terá acesso ao Portal Essencial Stay para conhecer os recursos do quarto, controlar a automação disponível, acessar o Wi-Fi, consultar serviços do hotel e utilizar o concierge digital.\n\nAcesse sua experiência:\n${getDemoPublicUrl("/s/hotel-monaco-demo")}\n\n${stay.unit}\nCheck-in: ${stay.checkIn}\nCheckout: ${stay.checkOut}\n\nHotel Summit Monaco\nExperiência digital oferecida por Essencial Stay.`; }
