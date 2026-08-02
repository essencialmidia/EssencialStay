# Arquitetura de segurança

## Controles existentes

Supabase Auth identifica usuários; RLS aplica isolamento e papéis. O frontend usa chave anônima. Credenciais de integração são configuração exclusiva do backend, com sanitização de respostas e logs. Providers operam em leitura e exigem allowlist de dispositivos e autorização administrativa nos endpoints protegidos.

O banco usa schema privado para referências de segredos, FKs compostas para tenant, funções de autorização e registros operacionais imutáveis. O container Nginx adiciona cabeçalhos básicos de segurança.

## Invariantes

- Nunca expor `.env`, token, chave, senha ou PIN.
- Nunca usar `service_role` no navegador ou desligar RLS.
- Nunca confiar no tenant escolhido pela interface sem validação no banco.
- Nunca registrar payload externo completo sem sanitização.
- Dados de testes devem ser fictícios.
- PIN temporário permanece mascarado inclusive para administração global.

Mudanças sensíveis exigem revisão de RLS, acesso cruzado, logs, rollback e impacto de dados. Use o [checklist de segurança](../checklists/security.md).
