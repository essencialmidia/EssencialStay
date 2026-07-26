import * as authRepository from "../repositories/auth.repository";
import * as perfisRepository from "../repositories/perfis.repository";

export type LoginInput = authRepository.AuthCredentials;
export type RegisterInput = authRepository.RegisterCredentials;

export async function login(input: LoginInput) {
  return authRepository.signIn(input);
}

export async function register(input: RegisterInput) {
  const result = await authRepository.signUp(input);
  if (result.session) {
    await perfisRepository.upsertPerfil({
      id: result.user.id,
      nome_completo: input.nomeCompleto,
    });
  }
  return result;
}

export async function logout(): Promise<void> {
  await authRepository.signOut();
}

export async function forgotPassword(email: string): Promise<void> {
  await authRepository.resetPassword(email);
}

export async function ensurePerfil(userId: string, nomeCompleto?: string | null): Promise<void> {
  const existing = await perfisRepository.getPerfil(userId);
  if (!existing) {
    await perfisRepository.upsertPerfil({
      id: userId,
      nome_completo: nomeCompleto ?? null,
    });
  }
}
