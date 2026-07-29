import { ArrowRight, CalendarCheck, CalendarClock, Check, CheckCircle2, Clock3, Copy, ExternalLink, Filter, Hotel, KeyRound, Mail, MessageCircle, Plus, Search, Send, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/layout/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FormField } from "../components/ui/form-field";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { SegmentedControl } from "../components/ui/segmented-control";
import { Select } from "../components/ui/select";
import { useToast } from "../components/ui/toast";
import { hotelSummitStaysFixture } from "../demo/stays-demo.fixtures";
import type { DemoCommunicationChannel, DemoGuestStay, DemoReservationSource, DemoStayBucket } from "../demo/stays-demo.types";
import { getDemoPublicUrl } from "../lib/demo-public-url";
import { AirbnbOperationCard } from "../components/reservas/airbnb-operation-card";
import { GuidedDemoPanel } from "../components/demo/guided-demo-panel";
import { isVilaNovaDemoOrganization } from "../demo/demo-organizations";
import { DemoAutomaticAccessProvider, demoLockConfigurations } from "../demo/lock-access-demo";
import { useOrganization } from "../contexts/organization-context";
import { addManualAirbnbReservation, clearManualAirbnbReservations, endGuidedDemoReservation, getDemoAccessSecret, getGuidedDemoReservation, getManualAirbnbReservations, prepareManualAirbnbAccess, registerDemoPortalRoute, removeManualAirbnbReservation, sendManualAirbnbExperience, setDemoAccessSecret, subscribeManualAirbnbReservations, updateManualAirbnbAccess, updateManualAirbnbPreparation, type ManualAirbnbReservation } from "../demo/manual-airbnb-reservations";
type StayTab = DemoStayBucket | "all";
type FormState = {
    name: string;
    phone: string;
    email: string;
    partySize: string;
    unit: string;
    checkIn: string;
    checkOut: string;
    notes: string;
    source: DemoReservationSource | "";
    externalCode: string;
};
const tabs: Array<{
    value: StayTab;
    label: string;
}> = [
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
    const { organizacaoAtual } = useOrganization();
    const [airbnbOpen, setAirbnbOpen] = useState(false);
    const [manualReservation, setManualReservation] = useState<ManualAirbnbReservation | null>(null);
    const [guidedModal, setGuidedModal] = useState<{
        reservationId: string;
        type: "checkin" | "checkout";
    } | null>(null);
    const [guidedAccessReservationId, setGuidedAccessReservationId] = useState<string | null>(null);
    const [demoOpen, setDemoOpen] = useState(false);
    const [, setManualReservationVersion] = useState(0);
    const navigate = useNavigate();
    const isVilaNova = isVilaNovaDemoOrganization(organizacaoAtual);
    const manualReservations = isVilaNova ? getManualAirbnbReservations(organizacaoAtual?.id) : [];
    const filtered = useMemo(() => isVilaNova ? [] : stays.filter((stay) => (tab === "all" || stay.bucket === tab) && `${stay.guest.name} ${stay.unit}`.toLowerCase().includes(query.trim().toLowerCase())), [isVilaNova, query, stays, tab]);
    useEffect(() => { setGuidedModal(null); setGuidedAccessReservationId(null); setManualReservation(null); }, [organizacaoAtual?.id]);
    useEffect(() => subscribeManualAirbnbReservations(() => setManualReservationVersion((value) => value + 1)), []);
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
        setNewOpen(false);
        setFormStep(1);
        setForm(emptyForm);
        setTab("all");
        showToast("Hospedagem criada e preparação iniciada em modo demonstrativo.");
        setDetail(created);
    }
    return (<div className="space-y-7">
      <PageHeader title="Hospedagens" description="Acompanhe chegadas, estadias, saídas e a preparação da experiência de cada hóspede." badge="Ambiente demonstrativo" actions={<div className="flex gap-2">{isVilaNova && <Button variant="outline" onClick={() => setDemoOpen(true)}>▶ Iniciar demonstração</Button>}<Button variant="accent" onClick={() => isVilaNova ? setAirbnbOpen(true) : setNewOpen(true)}><Plus className="size-4"/>{isVilaNova ? "Preparar Hospedagem" : "Nova hospedagem"}</Button>{isVilaNova && manualReservations.length > 0 && <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Limpar somente os dados demonstrativos desta organização?")) {
        clearManualAirbnbReservations(organizacaoAtual?.id || "");
        setManualReservation(null);
        showToast("Dados demonstrativos removidos.");
    } }}>Limpar dados demonstrativos</Button>}</div>}/>

      {!isVilaNova && <div className="rounded-lg border border-info/20 bg-info/[0.06] px-4 py-3 text-sm"><span className="font-semibold">Hotel Summit Monaco:</span> hospedagens recebidas automaticamente por PMS em modo simulado. O cadastro manual permanece disponível como contingência.</div>}
      {isVilaNova && <AirbnbReservationModal open={airbnbOpen} organizationId={organizacaoAtual?.id || ""} onClose={() => setAirbnbOpen(false)} onCreated={(reservation) => { addManualAirbnbReservation(reservation); setManualReservation(reservation); setAirbnbOpen(false); showToast("Reserva e experiência do hóspede criadas em modo demonstrativo."); }}/>}
      {isVilaNova && <GuidedDemoModal open={demoOpen} organizationId={organizacaoAtual?.id || ""} existing={getGuidedDemoReservation(organizacaoAtual?.id)} onClose={() => setDemoOpen(false)} onSelect={(reservation) => { setManualReservation(reservation); setDemoOpen(false); }}/>}
      {manualReservation && <ManualExperienceCard reservation={manualReservation} onClose={() => setManualReservation(null)} onUpdate={() => setManualReservation((current) => current ? { ...current } : current)} onDemoCompleted={() => { if (manualReservation.isGuidedDemo)
        endGuidedDemoReservation(manualReservation.id); }} accessOpen={guidedAccessReservationId === manualReservation.id} onAccessOpenChange={(open) => setGuidedAccessReservationId(open ? manualReservation.id : null)}/>}
      {isVilaNova && !manualReservation && manualReservations.map((reservation) => <ManualExperienceCard key={reservation.id} reservation={reservation} onClose={() => setManualReservation(null)} onUpdate={() => setManualReservation((current) => current ? { ...current } : current)} onDemoCompleted={() => { if (reservation.isGuidedDemo)
        endGuidedDemoReservation(reservation.id); }} accessOpen={guidedAccessReservationId === reservation.id} onAccessOpenChange={(open) => setGuidedAccessReservationId(open ? reservation.id : null)}/>)}
      {isVilaNova && (manualReservation ? [manualReservation] : manualReservations).map((reservation) => <AirbnbOperationCard key={`operation-${reservation.id}`} reservation={reservation} onUpdate={() => setManualReservation((current) => current?.id === reservation.id ? { ...current } : current)} checkinOpen={guidedModal?.reservationId === reservation.id && guidedModal.type === "checkin"} checkoutOpen={guidedModal?.reservationId === reservation.id && guidedModal.type === "checkout"} onCheckinOpenChange={(open) => setGuidedModal(open ? { reservationId: reservation.id, type: "checkin" } : null)} onCheckoutOpenChange={(open) => setGuidedModal(open ? { reservationId: reservation.id, type: "checkout" } : null)}/>)}
      {isVilaNova && getGuidedDemoReservation(organizacaoAtual?.id) && <GuidedDemoPanel reservation={getGuidedDemoReservation(organizacaoAtual?.id)!} onPrepareAccess={() => { const reservation = getGuidedDemoReservation(organizacaoAtual?.id); if (!reservation)
        return; setManualReservation(reservation); setGuidedAccessReservationId(reservation.id); }} onEndKeep={() => { const reservation = getGuidedDemoReservation(organizacaoAtual?.id); if (!reservation)
        return; endGuidedDemoReservation(reservation.id); setGuidedModal(null); setGuidedAccessReservationId(null); setManualReservation({ ...reservation, isGuidedDemo: false }); showToast("Demonstração encerrada. A reserva foi mantida."); }} onEndRemove={() => { const reservation = getGuidedDemoReservation(organizacaoAtual?.id); if (!reservation)
        return; removeManualAirbnbReservation(reservation.id); setGuidedModal(null); setGuidedAccessReservationId(null); setManualReservation(null); showToast("Demonstração encerrada e reserva removida."); }}/>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map((item) => <Card key={item.label}><CardContent className="flex items-center gap-4 p-4"><div className={`grid size-10 place-items-center rounded-md ${item.tone === "accent" ? "bg-accent/[0.12] text-accent" : item.tone === "success" ? "bg-success/[0.12] text-success" : item.tone === "warning" ? "bg-warning/[0.14] text-warning" : "bg-secondary text-muted-foreground"}`}><item.icon className="size-5"/></div><div><p className="text-2xl font-semibold tabular-nums">{item.value}</p><p className="text-xs text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <SegmentedControl value={tab} options={tabs} onChange={setTab} ariaLabel="Filtrar hospedagens por momento" className="w-full xl:w-auto"/>
          <div className="flex gap-2"><div className="relative flex-1 xl:w-72"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"/><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar hóspede ou unidade" className="pl-9"/></div><Button variant="outline" size="icon" aria-label="Filtros demonstrativos" onClick={() => showToast("Filtros locais ativos.")}><Filter className="size-4"/></Button></div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((stay) => <StayCard key={stay.id} stay={stay} onDetails={() => setDetail(stay)} onMessage={() => setMessageStay(stay)} onResend={() => updateCommunication(stay, stay.communication.channel)}/>)}
        </div>
        {filtered.length === 0 && <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhuma hospedagem encontrada neste filtro.</div>}
      </section>

      <StayDetailsModal stay={detail} onClose={() => setDetail(null)} onMessage={() => { if (detail)
        setMessageStay(detail); setDetail(null); }} onResend={(channel) => detail && updateCommunication(detail, channel)} onExperience={() => navigate("/experiencia-hospede")}/>
      <MessageModal stay={messageStay} onClose={() => setMessageStay(null)} onSend={(channel) => messageStay && updateCommunication(messageStay, channel)}/>
      <NewStayModal open={newOpen} step={formStep} form={form} onForm={setForm} onStep={setFormStep} onClose={() => { setNewOpen(false); setFormStep(1); }} onCreate={createStay}/>
    </div>);
}
function StayCard({ stay, onDetails, onMessage, onResend }: {
    stay: DemoGuestStay;
    onDetails: () => void;
    onMessage: () => void;
    onResend: () => void;
}) {
    const complete = stay.preparation.filter((item) => item.status === "complete").length;
    return <Card variant="interactive"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={stay.status === "Hospedado" ? "success" : stay.status === "Checkout solicitado" ? "warning" : "info"}>{stay.status}</Badge>{stay.featured && <Badge variant="highlight">Hospedagem principal</Badge>}</div><h2 className="mt-3 truncate text-lg font-semibold">{stay.guest.name}</h2><p className="mt-1 text-sm font-medium">{stay.unit}</p><p className="mt-1 text-sm text-muted-foreground">{stay.periodLabel}</p></div><PreparationBadge status={stay.preparationStatus}/></div><div className="mt-5"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Preparação da experiência</span><span className="font-medium">{complete}/{stay.preparation.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${stay.preparationStatus === "Com pendência" ? "bg-warning" : "bg-accent"}`} style={{ width: `${(complete / stay.preparation.length) * 100}%` }}/></div></div><div className="mt-4 flex items-center justify-between rounded-md bg-surface p-3 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><MessageCircle className="size-4"/>{stay.communication.channel}</span><span className={stay.communication.status === "Enviada" ? "font-medium text-success" : "font-medium text-warning"}>{stay.communication.status}</span></div><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onDetails}>Ver detalhes</Button><Button variant="ghost" size="sm" onClick={onMessage}>Visualizar mensagem</Button>{stay.communication.status === "Enviada" && <Button variant="ghost" size="sm" onClick={onResend}>Reenviar</Button>}{stay.portalPath && <Link to={stay.portalPath} className="inline-flex h-8 items-center gap-2 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground">Ver portal <ExternalLink className="size-3.5"/></Link>}</div></CardContent></Card>;
}
function PreparationBadge({ status }: {
    status: DemoGuestStay["preparationStatus"];
}) {
    return <Badge variant={status === "Pronta" ? "success" : status === "Com pendência" ? "warning" : "muted"}>{status}</Badge>;
}
function AirbnbReservationModal({ open, organizationId, onClose, onCreated }: {
    open: boolean;
    organizationId: string;
    onClose: () => void;
    onCreated: (reservation: ManualAirbnbReservation) => void;
}) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [checkIn, setCheckIn] = useState("2026-08-15T15:00");
    const [checkOut, setCheckOut] = useState("2026-08-17T11:00");
    const [guests, setGuests] = useState("2");
    const [notes, setNotes] = useState("");
    const [source, setSource] = useState<ManualAirbnbReservation["source"]>("Airbnb");
    const [unitId, setUnitId] = useState("studio-vila-nova");
    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    const lock = demoLockConfigurations[unitId];
    const phoneValid = isValidBrazilianMobile(phone);
    function create() { const id = `demo-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`; const guestName = name || "Hóspede demonstrativo"; const { slug, url } = vilaNovaPortalUrl(id, organizationId, guestName); onCreated({ id, organizationId, guestName, phone, phoneNormalized: normalizeBrazilianPhone(phone), checkIn, checkOut, guests: Number(guests), notes, source, portalUrl: url, portalSlug: slug, pinMasked: "••••••", unitId, unitName: lock.unitName, lockProvider: lock.provider, lockMode: lock.mode, accessStatus: lock.mode === "assisted" ? "awaiting_manual_pin" : undefined, accessPrepared: false, status: "Reserva criada", timeline: lock.mode === "assisted" ? ["Reserva confirmada", "Unidade definida"] : ["Reserva criada", "Unidade definida"] }); setStep(1); setName(""); setPhone(""); }
    return <Modal open={open} title="Preparar Hospedagem" description="Fluxo demonstrativo local para Studio Vila Nova." onClose={onClose}>{step === 1 ? <div className="space-y-3"><FormField label="Nome do hóspede *"><Input value={name} onChange={(event) => setName(event.target.value)} autoFocus/></FormField><FormField label="WhatsApp do hóspede *"><Input value={phone} onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))} inputMode="tel" placeholder="(11) 98765-4321"/>{phone && !phoneValid && <p className="mt-1 text-xs text-destructive">Informe um celular com DDD.</p>}</FormField><FormField label="Unidade"><Select value={unitId} onChange={(event) => setUnitId(event.target.value)}>{Object.values(demoLockConfigurations).map((item) => <option key={item.id} value={item.id}>{item.unitName}</option>)}</Select></FormField><div className="rounded-md border bg-surface p-3 text-sm"><p className="font-semibold">{lock.displayName} — {lock.mode === "assisted" ? "modo assistido" : "modo demonstração"}</p>{lock.mode === "assisted" ? <p className="mt-1 text-muted-foreground">O PIN Yale será informado somente após o pré-check-in e a FNRH. Nenhuma integração Yale é usada.</p> : <p className="mt-1 text-muted-foreground">O acesso será gerado por um provider local de demonstração.</p>}</div><div className="grid grid-cols-2 gap-3"><FormField label="Check-in *"><Input type="datetime-local" value={checkIn} onChange={(event) => setCheckIn(event.target.value)}/></FormField><FormField label="Check-out *"><Input type="datetime-local" value={checkOut} onChange={(event) => setCheckOut(event.target.value)}/></FormField></div><div className="grid grid-cols-2 gap-3"><FormField label="Hóspedes"><Input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)}/></FormField><FormField label="Origem"><Select value={source} onChange={(event) => setSource(event.target.value as ManualAirbnbReservation["source"])}><option>Airbnb</option><option>Booking</option><option>Direta</option><option>Outro</option></Select></FormField></div><FormField label="Observações"><Input value={notes} onChange={(event) => setNotes(event.target.value)}/></FormField><Button className="w-full" disabled={!name || !phoneValid} onClick={() => setStep(2)}>Continuar</Button></div> : <div className="space-y-4"><div className="rounded-md bg-surface p-4 text-sm"><p className="font-semibold">{name} · {lock.unitName}</p><p>{nights} noites · {source}</p><p>{checkIn.replace("T", " ")} → {checkOut.replace("T", " ")}</p></div><Button className="w-full" onClick={create}>Preparar hospedagem</Button><Button className="w-full" variant="ghost" onClick={() => setStep(1)}>Voltar</Button></div>}</Modal>;
}
function GuidedDemoModal({ open, organizationId, existing, onClose, onSelect }: {
    open: boolean;
    organizationId: string;
    existing: ManualAirbnbReservation | null;
    onClose: () => void;
    onSelect: (reservation: ManualAirbnbReservation) => void;
}) {
    const [step, setStep] = useState(1);
    const [guestName, setGuestName] = useState("");
    const [phone, setPhone] = useState("");
    const [checkIn, setCheckIn] = useState("2026-07-29T15:00");
    const [checkOut, setCheckOut] = useState("2026-07-31T11:00");
    const [unitId, setUnitId] = useState("studio-vila-nova");
    const [guests, setGuests] = useState("2");
    const [notes, setNotes] = useState("");
    const [accessType, setAccessType] = useState<"yale" | "ekaza">("yale");
    const selectedUnit = accessType === "yale" ? demoLockConfigurations["studio-vila-nova"] : demoLockConfigurations["apartamento-demo-zigbee"];
    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    function selectAccess(type: "yale" | "ekaza") { setAccessType(type); setUnitId(type === "yale" ? "studio-vila-nova" : "apartamento-demo-zigbee"); }
    const phoneValid = isValidBrazilianMobile(phone);
    function create() { const lock = demoLockConfigurations[unitId]; const id = `demo-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`; const { slug, url } = vilaNovaPortalUrl(id, organizationId, guestName); const reservation: ManualAirbnbReservation = { id, organizationId, guestName, phone, phoneNormalized: normalizeBrazilianPhone(phone), checkIn, checkOut, guests: Number(guests) || 1, notes, source: "Airbnb", portalUrl: url, portalSlug: slug, pinMasked: "••••••", unitId, unitName: lock.unitName, lockProvider: lock.provider, lockMode: lock.mode, accessStatus: lock.mode === "assisted" ? "awaiting_manual_pin" : undefined, accessPrepared: false, status: "Reserva criada", timeline: lock.mode === "assisted" ? ["Reserva confirmada", "Unidade definida"] : ["Reserva criada", "Unidade definida"], isGuidedDemo: true, demoSessionId: crypto.randomUUID(), demoCreatedAt: new Date().toISOString() }; addManualAirbnbReservation(reservation); onSelect(reservation); }
    const stepTitles = ["Dados da hospedagem", "Tipo de acesso", "Resumo"];
    return <Modal open={open} title="Preparar Hospedagem" description="Vamos preparar a chegada do hóspede." onClose={onClose} size="large"><div className="mx-auto max-w-3xl space-y-7"><div className="flex items-center gap-2">{stepTitles.map((title, index) => <div key={title} className="flex flex-1 items-center gap-2"><div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step >= index + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index + 1}</div><span className={`hidden text-xs font-medium sm:block ${step >= index + 1 ? "text-foreground" : "text-muted-foreground"}`}>{title}</span>{index < stepTitles.length - 1 && <div className="h-px flex-1 bg-border"/>}</div>)}</div>{existing && <div className="flex items-center justify-between rounded-xl border border-info/20 bg-info/[0.06] p-3 text-sm"><span>Há uma demonstração anterior disponível.</span><Button variant="ghost" size="sm" onClick={() => onSelect(existing)}>Continuar anterior</Button></div>}{step === 1 && <div className="space-y-5"><div><h2 className="text-xl font-semibold">Dados da hospedagem</h2><p className="mt-1 text-sm text-muted-foreground">Comece pela experiência que será preparada para o hóspede.</p></div><div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome do hóspede"><Input value={guestName} onChange={(event) => setGuestName(event.target.value)} autoFocus placeholder="Ex.: Mariana Oliveira"/></FormField><FormField label="WhatsApp do hóspede"><Input value={phone} onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))} inputMode="tel" placeholder="(11) 98765-4321"/>{phone && !phoneValid && <p className="mt-1 text-xs text-destructive">Informe um celular com DDD.</p>}</FormField><FormField label="Quantidade de hóspedes"><Input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)}/></FormField><FormField label="Check-in"><Input type="datetime-local" value={checkIn} onChange={(event) => setCheckIn(event.target.value)}/></FormField><FormField label="Check-out"><Input type="datetime-local" value={checkOut} onChange={(event) => setCheckOut(event.target.value)}/></FormField></div><FormField label="Unidade"><Select value={unitId} onChange={(event) => { setUnitId(event.target.value); setAccessType(event.target.value === "studio-vila-nova" ? "yale" : "ekaza"); }}><option value="studio-vila-nova">Studio Vila Nova</option><option value="apartamento-demo-zigbee">Apartamento Demo Zigbee</option></Select></FormField><FormField label="Observações"><Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional"/></FormField><Button className="w-full sm:w-auto" disabled={!guestName || !phoneValid || !checkIn || !checkOut} onClick={() => setStep(2)}>Próximo</Button></div>}{step === 2 && <div className="space-y-5"><div><h2 className="text-xl font-semibold">Como esta hospedagem será preparada?</h2><p className="mt-1 text-sm text-muted-foreground">Escolha a experiência de acesso que será demonstrada.</p></div><div className="grid gap-4 md:grid-cols-2"><button type="button" onClick={() => selectAccess("yale")} className={`rounded-2xl border p-6 text-left transition ${accessType === "yale" ? "border-primary bg-primary/[0.06] shadow-sm" : "hover:border-primary/40"}`}><p className="text-lg font-semibold">Yale</p><p className="mt-2 text-sm text-muted-foreground">Fluxo assistido. O sistema solicitará o PIN criado no Yale Hub Connect.</p><span className="mt-5 inline-flex rounded-full bg-surface px-3 py-1 text-sm font-medium">Selecionar</span></button><button type="button" onClick={() => selectAccess("ekaza")} className={`rounded-2xl border p-6 text-left transition ${accessType === "ekaza" ? "border-primary bg-primary/[0.06] shadow-sm" : "hover:border-primary/40"}`}><p className="text-lg font-semibold">Ekaza</p><p className="mt-2 text-sm text-muted-foreground">Fluxo automático. O sistema gerará automaticamente a chave digital.</p><span className="mt-5 inline-flex rounded-full bg-surface px-3 py-1 text-sm font-medium">Selecionar</span></button></div><div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button><Button onClick={() => setStep(3)}>Próximo</Button></div></div>}{step === 3 && <div className="space-y-5"><div><h2 className="text-xl font-semibold">Tudo pronto para começar</h2><p className="mt-1 text-sm text-muted-foreground">A hospedagem será criada somente após esta confirmação.</p></div><div className="rounded-2xl border bg-surface p-5"><div className="grid gap-4 sm:grid-cols-2">{[["Hóspede", guestName], ["WhatsApp", phone], ["Unidade", selectedUnit.unitName], ["Check-in", formatLocalDate(checkIn)], ["Check-out", formatLocalDate(checkOut)], ["Hóspedes", guests || "1"], ["Tipo de acesso", accessType === "yale" ? "Yale · assistido" : "Ekaza · automático"]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</div><p className="mt-5 border-t pt-4 text-sm text-muted-foreground">{nights} noite{nights > 1 ? "s" : ""} · A jornada será preparada localmente, sem integração externa.</p></div><div className="flex gap-2"><Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button><Button className="flex-1 sm:flex-none" onClick={create}>Preparar Hospedagem</Button></div></div>}<Button variant="ghost" className="w-full" onClick={onClose}>Cancelar</Button></div></Modal>;
}
function ManualExperienceCard({ reservation, onClose, onUpdate, onDemoCompleted, accessOpen, onAccessOpenChange }: {
    reservation: ManualAirbnbReservation;
    onClose: () => void;
    onUpdate: () => void;
    onDemoCompleted?: () => void;
    accessOpen?: boolean;
    onAccessOpenChange?: (open: boolean) => void;
}) {
    const [internalAccessOpen, setInternalAccessOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [yalePin, setYalePin] = useState("");
    const { showToast } = useToast();
    const isAccessOpen = accessOpen ?? internalAccessOpen;
    const setAccessOpen = onAccessOpenChange ?? setInternalAccessOpen;
    const timeline = reservation.timeline || [];
    const isYale = reservation.lockProvider === "yale";
    const readyForYale = Boolean(reservation.preCheckinCompleted && reservation.fnrhCompleted);
    async function prepareAccess() { if (reservation.lockMode === "automatic-demo") {
        updateManualAirbnbAccess(reservation.id, { accessStatus: "generating", accessPrepared: false }, ["Portal preparado"]);
        onUpdate();
        const result = await DemoAutomaticAccessProvider.createTemporaryAccess({ reservationId: reservation.id, unitId: reservation.unitId || "apartamento-demo-zigbee", guestName: reservation.guestName, validFrom: reservation.checkIn, validUntil: reservation.checkOut });
        if (result.status === "failed") {
            updateManualAirbnbAccess(reservation.id, { accessStatus: "generation_failed", accessPrepared: false }, ["Falha na geração demonstrativa"]);
            showToast("Falha na geração demonstrativa.");
        }
        else {
            setDemoAccessSecret(reservation.id, result.code);
            updateManualAirbnbAccess(reservation.id, { pinMasked: result.maskedCode, accessStatus: "active", accessPrepared: true, sent: false }, ["Chave criada", "QR criado", "Mensagem preparada", "Hospedagem pronta"]);
            showToast("Hospedagem preparada automaticamente.");
        }
    }
    else
        prepareManualAirbnbAccess(reservation.id); onUpdate(); }
    function completePreCheckin() { updateManualAirbnbPreparation(reservation.id, { preCheckinCompleted: true }, [reservation.lockMode === "automatic-demo" ? "Pré-check-in iniciado" : "Pré-check-in concluído"]); onUpdate(); showToast("Pré-check-in concluído."); }
    function completeFnrh() { updateManualAirbnbPreparation(reservation.id, { fnrhCompleted: true }, ["FNRH recebida.", "FNRH compartilhada com o anfitrião.", "Preparação do acesso iniciada."]); onUpdate(); showToast("FNRH recebida e compartilhada com o anfitrião."); if (reservation.lockMode === "automatic-demo")
        void prepareAccess(); }
    function confirmYalePin() { const cleanPin = yalePin.replace(/\D/g, ""); if (!cleanPin)
        return; setDemoAccessSecret(reservation.id, cleanPin); updateManualAirbnbAccess(reservation.id, { pinMasked: `${cleanPin.slice(0, 2)}${"•".repeat(Math.max(4, cleanPin.length - 2))}`, accessStatus: "active", accessPrepared: true }, ["Portal atualizado", "QR Code criado", "Mensagem preparada"]); setYalePin(""); onUpdate(); showToast("Portal, QR Code e mensagem preparados."); }
    function openWhatsApp() { if (!getDemoAccessSecret(reservation.id)) {
        showToast("O acesso temporário ainda não foi preparado.");
        return;
    } setAccessOpen(false); setSendOpen(true); }
    function sendExperience() { if (!getDemoAccessSecret(reservation.id)) {
        showToast("O acesso temporário ainda não foi preparado.");
        return;
    } sendManualAirbnbExperience(reservation.id); onUpdate(); setSendOpen(false); setAccessOpen(false); onDemoCompleted?.(); showToast("Mensagem enviada com sucesso.\n\nO trabalho do anfitrião foi concluído.\n\nO hóspede já pode iniciar sua experiência digital."); }
    const accessCode = getDemoAccessSecret(reservation.id);
    const message = `Olá, ${reservation.guestName.split(" ")[0]}!\n\nSua hospedagem no ${reservation.unitName || "Studio Vila Nova"} está confirmada.\n\nCheck-in: ${formatLocalDate(reservation.checkIn)}\nCheck-out: ${formatLocalDate(reservation.checkOut)}\n\nAcesse seu Portal do Hóspede:\n${reservation.portalUrl}\n\nSenha temporária da porta: ${accessCode || "Acesso ainda não preparado"}\n\nA senha será válida somente durante o período da hospedagem.\n\nEquipe Essencial Stay`;
    const checklist = [["Reserva confirmada", true], ["Unidade definida", true], ["Pré-check-in", Boolean(reservation.preCheckinCompleted)], ["FNRH Digital", Boolean(reservation.fnrhCompleted)], ["Portal do Hóspede", Boolean(reservation.accessPrepared)], [isYale ? "PIN Yale" : reservation.accessStatus === "generating" ? "Gerando acesso" : "Chave Digital", Boolean(reservation.accessPrepared)], ["QR Code", Boolean(reservation.accessPrepared)], ["Mensagem", Boolean(reservation.accessPrepared)]] as const;
    const completedSteps = checklist.filter(([, completed]) => completed).length;
    const progress = Math.round((completedSteps / checklist.length) * 100);
    const nextStep = reservation.sent ? "🎉 Hospedagem preparada e enviada ao hóspede" : !reservation.preCheckinCompleted ? "Iniciar pré-check-in" : !reservation.fnrhCompleted ? "Concluir FNRH Digital" : isYale && !reservation.accessPrepared ? "Aguardando PIN Yale" : reservation.accessStatus === "generating" ? "Gerando acesso automaticamente" : "Confirmar envio ao hóspede";
    return <Card className={`overflow-hidden border-border/70 shadow-sm ${reservation.accessPrepared ? "border-success/30" : reservation.isGuidedDemo ? "border-accent/40" : ""}`}><CardHeader className="bg-gradient-to-br from-primary/[0.08] via-surface to-accent/[0.08]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Centro de preparação da hospedagem</p><CardTitle className="mt-2 text-2xl">{reservation.sent ? "🎉 Hospedagem preparada e enviada ao hóspede" : reservation.accessPrepared ? "Hospedagem pronta para envio" : "Preparando a chegada"}</CardTitle><CardDescription className="mt-1">{reservation.guestName} · {reservation.unitName || "Studio Vila Nova"} · {formatLocalDate(reservation.checkIn)}</CardDescription></div><div className={`rounded-full px-3 py-1.5 text-sm font-semibold ${reservation.accessPrepared ? "bg-success/[0.12] text-success" : "bg-primary/[0.1] text-primary"}`}>{reservation.sent ? "✓ Jornada concluída" : reservation.accessPrepared ? "✓ Preparação concluída" : `${progress}% preparado`}</div></div><div className="mt-5"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Progresso da jornada</span><span>{completedSteps} de {checklist.length} etapas</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: `${progress}%` }}/></div></div></CardHeader><CardContent className="space-y-6 pt-6"><div><div className="mb-3 flex items-center justify-between"><div><p className="font-semibold">Jornada da hospedagem</p><p className="text-sm text-muted-foreground">O Essencial Stay antecipa as tarefas antes da chegada.</p></div><p className="text-sm font-medium text-primary">{nextStep}</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{checklist.map(([label, completed]) => <div key={label} className={`rounded-xl border p-4 transition-all duration-300 ${completed ? "border-success/20 bg-success/[0.05]" : label === "Gerando acesso" ? "border-info/30 bg-info/[0.05]" : "bg-surface"}`}><p className={`text-lg ${completed ? "text-success" : label === "Gerando acesso" ? "text-info" : "text-muted-foreground"}`}>{completed ? "✓" : label === "Gerando acesso" ? "⏳" : "○"}</p><p className="mt-2 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{completed ? "Preparado" : label === "Gerando acesso" ? "Em andamento" : "Aguardando etapa anterior"}</p></div>)}</div></div><div className="relative grid gap-2 rounded-xl border bg-surface p-4 sm:grid-cols-4">{["Reserva", "Pré-check-in", "FNRH", isYale ? "PIN Yale" : "Acesso automático", "Portal", "QR", "Mensagem", "Envio"].map((step, index) => <div key={step} className="flex items-center gap-2 text-xs"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${index < 7 ? index < Math.ceil((progress / 100) * 7) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground" : reservation.sent ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>{index + 1}</span><span className="font-medium">{step}</span></div>)}</div><div className="rounded-xl border bg-surface p-4"><p className="text-sm font-semibold">Atividade recente</p><p className="mt-2 text-sm text-muted-foreground">{timeline.join(" · ") || "Reserva confirmada"}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => window.open(reservation.portalUrl, "_blank", "noopener,noreferrer")}>Visualizar Portal</Button>{!reservation.sent && <Button variant="outline" disabled={!reservation.accessPrepared} onClick={openWhatsApp}>Enviar ao hóspede</Button>}<Button variant="ghost" onClick={() => setAccessOpen(true)}>Ver preparação</Button>{reservation.sent && <Button variant="ghost" onClick={() => window.location.reload()}>Nova demonstração</Button>}<Button variant="ghost" onClick={onClose}>Fechar</Button></div><Modal open={isAccessOpen} title={reservation.accessPrepared ? "🎉 Hospedagem preparada com sucesso" : "Preparar hospedagem"} description={reservation.accessPrepared ? "Toda a jornada foi preparada pelo Essencial Stay. Agora basta confirmar o envio das informações ao hóspede." : "Simulação local e segura para a jornada Airbnb."} onClose={() => setAccessOpen(false)}><div className="space-y-4 text-sm"><div className="rounded-md bg-surface p-4"><p className="font-semibold">{reservation.guestName} · {reservation.unitName || "Studio Vila Nova"}</p><p className="mt-1">Validade: {formatLocalDate(reservation.checkIn)} até {formatLocalDate(reservation.checkOut)}</p></div>{!reservation.preCheckinCompleted && <Button className="w-full" onClick={completePreCheckin}>Concluir pré-check-in</Button>}{reservation.preCheckinCompleted && !reservation.fnrhCompleted && <Button className="w-full" onClick={completeFnrh}>Concluir FNRH digital</Button>}{reservation.fnrhCompleted && <div className="rounded-md border border-success/20 bg-success/[0.08] p-3"><p className="font-semibold text-success">✓ FNRH recebida</p><p className="mt-1 font-medium">📲 FNRH compartilhada com o anfitrião</p><p className="mt-1 text-muted-foreground">A ficha foi registrada e a preparação do acesso continuará automaticamente.</p></div>}{isYale && readyForYale && !reservation.accessPrepared && <div className="rounded-md border border-accent/30 bg-accent/5 p-4"><p className="font-semibold">Aguardando PIN Yale</p><p className="mt-1 text-muted-foreground">Digite o PIN criado no Hub Connect. O código não será persistido em texto aberto.</p><Input className="mt-3" type="password" inputMode="numeric" value={yalePin} onChange={(event) => setYalePin(event.target.value.replace(/\D/g, ""))} placeholder="PIN Yale"/><Button className="mt-3 w-full" disabled={!yalePin} onClick={confirmYalePin}>Confirmar PIN</Button></div>}{!isYale && reservation.fnrhCompleted && !reservation.accessPrepared && <p className="rounded-md bg-info/[0.1] p-3 text-info">Gerando acesso automaticamente...</p>}{reservation.accessPrepared && <><div className="space-y-2 rounded-xl border border-success/20 bg-success/[0.05] p-4">{["Reserva confirmada", "Pré-check-in concluído", "FNRH registrada", `Acesso ${isYale ? "Yale" : "Ekaza"} preparado`, "Portal do Hóspede criado", "QR Code criado", "Mensagem preparada"].map((item) => <p key={item} className="flex items-center gap-2 font-medium text-success"><Check className="size-4"/>{item}</p>)}</div>{!reservation.sent && <Button className="w-full text-base" size="lg" onClick={openWhatsApp}>📲 Enviar ao hóspede pelo WhatsApp</Button>}<Button className="w-full" variant="outline" onClick={() => window.open(reservation.portalUrl, "_blank", "noopener,noreferrer")}>Visualizar Portal do Hóspede</Button></>}</div></Modal><Modal open={sendOpen} title="WhatsApp demonstrativo" description="Pré-visualização da mensagem que será enviada ao hóspede. Nenhuma integração externa será utilizada." onClose={() => setSendOpen(false)}><WhatsAppMessagePreview reservation={reservation} accessCode={accessCode || ""} onCopy={() => { void navigator.clipboard?.writeText(message); showToast("Mensagem copiada"); }} onSend={sendExperience}/></Modal></CardContent></Card>;
}

function WhatsAppMessagePreview({ reservation, accessCode, onCopy, onSend }: { reservation: ManualAirbnbReservation; accessCode: string; onCopy: () => void; onSend: () => void }) {
    const firstName = reservation.guestName.split(" ")[0];
    return <div className="space-y-5 text-sm">
        <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.08] to-accent/[0.08] p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-5" aria-hidden="true"/></span>
            <div><p className="font-semibold">Essencial Stay</p><p className="text-xs text-muted-foreground">Comunicação da hospedagem</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="whatsapp-recipient-title">
                <div className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4" aria-hidden="true"/><h3 id="whatsapp-recipient-title" className="text-xs font-semibold uppercase tracking-[0.14em]">Destinatário</h3></div>
                <p className="mt-4 text-lg font-semibold">{reservation.guestName}</p>
                <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MessageCircle className="size-4" aria-hidden="true"/>{reservation.phone}</p>
            </section>
            <section className="rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="whatsapp-stay-title">
                <div className="flex items-center gap-2"><Hotel className="size-4 text-primary" aria-hidden="true"/><h3 id="whatsapp-stay-title" className="font-semibold">{reservation.unitName || "Studio Vila Nova"}</h3></div>
                <dl className="mt-4 grid gap-3">
                    <div><dt className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarCheck className="size-3.5" aria-hidden="true"/>Check-in</dt><dd className="mt-1 font-medium">{formatLocalDate(reservation.checkIn)}</dd></div>
                    <div><dt className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true"/>Check-out</dt><dd className="mt-1 font-medium">{formatLocalDate(reservation.checkOut)}</dd></div>
                </dl>
            </section>
        </div>
        <section className="space-y-4 rounded-2xl border bg-surface/70 p-5 sm:p-6" aria-labelledby="whatsapp-message-title">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pré-visualização</p><h3 id="whatsapp-message-title" className="mt-1 text-lg font-semibold">Mensagem pronta para envio</h3></div>
            <div className="rounded-xl bg-card p-4"><p className="text-base font-semibold">Olá, {firstName}!</p><p className="mt-2 text-muted-foreground">Sua hospedagem no {reservation.unitName || "Studio Vila Nova"} está confirmada.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-4"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarCheck className="size-4" aria-hidden="true"/>Check-in</p><p className="mt-2 font-semibold">{formatLocalDate(reservation.checkIn)}</p></div>
                <div className="rounded-xl border bg-card p-4"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarClock className="size-4" aria-hidden="true"/>Check-out</p><p className="mt-2 font-semibold">{formatLocalDate(reservation.checkOut)}</p></div>
            </div>
            <div className="rounded-xl border border-info/20 bg-info/[0.06] p-4"><p className="flex items-center gap-2 font-semibold"><ExternalLink className="size-4 text-info" aria-hidden="true"/>Portal do Hóspede</p><a className="mt-2 block break-all text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={reservation.portalUrl} target="_blank" rel="noreferrer">{reservation.portalUrl}</a></div>
            <div className="rounded-xl border border-accent/25 bg-accent/[0.08] p-4"><p className="flex items-center gap-2 font-semibold"><KeyRound className="size-4 text-accent" aria-hidden="true"/>Acesso temporário</p><p className="mt-3 font-mono text-2xl font-bold tracking-[0.18em]">{accessCode}</p></div>
            <div className="border-t pt-4 text-muted-foreground"><p>A senha será válida somente durante o período da hospedagem.</p><p className="mt-3 font-medium text-foreground">Equipe Essencial Stay</p></div>
        </section>
        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCopy}><Copy className="size-4"/>Copiar mensagem</Button>
            <Button onClick={onSend}>Simular envio</Button>
        </div>
    </div>;
}
function StayDetailsModal({ stay, onClose, onMessage, onResend, onExperience }: {
    stay: DemoGuestStay | null;
    onClose: () => void;
    onMessage: () => void;
    onResend: (channel: DemoCommunicationChannel) => void;
    onExperience: () => void;
}) {
    if (!stay)
        return null;
    return <Modal open title={`Hospedagem · ${stay.unit}`} description="Visão operacional completa em ambiente demonstrativo." onClose={onClose} size="large"><div className="space-y-6">
    <DetailSection title="Hóspede"><DetailGrid items={[["Nome", stay.guest.name], ["Telefone", stay.guest.phone], ["E-mail", stay.guest.email], ["Hóspedes", String(stay.guest.partySize)], ["Observações", stay.guest.notes || "Nenhuma observação"]]}/></DetailSection>
    <DetailSection title="Estadia"><DetailGrid items={[["Propriedade", stay.property], ["Unidade", stay.unit], ["Check-in", stay.checkIn], ["Checkout", stay.checkOut], ["Status", stay.status]]}/></DetailSection>
    <DetailSection title="Preparação da experiência"><div className="space-y-2">{stay.preparation.map((item, index) => <div key={item.label} className="flex items-start gap-3 rounded-md bg-surface p-3"><div className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${item.status === "complete" ? "bg-success/[0.12] text-success" : "bg-warning/[0.12] text-warning"}`}>{item.status === "complete" ? <Check className="size-3.5"/> : <span className="text-[10px] font-bold">{index + 1}</span>}</div><div><p className="text-sm font-medium">{item.label}</p>{item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}</div></div>)}</div></DetailSection>
    <DetailSection title="Comunicação"><div className="rounded-md border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">{stay.communication.channel} · {stay.communication.status}</p><p className="mt-1 text-xs text-muted-foreground">{stay.communication.sentAt || "Ainda não enviada"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={onMessage}>Pré-visualizar</Button><Button size="sm" variant="ghost" onClick={() => onResend(stay.communication.channel)}>Reenviar</Button></div></div></div></DetailSection>
    <DetailSection title="Recursos da propriedade"><div className="flex flex-wrap gap-2">{stay.capabilities.map((capability) => <Badge key={capability} variant="outline"><CheckCircle2 className="size-3"/>{capability}</Badge>)}</div></DetailSection>
    <DetailSection title="Origem da reserva"><p className="text-sm">{stay.source === "PMS simulado" ? "Reserva recebida automaticamente — integração PMS simulada" : stay.source}{stay.externalCode && <span className="text-muted-foreground"> · {stay.externalCode}</span>}</p></DetailSection>
    {stay.featured && <><DetailSection title="Dados necessários do PMS"><CompactList items={["Identificador da reserva", "Nome e contato do hóspede", "Propriedade e unidade", "Check-in e checkout", "Status, alterações e cancelamentos"]}/></DetailSection><DetailSection title="Ações realizadas pela Essencial Stay"><CompactList items={["Identificação da unidade", "Preparação da experiência", "Disponibilização do portal", "Preparação da automação", "Geração da comunicação", "Acompanhamento até o checkout"]}/></DetailSection></>}
    <div className="flex flex-wrap justify-end gap-2 border-t pt-5">{stay.featured && <><Button variant="outline" onClick={onExperience}>Abrir Experiência do Hóspede</Button><Link to="/s/hotel-monaco-demo" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground">Abrir Portal Premium <ExternalLink className="size-4"/></Link></>}</div>
  </div></Modal>;
}
function MessageModal({ stay, onClose, onSend }: {
    stay: DemoGuestStay | null;
    onClose: () => void;
    onSend: (channel: DemoCommunicationChannel) => void;
}) {
    if (!stay)
        return null;
    const message = buildMessage(stay);
    return <Modal open title="Prévia da comunicação" description="Nenhuma mensagem real será enviada." onClose={onClose} size="large"><div className="space-y-4"><div className="rounded-lg border bg-surface p-5 whitespace-pre-line text-sm leading-6">{message}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(message); }}><Copy className="size-4"/>Copiar mensagem</Button><Button variant="outline" onClick={() => onSend("WhatsApp")}><MessageCircle className="size-4"/>Simular WhatsApp</Button><Button variant="outline" onClick={() => onSend("SMS")}><Send className="size-4"/>Simular SMS</Button><Button variant="outline" onClick={() => onSend("E-mail")}><Mail className="size-4"/>Simular e-mail</Button></div></div></Modal>;
}
function NewStayModal({ open, step, form, onForm, onStep, onClose, onCreate }: {
    open: boolean;
    step: number;
    form: FormState;
    onForm: (value: FormState) => void;
    onStep: (value: number) => void;
    onClose: () => void;
    onCreate: () => void;
}) {
    const set = (key: keyof FormState, value: string) => onForm({ ...form, [key]: value });
    return <Modal open={open} title="Nova hospedagem" description={`Etapa ${step} de 5 · cadastro manual demonstrativo`} onClose={onClose} size="large"><div className="space-y-5"><div className="grid grid-cols-5 gap-1">{[1, 2, 3, 4, 5].map((item) => <div key={item} className={`h-1.5 rounded-full ${item <= step ? "bg-accent" : "bg-secondary"}`}/>)}</div>
    {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nome completo"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Hóspede fictício"/></FormField><FormField label="Telefone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000"/></FormField><FormField label="E-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@example.com"/></FormField><FormField label="Quantidade de hóspedes"><Input type="number" min="1" value={form.partySize} onChange={(e) => set("partySize", e.target.value)}/></FormField></div>}
    {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Propriedade"><Input value="Hotel Summit Monaco" disabled/></FormField><FormField label="Unidade"><Select value={form.unit} onChange={(e) => set("unit", e.target.value)}><option>Apartamento 901</option><option>Apartamento 508</option><option>Apartamento 704</option></Select></FormField><FormField label="Check-in"><Input type="datetime-local" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)}/></FormField><FormField label="Checkout"><Input type="datetime-local" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)}/></FormField><FormField label="Observações" optional className="sm:col-span-2"><Input value={form.notes} onChange={(e) => set("notes", e.target.value)}/></FormField></div>}
    {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><FormField label="Origem" optional description="Usada somente no cadastro e nos detalhes."><Select value={form.source} onChange={(e) => set("source", e.target.value)}><option value="">Não informada</option>{["Airbnb", "Booking.com", "Reserva direta", "Indicação", "WhatsApp", "Outro"].map((value) => <option key={value}>{value}</option>)}</Select></FormField><FormField label="Código externo da reserva" optional><Input value={form.externalCode} onChange={(e) => set("externalCode", e.target.value)}/></FormField></div>}
    {step === 4 && <div><p className="text-sm font-medium">Recursos configurados para o Hotel Summit Monaco</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{["Portal do hóspede", "Automação Akubela", "Concierge digital", "Wi-Fi"].map((item) => <div key={item} className="flex items-center gap-3 rounded-md border p-3"><CheckCircle2 className="size-5 text-success"/><span className="text-sm font-medium">{item}</span></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Para propriedades short stay, esta etapa poderá incluir acesso Yale manual e guia local.</p></div>}
    {step === 5 && <div className="rounded-lg bg-surface p-5"><h3 className="font-semibold">Revisão</h3><DetailGrid items={[["Hóspede", form.name || "Não informado"], ["Propriedade", "Hotel Summit Monaco"], ["Unidade", form.unit], ["Check-in", formatLocalDate(form.checkIn)], ["Checkout", formatLocalDate(form.checkOut)], ["Origem", form.source || "Não informada"]]}/></div>}
    <div className="flex justify-between border-t pt-5"><Button variant="ghost" onClick={step === 1 ? onClose : () => onStep(step - 1)}>{step === 1 ? "Cancelar" : "Voltar"}</Button>{step < 5 ? <Button variant="accent" onClick={() => onStep(step + 1)}>Continuar <ArrowRight className="size-4"/></Button> : <Button variant="accent" onClick={onCreate}><Sparkles className="size-4"/>Criar hospedagem e preparar experiência</Button>}</div>
  </div></Modal>;
}
function DetailSection({ title, children }: {
    title: string;
    children: React.ReactNode;
}) { return <section><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>; }
function DetailGrid({ items }: {
    items: string[][];
}) { return <dl className="grid gap-4 rounded-md bg-surface p-4 sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>; }
function CompactList({ items }: {
    items: string[];
}) { return <div className="grid gap-2 sm:grid-cols-2">{items.map((item) => <div key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-success"/>{item}</div>)}</div>; }
function formatLocalDate(value: string) { if (!value)
    return "Não informado"; const [date, time] = value.split("T"); const [year, month, day] = date.split("-"); return `${day}/${month}/${year}${time ? ` às ${time}` : ""}`; }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function localPhoneDigits(value: string) { const digits = value.replace(/\D/g, ""); return (digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits).slice(0, 11); }
function formatBrazilianPhone(value: string) { const digits = localPhoneDigits(value); if (digits.length <= 2) return digits ? `(${digits}` : ""; if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`; return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`; }
function isValidBrazilianMobile(value: string) { const digits = localPhoneDigits(value); return digits.length === 11 && digits[2] === "9"; }
function normalizeBrazilianPhone(value: string) { return `+55${localPhoneDigits(value)}`; }
function vilaNovaPortalUrl(reservationId: string, organizationId: string, guestName: string) { const shortId = reservationId.replace(/^demo-/, "").slice(-4); const slug = `${slugify(guestName)}-${shortId}`; registerDemoPortalRoute(slug, organizationId, reservationId); return { slug, url: getDemoPublicUrl(`/s/vila-nova/${slug}`) }; }
function buildMessage(stay: DemoGuestStay) { return `Olá, ${stay.guest.name.split(" ")[0]}!\n\nSua hospedagem no Hotel Summit Monaco está confirmada.\n\nDurante sua estadia, você terá acesso ao Portal Essencial Stay para conhecer os recursos do quarto, controlar a automação disponível, acessar o Wi-Fi, consultar serviços do hotel e utilizar o concierge digital.\n\nAcesse sua experiência:\n${getDemoPublicUrl("/s/hotel-monaco-demo")}\n\n${stay.unit}\nCheck-in: ${stay.checkIn}\nCheckout: ${stay.checkOut}\n\nHotel Summit Monaco\nExperiência digital oferecida por Essencial Stay.`; }
