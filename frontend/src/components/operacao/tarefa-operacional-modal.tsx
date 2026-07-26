import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { criarTarefaOperacional } from "../../services/operacao.service";
import { nomesPrioridadesTarefaOperacional, prioridadesTarefaOperacional, type Propriedade, type TipoTarefaOperacional, type Unidade } from "../../types/database";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/toast";

const schema = z.object({
  unidade_id: z.string().uuid("Selecione uma unidade."),
  titulo: z.string().min(2, "Informe o título da tarefa."),
  descricao: z.string().optional(),
  prioridade: z.enum(prioridadesTarefaOperacional),
  obrigatoria: z.boolean(),
  agendada_para: z.string().optional(),
  prazo_em: z.string().optional(),
  justificativa: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function TarefaOperacionalModal({
  open,
  tipo,
  propriedades,
  unidades,
  exigeJustificativa,
  onClose,
  onSaved,
}: {
  open: boolean;
  tipo: TipoTarefaOperacional;
  propriedades: Propriedade[];
  unidades: Unidade[];
  exigeJustificativa: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { showToast } = useToast();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { unidade_id: "", titulo: "", descricao: "", prioridade: "normal", obrigatoria: tipo === "limpeza", agendada_para: "", prazo_em: "", justificativa: "" } });

  useEffect(() => {
    if (open) form.reset({ unidade_id: "", titulo: "", descricao: "", prioridade: "normal", obrigatoria: tipo === "limpeza", agendada_para: "", prazo_em: "", justificativa: "" });
  }, [form, open, tipo]);

  const propertyName = (id: string) => propriedades.find((item) => item.id === id)?.nome_fantasia || propriedades.find((item) => item.id === id)?.nome || "Propriedade";

  async function submit(values: Values) {
    if (exigeJustificativa && (values.justificativa?.trim().length ?? 0) < 3) {
      form.setError("justificativa", { message: "A ação de suporte exige justificativa." });
      return;
    }
    try {
      await criarTarefaOperacional({
        unidadeId: values.unidade_id,
        tipo,
        titulo: values.titulo,
        descricao: values.descricao,
        prioridade: values.prioridade,
        obrigatoria: values.obrigatoria,
        agendadaPara: values.agendada_para ? new Date(values.agendada_para).toISOString() : null,
        prazoEm: values.prazo_em ? new Date(values.prazo_em).toISOString() : null,
        justificativa: values.justificativa,
      });
      await onSaved();
      showToast("Tarefa operacional criada.");
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível criar a tarefa.", "error");
    }
  }

  return (
    <Modal open={open} title="Nova tarefa" description="Registre uma atividade operacional vinculada a uma unidade." onClose={onClose}>
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <FormField label="Unidade" error={form.formState.errors.unidade_id?.message}>
          <Select {...form.register("unidade_id")}><option value="">Selecione</option>{unidades.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{propertyName(item.propriedade_id)} · {item.nome}</option>)}</Select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Título" error={form.formState.errors.titulo?.message}><Input {...form.register("titulo")} /></FormField>
          <FormField label="Prioridade"><Select {...form.register("prioridade")}>{prioridadesTarefaOperacional.map((item) => <option key={item} value={item}>{nomesPrioridadesTarefaOperacional[item]}</option>)}</Select></FormField>
          <FormField label="Agendada para" optional><Input type="datetime-local" {...form.register("agendada_para")} /></FormField>
          <FormField label="Prazo" optional><Input type="datetime-local" {...form.register("prazo_em")} /></FormField>
        </div>
        <FormField label="Descrição" optional><Textarea {...form.register("descricao")} /></FormField>
        <label className="flex items-center gap-3 text-sm font-medium"><Checkbox {...form.register("obrigatoria")} />Tarefa obrigatória</label>
        {exigeJustificativa && <FormField label="Justificativa de suporte" error={form.formState.errors.justificativa?.message}><Textarea {...form.register("justificativa")} /></FormField>}
        <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Criando..." : "Criar tarefa"}</Button></div>
      </form>
    </Modal>
  );
}
