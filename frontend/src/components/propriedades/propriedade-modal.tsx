import { Building2, Rows3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { AutomacaoComRecursos } from "../../services/automacao.service";
import { atualizarPropriedade, criarPropriedade } from "../../services/propriedades.service";
import type { Propriedade, Unidade } from "../../types/database";
import { cn } from "../../lib/utils";
import { AutomationConfigForm } from "../automacao/automation-config-form";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { PropertyForm, type PropertyFormInput } from "./property-form";
import { PropertyUnitsEditor } from "./property-units-editor";

type Props = {
  open: boolean;
  organizacaoId: string;
  propriedade?: Propriedade | null;
  automacao?: AutomacaoComRecursos | null;
  unidades?: Unidade[];
  initialSection?: EditSection;
  onClose: () => void;
  onSaved: (propriedade: Propriedade) => void | Promise<void>;
  onAutomationSaved?: () => void | Promise<void>;
  onUnitsSaved?: () => void | Promise<void>;
};

type EditSection = "dados" | "automacao" | "unidades";

export function PropriedadeModal({ open, organizacaoId, propriedade, automacao, unidades = [], initialSection = "dados", onClose, onSaved, onAutomationSaved, onUnitsSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [section, setSection] = useState<EditSection>(initialSection);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [initialSection, open]);

  async function submit(input: PropertyFormInput) {
    setSubmitting(true);
    try {
      const saved = propriedade
        ? await atualizarPropriedade({ id: propriedade.id, ...input })
        : await criarPropriedade({ organizacao_id: organizacaoId, ...input });
      await onSaved(saved);
      showToast(propriedade ? "Propriedade atualizada." : "Propriedade cadastrada.");
      onClose();
    } catch (error) {
      console.error("[Propriedades] Falha ao salvar", error);
      showToast(error instanceof Error ? error.message : "Não foi possível salvar a propriedade.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function automationSaved() {
    await onAutomationSaved?.();
    onClose();
  }

  return (
    <Modal open={open} size="large" title={propriedade ? "Editar propriedade" : "Adicionar propriedade"} description={propriedade ? "Cadastro, operação e automação da hospedagem." : "Dados cadastrais e operacionais da hospedagem."} onClose={onClose}>
      {propriedade && (
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-md bg-secondary p-1" role="tablist" aria-label="Seções da propriedade">
          <EditTab active={section === "dados"} icon={Building2} label="Dados da propriedade" onClick={() => setSection("dados")} />
          <EditTab active={section === "automacao"} icon={Sparkles} label="Automação e recursos" onClick={() => setSection("automacao")} />
          <EditTab active={section === "unidades"} icon={Rows3} label="Unidades" onClick={() => setSection("unidades")} />
        </div>
      )}
      {section === "dados" || !propriedade ? (
        <PropertyForm value={propriedade} onSubmit={submit} submitting={submitting} onCancel={onClose} />
      ) : section === "automacao" ? (
        <AutomationConfigForm propriedadeId={propriedade.id} value={automacao} onSaved={automationSaved} />
      ) : (
        <PropertyUnitsEditor propriedadeId={propriedade.id} unidades={unidades} onSaved={onUnitsSaved} />
      )}
    </Modal>
  );
}

function EditTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Building2; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("flex min-h-9 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-muted-foreground transition-colors", active && "bg-background text-foreground shadow-xs")}><Icon className="size-4" />{label}</button>;
}
