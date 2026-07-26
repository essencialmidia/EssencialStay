import * as ambientesRepository from "../repositories/ambientes.repository";

export type CriarAmbienteInput = ambientesRepository.AmbienteCreate;
export type AtualizarAmbienteInput = ambientesRepository.AmbienteUpdate;
export type FiltrosAmbientes = ambientesRepository.AmbienteListFilters;

export const listarAmbientes = ambientesRepository.listAmbientes;
export const listarOpcoesAmbiente = ambientesRepository.listAmbienteOptions;

export async function criarAmbiente(input: CriarAmbienteInput) {
  return ambientesRepository.createAmbiente(normalizarAmbiente(input));
}

export async function atualizarAmbiente(input: AtualizarAmbienteInput) {
  return ambientesRepository.updateAmbiente(normalizarAmbiente(input));
}

function normalizarAmbiente<T extends CriarAmbienteInput | AtualizarAmbienteInput>(input: T): T {
  return {
    ...input,
    ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
    ...(input.descricao !== undefined ? { descricao: input.descricao?.trim() || null } : {}),
    ...(input.unidade_id !== undefined ? { unidade_id: input.unidade_id || null } : {}),
    ...(input.ambiente_pai_id !== undefined ? { ambiente_pai_id: input.ambiente_pai_id || null } : {}),
  } as T;
}
