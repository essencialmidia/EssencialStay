# Auditoria de UX, UI, Design System e frontend — Essencial Stay

**Data da auditoria:** 31 de julho de 2026

**Escopo:** frontend React e aplicação publicada autenticada em `https://essencialstay.com.br/admin`

**Método:** inspeção estática do código, navegação não destrutiva na aplicação publicada, leitura da árvore acessível, inspeção visual em tema escuro e testes de viewport em 1440, 1280, 1024, 768 e 390 px. Nenhum cadastro foi enviado e nenhuma regra, componente, estilo ou texto da aplicação foi alterado.

> Nota de alcance: estados existentes de carregamento, erro e vazio foram auditados no código; os estados com dados foram observados na aplicação publicada. Fluxos de criação foram revisados no código e nas telas disponíveis, sem submeter formulários para não modificar dados reais.

## 1. Resumo executivo

A Essencial Stay já possui uma base técnica e visual acima da média de painéis administrativos iniciais: há tokens semânticos para temas claro e escuro, componentes compartilhados, estados de carregamento/erro/vazio, foco visível, navegação responsiva e uma separação funcional entre administração global e operação de empresas. A linguagem visual é sóbria, coerente com tecnologia e segurança, e a interface publicada apresenta boa legibilidade geral no tema escuro.

Os principais riscos não são de acabamento isolado, mas de **clareza de contexto, densidade e adaptação móvel**:

1. O seletor do topo reúne dois conceitos: nível global e empresa atual. Isso acelera a troca, mas não deixa explícito que o usuário atravessa uma fronteira de escopo e permissões.
2. A página administrativa em 390 px apresenta largura interna de aproximadamente 620 px, causada por tabelas com largura mínima de 560 px. A página inteira pode rolar horizontalmente e conteúdo/ações ficam fora da tela.
3. O dashboard global usa muitos contêineres visualmente equivalentes. Indicadores estratégicos, links de demonstração, pendências e implantação competem pelo mesmo peso visual.
4. Há inconsistência conceitual: “empresa”, “empresa cliente”, “tenant”, “hotel”, “propriedade”, “hospedagem”, “unidade” e “quarto” aparecem em níveis diferentes de linguagem.
5. Alguns elementos têm alvo menor que o recomendado para WCAG 2.2 (botões de 32, 36 e 40 px; badges de 24 px quando interativos indiretamente), embora a WCAG não exija 44 px em todos os casos. O alvo mínimo AA de 24×24 deve ser verificado sistematicamente.
6. O modal tem semântica básica correta, mas o código não evidencia aprisionamento de foco, foco inicial nem restauração de foco.
7. Tabelas preservam semântica, porém não têm alternativa mobile em cartões/linhas resumidas; a rolagem é pouco sinalizada.

**Direção recomendada:** preservar o tema escuro e a arquitetura existente, reduzir a ambiguidade de contexto, adotar composição responsiva específica para dados tabulares, transformar o dashboard global em uma central de exceções e ações e formalizar um Design System leve em cima dos componentes atuais.

## 2. Estrutura atual do frontend

### Stack identificada

- React 19 + TypeScript 5.7.
- Vite 6 como build/dev server.
- React Router 7 para rotas e gates de acesso.
- Tailwind CSS 3.4 com variáveis CSS semânticas.
- React Hook Form + Zod para formulários e validação.
- Lucide React para iconografia.
- Supabase como cliente de dados/autenticação.
- Utilitários `clsx` e `tailwind-merge` para composição de classes.
- Testes de jornadas demo com o test runner nativo do Node.

### Organização

- `frontend/src/routes/router.tsx`: árvore central de rotas, gates público/protegido/admin e shells.
- `frontend/src/components/admin/admin-shell.tsx`: navegação e topbar da administração global.
- `frontend/src/components/layout/app-shell.tsx`: shell operacional das empresas.
- `frontend/src/components/navigation/`: sidebar, seletor de empresa, marca e tema.
- `frontend/src/components/ui/`: primitives de botão, badge, card, tabela, formulário, modal, tooltip e paginação.
- `frontend/src/components/feedback/`: estados vazio, carregamento, erro e skeleton.
- `frontend/src/pages/admin/`: administração global, empresas, propriedades, unidades e integrações Akubela/Ekaza.
- `frontend/src/pages/`: dashboard da empresa, propriedades, reservas, hóspedes/CRM, experiência, dispositivos, integrações, automação, limpeza, manutenção e configurações.
- `frontend/src/contexts/`: autenticação, organização, cliente e administração global.
- `frontend/src/hooks/`, `services/` e `repositories/`: separação razoável de estado, serviço e persistência.
- `frontend/src/styles/globals.css` e `frontend/tailwind.config.ts`: tokens visuais e temas.

### Rotas e fluxos principais

| Escopo | Rotas principais | Objetivo |
|---|---|---|
| Público | `/login`, `/register`, `/forgot-password` | Acesso e recuperação |
| Onboarding | `/onboarding?modo=nova-empresa` | Empresa → propriedade → automação → unidade |
| Administração global | `/admin`, `/admin/empresas`, `/admin/empresas/:id`, `/admin/propriedades/:id` | Visão consolidada e gestão estrutural |
| Operação da empresa | `/dashboard`, `/propriedades`, `/reservas`, `/hospedes`, `/experiencia-hospede` | Gestão diária e jornada do hóspede |
| Operação física | `/limpeza`, `/manutencao` | Fila operacional |
| IoT | `/automation-lab`, `/dispositivos`, `/integracoes`, `/automacao` | Integração e automação |
| Futuro | `/relatorios`, `/financeiro` | Módulos ainda informativos |

### Tokens e componentes

O código já utiliza tokens semânticos (`background`, `card`, `surface`, `sidebar`, `accent`, `success`, `warning`, `destructive`, `info`) e sombras/durações centralizadas. O raio-base é 8 px. Botões têm alturas de 32, 40 e 44 px; ícones normalmente 16, 18 ou 20 px. Esta base deve ser consolidada, não substituída.

## 3. Pontos positivos

