import * as dispositivosRepository from "../repositories/dispositivos.repository";

export type CriarDispositivoInput = dispositivosRepository.DispositivoCreate;
export type AtualizarDispositivoInput = dispositivosRepository.DispositivoUpdate;
export type FiltrosDispositivo = dispositivosRepository.DispositivoListFilters;

export const listarDispositivos = dispositivosRepository.listDispositivos;
export const listarEventosDispositivo = dispositivosRepository.listEventosDispositivo;

export async function criarDispositivo(input: CriarDispositivoInput) {
  return dispositivosRepository.createDispositivo(normalizarDispositivo(input));
}

export async function atualizarDispositivo(input: AtualizarDispositivoInput) {
  return dispositivosRepository.updateDispositivo(normalizarDispositivo(input));
}

function normalizarDispositivo<T extends CriarDispositivoInput | AtualizarDispositivoInput>(input: T): T {
  return {
    ...input,
    ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
    ...(input.fabricante !== undefined ? { fabricante: input.fabricante?.trim() || null } : {}),
    ...(input.modelo !== undefined ? { modelo: input.modelo?.trim() || null } : {}),
    ...(input.numero_serie !== undefined ? { numero_serie: input.numero_serie?.trim() || null } : {}),
    ...(input.versao_firmware !== undefined ? { versao_firmware: input.versao_firmware?.trim() || null } : {}),
  } as T;
}
