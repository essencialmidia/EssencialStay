import * as operacaoRepository from "../repositories/operacao.repository";
import type {
  BloqueioUnidade,
  EstadoUnidade,
  Pagina,
  ResumoOperacional,
  StatusOperacionalUnidade,
  StatusTarefaOperacional,
  TarefaOperacional,
} from "../types/database";

export type ListarTarefasInput = operacaoRepository.ListarTarefasInput;
export type ListarBloqueiosInput = operacaoRepository.ListarBloqueiosInput;
export type ListarEstadosUnidadeInput = operacaoRepository.ListarEstadosUnidadeInput;
export type EstadoUnidadeCursor = operacaoRepository.EstadoUnidadeCursor;
export type PaginaCursorEstadosUnidade = operacaoRepository.PaginaCursorEstadosUnidade;

export const listarEstadosUnidade = operacaoRepository.listEstadosUnidade;
export const listarTarefasOperacionais = operacaoRepository.listTarefasOperacionais;
export const listarBloqueiosUnidade = operacaoRepository.listBloqueiosUnidade;
export const obterResumoOperacional = operacaoRepository.getResumoOperacional;

export async function transicionarEstadoUnidade(input: Omit<Parameters<typeof operacaoRepository.transitionEstadoUnidade>[0], "chaveIdempotencia">): Promise<EstadoUnidade> {
  return operacaoRepository.transitionEstadoUnidade({ ...input, chaveIdempotencia: criarChave("estado") });
}

export async function criarTarefaOperacional(input: Omit<Parameters<typeof operacaoRepository.createTarefaOperacional>[0], "chaveIdempotencia">): Promise<string> {
  return operacaoRepository.createTarefaOperacional({ ...input, chaveIdempotencia: criarChave("tarefa") });
}

export async function alterarStatusTarefaOperacional(input: Omit<Parameters<typeof operacaoRepository.changeStatusTarefaOperacional>[0], "chaveIdempotencia">): Promise<TarefaOperacional> {
  return operacaoRepository.changeStatusTarefaOperacional({ ...input, chaveIdempotencia: criarChave("tarefa-status") });
}

export async function criarBloqueioUnidade(input: Omit<Parameters<typeof operacaoRepository.createBloqueioUnidade>[0], "chaveIdempotencia">): Promise<string> {
  return operacaoRepository.createBloqueioUnidade({ ...input, chaveIdempotencia: criarChave("bloqueio") });
}

export async function encerrarBloqueioUnidade(input: Omit<Parameters<typeof operacaoRepository.closeBloqueioUnidade>[0], "chaveIdempotencia">): Promise<BloqueioUnidade> {
  return operacaoRepository.closeBloqueioUnidade({ ...input, chaveIdempotencia: criarChave("bloqueio-fim") });
}

export type { BloqueioUnidade, EstadoUnidade, Pagina, ResumoOperacional, StatusOperacionalUnidade, StatusTarefaOperacional, TarefaOperacional };

function criarChave(prefixo: string) {
  return `${prefixo}-${crypto.randomUUID()}`;
}