- Separação clara no código entre shell global e shell da organização.
- Tema claro já existe tecnicamente; o tema escuro não é um beco sem saída.
- Uso consistente de cores semânticas, sem hexadecimais dispersos nas páginas principais.
- Estados `LoadingState`, `ErrorState`, `EmptyState` e skeleton reutilizáveis.
- Breadcrumb com `aria-label`, tabelas semânticas, headings e labels de formulário.
- Foco visível presente nos componentes principais.
- Respeito a `prefers-reduced-motion`.
- Sidebar vira drawer em telas menores que `lg`.
- Grid de indicadores reduz de quatro para duas e uma coluna conforme o viewport.
- Mensagens de erro do onboarding são ligadas aos campos por componentes compartilhados.
- O modo de administração sobre uma empresa possui faixa explícita “Administrador global — Visualizando…”, uma boa barreira contra erro de contexto.
- O dashboard operacional inclui indicadores acionáveis, estados vazios e atalhos coerentes.
- O produto já diferencia sucesso, alerta, erro e informação por cor, texto e/ou ícone em vários componentes.

## 4. Problemas críticos

### C1 — Rolagem horizontal da página em smartphone

- **Tela/componente:** dashboard administrativo e listas com `DataTable`.
- **Problema:** tabelas têm `min-w-[560px]`; em 390 px, o contêiner interno medido chegou a 620 px e ampliou o `scrollWidth` do `body` para 620 px contra `clientWidth` de 375 px.
- **Evidência:** teste na aplicação publicada em 390×844; a tabela de empresas mostra apenas Nome, Nome fantasia e parte de Documento, ocultando status e ações fora da tela. Código em `frontend/src/components/ui/data-table.tsx`.
- **Impacto:** perda de ações, sensação de tela quebrada, dificuldade de saber que existe conteúdo lateral e alto custo para operação em campo.
- **Gravidade:** crítica.
- **Recomendação:** garantir que apenas o contêiner da tabela role (`min-w-0`, `max-w-full`, isolamento de overflow) e criar variante mobile: coluna principal + status + menu de ações, com detalhes secundários em expansão/cartão.
- **Esforço:** médio.
- **Arquivos prováveis:** `frontend/src/components/ui/data-table.tsx`, `frontend/src/pages/admin/companies.tsx`, `frontend/src/pages/admin/dashboard.tsx`, páginas com `DataTable`.

### C2 — Fronteira de contexto global/empresa pouco explícita no seletor

- **Tela/componente:** topbar administrativo e `CompanySwitcher`.
- **Problema:** o mesmo seletor apresenta “Administração Essencial Stay” e “Empresa atual: …”. Trocar uma opção muda shell, escopo dos dados e potencialmente ações permitidas.
- **Evidência:** árvore acessível do dashboard publicado; `AdminTopbar.selectContext` navega de `/admin` para `/admin/empresas/:id/painel`; `CompanySwitcher` também navega entre empresas e administração.
- **Impacto:** ações no contexto errado, especialmente para administrador global que alterna frequentemente entre clientes.
- **Gravidade:** crítica pela possibilidade de erro operacional, embora já exista uma faixa de contexto depois da troca.
- **Recomendação:** separar “Área” (Administração global/Operação) de “Empresa”; usar confirmação apenas quando houver edição não salva; manter faixa persistente de impersonação com saída clara e registrar a empresa no título/breadcrumb.
- **Esforço:** médio.
- **Arquivos prováveis:** `admin-shell.tsx`, `topbar.tsx`, `company-switcher.tsx`, `organization-context.tsx`.

## 5. Problemas importantes

### I1 — Dashboard global sem prioridade operacional

- **Tela/componente:** `/admin`.
- **Problema:** seis indicadores, três links demo, tabela, pendências e implantações usam cartões visualmente semelhantes.
- **Evidência:** primeira dobra em desktop contém apenas cabeçalho e parte dos KPIs; pendências ficam abaixo. Cards de “Propriedades com/sem automação” têm o mesmo peso dos KPIs principais.
- **Impacto:** o administrador lê inventário antes de saber o que exige ação.
- **Gravidade:** alta.
- **Recomendação:** primeira dobra = contexto + ações + “requer atenção”; segunda = saúde do portfólio; demonstrações em utilitário secundário.
- **Esforço:** médio.
- **Arquivos:** `frontend/src/pages/admin/dashboard.tsx`, `stat-card.tsx`, `card.tsx`.

### I2 — Tabela de empresas excessivamente larga e com quatro ações por linha

- **Tela:** `/admin/empresas`.
- **Problema:** oito colunas e quatro botões por registro; Nome e Nome fantasia repetem informação em vários casos.
- **Evidência:** dados publicados mostram nomes iguais em Casa Mairiporã, Hotel Summit Monaco e Grupo Inovanex.
- **Impacto:** varredura lenta, ruído e pior adaptação móvel.
- **Gravidade:** alta.
- **Recomendação:** combinar nome legal/fantasia, manter documento secundário, mostrar Propriedades/Unidades juntos, status e uma ação primária; demais ações em menu.
- **Esforço:** médio.
- **Arquivos:** `frontend/src/pages/admin/companies.tsx`, `data-table.tsx`, `dropdown-menu.tsx`.

### I3 — Tabs administrativas truncadas no smartphone

- **Tela:** detalhe da empresa.
- **Problema:** “Visão geral”, “Propriedades”, “Usuários”, “Plano”, “Integrações” e “Histórico” ficam em linha; em 390 px “Plano” aparece cortado e as demais dependem de rolagem horizontal pouco perceptível.
- **Evidência:** inspeção visual publicada em 390×844.
- **Impacto:** recursos parecem ausentes; descoberta baixa.
- **Gravidade:** alta.
- **Recomendação:** tabs roláveis com fade/indicador de continuidade, ou seletor compacto em mobile; não mostrar tabs “Em breve” como destinos equivalentes.
- **Esforço:** baixo/médio.
- **Arquivos:** `frontend/src/components/admin/entity-tabs.tsx`, `frontend/src/pages/admin/company-details.tsx`.

### I4 — Onboarding mistura linguagem técnica e comercial

