import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import type { ManualAirbnbReservation } from "../../demo/manual-airbnb-reservations";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

type GuideStep = { step: number; title: string; text: string };

function resolveGuideStep(reservation: ManualAirbnbReservation): GuideStep {
  const timeline = reservation.timeline || [];
  if (reservation.sent) return { step: 8, title: "Trabalho do anfitrião concluído", text: "A experiência foi enviada ao hóspede e a demonstração foi concluída." };
  if (timeline.includes("Mensagem preparada")) return { step: 7, title: "Hospedagem preparada", text: "O Essencial Stay concluiu a preparação. Confirme o envio das informações ao hóspede." };
  if (timeline.includes("QR Code criado") || timeline.includes("QR criado")) return { step: 6, title: "QR Code criado", text: "O QR Code demonstrativo já está disponível no Portal." };
  if (timeline.includes("Portal atualizado") || timeline.includes("Portal preparado")) return { step: 5, title: "Portal preparado", text: "O Portal do Hóspede foi preparado para a chegada." };
  if (reservation.accessPrepared) return { step: 4, title: reservation.lockMode === "automatic-demo" ? "Acesso Ekaza preparado" : "PIN Yale confirmado", text: "A chave digital está pronta para a hospedagem." };
  if (reservation.fnrhCompleted) return { step: 3, title: "FNRH concluída", text: "A chegada do hóspede foi registrada na jornada." };
  if (reservation.preCheckinCompleted) return { step: 2, title: "Pré-check-in concluído", text: "A preparação da chegada está em andamento." };
  return { step: 1, title: "Reserva recebida", text: "Abra a preparação para iniciar a jornada do hóspede." };
}

export function GuidedDemoPanel({ reservation, onPrepareAccess, onEndKeep, onEndRemove }: { reservation: ManualAirbnbReservation; onPrepareAccess: () => void; onEndKeep: () => void; onEndRemove: () => void }) {
  const [minimized, setMinimized] = useState(false); const [endOpen, setEndOpen] = useState(false);
  const item = resolveGuideStep(reservation);
  return <aside className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 shadow-floating" aria-label="Assistente da demonstração"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">▶ Assistente da Demonstração</p><p className="mt-1 text-xs text-muted-foreground">Etapa {item.step} de 8</p></div><div className="flex"><Button size="icon" variant="ghost" aria-label={minimized ? "Expandir assistente" : "Minimizar assistente"} onClick={() => setMinimized((value) => !value)}>{minimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</Button><Button size="icon" variant="ghost" aria-label="Encerrar demonstração" onClick={() => setEndOpen(true)}><X className="size-4" /></Button></div></div>{!minimized && <><div className="mt-3 h-1.5 rounded bg-secondary"><div className="h-full rounded bg-accent transition-all duration-500" style={{ width: `${(item.step / 8) * 100}%` }} /></div><h2 className="mt-4 font-medium">{item.step === 8 ? "🎉 " : ""}{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.text}</p>{item.step < 8 && <Button className="mt-4 w-full" variant="outline" onClick={onPrepareAccess}>{item.step === 1 ? "Iniciar preparação" : item.step === 7 ? "Revisar mensagem" : "Continuar preparação"}</Button>}<Button className="mt-2 w-full" variant="ghost" onClick={() => setEndOpen(true)}>Encerrar demonstração</Button></>}<Modal open={endOpen} title="Encerrar demonstração" description="Escolha como encerrar apenas esta sessão guiada." onClose={() => setEndOpen(false)}><div className="flex flex-col gap-2"><Button variant="outline" onClick={() => setEndOpen(false)}>Cancelar</Button><Button onClick={onEndKeep}>Encerrar mantendo a reserva</Button><Button variant="ghost" onClick={onEndRemove}>Encerrar removendo a reserva</Button></div></Modal></aside>;
}
