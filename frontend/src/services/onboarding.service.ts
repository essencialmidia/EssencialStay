import type { User } from "@supabase/supabase-js";
import { getTechnicalError } from "../lib/supabase-error";
import type { RecursosInteligentesMapeados } from "../lib/recursos-inteligentes";
import * as authRepository from "../repositories/auth.repository";
import * as perfisRepository from "../repositories/perfis.repository";
import { getAdministradorAtual } from "../repositories/platform-admin.repository";
import * as propriedadesRepository from "../repositories/propriedades.repository";
import * as unidadesRepository from "../repositories/unidades.repository";
import type { TipoOrganizacao, TipoPropriedade, TipoUnidade } from "../types/database";
import { salvarAutomacao } from "./automacao.service";
import { criarOrganizacaoOnboarding } from "./organizacoes.service";

export type OnboardingInput = {
  organizacao: { nome: string; nome_fantasia?: string | null; documento?: string | null; tipo: TipoOrganizacao; email?: string | null; telefone?: string | null; logo?: File | null };
  propriedade: { nome: string; tipo: TipoPropriedade };
  automacao: RecursosInteligentesMapeados;
  unidade: { nome: string; codigo?: string | null; tipo: TipoUnidade; capacidade_hospedes?: number | null };
};

export type OnboardingOperation = "validar_usuario" | "salvar_perfil" | "validar_administrador" | "criar_organizacao" | "criar_propriedade" | "salvar_automacao" | "criar_unidade" | "concluir";
const config: Record<OnboardingOperation, { label: string; message: string; formStep: number }> = {
  validar_usuario: { label: "validar usuário", message: "Não foi possível validar sua sessão.", formStep: 0 }, salvar_perfil: { label: "salvar perfil", message: "Não foi possível atualizar seu perfil.", formStep: 0 },
  validar_administrador: { label: "validar administrador global", message: "Seu usuário não possui permissão para criar empresas clientes.", formStep: 0 }, criar_organizacao: { label: "criar empresa cliente", message: "Não foi possível criar a empresa cliente.", formStep: 0 },
  criar_propriedade: { label: "criar propriedade", message: "Não foi possível criar a propriedade.", formStep: 1 }, salvar_automacao: { label: "salvar automação", message: "Não foi possível salvar a automação.", formStep: 2 },
  criar_unidade: { label: "criar unidade", message: "Não foi possível criar a unidade.", formStep: 3 }, concluir: { label: "concluir", message: "Os dados foram salvos, mas a conclusão falhou.", formStep: 3 },
};
type Checkpoint = { ativo: boolean; organizacaoId?: string; propriedadeId?: string; unidadeId?: string };
export class OnboardingOperationError extends Error { constructor(message: string, public readonly operation: OnboardingOperation, public readonly formStep: number, public readonly cause: unknown) { super(message); this.name = "OnboardingOperationError"; } }
const key = (userId: string) => `essencial-stay:onboarding:${userId}`;
function read(userId: string): Checkpoint { try { const stored = localStorage.getItem(key(userId)); return stored ? JSON.parse(stored) as Checkpoint : { ativo: false }; } catch { return { ativo: false }; } }
function write(userId: string, checkpoint: Checkpoint) { localStorage.setItem(key(userId), JSON.stringify(checkpoint)); }
export function temOnboardingPendente(userId: string) { return read(userId).ativo; }
async function run<T>(operation: OnboardingOperation, action: () => Promise<T>) { try { return await action(); } catch (error) { const detail = getTechnicalError(error); console.error(`[Onboarding] Falha: ${config[operation].label}`, { operation, ...detail }); throw new OnboardingOperationError(`${config[operation].message} Detalhe do Supabase: ${detail.message}${detail.code ? ` (código ${detail.code})` : ""}`, operation, config[operation].formStep, error); } }
export async function finalizarOnboarding(input: OnboardingInput, currentUser: User, options?: { onProgress?: (message: string) => void }) {
  let checkpoint = { ...read(currentUser.id), ativo: true }; write(currentUser.id, checkpoint);
  const user = await run("validar_usuario", async () => { const authenticated = await authRepository.getAuthenticatedUser(); if (authenticated.id !== currentUser.id) throw new Error("A sessão ativa não corresponde ao onboarding."); return authenticated; });
  options?.onProgress?.("Preparando perfil...");
  await run("salvar_perfil", () => perfisRepository.upsertPerfil({ id: user.id, nome_completo: typeof user.user_metadata.nome_completo === "string" ? user.user_metadata.nome_completo : null }));
  await run("validar_administrador", async () => { const admin = await getAdministradorAtual(user.id); if (!admin?.ativo || !["proprietario", "administrador"].includes(admin.papel)) throw new Error("Administrador global ativo não encontrado."); return admin; });
  options?.onProgress?.("Criando empresa cliente...");
  const result = await run("criar_organizacao", () => criarOrganizacaoOnboarding(input.organizacao, user));
  const organizacao = result.organizacao; checkpoint = { ...checkpoint, organizacaoId: organizacao.id }; write(user.id, checkpoint);
  options?.onProgress?.("Criando propriedade...");
  const propriedade = await run("criar_propriedade", async () => {
    const byCheckpoint = checkpoint.propriedadeId ? await propriedadesRepository.getPropriedade(checkpoint.propriedadeId) : null;
    const existing = byCheckpoint?.organizacao_id === organizacao.id ? byCheckpoint : await propriedadesRepository.findPropriedadeOnboarding(organizacao.id, input.propriedade.nome);
    return existing ?? propriedadesRepository.createPropriedade({ organizacao_id: organizacao.id, nome: input.propriedade.nome.trim(), tipo: input.propriedade.tipo });
  });
  checkpoint = { ...checkpoint, propriedadeId: propriedade.id }; write(user.id, checkpoint);
  options?.onProgress?.("Salvando automação..."); await run("salvar_automacao", () => salvarAutomacao({ propriedade_id: propriedade.id, ...input.automacao }));
  options?.onProgress?.("Criando unidade...");
  const unidade = await run("criar_unidade", async () => { const byCheckpoint = checkpoint.unidadeId ? await unidadesRepository.getUnidade(checkpoint.unidadeId) : null; const existing = byCheckpoint?.propriedade_id === propriedade.id ? byCheckpoint : await unidadesRepository.findUnidadeOnboarding(propriedade.id, input.unidade.nome, input.unidade.codigo); const payload = { nome: input.unidade.nome.trim(), codigo: input.unidade.codigo?.trim() || null, tipo: input.unidade.tipo, capacidade_hospedes: input.unidade.capacidade_hospedes ?? null }; return existing ? unidadesRepository.updateUnidade({ id: existing.id, ...payload }) : unidadesRepository.createUnidade({ propriedade_id: propriedade.id, ...payload }); });
  checkpoint = { ...checkpoint, unidadeId: unidade.id }; write(user.id, checkpoint);
  await run("concluir", async () => { localStorage.removeItem(key(user.id)); });
  return { organizacao, propriedade, unidade, logoPendente: result.logoPendente };
}
