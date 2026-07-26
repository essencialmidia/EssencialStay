# Sprint 3: Shell da Aplicacao

## Objetivo

Criar a fundacao visual e estrutural do frontend do Essencial Stay, com navegacao responsiva, componentes reutilizaveis e rotas demonstrativas para os modulos principais.

Esta entrega nao implementa autenticacao real, Supabase Auth, backend, banco de dados, Tuya, Akubela, PMS, reservas reais, propriedades reais ou integracoes.

## Stack utilizada

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- React Router;
- Lucide React;
- estrutura de componentes compativel com abordagem shadcn/ui.

## Estrutura criada

A implementacao principal fica em `frontend/src`:

- `app`: providers e configuracoes da aplicacao;
- `components/layout`: AppShell, Topbar e PageHeader;
- `components/navigation`: Sidebar, marca textual e seletor de tema;
- `components/ui`: componentes reutilizaveis de interface;
- `components/feedback`: estados de vazio, carregamento, erro e skeleton;
- `pages`: paginas demonstrativas;
- `routes`: configuracao do React Router;
- `hooks`: reservado para hooks futuros;
- `lib`: utilitarios e configuracoes compartilhadas;
- `assets`: reservado para o logotipo oficial e assets futuros;
- `styles`: estilos globais e tokens;
- `types`: tipos compartilhados.

## Rotas

Rotas criadas:

- `/`;
- `/dashboard`;
- `/hospedagens`;
- `/reservas`;
- `/hospedes`;
- `/portal-hospede`;
- `/automacao`;
- `/integracoes`;
- `/relatorios`;
- `/financeiro`;
- `/limpeza`;
- `/manutencao`;
- `/configuracoes`;
- rota `404`.

A rota `/` redireciona para `/dashboard`.

## Componentes

Componentes preparados:

- `Button`;
- `Input`;
- `Textarea`;
- `Select`;
- `Checkbox`;
- `Switch`;
- `Card`;
- `Badge`;
- `Avatar`;
- `DropdownMenu`;
- `Modal`;
- `Toast`;
- `Tooltip`;
- `Breadcrumb`;
- `EmptyState`;
- `PageHeader`;
- `StatCard`;
- `DataTable`;
- `Skeleton`;
- `LoadingState`;
- `ErrorState`.

## Decisoes visuais

- Marca textual "Essencial Stay" usada como placeholder ate a chegada do logotipo oficial.
- Paleta baseada em azul-marinho profundo, azul tecnologico, laranja de destaque, branco e cinzas neutros.
- Interface inspirada em SaaS modernos como Notion, Linear e Stripe.
- Layout mobile first com sidebar desktop, sidebar recolhivel e drawer mobile.
- Light Mode, Dark Mode e opcao "Sistema" com persistencia em `localStorage`.
- Dados do dashboard sao mockados em constantes locais e permanecem fixos entre atualizacoes.

## Limitacoes atuais

- Nao existe login real.
- Nao existe Supabase Auth.
- Nao existe chamada de API.
- Nao existe backend.
- Nao existe leitura ou escrita no banco.
- Nao existe integracao com Tuya, Akubela, PMS, Airbnb, pagamentos ou WhatsApp.
- Modulos internos exibem estados demonstrativos e mensagens de construcao.
- O logotipo oficial ainda nao foi adicionado ao workspace.

## Proximos passos

- Executar instalacao e build em ambiente com Node/npm disponiveis.
- Inserir o logotipo oficial do Essencial Stay em `frontend/src/assets`.
- Criar a camada real de autenticacao quando o sprint correspondente for aprovado.
- Criar as primeiras telas operacionais de organizacao, propriedades e unidades.
- Definir politicas de permissao e dados reais apenas depois da validacao da shell.
