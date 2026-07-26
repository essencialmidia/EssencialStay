import * as conexoesRepository from "../repositories/conexoes-integracao.repository";

export type SalvarConexaoIntegracaoInput = conexoesRepository.ConexaoIntegracaoSave;
export type AtualizarConexaoIntegracaoInput = conexoesRepository.ConexaoIntegracaoUpdate;
export type FiltrosConexaoIntegracao = conexoesRepository.ConexaoIntegracaoListFilters;

export const listarConexoesIntegracao = conexoesRepository.listConexoesIntegracao;

export async function salvarConexaoIntegracao(input: SalvarConexaoIntegracaoInput) {
  return conexoesRepository.saveConexaoIntegracao({
    ...input,
    nome_exibicao: input.nome_exibicao.trim(),
    propriedade_ids: [...new Set(input.propriedade_ids)],
  });
}

export const atualizarConexaoIntegracao = conexoesRepository.updateConexaoIntegracao;
