# Desenvolvimento de migrations

1. Leia README, a sequência anterior, ADRs e consumidores.
2. Confirme se a migration alvo já foi aplicada; não a reescreva silenciosamente.
3. Prefira nova migration aditiva e idempotente quando compatível com o padrão local.
4. Avalie dados existentes, locks, constraints, índices, FKs, RLS e isolamento por `organizacao_id`.
5. Defina ordem, impacto, validação e rollback/mitigação.
6. Recarregue o schema do PostgREST quando o padrão vigente exigir.
7. Teste sucesso, negação, acesso cruzado, repetição e concorrência quando aplicável.

A migration 008 é obsoleta e não faz parte da arquitetura oficial. As 016/017 são históricas; não derive delas exclusão física atual. Não há Supabase CLI configurada neste repositório.

Use o [template](../templates/migration.md) e o [checklist](../checklists/database.md).
