# Essencial Stay

Plataforma SaaS multiempresa para gestão de hospedagens. O produto atende desde proprietários de imóveis de temporada até redes hoteleiras e funciona com ou sem automação.

## Modelo principal

```text
Essencial Stay (SaaS)
├── Administradores da plataforma
└── Empresas clientes (tenant)
    ├── Usuários
    └── Propriedades
        ├── Unidades
        ├── Ambientes
        ├── Integrações
        ├── Dispositivos
        └── Automação
```

Propriedades não pertencem a usuários. Usuários recebem acesso à empresa cliente por meio de um vínculo com papel. Automação e integrações são capacidades opcionais da propriedade.

## Estrutura

- `frontend`: aplicação React, TypeScript, Vite e TailwindCSS;
- `backend`: fundação para a futura API NestJS e seus adapters;
- `database/migrations`: histórico versionado do PostgreSQL/Supabase;
- `database/seeds`: dados de desenvolvimento futuros;
- `docs`: visão de produto, domínio, arquitetura, roadmap e design system;
- `config`: configurações compartilhadas futuras.

## Frontend

Variáveis locais, sempre usando a chave anônima do Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Nunca use `service_role` no frontend.

Comandos:

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

## Migrations

Migrations são a única forma aceita de alterar a estrutura do banco. A migration 008 documenta uma arquitetura descartada e não integra a sequência oficial.

Para o banco que já recebeu as migrations 001 a 006, execute manualmente no SQL Editor, sem repetir arquivos já aplicados:

1. `007_adicionar_logo_organizacoes.sql`;
2. `009_administracao_plataforma.sql`;
3. `010_automacao_por_propriedade.sql`;
4. `011_garantir_rpc_onboarding_organizacao.sql`;
5. `012_garantir_administracao_plataforma.sql`;
6. `013_gestao_multiempresa.sql`;
7. `014_corrigir_tipos_unidade.sql`;
8. `015_gestao_propriedades_unidades.sql`;
9. `016_exclusao_permanente_propriedade.sql`;
10. `017_exclusao_permanente_organizacao.sql`;
11. `018_nucleo_integracoes_dispositivos.sql`.

A 007 garante `logo_url`. A 008 é obsoleta e não deve ser executada. A 009 parte diretamente de `organizacoes`, cria a administração global e recompõe o RLS sem introduzir `clientes` ou `empresas`. A 010 normaliza a automação por propriedade. A 011 garante a RPC administrativa. A 012 consolida tabela, RLS, funções administrativas e RPC. A 013 amplia os tipos permitidos de unidade para a gestão multiempresa. A 014 normaliza os tipos legados e consolida o conjunto oficial aceito em `unidades.tipo`. A 015 implementa a gestão completa de propriedades e unidades, separa ativação de status operacional, garante códigos únicos e adiciona o cadastro idempotente em lote. As migrations 016 e 017 registram uma abordagem histórica de exclusão permanente que é removida pela migration 019; o modelo vigente utiliza somente cancelamento e inativação lógica. A 018 cria o núcleo multiempresa de ambientes, integrações, credenciais criptografadas, catálogo, dispositivos e eventos. As migrations que alteram o schema recarregam o PostgREST ao final.

Depois, faça o bootstrap controlado do primeiro proprietário global seguindo [docs/bootstrap-platform-admin.md](docs/bootstrap-platform-admin.md).

Não volte a executar migrations antigas que já foram aplicadas.

## Segurança

- RLS permanece ativo nas tabelas operacionais;
- autenticação usa Supabase Auth e `auth.uid()`;
- o frontend não acessa APIs externas;
- credenciais de Tuya, Akubela, PMS ou outros provedores ficarão somente no backend;
- nenhuma integração externa é executada nesta etapa.

Consulte [docs/architecture.md](docs/architecture.md) e [docs/domain-model.md](docs/domain-model.md) para as decisões completas.
