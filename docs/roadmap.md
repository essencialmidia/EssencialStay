# Roadmap do Essencial Stay

## Fase 1 - Fundação

Documentação, autenticação, empresas clientes, usuários, propriedades, unidades, banco e dashboard inicial.

Entregas concluídas até o Sprint 05:

- Design System, shell operacional e experiência visual premium;
- autenticação Supabase com sessão persistente e rotas protegidas;
- tenant oficial em `organizacoes` e membros multiempresa;
- área global `/admin` protegida por `administradores_plataforma`;
- cadastro e consulta de empresas, propriedades e unidades;
- automação cadastral normalizada por propriedade;
- onboarding Empresa -> Propriedade -> Automação -> Unidade;
- RLS para membros do tenant e administradores globais.

Pendências para encerrar a fase:

- aplicar e validar as migrations 009 e 010 no ambiente Supabase;
- executar os cenários oficiais com usuários reais;
- adicionar paginação antes de volume de produção;
- criar auditoria das ações administrativas.

## Fase 2 - Gestão da hospedagem

Hóspedes, reservas manuais, check-in, checkout, status da unidade e portal básico do hóspede. A operação deve funcionar sem automação.

## Fase 3 - Motor Tuya

Conexão pelo backend, importação e associação de dispositivos, luzes, tomadas, ar-condicionado, cenas, logs e fechaduras quando suportadas. Tuya será um adapter, não o núcleo do produto.

## Fase 4 - Experiência do hóspede

Link temporário, QR Code, Wi-Fi, regras da propriedade, contato, automação autorizada e mensagens.

## Fase 5 - Integrações

PMS, Airbnb, WuBook, Stays.net, WhatsApp e pagamentos, sempre via backend e adapters.

## Fase 6 - Motor Akubela

OpenAPI, GRMS, Hotel Function, H5, dispositivos e cenas por adapter.

## Fase 7 - SaaS comercial

Planos, assinaturas, limites, faturamento, white label, relatórios e permissões avançadas.

## Essencial AI

O módulo de IA é posterior à consolidação dos dados operacionais. Ele não será implementado antes de autorização granular, auditoria e políticas de privacidade. Consulte `docs/ai-future-architecture.md`.

**Decisão pendente:** critérios de aceite para encerrar cada fase.

**Decisão pendente:** clientes piloto das fases de hospedagem e automação.

**Decisão pendente:** prioridade entre PMS, canais e experiência do hóspede após reservas manuais.
