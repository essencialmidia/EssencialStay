import * as automacaoRepository from "../repositories/automacao.repository";
import type { ConfiguracaoAutomacaoPropriedade, RecursoAutomacao, RecursoAutomacaoPropriedade } from "../types/database";

export type AutomacaoComRecursos = ConfiguracaoAutomacaoPropriedade & { recursos: RecursoAutomacao[] };

export async function listarAutomacoes(propriedadeIds?: string[]): Promise<AutomacaoComRecursos[]> {
  const configuracoes = await automacaoRepository.listConfiguracoes(propriedadeIds);
  const recursos = await automacaoRepository.listRecursos(configuracoes.map((item) => item.id));
  return configuracoes.map((configuracao) => ({
    ...configuracao,
    recursos: recursos.filter((item: RecursoAutomacaoPropriedade) => item.configuracao_id === configuracao.id).map((item) => item.recurso),
  }));
}

export async function obterAutomacao(propriedadeId: string): Promise<AutomacaoComRecursos | null> {
  const configuracao = await automacaoRepository.getConfiguracao(propriedadeId);
  if (!configuracao) return null;
  const recursos = await automacaoRepository.listRecursos([configuracao.id]);
  return { ...configuracao, recursos: recursos.map((item) => item.recurso) };
}

export const salvarAutomacao = automacaoRepository.saveConfiguracao;