- **Tela:** `/onboarding`.
- **Problema:** descrição “Tenant da operação” e “inventário de automação” é técnica para cliente; a etapa “Empresa cliente” é adequada apenas para admin global.
- **Evidência:** constantes `steps` e descrições em `frontend/src/pages/onboarding.tsx`.
- **Impacto:** insegurança, dúvidas e percepção de complexidade.
- **Gravidade:** alta.
- **Recomendação:** adaptar microcopy por papel: “Dados da empresa”, “Primeira propriedade”, “Recursos inteligentes”, “Primeira unidade”. Explicar que integrações podem ser feitas depois.
- **Esforço:** baixo.
- **Arquivos:** `onboarding.tsx`.

### I5 — Modal não demonstra gestão completa de foco

- **Componente:** `Modal`.
- **Problema:** há `role=dialog`, nome acessível e Escape, mas não há evidência de foco inicial, focus trap, `inert` no fundo ou restauração de foco.
- **Evidência:** `frontend/src/components/ui/modal.tsx`.
- **Impacto:** usuário de teclado pode navegar para conteúdo encoberto ou perder sua posição ao fechar.
- **Gravidade:** alta.
- **Recomendação:** implementar gerenciamento de foco reutilizável e testar Tab/Shift+Tab/Escape.
- **Esforço:** médio.
- **Arquivos:** `modal.tsx`, `confirmation-modal.tsx`, testes de componentes.

### I6 — Busca e notificações simulam funcionalidade

- **Tela:** topbar operacional.
- **Problema:** “Buscar na plataforma” é botão com `aria-label="Busca visual ainda não implementada"`; sino exibe ponto sem central funcional comprovada.
- **Evidência:** `frontend/src/components/layout/topbar.tsx`.
- **Impacto:** expectativa quebrada e cliques sem resultado.
- **Gravidade:** média/alta.
- **Recomendação:** ocultar até existir função, ou rotular claramente como indisponível/“Em breve” sem aparência de ação principal.
- **Esforço:** baixo.
- **Arquivos:** `topbar.tsx`.

### I7 — Suporte aponta para Configurações

- **Tela:** sidebar operacional.
- **Problema:** item “Suporte” usa `/configuracoes`, igual ao item “Empresa”.
- **Evidência:** `frontend/src/lib/navigation.ts`.
- **Impacto:** navegação enganosa e quebra de confiança.
- **Gravidade:** média.
- **Recomendação:** criar destino real ou remover temporariamente; não duplicar destino com rótulo diferente.
- **Esforço:** baixo.
- **Arquivos:** `navigation.ts`, `router.tsx`.

## 6. Melhorias recomendadas

1. Introduzir um **Context Bar** persistente com Área, Empresa e, quando necessário, Propriedade.
2. Reorganizar a informação por tarefa: “Atenção agora”, “Saúde da operação”, “Estrutura” e “Atividade recente”.
3. Criar padrão responsivo para tabelas: tabela em desktop; lista/cartões resumidos em mobile; menu de ações.
4. Reduzir a primeira dobra do dashboard global a quatro KPIs realmente decisivos e um painel de alertas.
5. Tornar status sempre composto de rótulo + ícone/ponto/descrição, nunca só cor.
6. Consolidar vocabulário de domínio e proibir “tenant” na interface de cliente.
7. Implementar foco completo em modais/drawers e auditoria automatizada com axe.
8. Padronizar alvos: 40 px padrão, 44 px em ações móveis e 24 px mínimo absoluto com espaçamento adequado.
9. Diferenciar superfícies: KPI, alerta, ação rápida e conteúdo não devem ser todos o mesmo card.
10. Adicionar resumo/revisão antes de concluir onboarding, com edição por etapa.

## 7. Análise por página

### Administração global (`/admin`)

- **Acerto:** números reais, pendências e implantação no mesmo lugar.
- **Problema:** inventário domina antes das exceções; “Demonstrações” ocupa área central operacional.
- **Recomendação:** trazer pendências para a primeira dobra; mover demos para menu “Apresentação” ou painel recolhível; combinar automação em um único card com proporção.
- **Arquivos:** `pages/admin/dashboard.tsx`, `components/ui/stat-card.tsx`.

### Empresas (`/admin/empresas`)

- **Acerto:** tabela tem cabeçalhos e nomes acessíveis detalhados para ações.
- **Problema:** largura, repetição e excesso de ações; ausência visível de busca/filtro apesar do crescimento esperado.
- **Recomendação:** busca por nome/documento, filtros de status/implantação, linha resumida e menu contextual.
- **Arquivos:** `pages/admin/companies.tsx`, `data-table.tsx`.

### Detalhe da empresa

- **Acerto:** breadcrumb, status e ações principais estão presentes.
- **Problema:** tabs futuras competem com áreas reais; telefone sem máscara; ordem e densidade mobile podem melhorar.
- **Recomendação:** esconder módulos futuros ou agrupá-los; formatar telefone/documento; separar “Resumo”, “Estrutura” e “Acessos”.
- **Arquivos:** `pages/admin/company-details.tsx`, `entity-tabs.tsx`, `formatters.ts`.

### Propriedades e detalhe da propriedade

- **Risco:** administração global e operação possuem formulários/arquivos paralelos para propriedades e unidades, criando divergência visual e de validação.
- **Evidência:** `components/admin/property-form.tsx`, `components/propriedades/property-form.tsx`, equivalentes de unidade.
- **Recomendação:** compartilhar schema, campos e layouts; variar apenas permissões e ações.
- **Gravidade/esforço:** alta / médio-alto.

### Dashboard da empresa (`/dashboard`)

- **Acerto:** boa divisão entre indicadores operacionais, IoT, portfólio e próximos passos.
- **Problema:** até dez indicadores antes do conteúdo principal; “Última sincronização: Nunca” e “Status: Operando normalmente” podem se contradizer.
- **Recomendação:** agrupar IoT em um cartão de saúde; priorizar ocupação, chegada, limpeza e offline; tornar inconsistências acionáveis.
- **Arquivos:** `pages/dashboard.tsx`, hooks de dashboard/IoT/operação.

### Reservas e check-in

