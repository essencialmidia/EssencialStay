import * as propriedadesRepository from "../repositories/propriedades.repository";
import type { FusoHorario, Propriedade } from "../types/database";

export type CriarPropriedadeInput = propriedadesRepository.PropriedadeCreate;
export type AtualizarPropriedadeInput = propriedadesRepository.PropriedadeUpdate;

export async function listarPropriedades(organizacoesIds?: string[]): Promise<Propriedade[]> {
  return propriedadesRepository.listPropriedades(organizacoesIds);
}

export async function listarFusosHorarios(): Promise<FusoHorario[]> {
  return propriedadesRepository.listFusosHorarios();
}

export async function criarPropriedade(input: CriarPropriedadeInput): Promise<Propriedade> {
  return propriedadesRepository.createPropriedade(input);
}

export async function atualizarPropriedade(input: AtualizarPropriedadeInput): Promise<Propriedade> {
  return propriedadesRepository.updatePropriedade(input);
}

export async function alterarStatusPropriedade(id: string, status: "ativa" | "inativa"): Promise<Propriedade> {
  return propriedadesRepository.updatePropriedade({ id, status });
}
