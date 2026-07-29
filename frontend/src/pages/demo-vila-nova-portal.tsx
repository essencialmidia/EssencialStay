import { BedDouble, Coffee, KeyRound, MapPin, MessageCircle, QrCode, ShieldCheck, Sparkles, Utensils, Wifi } from "lucide-react";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getDemoAccessSecret, getManualAirbnbReservationByOrganization, getManualAirbnbReservationBySlug } from "../demo/manual-airbnb-reservations";

const cards = [
  { label: "Informações", icon: BedDouble, text: "Confira os horários e detalhes da hospedagem" },
  { label: "Wi‑Fi", icon: Wifi, text: "VilaNova_Guest · senha no portal" },
  { label: "Acesso inteligente", icon: KeyRound, text: "Ativado no horário do check-in" },
  { label: "Automação", icon: Sparkles, text: "Iluminação e clima demonstrativos" },
  { label: "Como chegar", icon: MapPin, text: "Instruções de chegada disponíveis" },
  { label: "Restaurantes", icon: Utensils, text: "Guia local selecionado" },
  { label: "Transporte", icon: Coffee, text: "Opções próximas ao Studio" },
  { label: "Falar com anfitrião", icon: MessageCircle, text: "Suporte demonstrativo" },
];

export function DemoVilaNovaPortalPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const reservation = slug
    ? getManualAirbnbReservationBySlug(slug)
    : getManualAirbnbReservationByOrganization(params.get("organizationId"), params.get("reservaId"));
  const [message, setMessage] = useState<string | null>(null);
  const accessCode = getDemoAccessSecret(reservation?.id);
  const name = reservation?.guestName || "hóspede";
  const nights = reservation ? Math.max(1, Math.round((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / 86400000)) : 2;
  const stayItems = [
    ["Pré-check-in", reservation?.preCheckinCompleted ? "Concluído" : "Pendente"],
    ["Acesso temporário", accessCode ? "Disponível" : "Em preparação"],
    ["Wi-Fi", "Disponível"],
    ["Concierge", "Disponível"],
    ["Informações", "Disponíveis"],
    ["Checkout", "Acompanhar no portal"],
    ["Avaliação", "Disponível após a estadia"],
  ];

  return <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl space-y-5">
    <header className="rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-300/15 to-white/5 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Studio Vila Nova · Concierge Digital</p>
      {!reservation && <p className="mt-4 rounded-md bg-amber-300/10 p-3 text-sm text-amber-100">Dados específicos da reserva não estão disponíveis. Exibindo portal demonstrativo padrão.</p>}
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Olá, {name}</h1>
      <p className="mt-2 max-w-xl text-slate-300">Sua experiência está pronta. Tudo que você precisa para uma hospedagem confortável está aqui.</p>
      <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-sm">{reservation?.status || "Check-in pendente"}</span><span className="rounded-full bg-white/10 px-3 py-1 text-sm">{nights} noites</span><span className="rounded-full bg-white/10 px-3 py-1 text-sm">{reservation?.guests || 2} hóspedes</span></div>
    </header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Minha hospedagem" value={reservation?.unitName || "Studio Vila Nova"} /><Info label="Check-in" value={formatPeriod(reservation?.checkIn) || "15:00"} /><Info label="Check-out" value={formatPeriod(reservation?.checkOut) || "11:00"} /><Info label="Período" value={reservation ? `${formatPeriod(reservation.checkIn)} até ${formatPeriod(reservation.checkOut)}` : "Durante a reserva"} /></section>
    {reservation && <section className="grid gap-3 sm:grid-cols-2"><Info label="Hóspede" value={reservation.guestName} /><Info label="WhatsApp" value={reservation.phone} /></section>}
    <section><h2 className="mb-3 text-lg font-semibold">Sua estadia</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stayItems.map(([label, value]) => <Info key={label} label={label} value={value} />)}</div></section>
    <section className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-emerald-300" /><h2 className="font-semibold">Meu acesso temporário</h2></div>{accessCode ? <><p className="mt-3 text-sm text-slate-300">Senha temporária da porta: <strong className="text-lg text-white">{accessCode}</strong></p><p className="mt-2 text-sm text-slate-300">Digite a senha no teclado da fechadura e confirme. Ela será válida somente de {formatPeriod(reservation?.checkIn)} até {formatPeriod(reservation?.checkOut)}.</p></> : <p className="mt-3 text-sm text-slate-300">O acesso temporário ainda está sendo preparado.</p>}<div className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 p-3"><QrCode className="size-11 text-amber-200" /><span className="text-sm text-slate-300">QR Code demonstrativo para acesso seguro.</span></div></div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold">Meu quarto</h2><p className="mt-3 text-sm text-slate-300">Controle demonstrativo de iluminação, clima e cenas de chegada.</p><button type="button" onClick={() => setMessage("Cena de boas-vindas simulada.")} className="mt-4 rounded-md bg-amber-200 px-3 py-2 text-sm font-medium text-slate-950">Ativar boas-vindas</button></div>
    </section>
    <section><h2 className="mb-3 text-lg font-semibold">Seu Concierge</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <button type="button" key={card.label} onClick={() => setMessage(`${card.label}: ${card.text}`)} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"><card.icon className="size-5 text-amber-200" /><p className="mt-3 font-medium">{card.label}</p><p className="mt-1 text-xs text-slate-400">{card.text}</p></button>)}</div></section>
    <section className="rounded-xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold">Informações da hospedagem</h2><p className="mt-2 text-sm text-slate-300">Wi‑Fi, regras da casa, chegada, guia local e suporte estão disponíveis durante toda a estadia.</p></section>
    {message && <div className="fixed bottom-5 left-1/2 z-10 w-[min(90vw,30rem)] -translate-x-1/2 rounded-lg bg-emerald-500 px-4 py-3 text-sm text-white shadow-xl">{message}</div>}
    <p className="pb-4 text-center text-xs text-slate-500">Ambiente demonstrativo · acesso protegido · Suporte Essencial Stay</p>
  </div></main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
function formatPeriod(value?: string) { if (!value) return ""; const [date, time] = value.split("T"); const [year, month, day] = date.split("-"); return `${day}/${month}/${year}${time ? ` às ${time}` : ""}`; }