- **Acerto:** existe rota dedicada e fixtures/jornadas de demonstração.
- **Risco:** o menu usa “Reservas”, enquanto `/hospedagens` redireciona para propriedades; isso confunde “reserva”, “hospedagem” e “propriedade”.
- **Recomendação:** adotar “Reservas e estadias” ou separar claramente reserva futura de estadia em curso. O check-in deve aparecer como estado/ação da reserva, não como conceito disperso.
- **Arquivos:** `router.tsx`, `pages/reservas.tsx`, componentes de reservas/demo.

### Integrações e recursos inteligentes

- **Problema:** menu separa Automation Lab, Dispositivos, Integrações e Automação; para usuário não técnico, a diferença é abstrata.
- **Recomendação:** grupo “Tecnologia da propriedade” com visão de saúde; “Integrações” para conexões; “Dispositivos” para inventário; Lab apenas para papel técnico/admin.
- **Arquivos:** `navigation.ts`, páginas de integração, dispositivos e lab.

### Usuários

- **Problema:** a administração global mostra “Usuários vinculados: 0”, mas o detalhe da empresa possui tab Usuários. Falta explicar se zero é ausência real, perfis únicos ou falha de vínculo.
- **Recomendação:** rótulo “Usuários ativos” com ajuda contextual e CTA para convidar/vincular quando zero.
- **Arquivos:** `pages/admin/dashboard.tsx`, `company-details.tsx`, repositórios de perfis/membros.

### Onboarding

- **Acerto:** quatro etapas curtas, validação por etapa e feedback de progresso.
- **Problema:** não há revisão final; cadastro exige criar unidade mesmo quando o cliente ainda não tem inventário pronto; automação pode parecer obrigatória.
- **Recomendação:** permitir “Configurar depois” em automação e, conforme regra de negócio aprovada, unidade; adicionar revisão e checklist pós-criação.
- **Arquivos:** `pages/onboarding.tsx`, serviço/RPC apenas numa fase posterior e com validação de negócio.

## 8. Análise dos principais fluxos

### Criação de empresa cliente

- **Etapas atuais:** CTA → onboarding → empresa → propriedade → automação → unidade → conclusão.
- **Confusão:** criar empresa implica criar toda a operação; “tenant” e “inventário” são técnicos.
- **Campos questionáveis:** logotipo no primeiro passo e automação detalhada podem ser postergados.
- **Informações ausentes:** duração, obrigatoriedade, efeito da criação, revisão final.
- **Melhoria:** informar “4 etapas · cerca de 5 min”; salvar rascunho; revisão; checklist pós-criação.
- **Orientação ideal:** “Você poderá completar automação, unidades e integrações depois.”

### Cadastro de propriedade

- **Etapas atuais:** ação no contexto da empresa → formulário → detalhe/portfólio.
- **Confusão:** duplicidade entre fluxo admin e fluxo operacional.
- **Campos ausentes prováveis:** identificação/localização operacional pode surgir tarde; avaliar necessidade real antes de adicionar.
- **Melhoria:** componente único; cabeçalho confirma empresa atual; resumo após salvar.

### Cadastro de unidade

- **Etapas atuais:** propriedade → adicionar unidade → nome, código, tipo e capacidade.
- **Confusão:** “unidade” versus “quarto/apartamento”.
- **Melhoria:** usar “Unidade (quarto, apartamento ou casa)” na primeira ocorrência e exemplos por tipo de propriedade; permitir criação em lote já existente onde aplicável.

### Configuração de automação

- **Etapas atuais:** status → marca → modelo → situação → instalador → recursos.
- **Confusão:** mistura inventário comercial, instalação e conexão técnica.
- **Melhoria:** dividir “Possui tecnologia?” de “Conectar provedor”; revelar campos progressivamente; apresentar estado final “Cadastrada, ainda não conectada”.

### Configuração de integração

- **Etapas atuais:** página de integrações → conexão/modal → credenciais/provedor → status.
- **Risco:** diferença pouco clara entre integração cadastrada, conectada e sincronizando.
- **Melhoria:** stepper “Selecionar provedor → Autorizar → Mapear propriedade → Testar → Ativar”; logs técnicos sob expansão.

### Vinculação de usuário

- **Etapas atuais:** tab Usuários no detalhe da empresa; dados do dashboard derivam de membros/perfis.
- **Informação ausente:** papel, escopo (empresa/propriedade), convite pendente e último acesso devem ser explícitos.
- **Melhoria:** formulário com resumo de permissões em linguagem humana e confirmação do escopo.

### Consulta de reservas

- **Etapas atuais:** menu Reservas → lista/agenda e ações do fluxo demo.
- **Melhoria:** filtros persistentes por propriedade, data e estado; busca por hóspede/código; resumo da reserva em drawer, preservando a lista.

### Check-in

- **Etapas recomendadas:** localizar reserva → verificar dados/pendências → confirmar unidade/acesso → concluir → exibir comprovante/status.
- **Risco:** check-in não aparece como destino claro na arquitetura principal.
- **Melhoria:** fila “Chegadas de hoje” no dashboard e ação contextual na reserva; nunca depender apenas da cor do status.

### Alternância entre empresas e propriedades

- **Etapas atuais:** seletor superior alterna global/empresa; propriedade é escolhida dentro das páginas.
- **Confusão:** nível de empresa é global no shell, propriedade é local e pode não persistir.
- **Melhoria:** Context Bar hierárquico, com `Administração > Empresa > Propriedade`, mudança explícita e contexto visível em todas as ações destrutivas.

## 9. Auditoria visual

### Cores e contraste

- O tema escuro usa fundo HSL 220 18% 7%, cards 10%, superfícies 12–14% e bordas 20%. A progressão é coerente, mas áreas grandes ficam muito próximas em luminância.
- Texto principal (95%) tem contraste forte. `muted-foreground` em 64% tende a ser legível sobre 7–14%, mas combinações com opacidade (`/45`, `/55`, `/60`) precisam de medição; labels da sidebar e textos de 11 px são candidatos a falha.
- O amarelo `highlight` funciona como assinatura premium, mas hoje indica também “Global” e destaque de KPI; definir significado para não confundir marca com alerta.
- Verde, amarelo e azul são acompanhados de rótulo na maioria dos badges, ponto positivo.

