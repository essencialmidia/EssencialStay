# Sprint 4.5 — Premium UX

## Objetivo

Elevar a fundação visual do Essencial Stay a um padrão SaaS internacional, preservando integralmente o escopo funcional do Sprint 4.

Este sprint não adiciona regras de negócio, integrações ou entidades. O trabalho está concentrado em design tokens, componentes reutilizáveis, shell da aplicação, Dashboard, estados de interface e prévia da Experiência do Hóspede.

## Escopo implementado

### Design System

- nova paleta semântica para temas claro e escuro;
- tokens para superfícies, sidebar, informação, elevação, duração e easing;
- escala tipográfica compacta e números tabulares;
- grid de espaçamento consistente;
- animações de entrada, hover, modal, dropdown e toast;
- comportamento reduzido para `prefers-reduced-motion`;
- novos componentes `FormField`, `SectionHeading` e `SegmentedControl`;
- refinamento de botões, cards, badges, inputs, selects, textareas, tabelas, modal, toast, dropdown, avatar, breadcrumb e estados de feedback.

### Sidebar

- largura expandida reduzida para aumentar a área útil;
- agrupamento por Gestão, Operação, Ecossistema, Análises e Sistema;
- estado ativo com contraste e marcador lateral;
- modo recolhido com tooltips;
- rótulos “Breve” discretos para módulos futuros;
- Experiência do Hóspede posicionada entre as áreas principais da gestão.

### Topbar

- seletor de cliente com identificação visual;
- hierarquia simplificada no desktop e no mobile;
- busca visual compacta;
- seletor de tema em um único controle;
- notificações com indicador visual;
- menu de usuário com interações por clique, Escape e clique externo.

### Dashboard

- quatro indicadores operacionais principais;
- tabela de portfólio com status semântico e quantidade de unidades;
- distribuição visual dos estados das unidades;
- estados vazios com ação contextual;
- atalhos para propriedades e Experiência do Hóspede;
- reservas apresentadas apenas como módulo futuro, sem dados simulados ou lógica implementada.

Os números do Dashboard continuam derivados somente das propriedades e unidades já disponíveis pelo Sprint 4. Nenhuma consulta, serviço ou regra de negócio foi criada neste sprint.

### Experiência do Hóspede

Foi criada uma página principal dedicada à visão futura da jornada do hóspede. Ela demonstra:

- link temporário;
- QR Code visual;
- check-in digital concluído;
- Wi-Fi;
- senha temporária de fechadura;
- validade de acesso;
- informações da propriedade;
- contato do anfitrião;
- controles visuais de luz e ar-condicionado;
- cena de conforto;
- orientações de chegada e checkout.

Todos os dados da página são fictícios e identificados como demonstração. Os controles existem apenas no estado local da interface e não conversam com Tuya, Akubela, Supabase, backend ou qualquer API.

### Formulários e tabelas

- propriedades, unidades e organizações passaram a usar labels visíveis e mensagens de erro compartilhadas;
- ações secundárias foram organizadas no rodapé dos modais;
- tabelas agora aceitam conteúdo semântico reutilizável;
- ações por linha usam ícones, tooltips e nomes acessíveis;
- listas duplicadas de ações foram removidas da página de propriedades.

### Estados futuros

Páginas ainda não implementadas usam um estado vazio consistente, informando com clareza que navegação e padrão visual estão prontos, enquanto funcionalidade e dados permanecem planejados.

## Arquivos criados

- `frontend/src/components/layout/section-heading.tsx`;
- `frontend/src/components/ui/form-field.tsx`;
- `frontend/src/components/ui/segmented-control.tsx`;
- `frontend/src/pages/experiencia-hospede.tsx`;
- `docs/sprint-04-5-premium-ux.md`.

## Arquivos principais atualizados

- `frontend/tailwind.config.ts`;
- `frontend/src/styles/globals.css`;
- componentes de layout, navegação, feedback e UI;
- `frontend/src/pages/dashboard.tsx`;
- `frontend/src/pages/propriedades.tsx`;
- `frontend/src/pages/configuracoes.tsx`;
- `frontend/src/pages/onboarding.tsx`;
- `frontend/src/pages/module-page.tsx`;
- `frontend/src/routes/router.tsx`;
- `docs/design-system.md`.

O `package-lock.json` foi atualizado somente para concluir a instalação das dependências que já estavam declaradas no Sprint 4 e haviam ficado ausentes após uma instalação interrompida. Nenhuma dependência visual nova foi adicionada neste sprint.

## Decisões registradas

- a sidebar escura é uma âncora visual permanente nos dois temas;
- o verde-petróleo é o acento funcional da plataforma;
- o âmbar é reservado a destaque e atenção;
- Dashboard prioriza estrutura operacional real antes de módulos futuros;
- Experiência do Hóspede é uma área principal, não um recurso subordinado à automação;
- automação demonstrativa deve sempre ser identificada como simulação;
- estados vazios precisam oferecer contexto e próximo passo;
- microanimações são curtas e nunca bloqueiam o fluxo.

## Fora do escopo

Não foram implementados ou alterados:

- backend;
- banco de dados ou migrations;
- Supabase e suas políticas;
- autenticação ou fluxo de sessão;
- reservas;
- integração Tuya;
- integração Akubela;
- PMS, Airbnb, WuBook ou Stays.net;
- APIs externas;
- QR Code funcional;
- fechadura ou senha real;
- automação real;
- mensagens reais.

## Validação

A compilação de produção foi executada com sucesso, incluindo verificação de TypeScript e geração do bundle pelo Vite.

Foi emitido um aviso não bloqueante sobre o tamanho do bundle inicial. A divisão de código por rota deve ser avaliada quando os módulos funcionais crescerem.

## Decisões pendentes

- **Decisão pendente:** definir o arquivo oficial do logotipo a ser usado no shell e na experiência do hóspede.
- **Decisão pendente:** validar a linguagem visual com usuários de Airbnb, pousadas e hotéis antes da implementação funcional do portal.
- **Decisão pendente:** definir a estratégia de code splitting por rota quando o número de módulos justificar a mudança.
