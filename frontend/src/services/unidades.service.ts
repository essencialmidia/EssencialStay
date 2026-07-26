import * as unidadesRepository from "../repositories/unidades.repository";
import type { Unidade } from "../types/database";

export type CriarUnidadeInput = unidadesRepository.UnidadeCreate;
export type AtualizarUnidadeInput = unidadesRepository.UnidadeUpdate;
export type CriarUnidadesEmLoteInput = unidadesRepository.CriarUnidadesEmLoteInput;
export type CriarUnidadesEmLoteResult = unidadesRepository.CriarUnidadesEmLoteResult;

export async function listarUnidades(propriedadeIds: string[]): Promise<Unidade[]> {
  return unidadesRepository.listUnidadesByPropriedades(propriedadeIds);
}

export async function criarUnidade(input: CriarUnidadeInput): Promise<Unidade> {
  try {
    return await unidadesRepository.createUnidade(input);
  } catch (error) {
    throw normalizarErroUnidade(error);
  }
}

export async function atualizarUnidade(input: AtualizarUnidadeInput): Promise<Unidade> {
  try {
    return await unidadesRepository.updateUnidade(input);
  } catch (error) {
    throw normalizarErroUnidade(error);
  }
}

export async function criarUnidadesEmLote(input: CriarUnidadesEmLoteInput): Promise<CriarUnidadesEmLoteResult> {
  return unidadesRepository.createUnidadesEmLote(input);
}

function normalizarErroUnidade(error: unknown) {
  if ((error as { code?: string })?.code === "23505") {
    return new Error("Já existe uma unidade com este código nesta propriedade.");
  }
  return error;
}
