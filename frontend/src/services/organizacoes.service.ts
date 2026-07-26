import type { User } from "@supabase/supabase-js";
import { getTechnicalError } from "../lib/supabase-error";
import * as organizacoesRepository from "../repositories/organizacoes.repository";
import * as storageRepository from "../repositories/storage.repository";
import type { Organizacao, StatusOrganizacao } from "../types/database";

export type SalvarOrganizacaoInput = organizacoesRepository.OrganizacaoCreate & { logo?: File | null };

export function normalizarDocumento(value?: string | null) {
  return value?.replace(/\D/g, "") || null;
}

export function normalizarTelefone(value?: string | null) {
  return value?.replace(/\D/g, "") || null;
}

export async function listarOrganizacoes(): Promise<Organizacao[]> {
  return organizacoesRepository.listOrganizacoes();
}

export async function obterOrganizacao(id: string) {
  return organizacoesRepository.getOrganizacao(id);
}

export async function atualizarStatusOrganizacao(id: string, status: StatusOrganizacao) {
  return organizacoesRepository.updateOrganizacao({ id, status });
}

export async function salvarOrganizacao(input: SalvarOrganizacaoInput, user: User, id?: string): Promise<Organizacao> {
  const { logo, ...values } = input;
  const logoUrl = logo ? await storageRepository.uploadClientLogo(user.id, logo) : values.logo_url;
  const payload = {
    ...values,
    documento: normalizarDocumento(values.documento),
    telefone: normalizarTelefone(values.telefone),
    email: values.email?.trim().toLocaleLowerCase("pt-BR") || null,
    logo_url: logoUrl ?? null,
  };
  return id
    ? organizacoesRepository.updateOrganizacao({ id, ...payload })
    : organizacoesRepository.createOrganizacao(payload);
}

export async function criarOrganizacaoOnboarding(input: SalvarOrganizacaoInput, user: User) {
  let logoUrl: string | null = null;
  let logoPendente = false;
  if (input.logo) {
    try {
      logoUrl = await storageRepository.uploadOnboardingLogo(user.id, input.logo);
    } catch (error) {
      logoPendente = true;
      console.warn("[Onboarding] Upload opcional do logotipo pendente", getTechnicalError(error));
    }
  }
  const organizacao = await organizacoesRepository.criarOrganizacaoOnboarding({
    ...input,
    documento: normalizarDocumento(input.documento),
    telefone: normalizarTelefone(input.telefone),
    email: input.email?.trim().toLocaleLowerCase("pt-BR") || null,
    logo_url: logoUrl,
  });
  return { organizacao, logoPendente };
}

export const listarMembrosOrganizacao = organizacoesRepository.listMembrosOrganizacao;
export const obterMembroOrganizacao = organizacoesRepository.getMembroOrganizacao;
