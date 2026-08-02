# Instruções locais: backend

- O backend atual é HTTP Node.js sem framework; não suponha NestJS.
- Preserve o contrato provider-agnostic e mantenha regras de fabricante em `akubela` ou `ekaza`.
- Operações reais permanecem somente leitura salvo solicitação e revisão de segurança explícitas.
- Credenciais vêm do ambiente; nunca retornam em respostas, logs ou fixtures.
- Mantenha allowlists, timeouts, cache de token, CORS e códigos de erro sanitizados.
- Adicione testes Node para autenticação, falhas, sanitização e limites do provider.
- Valide com `npm run lint` e `npm test`.