### Tipografia

- Inter/system é adequada para SaaS B2B.
- Título de 28 px e cards de 15 px são equilibrados.
- Textos de 11 px na navegação e eyebrow devem ser reservados a metadados não essenciais; evitar opacidade baixa.
- Números usam `tabular-nums`, bom para KPIs/tabelas.

### Espaçamento, bordas e sombras

- Escala é baseada na escala Tailwind e visualmente consistente.
- Uso repetido de borda + card + sombra, mesmo em subblocos, aumenta “efeito caixa”.
- Criar três níveis: página sem contêiner, seção com fundo sutil, card elevado apenas quando houver interação/prioridade.

### Ícones

- Lucide mantém consistência. Porém `Settings2` para “Propriedades” e `Sparkles` para automação com/sem automação não são as associações mais diretas.
- Usar `Building2/Hotel`, `Cpu/PlugZap`, `DoorOpen`, `UsersRound` de forma estável por entidade.

### Cards, botões e badges

- Botão primário branco no tema escuro tem excelente destaque, mas pode parecer ação “neutra”; o `accent` verde deve ser reservado a ação-chave de produto, não a qualquer CTA.
- Cards de KPI precisam indicar se são clicáveis; atualmente aparência semelhante pode esconder diferença.
- Badges de 24 px estão bons como informação; não devem virar alvo isolado.

### Formulários

- Campos têm 40 px, labels e erros. Falta explicitar ajuda, exemplo e formatação em documentos/telefone.
- Estados `required/optional` são parcialmente claros; manter “Opcional” consistente.

### Tema claro

- Já há tokens completos e `color-scheme: light`; é viável manter os dois temas.
- Antes de promover o tema claro, testar tabelas, estados semânticos, imagens/logos e sombras. O claro não deve ser mera inversão; bordas e superfícies já apontam na direção correta.

## 10. Auditoria de acessibilidade

### Conformidades observadas

- Estrutura com `header`, `main`, `nav`, headings e tabela semântica.
- Breadcrumb nomeado.
- Ícones decorativos frequentemente `aria-hidden`.
- Botões de ícone normalmente têm `aria-label` e/ou tooltip.
- `LoadingState` usa `role=status`.
- Modal possui `role=dialog`, `aria-modal`, `aria-labelledby` e descrição associada.
- Foco visível e redução de movimento estão definidos.

### Lacunas WCAG 2.2 AA

| Critério | Evidência/risco | Recomendação |
|---|---|---|
| 1.4.3 Contraste | sidebar usa texto branco com opacidades 45–65% e tamanho 11–14 px | medir todas as combinações; elevar luminância/opacidade quando <4,5:1 |
| 1.4.10 Reflow | `body` chega a 620 px em viewport útil de 375 px | conter overflow e criar representação mobile de tabelas |
| 1.4.11 Contraste não textual | bordas escuras 20% sobre cards 10–14% podem ficar abaixo de 3:1 para identificação de controles | reforçar borda de campos/controles, especialmente hover/focus |
| 2.1.1 Teclado | cards interativos usam `div onClick` no dashboard | usar `button`/`a`, com foco e ativação por teclado |
| 2.4.3 Ordem do foco | modal não evidencia trap/restauração | implementar e testar foco completo |
| 2.4.7 Foco visível | presente nos primitives; verificar cards/tabs customizados | centralizar padrão `focus-ring` |
| 2.4.11 Foco não obscurecido | topbar sticky e modais | testar navegação com teclado/zoom 200% |
| 2.5.8 Tamanho do alvo | botões `sm` 32 px, ícones 36 px | garantir 24×24 mínimo e 44 px para ações críticas/mobile |
| 3.3.1/3.3.3 Erros | erros existem, mas resumo e foco no primeiro erro não são evidentes | focar primeiro campo inválido e adicionar resumo na submissão |
| 4.1.2 Nome/função/valor | tabs e dropdowns customizados devem comunicar selecionado/expandido | validar `aria-selected`, `aria-expanded`, controles e IDs |

### Problema adicional

`Card variant="interactive"` recebe `onClick` em um `div` no dashboard. Isso não é acessível por teclado por padrão.

- **Gravidade:** alta.
- **Esforço:** baixo.
- **Arquivos:** `pages/dashboard.tsx`, `components/ui/card.tsx`.

## 11. Auditoria de responsividade

| Largura | Comportamento observado/esperado | Risco |
|---|---|---|
| 1440 px | sidebar expandida, área útil ampla; dashboard pode aproveitar melhor o eixo horizontal | médio: primeira dobra ainda dominada por cards |
| 1280 px | área útil ~1001 px com sidebar; grids se ajustam | baixo/médio: tabelas densas |
| 1024 px | área útil ~745 px com sidebar; cartões em 2 colunas | médio: breakpoint `lg` mantém sidebar e reduz muito o conteúdo |
| 768 px | drawer substitui sidebar; conteúdo ocupa ~753 px | médio: tabelas e tabs horizontais |
| 390 px | cabeçalho compacto; cards em 1 coluna; tabela provoca largura de 620 px | crítico |

### Componentes

- **Menu lateral:** boa conversão para drawer, mas deve ter focus trap, Escape e restauração de foco como modal.
- **Cards:** empilham corretamente; em páginas longas, geram muita rolagem.
- **Tabelas:** maior problema. Não basta `overflow-x-auto` quando ancestral/filho impede encolhimento.
- **Formulários:** grids `sm:grid-cols-2` viram uma coluna corretamente.
- **Cabeçalho:** em 390 px o seletor de contexto fica truncado; ainda reconhecível, mas o nome completo não está disponível sem abrir.
- **Breadcrumbs:** podem consumir múltiplas linhas; em detalhe mobile ocupam espaço, mas ajudam contexto.
- **Modais:** largura é responsiva e altura limitada; teclado móvel e footer sticky precisam de teste.
- **Áreas clicáveis:** ações do topo de 36 px são pequenas para uso frequente em smartphone.

### Telas de maior risco em smartphone

