# Sprint 04: SaaS funcional com Supabase

## Objetivo

Transformar a shell visual do Essencial Stay em uma base SaaS funcional com autenticacao, onboarding e persistencia real no Supabase.

Este sprint nao implementa Tuya, Akubela, WuBook, PMS, automacoes, QR Code, webhooks ou experiencia do hospede funcional.

## Fluxo de autenticacao

O frontend usa Supabase Auth por meio de `frontend/src/lib/supabase.ts`, configurado somente com:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`.

Fluxos implementados:

- cadastro;
- login;
- logout;
- recuperacao de senha;
- persistencia de sessao;
- refresh token automatico pelo cliente Supabase;
- rotas protegidas.

O frontend nunca utiliza Service Role.

## Fluxo do onboarding

O onboarding fica em `/onboarding` e e obrigatorio para usuarios autenticados sem organizacao.

Etapas:

1. Empresa: nome, documento, email, telefone e logo opcional.
2. Primeira propriedade: nome e tipo.
3. Motor de automacao: nenhum, Tuya ou Akubela.
4. Primeira unidade: nome, codigo e capacidade.

Ao finalizar, o sistema cria:

- organizacao;
- membro da organizacao com papel `proprietario`;
- primeira propriedade;
- primeira unidade.

Depois disso, o usuario e enviado para `/dashboard`.

## Estrutura do banco

Tabelas utilizadas:

- `perfis`;
- `organizacoes`;
- `membros_organizacao`;
- `propriedades`;
- `unidades`.

Migration adicionada:

- `database/migrations/002_sprint_04_rls.sql`.

Essa migration:

- adiciona `logo_url` em `organizacoes`;
- cria bucket publico `organization-logos`;
- cria funcoes auxiliares de seguranca por organizacao;
- cria politicas RLS para leitura e escrita conforme participacao do usuario na organizacao;
- prepara upload de logos no Supabase Storage.

## Arquitetura do frontend

Estrutura funcional adicionada:

- `contexts`: sessao autenticada e organizacao ativa;
- `repositories`: acesso direto ao Supabase;
- `services`: regras de fluxo usadas pelas telas;
- `hooks`: carregamento de dados compostos;
- `pages/auth`: login, cadastro e recuperacao;
- `pages/onboarding`: wizard inicial;
- `pages/propriedades`: CRUD de propriedades e unidades;
- `pages/configuracoes`: CRUD de organizacoes.

Regra arquitetural: paginas nao acessam Supabase diretamente. Toda chamada passa por services, e services usam repositories.

## Rotas

Rotas publicas:

- `/login`;
- `/register`;
- `/forgot-password`.

Rotas protegidas:

- `/onboarding`;
- `/dashboard`;
- `/hospedagens`;
- `/reservas`;
- `/hospedes`;
- `/experiencia-hospede`;
- `/automacao`;
- `/integracoes`;
- `/relatorios`;
- `/financeiro`;
- `/limpeza`;
- `/manutencao`;
- `/configuracoes`.

Se o usuario nao estiver autenticado, e redirecionado para `/login`.

Se estiver autenticado e nao possuir organizacao, e redirecionado para `/onboarding`.

## Decisoes tomadas

- Manter a identidade visual do Sprint 03.
- Remover "Portal do Hospede" do menu e usar "Experiencia do Hospede".
- Manter Tuya e Akubela apenas como valores cadastrados em `motor_automacao`.
- Usar Supabase diretamente no frontend apenas nesta fase funcional inicial, isolado por repositories e services.
- Preparar Storage para logos, sem implementar gestao avancada de marca.
- Criar policies RLS antes de liberar leitura/escrita pelo cliente autenticado.

## Arquivos criados

- `frontend/src/lib/supabase.ts`;
- `frontend/src/contexts/auth-context.tsx`;
- `frontend/src/contexts/organization-context.tsx`;
- `frontend/src/repositories/*`;
- `frontend/src/services/*`;
- `frontend/src/pages/auth/*`;
- `frontend/src/pages/onboarding.tsx`;
- `frontend/src/pages/propriedades.tsx`;
- `frontend/src/pages/configuracoes.tsx`;
- `frontend/.env.example`;
- `database/migrations/002_sprint_04_rls.sql`.

## Arquivos alterados

- `frontend/package.json`;
- `frontend/src/main.tsx`;
- `frontend/src/routes/router.tsx`;
- `frontend/src/lib/navigation.ts`;
- `frontend/src/pages/dashboard.tsx`;
- `frontend/src/components/layout/topbar.tsx`;
- `frontend/src/components/ui/dropdown-menu.tsx`;
- `frontend/src/components/ui/toast.tsx`;
- `docs/architecture.md`;
- `docs/roadmap.md`.

## Limitacoes atuais

- Reservas ainda nao existem no banco.
- Hospedes ainda nao existem no banco.
- Experiencia do hospede ainda nao e funcional.
- Automacao nao foi conectada.
- Tuya e Akubela sao apenas opcoes cadastradas.
- Nao ha API NestJS implementada.
- O logotipo oficial ainda precisa ser adicionado ao projeto.

## Sugestoes para o Sprint 05

- Criar fluxo real de reservas.
- Criar cadastro de hospedes.
- Criar status operacional de unidade com historico.
- Evoluir permissoes por papel.
- Preparar primeira API NestJS para centralizar regras de negocio sensiveis.
- Criar testes de fluxo para autenticacao, onboarding e CRUD.
