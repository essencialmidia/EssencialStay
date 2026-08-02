# AI Context — Essencial Stay

## Leitura rápida

Essencial Stay é um SaaS multiempresa de hospitalidade. Estado real e código prevalecem sobre roadmap e documentos históricos. Leia primeiro o `AGENTS.md` aplicável; use `docs/project-map.md` para localizar a área. Não abra `.env`, gerados ou logs completos.

## Domínio

```text
Essencial Stay
├── administradores_plataforma (proprietário, administrador, suporte)
└── organizacoes = empresas clientes = tenants
    ├── membros_organizacao -> perfis -> auth.users
    └── propriedades
        ├── unidades
        ├── ambientes/dispositivos
        ├── automação e recursos inteligentes
        └── integrações funcionais

organizacao -> conexoes_integracao -> propriedades vinculadas
```

- A própria Essencial Stay não é organização cliente.
- Propriedade nunca pertence diretamente a usuário.
- PMS/channel manager são capacidades da propriedade.
- Conexão técnica externa pertence à organização e pode atender propriedades.
- Migration 008 (`clientes -> empresas`) é obsoleta.
- 016/017 são históricas; 019 usa cancelamento/inativação lógica.

## Arquitetura

- `frontend`: React 19, TypeScript, Vite, Tailwind, Router e Supabase JS.
- Fluxo frontend: page/component -> hook/context -> service -> repository -> Supabase.
- `backend`: HTTP Node sem framework; providers Akubela e Ekaza/Tuya.
- `database/migrations`: fonte de verdade PostgreSQL/Supabase, RLS e RPCs.
- `database/tests`: SQL do núcleo operacional; sem runner configurado.
- `docs`: base canônica + documentos históricos/roadmap.
- Deploy documentado: Docker/EasyPanel; frontend servido por Nginx.

## Estado das capacidades

- Supabase Auth, organizações, propriedades, unidades, administração global, RLS, IoT cadastral e núcleo operacional: implementados.
- Akubela e Ekaza/Tuya: integrações implementadas em fase segura, somente leitura.
- Automation Lab e jornadas de hóspede: demos/fixtures; não são operação real.
- Reserva/hóspede persistentes, PMS, channel manager, Airbnb operacional, mensagens e PIN real: planejados/não implementados.
- Backend NestJS: direção futura; backend atual é Node nativo.

## Autenticação, autorização e tenant

- Supabase Auth usa PKCE, sessão persistente e renovação automática.
- Frontend usa apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Contextos/guards orientam UI; RLS/RPC autorizam de fato.
- `organizacao_id` é raiz do tenant; FKs compostas evitam vínculos cruzados.
- Papéis de membro: proprietário, administrador, gerente, recepção, limpeza, manutenção.
- Papéis globais: proprietário, administrador, suporte; suporte é leitura.

## Segurança invariável

- Nunca ler/exibir/versionar `.env`, tokens, chaves, senhas, PINs ou dados reais.
- Nunca usar `service_role` no navegador, desativar RLS ou confiar no tenant da UI.
- Nunca permitir acesso entre organizações.
- Segredos de providers ficam no backend; respostas/logs são sanitizados.
- PIN temporário é mascarado até para administrador global.
- Não reescrever migration aplicada; definir impacto, RLS e rollback.
- Testes usam somente dados fictícios.

## Pastas-chave

- UI: `frontend/src/components/ui`, `frontend/src/styles`, `docs/design-system.md`.
- Rotas/auth: `frontend/src/routes`, `frontend/src/contexts/auth-context.tsx`.
- Dados: `frontend/src/repositories`; regras: `frontend/src/services`.
- Demos: `frontend/src/demo`; não tratar como persistência.
- Providers: `backend/automation`, `backend/akubela`, `backend/ekaza`.
- Banco: `database/migrations`; decisões: `docs/adr`.
- Conhecimento canônico: `docs/architecture`, `business`, `integrations`, `development`.

## Comandos reais

Não há script npm raiz.

```text
frontend: npm ci | npm run dev | npm run lint | npm test | npm run build | npm run preview
backend:  npm ci | npm start | npm run lint | npm test
```

Não há script separado de typecheck nem runner npm para SQL.

RTK: execute `where.exe rtk`; fallback PowerShell: `& "C:\Program Files\Tools\RTK\rtk.exe"`. Consulte `--help` e use apenas quando reduzir saída sem esconder erros.

## Forma de trabalhar

1. Verifique `git status`; preserve mudanças locais.
2. Pesquise símbolos/referências antes de abrir arquivos.
3. Identifique causa e camada afetada.
4. Faça diff pequeno, sem refatoração incidental.
5. Reutilize componentes, services, repositories e providers.
6. Valide teste relacionado, lint/test e build conforme risco.
7. Revise RLS, tenant, segredos e `git diff --check`.
8. Informe arquivos, testes, riscos, limitações e rollback.

## Roteamento de documentação

- Arquitetura: `docs/architecture`.
- Negócio: `docs/business`.
- Integrações: `docs/integrations`.
- Desenvolvimento: `docs/development`.
- Templates/checklists: `docs/templates`, `docs/checklists`.
- Termos: `docs/glossary.md`; mapa: `docs/project-map.md`.
- Detalhes históricos permanecem nos documentos antigos e devem ser checados contra o código.