1. Empresas (oito colunas e ações).
2. Dashboard global (tabela recente e muitas seções).
3. Detalhe da empresa (tabs horizontais).
4. Reservas/CRM (densidade de dados e filtros).
5. Dispositivos/integrações (inventários e status técnicos).
6. Formulários em modal com teclado aberto.

## 12. Proposta para o dashboard administrativo

### Cabeçalho ideal

- Linha 1: breadcrumb curto `Administração / Visão geral`.
- Linha 2: título + badge “Escopo global”; à direita, CTA “Nova empresa”.
- Linha 3 opcional: período/atualização dos dados e link para gerenciar empresas.
- O seletor de empresa fica no Context Bar, não como título substituto da área.

### Ordem recomendada

1. **Atenção agora:** pendências cadastrais, empresas sem unidade, integração offline, implantação atrasada.
2. **Saúde da plataforma:** empresas ativas, propriedades operacionais, unidades ativas e usuários ativos.
3. **Implantações:** andamento por propriedade, responsável e próxima ação.
4. **Atividade recente:** empresa criada, propriedade adicionada, usuário convidado, integração alterada.
5. **Acessos de demonstração:** utilitário recolhível ou menu dedicado.

### Cards

- Destaque maior: “Pendências críticas” e “Implantações em andamento”.
- KPIs menores: Empresas, Propriedades, Unidades, Usuários.
- Agrupar “com automação/sem automação” em uma única composição: `3 de 7 com automação (43%)`.
- Remover card isolado quando o número não suporta decisão; apresentar como detalhe do KPI.

### Ações rápidas

- Nova empresa.
- Localizar empresa.
- Retomar implantação.
- Convidar/vincular usuário.
- Abrir painel da última empresa acessada.

### Alertas operacionais

Cada alerta deve ter severidade, entidade, causa, há quanto tempo, proprietário e CTA. Exemplo: `Alta · Hotel Inovanex · Sem unidades · há 9 dias · Adicionar unidade`.

### Atividades recentes

Linha temporal compacta, no máximo 5 itens, com ator + ação + entidade + tempo. Oferecer “Ver histórico” apenas quando existir histórico real.

### Gráficos

Usar somente para tendência temporal ou proporção acionável. Não criar gráfico para quatro números estáticos. Candidato útil: implantações por etapa ao longo das últimas 8 semanas; caso não haja histórico confiável, usar lista/progresso.

## 13. Proposta de Design System

### Princípios

- Reutilizar os primitives atuais.
- Um token deve representar intenção, não uma página.
- Hierarquia por espaçamento e tipografia antes de bordas/sombras.
- Componentes complexos devem nascer de padrões repetidos reais.

### Fundação sugerida

| Categoria | Escala proposta |
|---|---|
| Tipografia | 12 metadata; 14 corpo compacto; 16 corpo/título card; 20 seção; 28 página; 36 display raro |
| Line-height | 16, 20, 24, 28, 36, 44 px conforme escala |
| Espaçamento | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px |
| Raios | 4 pequeno; 6 controle; 8 card; 12 modal/painel especial; pill apenas para status curtos |
| Ícones | 16 inline; 18 navegação; 20 ação/KPI; 24 ilustração compacta |
| Alturas | 32 compacto desktop; 40 padrão; 44 confortável/mobile; 48 CTA especial |
| Layout | página max 1440; leitura/formulário max 720–800; gutters 16/24/32 |

### Cores

- **Primária estrutural:** grafite/ink atual para hierarquia e ações neutras.
- **Accent de marca:** verde-teal atual, reservado a foco, progresso e ação de produto.
- **Highlight:** âmbar premium, reservado a destaque editorial/global — não reutilizar como alerta.
- **Sucesso/alerta/erro/info:** manter famílias atuais, mas criar tokens `*-surface`, `*-border`, `*-text`, evitando opacidades arbitrárias.
- **Superfícies dark:** aumentar levemente a separação entre background 7%, card 11–12%, elevated 15–16% e borda de controle com contraste ≥3:1 quando necessária para identificação.

### Estados

- Hover: mudança de superfície/borda, sem depender só de elevação.
- Active: reduzir elevação e aplicar superfície selecionada.
- Disabled: preservar leitura; cursor e texto explicativo quando relevante.
- Focus: anel de 2 px + offset de 2 px, contraste ≥3:1.
- Loading: manter largura e label; evitar troca brusca de layout.

### Padrões de componentes

- **Card:** `plain`, `section`, `interactive`, `alert`; interactive sempre `button` ou `a`.
- **Tabela:** toolbar, cabeçalho sticky opcional, densidade, empty/loading/error, paginação e variante mobile.
- **Formulário:** label, opcional, help, input, erro e contador; footer de ações consistente.
- **PageHeader:** breadcrumb, título, escopo, descrição curta e no máximo uma ação primária.
- **Modal:** foco completo, header/footer sticky, ação destrutiva separada e conteúdo rolável.
- **Badge:** `status`, `scope`, `metadata`; texto em sentence case; ponto/ícone quando necessário.
- **Toast/alerta:** título opcional, mensagem específica, ação e região `aria-live` adequada.

## 14. Melhorias de textos e nomenclaturas

| Atual | Sugerido | Motivo |
|---|---|---|
| Administração Essencial Stay | Administração da plataforma | reduz repetição da marca; manter marca no shell |
| Global | Escopo global | explica o significado |
| Gerenciar empresas | Empresas clientes | orientado à entidade, consistente com menu |
| Tenant da operação | Dados da empresa | elimina jargão técnico |
| Primeira hospedagem | Primeira propriedade | “hospedagem” pode significar estadia |
| Configuração cadastral | Recursos inteligentes | diz o que o usuário está configurando |
| Usuários vinculados | Usuários ativos | mais direto; explicar vínculo em ajuda |
| cadastros operacionais | unidades cadastradas | detalhe mensurável |
| Empresa atual | Empresa em uso | reduz ambiguidade com dado cadastral |
| Abrir operação | Acessar painel da empresa | explicita destino |
| Automação | Regras de automação | diferencia de dispositivos/integrações |
| Histórico e CRM | Hóspedes e relacionamento | linguagem menos técnica; CRM pode ficar como subtítulo |
| Não possui automação | Sem automação cadastrada | distingue cadastro de realidade física |
| Em breve em tab | Ocultar ou “Planejado” fora da navegação | evita promessa de ação disponível |

