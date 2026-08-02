# Instruções locais: banco e Supabase

- `database/migrations` é a fonte de verdade; leia a sequência e o README antes de alterar schema.
- Não edite migration aplicada silenciosamente. A 008 é obsoleta; 016/017 são históricas.
- Toda entidade de cliente deve ter tenant inequívoco, RLS e proteção contra acesso cruzado.
- Considere dados existentes, índices, constraints, FKs, locks, idempotência e PostgREST.
- Nunca desative RLS, exponha o schema `private` ou armazene segredo/PIN em dados comuns.
- Documente impacto, ordem, rollback e ambiente de teste. Não há runner SQL automatizado no repositório.
- Use dados fictícios em `database/tests` e preserve migrations anteriores.
