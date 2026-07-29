# Akubela OpenAPI — Fase 1 somente leitura

## Pesquisa oficial

A Akubela OpenAPI é disponibilizada mediante contato e aprovação do integrador. A documentação recomenda desenvolver e depurar primeiro no servidor de teste. Para a Manager API, cada integração usa credenciais próprias e OAuth 2.0 com `password grant`, escopo `manager`, token bearer, validade informada por `expires_in` e renovação por `refresh_token`.

Endpoint de token:

`POST /api/v1.0/invoke/open-ability/method/oauth2/token`

As operações Manager confirmadas usam:

`POST /api/v1.0/invoke/open-ability/method/manager-commands`

Embora o transporte seja POST, esta fase permite somente os comandos documentados de leitura:

- `get_project_list`: projetos disponíveis para a conta Manager;
- `get_device_list`: dispositivos de um projeto;
- `get_device_info`: detalhes de um dispositivo.

O cliente rejeita qualquer outro comando antes de realizar uma requisição.

## Servidores

Produção:

- Europa: `https://api.ecloud.akubela.com`
- Ásia: `https://api.scloud.akubela.com`
- América: `https://api.ucloud.akubela.com`
- Japão: `https://api.jcloud.akubela.com`
- Austrália: `https://api.aucloud.akubela.com`
- China: `https://api.ccloud.akubela.com`

Teste oficialmente documentado:

- Europa: `https://api.ecloud.pre.akubela.com`
- China: `https://api.ccloud.pre.akubela.com`

## Hierarquia confirmada e normalização

| Akubela | Essencial Stay | Situação |
| --- | --- | --- |
| Project | Location | Confirmado por `get_project_list` |
| Residence/Family | Residência | Documentado na Family Management API, ainda não exposto nesta fase |
| Device | Device | Confirmado por `get_device_list` e `get_device_info` |
| Indoor Monitor | Control panel | Classificação baseada no `device_type` real |
| Relay/Security relay | Channel | Somente quando retornado em `get_device_info` |
| Space/Room | Space | Endpoint de listagem não confirmado; retorna `supported: false` |

PG42 e módulos Nova Digital não são classificados pelo nome comercial. A identificação depende dos campos reais `device_type`, `product_name`, modelo, relações e relés retornados no ambiente do integrador.

## Configuração

```dotenv
AKUBELA_ENABLED=false
AKUBELA_DEVICE_READ_ENABLED=false
AKUBELA_COMMANDS_ENABLED=false
AKUBELA_BASE_URL=
AKUBELA_CLIENT_ID=
AKUBELA_CLIENT_SECRET=
AKUBELA_USERNAME=
AKUBELA_PASSWORD=
AKUBELA_PROJECT_ID=
AKUBELA_ADMIN_API_KEY=
AKUBELA_ALLOWED_DEVICE_IDS=
AKUBELA_REQUEST_TIMEOUT_MS=10000
```

`AKUBELA_COMMANDS_ENABLED` deve permanecer `false`. Não existe implementação de comando nesta fase. A chave administrativa local é independente das credenciais Akubela e chega às rotas administrativas pelo header `x-akubela-admin-key`.

## Obtenção de credenciais e vínculo

O integrador deve contatar `support@akubela.com`, solicitar acesso à OpenAPI e credenciais para o ambiente de teste apropriado. O cadastro/vínculo do PG42 e dos módulos deve ser feito pelos procedimentos oficiais do ecossistema Akubela; esta implementação não cadastra, remove ou altera equipamentos.

## Limitações da fase

- Não há endpoint oficial inequívoco confirmado para listar espaços/cômodos.
- A Manager API documenta `online`, mas não estados elétricos individuais dos canais.
- Relés retornados em detalhes viram canais com `state: null`; `writable` apenas registra capacidade declarada, sem habilitar escrita.
- Cenas e webhooks ficam apenas como temas de pesquisa; não há chamadas nesta fase.
- PG42, Nova Digital, relação pai/filho e quantidade real de canais dependem das respostas do ambiente de teste.