Glossário recomendado:

- **Empresa:** cliente contratante e limite principal de acesso.
- **Propriedade:** hotel, pousada, apart-hotel, casa ou empreendimento operado.
- **Unidade:** espaço reservável; na ajuda: quarto, apartamento, suíte ou casa.
- **Reserva:** compromisso futuro/confirmado.
- **Estadia:** período em curso ou concluído.
- **Integração:** conexão com sistema/provedor externo.
- **Dispositivo:** equipamento físico.
- **Automação:** regra/cena que atua sobre dispositivos.

## 15. Dez melhorias rápidas

1. Conter a rolagem horizontal das tabelas no próprio componente.
2. Ocultar ou desabilitar visualmente busca/notificações ainda não funcionais.
3. Trocar “Tenant da operação” por “Dados da empresa”.
4. Trocar “Abrir operação” por “Acessar painel da empresa”.
5. Mover “Demonstrações” para ação secundária do header/menu.
6. Formatar telefone e documentos no detalhe da empresa.
7. Adicionar indicação visual de continuidade nas tabs móveis.
8. Converter cards clicáveis de `div` para `a`/`button`.
9. Ajustar opacidade dos rótulos de 11 px na sidebar após teste de contraste.
10. Remover o item Suporte enquanto apontar para Configurações ou renomeá-lo honestamente.

## 16. Melhorias estruturais

- Unificar formulários de propriedade/unidade entre administração e operação.
- Criar Context Bar hierárquico e contrato de contexto único.
- Adotar tabela responsiva com modo lista/cartão.
- Reorganizar dashboard global em exceções, saúde, implantação e atividade.
- Criar arquitetura de permissões visível ao vincular usuários.
- Separar cadastro de automação de conexão técnica com provedor.
- Criar sistema de revisão/checklist para onboarding.
- Implantar testes de acessibilidade e responsividade em CI.
- Definir telemetria de UX: abandono por etapa, erros, tempo para criar empresa e frequência de troca de contexto.

## 17. Matriz de impacto e esforço

| Iniciativa | Impacto | Esforço | Prioridade |
|---|---:|---:|---:|
| Corrigir overflow mobile de tabelas | Muito alto | Médio | P0 |
| Tornar contexto global/empresa explícito | Muito alto | Médio | P0 |
| Cards interativos acessíveis | Alto | Baixo | P0 |
| Gestão de foco em modal/drawer | Alto | Médio | P0 |
| Microcopy e glossário | Alto | Baixo | P1 |
| Simplificar tabela de empresas | Alto | Médio | P1 |
| Reorganizar dashboard global | Alto | Médio | P1 |
| Consolidar tokens/variantes | Médio/alto | Médio | P1 |
| Unificar formulários duplicados | Alto | Alto | P2 |
| Revisão/checklist do onboarding | Alto | Médio/alto | P2 |
| Atividade recente e alertas enriquecidos | Alto | Alto | P2 |
| Tema claro promovido e validado | Médio | Médio | P3 |

## 18. Plano de implementação em fases

### Fase 1 — Correções rápidas

- Corrigir reflow/overflow em 390 px.
- Ajustar tabs mobile, alvos e contraste.
- Corrigir cards clicáveis e destino de Suporte.
- Padronizar textos, máscaras e badges.
- Rebaixar demos e esconder controles sem função.
- Adicionar contexto da entidade aos headers e confirmações.

### Fase 2 — Padronização

- Formalizar tokens, variantes e documentação do Design System.
- Criar DataTable responsiva e toolbar de listas.
- Unificar PageHeader, formulários e ações.
- Gestão de foco em modal/drawer/dropdown.
- Consolidar formulários de propriedade/unidade.
- Testes automáticos WCAG, teclado e breakpoints.

### Fase 3 — Evolução da experiência

- Novo dashboard global orientado a exceções.
- Context Bar hierárquico.
- Onboarding com rascunho, revisão e checklist.
- Alertas operacionais, ações rápidas e atividades recentes.
- Fluxos guiados de integração/check-in e permissões por escopo.

## 19. Critérios de aceitação

### Responsividade

- Nenhuma página gera rolagem horizontal do `body` em 320–1440 px.
- Tabelas continuam utilizáveis em 390 px e expõem ação primária/status sem rolagem obrigatória.
- Header, breadcrumb, tabs e modais permanecem operáveis com zoom de 200%.

### Contexto

- Toda página exibe claramente área, empresa e propriedade aplicáveis.
- Toda ação destrutiva confirma a entidade afetada.
- Trocar de empresa atualiza título, navegação e dados sem estado visual contraditório.

### Acessibilidade

- WCAG 2.2 AA: contraste ≥4,5:1 para texto normal, ≥3:1 para texto grande e componentes/estados visuais aplicáveis.
- Fluxos principais funcionam apenas com teclado.
- Modais aprisionam foco, fecham com Escape e devolvem foco ao acionador.
- Nenhum `div onClick` é a única forma de acionar uma função.
- Erros são associados ao campo, anunciados e o primeiro erro recebe foco.

### Consistência

- Um único componente/padrão atende propriedade e unidade nos dois shells.
- Botões, campos, badges, cards e tabelas usam tokens documentados.
- Termos do glossário são aplicados em rotas, menus, títulos e mensagens.

### Dashboard

- Pendências críticas aparecem antes dos indicadores de inventário.
- Cada alerta possui entidade, motivo, severidade e ação.
- Gráficos existem apenas quando há série histórica/proporção útil.

### Onboarding

- Usuário vê etapas, tempo aproximado, campos obrigatórios e o que pode configurar depois.
- Há revisão antes da conclusão e checklist pós-criação.
- Retomar após erro leva à etapa/campo correto sem perder dados.

## 20. Conclusão

