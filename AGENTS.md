# AGENTS.md

## Visao do projeto e hierarquia

Essencial Stay e uma plataforma SaaS multiempresa de hospitalidade inteligente para hoteis, pousadas e outras propriedades. Centraliza empresas clientes, propriedades, unidades, operacao, reservas, check-in, jornada do hospede e automacao. Diferencie funcionalidades reais de demos, fundacoes ou roadmap.

Hierarquia oficial: administracao global da Essencial Stay -> `organizacoes` (empresas clientes/tenants) -> propriedades -> unidades/quartos, ambientes, recursos inteligentes e integracoes por propriedade -> reservas e jornada do hospede. PMS, channel manager e integracoes funcionais pertencem a propriedade, nunca ao cadastro da empresa. O modelo historico `clientes -> empresas` da migration 008 nao e oficial. Conexoes tecnicas externas podem pertencer a organizacao e ser vinculadas a uma ou mais propriedades, conforme o ADR 001.

## Arquitetura real

- `frontend/`: React 19 + TypeScript + Vite + Tailwind. Codigo em `frontend/src`; rotas em `src/routes`; telas em `src/pages`; componentes compartilhados em `src/components`; acesso a dados em `src/repositories` e regras de aplicacao em `src/services`.
- Autenticacao: Supabase Auth via `frontend/src/contexts/auth-context.tsx`; cliente anonimo em `frontend/src/lib/supabase.ts`; guards em `frontend/src/routes`. Nunca usar `service_role` no frontend.
- `backend/`: servidor HTTP Node.js atual e provedores Akubela e Ekaza/Tuya. `backend/automation` define contratos/registro; testes ficam em `backend/test`. NestJS e apenas direcao futura documentada.
- `database/migrations/`: historico PostgreSQL/Supabase 001-019, com funcoes/RPCs, indices, constraints, schemas `public`/`private` e RLS. A 008 e obsoleta; migrations 016/017 sao historicas e a 019 adota cancelamento/inativacao logica.
- `database/tests/`: testes SQL do nucleo operacional. `frontend/test/`: testes Node/TypeScript. `docs/`: arquitetura, dominio, produto, ADRs, integracoes, deploy e design system.
- Integracoes implementadas em codigo: Akubela e Ekaza/Tuya. Outros adapters vazios, demos, PMS/channel manager e itens de roadmap nao devem ser descritos como concluidos.

## Seguranca obrigatoria

Nunca:

- ler, exibir, registrar ou versionar `.env`, credenciais, tokens, API keys, PINs ou segredos; use apenas nomes de variaveis e exemplos vazios;
- colocar segredos no codigo, usar `service_role` no frontend ou enfraquecer autenticacao/autorizacao;
- desativar ou contornar RLS para corrigir erros, nem permitir acesso entre tenants;
- alterar silenciosamente migration aplicada ou usar dados reais de hospedes em testes;
- registrar payloads sensiveis de provedores.

PINs temporarios de fechaduras permanecem mascarados inclusive para o administrador global. O painel mostra somente estado, validade, propriedade, unidade e acoes permitidas. PINs/tokens nunca aparecem em logs e, quando a arquitetura permitir, ficam separados dos dados comuns em armazenamento restrito.

## Forma de trabalhar e contexto

1. Identifique a causa antes de editar e pesquise simbolos/referencias antes de abrir arquivos inteiros.
2. Comece por uma arvore resumida; nao leia `node_modules`, `dist`, `build`, `coverage`, caches ou gerados.
3. Abra somente trechos e arquivos diretamente ligados a tarefa. Resuma saidas longas, nao despeje logs e reutilize fatos ja verificados.
4. Faca mudancas pequenas e focadas; preserve comportamento e alteracoes locais do usuario. Nao refatore amplamente sem pedido.
5. Reutilize services, repositories, componentes e design system existentes; evite duplicacao.
6. Valide tipos/lint, testes relacionados e build quando apropriado. Se algo falhar, obtenha o detalhe essencial e informe o que nao foi executado.

## RTK

Antes de usar, execute `where.exe rtk`. Se o comando nao estiver no PATH, use `& "C:\Program Files\Tools\RTK\rtk.exe"`. Consulte `rtk --help` (ou o executavel pelo caminho completo) antes de escolher um subcomando. Use RTK somente quando ele realmente reduzir a saida, por exemplo em buscas, Git, lint, testes e builds suportados. Nao invente sintaxe; use o comando normal quando ausente ou incompativel. A compactacao nunca deve ocultar erros importantes: em falhas, obtenha contexto suficiente para diagnosticar causa, arquivo e linha.

## Comandos oficiais

Nao ha scripts npm na raiz. Execute no pacote correspondente.

```bash
cd frontend
npm ci                 # instalacao reproduzivel (package-lock existente)
npm run dev
npm test
npm run lint           # TypeScript sem emit + unused checks
npm run build           # tsc -b + vite build
npm run preview
```

```bash
cd backend
npm ci
npm start
npm test               # node --test; aceita caminhos/filtros apos --
npm run lint            # node --check nos arquivos oficiais
```

Nao existe script separado de verificacao de tipos nem runner npm para `database/tests`; nao invente comandos.

## Banco e migrations

Revise README, migrations anteriores e estado do ambiente antes de criar uma migration. Nunca reescreva migration ja aplicada sem avaliar compatibilidade. Prefira migration nova e aditiva; preserve dados e considere RLS, isolamento por `organizacao_id`, FKs, constraints e indices. Evite operacoes destrutivas. Explique impacto, ordem de aplicacao e rollback/mitigacao; recarregue PostgREST conforme o padrao existente quando o schema mudar.

## Interface e experiencia

Use portugues claro, responsividade e acessibilidade. Reutilize tokens/componentes de `frontend/src/components/ui` e `docs/design-system.md`; nao altere o visual fora do escopo. Cubra carregamento, sucesso, erro e vazio, bloqueie cliques repetidos durante operacoes e escreva mensagens compreensiveis para pessoas nao tecnicas.

## Criterios de conclusao

So conclua quando a causa estiver identificada, o diff estiver no escopo, tipos/lint e testes relacionados tiverem passado e o build tiver sido executado quando pertinente. Confirme que nao ha segredos em arquivos/logs. Liste arquivos alterados, validacoes, riscos e limitacoes; declare explicitamente qualquer verificacao omitida ou impossivel.
