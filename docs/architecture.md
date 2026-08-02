# Arquitetura do Essencial Stay

> **Documento histórico.** Parte deste texto registra decisões de fundação e usa futuro para componentes que já evoluíram. Para o estado executável atual, consulte `docs/architecture/overview.md`, `frontend.md`, `backend.md` e `database.md`. Em caso de divergência, código, migrations vigentes e a base canônica em `docs/architecture/` prevalecem.

## Modelo oficial

O Essencial Stay é o SaaS e não é cadastrado como cliente. Cada registro de `public.organizacoes` representa uma empresa cliente e constitui uma fronteira de isolamento.

```text
Essencial Stay (SaaS)
├── Administradores da plataforma
└── Empresas clientes (organizacoes)
    ├── Usuarios (membros_organizacao -> perfis)
    └── Propriedades
        ├── Unidades
        ├── Automacao
        ├── Ambientes
        ├── Dispositivos
        └── Integracoes funcionais legadas

Empresas clientes (organizacoes)
└── Conexoes de integracao
    └── Propriedades vinculadas
```

Uma empresa cliente pode representar pessoa física ou jurídica e possuir qualquer quantidade ou combinação de hotéis, pousadas, casas, apartamentos e outros meios de hospedagem. Propriedades nunca pertencem diretamente a usuários.

O modelo `clientes -> empresas` introduzido historicamente pela migration 008 não integra a arquitetura oficial. A evolução vigente parte diretamente de `public.organizacoes`; não existe uma entidade `clientes` paralela. O artefato `public.integracoes_propriedade`, também originado naquele contexto, foi preservado por compatibilidade e está reservado para PMS, channel manager, GRMS e integrações funcionais. Ele não representa uma conexão externa do novo núcleo.

## Isolamento multiempresa

`organizacao_id` é a raiz do tenant. O usuário recebe acesso por `membros_organizacao`, podendo participar de várias empresas com papéis diferentes. Unidades, automação e integrações herdam o tenant por meio da propriedade.

Princípios obrigatórios:

- RLS permanece ativado em todas as tabelas expostas;
- selecionar uma empresa no frontend não concede autorização;
- toda política percorre a relação até `organizacoes`;
- administradores globais são separados dos membros da empresa;
- suporte global possui leitura, mas não escrita estrutural;
- proprietário e administrador global podem gerenciar cadastros;
- nenhuma promoção global é permitida pelo frontend.

## Camadas

### Frontend

React, TypeScript, Vite, TailwindCSS e o Design System do projeto. O fluxo interno é:

```text
page/component -> hook/context -> service -> repository -> Supabase
```

Neste estágio da fundação, autenticação e cadastros protegidos por RLS usam o cliente Supabase com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. `service_role` nunca é usada no navegador.

O frontend nunca conversa diretamente com Tuya, Akubela, Airbnb, PMS, pagamentos ou qualquer API externa.

### Backend

O backend será Node.js com NestJS. Ao iniciar regras de negócio e integrações, o fluxo alvo será:

```text
Frontend -> API NestJS -> Supabase/adapters -> servicos externos
```

O backend concentrará autorização complementar, regras de negócio, credenciais, idempotência, filas, retentativas, logs e auditoria.

### Banco e autenticação

Supabase fornece PostgreSQL, Auth e Storage. O domínio usa português do Brasil; tabelas e colunas usam `snake_case`, sem acentos. Migrations versionadas são a única fonte de alteração estrutural.

```text
auth.users -> perfis
perfis -> administradores_plataforma
perfis -> membros_organizacao -> organizacoes
organizacoes -> propriedades -> unidades
propriedades -> configuracoes_automacao_propriedade
configuracoes_automacao_propriedade -> recursos_automacao_propriedade
organizacoes + propriedades + unidades -> ambientes
organizacoes -> conexoes_integracao
conexoes_integracao + propriedades -> conexoes_integracao_propriedades
conexoes_integracao -> private.credenciais_integracao
categorias_dispositivo + protocolos_dispositivo -> catalogo_dispositivos
organizacoes + propriedades + ambientes -> dispositivos
dispositivos -> origens_dispositivo
dispositivos -> capacidades_dispositivo
dispositivos -> estados_dispositivo
dispositivos -> eventos_dispositivo
conexoes_integracao -> execucoes_sincronizacao
```

### Adapters

