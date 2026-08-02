# Testes

## Frontend

`cd frontend && npm test` executa `node --test test/*.test.ts`. Os testes atuais cobrem Automation Lab e jornadas demonstrativas. `npm run lint` executa verificação TypeScript sem emit e regras de símbolos não usados.

## Backend

`cd backend && npm test` usa o test runner nativo do Node. Os testes cobrem configuração, autenticação, assinatura, cache, allowlist, sanitização, mapeamento e servidor. `npm run lint` aplica `node --check` aos arquivos oficiais.

## Banco

`database/tests` contém SQL de release candidate e concorrência para a migration 019. Não existe runner npm ou ambiente local automatizado; registre qual instância PostgreSQL/Supabase foi usada e nunca use dados reais.

Execute primeiro o teste relacionado, depois lint/test completos e build quando o risco justificar. Em falha compactada, recupere mensagem, arquivo, linha e contexto mínimo.
