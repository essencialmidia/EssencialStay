# Mapa do projeto

## Diretórios

```text
.
├── frontend/                 aplicação React/TypeScript
│   ├── src/pages             composição de telas
│   ├── src/components        UI e componentes de domínio
│   ├── src/contexts, hooks   sessão, contexto e consultas
│   ├── src/services          regras/orquestração
│   ├── src/repositories      acesso ao Supabase
│   ├── src/demo              dados e jornadas não operacionais
│   └── test                  testes Node/TypeScript
├── backend/                  serviço HTTP Node
│   ├── automation            contrato e registro de providers
│   ├── akubela               adapter Akubela somente leitura
│   ├── ekaza                 adapter Ekaza/Tuya somente leitura
│   └── test                  testes Node
├── database/
│   ├── migrations            fonte de verdade do schema/RLS/RPC
│   ├── tests                 testes SQL do núcleo operacional
│   ├── diagnostics           consultas de diagnóstico
│   └── seeds                 reservado
├── docs/                     conhecimento, ADRs, deploy e histórico
├── config/                   reservado
└── essencial-stay-painel-v20 artefato visual legado
```

## Camadas e fluxo

```text
Usuário
  -> Router / Page / Component
  -> Context ou Hook
  -> Service
  -> Repository
  -> Supabase client (anon)
  -> Auth + RLS + RPC/PostgreSQL

Tela de integração
  -> Backend HTTP
  -> Provider contract
  -> Adapter Akubela ou Ekaza/Tuya
  -> API externa somente leitura
```

`organizacoes` é o tenant. `propriedades` pertence à organização; `unidades` pertence à propriedade. Membros ligam perfis às organizações. Administração global é paralela e não pertence a cliente.

## Dependências e integrações

O frontend depende de React, Router, Supabase JS, Tailwind, Zod e React Hook Form. O backend usa APIs nativas do Node e não possui dependências npm externas. Supabase é a infraestrutura central; Akubela e Ekaza/Tuya são integrações implementadas em leitura. PMS, channel manager, Airbnb operacional, reservas persistentes e mensagens permanecem planejados/demonstrativos.

Comece por [AI_CONTEXT](../AI_CONTEXT.md), depois abra apenas a área canônica em `docs/architecture`, `docs/business`, `docs/integrations` ou `docs/development`.