Adapters traduzirão contratos externos sem contaminar o domínio. Estão previstos Tuya, Akubela, Airbnb, WuBook e Stays.net. Cada adapter deverá encapsular autenticação, renovação de tokens, limites, IDs externos, erros e observabilidade.

## Administração global

`administradores_plataforma` possui os papéis `proprietario`, `administrador` e `suporte`.

- `proprietario`: gestão global e bootstrap controlado;
- `administrador`: gestão de empresas, propriedades, unidades e automação cadastral;
- `suporte`: consulta global para atendimento, sem escrita estrutural.

A tabela só permite ao usuário autenticado consultar o próprio vínculo. Inclusões e promoções são feitas manualmente por operador autorizado no SQL Editor, conforme `docs/bootstrap-platform-admin.md`.

## Automação

Automação pertence à propriedade. `configuracoes_automacao_propriedade` guarda situação, marca, modelo, instalação e instalador. `recursos_automacao_propriedade` normaliza o inventário de capacidades.

Os campos `automacao_*` existentes em `propriedades` são legados temporários. Triggers os mantêm como espelho; novos consumidores usam as tabelas normalizadas. Nenhuma API de fabricante é conectada no Sprint 05.

## Núcleo de integrações e dispositivos

`ambientes` organiza espaços físicos comuns ou vinculados opcionalmente a uma unidade. A autorreferência opcional permite representar hierarquias como unidade, quarto e banheiro sem misturar ambiente com unidade.

`conexoes_integracao` representa uma conta ou conexão externa da organização. A associação `conexoes_integracao_propriedades` permite que uma conexão atenda uma ou várias propriedades, sempre dentro do mesmo tenant. A função `salvar_conexao_integracao` persiste a conexão e seus vínculos de forma atômica, sem receber credenciais.

`private.credenciais_integracao` guarda apenas uma referência opaca para um segredo que será armazenado futuramente no Supabase Vault ou em outro gerenciador. O schema `private` não concede uso a `anon` ou `authenticated`; nenhum segredo, token ou chave é aceito pelo frontend.

`provedores_integracao`, `protocolos_dispositivo` e `categorias_dispositivo` são cadastros configuráveis. Novos fornecedores e protocolos não exigem alteração de constraint. `catalogo_dispositivos` é global, reutilizável e pode possuir vários protocolos.

`dispositivos` mantém o inventário interno sem chave estrangeira direta para fornecedor. `origens_dispositivo` registra identidades externas por conexão; `capacidades_dispositivo` descreve recursos normalizados; `estados_dispositivo` mantém somente o último estado observado; `eventos_dispositivo` preserva o histórico imutável.

As chaves estrangeiras compostas repetem `organizacao_id` e `propriedade_id` nas tabelas operacionais para impedir combinações entre tenants. Estado, origens, capacidades, eventos e execuções de sincronização são somente leitura no frontend.

`public.integracoes_propriedade` permanece intocada e semanticamente separada. A decisão está registrada em `docs/adr/001-separar-integracao-funcional-conexao-externa.md`.

Nenhum adapter externo, segredo, sincronização automática, comando IoT ou geração de evento é implementado nesta etapa.

## Segurança, logs e idempotência

- segredos ficam somente no backend ou em armazenamento seguro;
- logs não armazenam senhas, tokens ou credenciais completas;
- erros do Supabase são registrados tecnicamente e apresentados sem mascarar falhas relevantes;
- onboarding procura registros existentes e usa checkpoints para reduzir duplicações;
- futuras reservas, webhooks, comandos e pagamentos exigirão chaves idempotentes no backend;
- alterações administrativas sensíveis deverão gerar auditoria quando esse módulo for criado.

## Escalabilidade

Chaves estrangeiras possuem índices e as novas listagens são paginadas e filtradas no servidor. Índices operacionais começam por `organizacao_id`; o dashboard usa consultas de contagem em vez de carregar todos os registros. Eventos possuem índices por dispositivo, tenant e ordem temporal, além de chave de idempotência opcional.

Não há índice GIN genérico nos campos JSONB. Índices desse tipo somente serão adicionados quando consultas reais demonstrarem necessidade.

**Decisão pendente:** infraestrutura de filas e workers no EasyPanel.

**Decisão pendente:** retenção, arquivamento e particionamento físico de eventos.

## Infraestrutura

- frontend: React, TypeScript, Vite, TailwindCSS;
- backend futuro: Node.js e NestJS;
- banco, autenticação e storage: Supabase;
- deploy: EasyPanel;
- domínio principal: `essencialstay.com.br`.
