# Arquitetura do banco

## Plataforma e fonte de verdade

O banco é PostgreSQL no Supabase. Alterações estruturais são versionadas em `database/migrations`; não há ferramenta CLI de migration configurada no repositório. A migration 008 registra um modelo obsoleto e não integra a sequência oficial. As migrations 016/017 são históricas; a 019 consolida cancelamento e inativação lógica.

## Núcleos

- Identidade: `perfis`, ligados a `auth.users`.
- Tenant: `organizacoes` e `membros_organizacao`.
- Hospedagem: `propriedades` e `unidades`.
- Plataforma: `administradores_plataforma`.
- Automação: configurações e recursos por propriedade.
- IoT: ambientes, conexões, catálogo, dispositivos, capacidades, estados e eventos.
- Operação: estados da unidade, histórico, tarefas, bloqueios e eventos operacionais.

O schema `private` guarda referência opaca de credenciais e não é exposto aos papéis do navegador. RPCs encapsulam operações atômicas ou sensíveis. Índices seguem consultas por tenant e propriedade; FKs compostas impedem combinações entre organizações.

## Evolução segura

Leia toda a cadeia anterior antes de propor uma migration. Prefira mudanças aditivas, preserve migrations aplicadas, avalie RLS, índices, constraints, compatibilidade e rollback. Testes SQL da migration 019 ficam em `database/tests`. Veja [migrations](../development/migrations.md).
