# Sprint 3 - Núcleo de Integrações, Ambientes e Dispositivos

## Objetivo

Este sprint cria a fundação cadastral e multiempresa para futuras integrações e operações IoT. Não há conexão, autenticação, sincronização ou comando real com qualquer fornecedor externo.

## Modelo implementado

```text
organizacoes
├── propriedades
│   ├── unidades
│   │   └── ambientes
│   ├── ambientes comuns
│   └── dispositivos
│       ├── origens_dispositivo
│       ├── capacidades_dispositivo
│       ├── estados_dispositivo
│       └── eventos_dispositivo
└── conexoes_integracao
    ├── conexoes_integracao_propriedades
    ├── private.credenciais_integracao
    └── execucoes_sincronizacao

provedores_integracao
protocolos_dispositivo
categorias_dispositivo
catalogo_dispositivos
```

## Decisões

- `public.integracoes_propriedade` permanece intocada e reservada ao modelo legado de integrações funcionais.
- `conexoes_integracao` pertence à organização e pode atender várias propriedades.
- `conexoes_integracao_propriedades` é a única associação N:N do novo núcleo.
- Provedores, protocolos e categorias são registros configuráveis, não enums rígidos.
- Ambientes podem pertencer a uma unidade e possuir um ambiente superior.
- Dispositivos não dependem de conexão ou fornecedor para existir.
- Identidades externas ficam em `origens_dispositivo`.
- Cadastro, estado atual e histórico de eventos são estruturas separadas.
- Nenhuma tabela concede `DELETE` ao frontend.

## Interface

As rotas `/ambientes`, `/integracoes` e `/dispositivos` foram preservadas.

- Ambientes possuem busca, filtros e paginação no servidor, unidade opcional e hierarquia.
- Integrações são exibidas como conexões da empresa e aceitam múltiplas propriedades.
- Dispositivos são cadastrados manualmente sem fornecedor obrigatório.
- Estado, bateria e sinal são informativos e não podem ser editados pelo frontend.
- O dashboard obtém indicadores por contagens no banco.

## Segurança

RLS é obrigatória em todas as tabelas. Leitura operacional exige administração global ativa ou vínculo com a organização. Escrita cadastral exige gestão global ou papel autorizado na empresa.

O schema `private` não é exposto a `anon` ou `authenticated`. `private.credenciais_integracao` contém somente referência para segredo futuro e permanece sem políticas ou grants para o navegador.

Origens externas, capacidades, estados, eventos e execuções de sincronização possuem somente leitura para `authenticated`. A ingestão será responsabilidade do backend futuro.

## Catálogos iniciais

Provedores: Tuya, Akubela, Yale Connect, TTLock, Shelly, Matter, MQTT, WuBook, Hospy, HITS, Cloudbeds, Stays.net e Personalizada.

Protocolos: Zigbee, Wi-Fi, Bluetooth, Matter, KNX, Modbus, MQTT, Ethernet e proprietário.

Categorias: gateway, painel inteligente, interruptor, relé, fechadura, sensor, termostato, ar-condicionado, infravermelho, TV, luz, cortina, tomada, câmera e outro.

## Fora do escopo

- adapters reais e autenticação de fornecedores;
- armazenamento efetivo de segredos;
- comandos e sincronização automática;
- filas, Event Bus distribuído e Inbox/Outbox;
- particionamento físico de eventos;
- backend NestJS independente.

## Decisões pendentes

- **Decisão pendente:** Supabase Vault ou KMS externo para produção.
- **Decisão pendente:** política de retenção e particionamento de eventos.
- **Decisão pendente:** taxonomia definitiva de capacidades e eventos.
- **Decisão pendente:** estratégia de filas, retentativas e observabilidade.