A Essencial Stay não precisa de uma reconstrução visual. A fundação é boa e já comunica tecnologia, sobriedade e segurança. O salto de qualidade virá de três decisões: **tornar o contexto impossível de ignorar, tratar mobile como uma composição própria para dados densos e organizar dashboards pela urgência da decisão, não pela disponibilidade dos números**.

Recomenda-se iniciar pela Fase 1 sem alterar regras de negócio: reflow, acessibilidade de interações, clareza textual, contraste e hierarquia. Depois, a padronização deve reaproveitar os componentes existentes. A evolução do dashboard e onboarding deve ocorrer somente após validar os fluxos e métricas com administradores globais e operadores de propriedades.

### Status da implementação da Fase 1 — 31/07/2026

**Implementado**

- Contenção de largura em `Card`, `CardHeader`, `CardContent` e `DataTable`.
- Rolagem horizontal isolada e acessível dentro de tabelas extensas.
- Representação mobile em cartões para a lista de empresas, mantendo a tabela em desktop.
- Ações da empresa agrupadas em menu com nome acessível e estado desabilitado.
- Contexto global renomeado para “Administração da plataforma” e “Escopo global”.
- Rótulo “Visão atual” e distinção visual de “Empresa selecionada”.
- Pendências reais promovidas para a primeira seção do dashboard administrativo.
- Indicadores informativos deixaram de usar aparência de card clicável.
- Tabs com rolagem interna, foco visível, alvo de 44 px e indicação de continuidade.
- Cards de navegação do dashboard convertidos em links semânticos.
- Modal com foco inicial, contenção de foco, Escape e restauração do foco.
- Termo “tenant” removido dos textos visíveis e microcopy do onboarding simplificada.
- Alvos de botões compactos e de ícone ampliados.

**Parcialmente implementado**

- Drawers: a estrutura responsiva foi preservada, mas o mesmo tratamento completo de foco do modal não foi generalizado para todos os drawers nesta fase, para evitar uma refatoração ampla dos shells.
- Tabelas: o primitive foi corrigido e a tabela de empresas recebeu variante mobile; outras tabelas continuam com rolagem interna, sem reconstrução em cartões.
- Contraste: hierarquia de pendências, badges e textos foi melhorada pontualmente; uma matriz completa de contraste de todos os estados fica para a padronização.
- Validação visual autenticada: o baseline de produção foi medido antes da implementação. Após a implementação, o ambiente local não herdou a sessão autenticada do domínio de produção; foram validados localmente os componentes compartilhados e as rotas públicas, sem copiar credenciais ou armazenamento do navegador.

**Adiado para Fase 2 ou posterior**

- Context Bar hierárquico completo e nova arquitetura de navegação.
- Unificação dos formulários duplicados de propriedades e unidades.
- Variante mobile em cartões para todas as tabelas.
- Revisão completa do onboarding e checklist pós-criação.
- Busca, notificações, suporte real, atividades recentes e novas fontes de alertas.
- Code splitting do bundle principal.

Detalhes técnicos e resultados de validação estão em `docs/implementacao-ux-fase-1.md`.

**Atualização da validação autenticada:** o domínio publicado foi inspecionado em 31/07/2026 e ainda executa o build anterior à Fase 1. A regressão funcional autenticada passou sem ações de escrita, mas a certificação visual pós-alteração permanece pendente até que o build seja disponibilizado em homologação autenticada. Em 390 px, o build publicado ainda mede 375 px de largura útil e 620 px de `scrollWidth`; o build local corrigido mede 375/375 px. Consulte a seção 11 de `docs/implementacao-ux-fase-1.md`.

---

## Registro consolidado de problemas

| Tela/componente | Problema | Evidência | Impacto | Gravidade | Recomendação | Esforço | Arquivos prováveis |
|---|---|---|---|---|---|---|---|
| DataTable/mobile | body com overflow horizontal | 620 px internos em viewport útil de 375 px | ações invisíveis | Crítica | variante mobile + contenção | Médio | `data-table.tsx`, páginas de lista |
| Topbar/contexto | mistura nível global e empresa | opções no mesmo select | erro de contexto | Crítica | separar Área e Empresa | Médio | shells, switcher, contexts |
| Dashboard admin | muitos cards equivalentes | seis KPIs + seções com mesmo peso | baixa priorização | Alta | exceções primeiro | Médio | `admin/dashboard.tsx` |
| Empresas | tabela com 8 colunas/4 ações | árvore acessível e mobile | leitura lenta | Alta | resumo + menu | Médio | `admin/companies.tsx` |
| Detalhe empresa | tabs truncadas | screenshot 390 px | baixa descoberta | Alta | tabs adaptativas | Baixo/médio | `entity-tabs.tsx` |
| Modal/drawer | foco incompleto | ausência no código | barreira teclado | Alta | trap/restauração/inert | Médio | `modal.tsx`, shells |
| Dashboard | `div onClick` | cards “Próximos movimentos” | inacessível por teclado | Alta | usar link/button | Baixo | `pages/dashboard.tsx` |
| Onboarding | jargão “tenant” | texto no stepper | confusão | Alta | linguagem por papel | Baixo | `onboarding.tsx` |
| Topbar | busca/sino sem função comprovada | labels e handlers ausentes | expectativa quebrada | Média | ocultar/rotular | Baixo | `topbar.tsx` |
| Sidebar | Suporte → Configurações | mesma rota | navegação enganosa | Média | destino real/remover | Baixo | `navigation.ts` |
| Tema escuro | superfícies muito próximas | tokens 7–20% | pouca separação | Média | calibrar níveis | Baixo | `globals.css` |
| Formulários | implementações paralelas | pastas admin/propriedades | inconsistência | Alta | composição compartilhada | Alto | forms de propriedade/unidade |
| Dashboard empresa | excesso de KPIs | 4 operação + 6 IoT | carga cognitiva | Média | agrupar saúde IoT | Médio | `pages/dashboard.tsx` |
| Reservas | termos/redirects conflitantes | `/hospedagens` → propriedades | modelo mental confuso | Alta | taxonomia única | Médio | router, reservas, navigation |
| Badges/status | sem taxonomia formal | variantes genéricas | semântica inconsistente | Média | tipos status/scope/meta | Baixo | `badge.tsx`, páginas |
