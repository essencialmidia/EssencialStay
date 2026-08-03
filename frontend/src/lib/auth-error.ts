const knownMessages: Array<{ match: string; message: string }> = [
  { match: "autenticação não está configurada", message: "O acesso à plataforma não está configurado neste ambiente. Contate o suporte." },
  { match: "invalid login credentials", message: "E-mail ou senha incorretos." },
  { match: "email not confirmed", message: "Confirme seu e-mail antes de entrar." },
  { match: "user already registered", message: "Já existe uma conta com este e-mail." },
  { match: "email rate limit exceeded", message: "Muitas tentativas foram realizadas. Aguarde alguns minutos." },
  { match: "password should be at least", message: "A senha não atende aos requisitos mínimos de segurança." },
  { match: "signup is disabled", message: "O cadastro de novas contas está temporariamente indisponível." },
  { match: "network", message: "Não foi possível conectar ao serviço de autenticação." },
  { match: "fetch", message: "Não foi possível conectar ao serviço de autenticação." },
];

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const normalizedMessage = error.message.toLowerCase();
  return knownMessages.find((item) => normalizedMessage.includes(item.match))?.message ?? fallback;
}
