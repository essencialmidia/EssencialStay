# Implementação de UX e Visual Design — Fase 1

**Data:** 31 de julho de 2026

**Escopo:** correções frontend de baixo risco, sem alterações em backend, banco, autenticação, permissões, APIs, integrações, rotas ou regras de negócio.

## 1. Resumo das mudanças

A Fase 1 corrigiu a origem estrutural do overflow horizontal, criou uma apresentação mobile específica para empresas, tornou o contexto global mais explícito, priorizou pendências reais no dashboard administrativo e melhorou acessibilidade de links, menus, tabs, botões e modais.

Antes, uma viewport de 390 px apresentava largura útil de 375 px e o dashboard publicado podia chegar a aproximadamente 620 px de largura interna. Depois das mudanças nos primitives e de uma correção adicional em badges longos, a validação local retornou `clientWidth=375` e `scrollWidth=375` em 390 px.

## 2. Arquivos alterados

Arquivos alterados especificamente nesta fase:

- `frontend/src/components/admin/admin-shell.tsx`
- `frontend/src/components/admin/entity-tabs.tsx`
- `frontend/src/components/layout/page-header.tsx`
- `frontend/src/components/layout/topbar.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/data-table.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/components/ui/modal.tsx`
- `frontend/src/components/ui/stat-card.tsx`
- `frontend/src/pages/admin/companies.tsx`
- `frontend/src/pages/admin/company-details.tsx`
- `frontend/src/pages/admin/dashboard.tsx`
- `frontend/src/pages/dashboard.tsx`
- `frontend/src/pages/onboarding.tsx`
- `docs/auditoria-ux-visual.md`
- `docs/implementacao-ux-fase-1.md`

O build atualizou os artefatos em `frontend/dist`. O repositório já possuía mudanças não relacionadas antes desta implementação; elas foram preservadas e não fazem parte da lista acima.

## 3. Componentes criados ou ajustados

Nenhuma nova biblioteca ou arquitetura foi introduzida.

- **DataTable:** contém a largura mínima da tabela dentro de uma região rolável, focável e nomeada.
- **Card:** permite encolhimento dentro de grids com `min-w-0`.
- **Badge:** pode encolher/truncar sem ampliar a viewport.
- **Button:** alvos compactos passaram de 32 para 36 px e ícones de 36 para 40 px.
- **PageHeader:** quebra títulos longos e oferece ação principal em largura confortável no mobile.
- **EntityTabs:** rolagem interna, alvo de 44 px, foco visível e fade de continuidade.
- **DropdownMenu:** aceita item desabilitado e mantém alvo mínimo de 40 px.
- **Modal:** foco inicial, focus trap, Escape, restauração de foco e altura baseada em `dvh`.
- **StatCard:** deixa de sugerir clique quando é meramente informativo.

## 4. Problemas corrigidos

- Overflow do `body` provocado por tabelas e conteúdo intrínseco de cards.
- Lista de empresas ilegível em smartphone.
- Quatro ações repetidas por linha na tabela desktop.
- Contexto global apresentado como se fosse uma empresa no seletor.
- Pendências abaixo de indicadores meramente informativos.
- Tabs cortadas sem indicação de continuidade.
- Cards com `div onClick`, inacessíveis por teclado.
- Modal sem ciclo completo de foco.
- Termo técnico “tenant” exposto ao usuário.
- Badges longos ampliando a viewport em layouts estreitos.

## 5. Decisões de UX

- Em mobile, empresas são apresentadas como cartões com nome, status, estrutura e ação principal. O restante fica em menu de ações.
- Em desktop, a tabela é preservada, mas as quatro ações viraram um único menu.
- “Administração da plataforma” e “Escopo global” deixam explícito que o usuário não está dentro de uma empresa.
- Ao entrar em uma empresa como administrador, a faixa superior usa “Empresa selecionada” e oferece “Voltar à administração”.
- Pendências reais aparecem antes dos KPIs; demonstrações comerciais foram movidas para o final e recebem superfície visual secundária.
- Automação no onboarding é descrita como “Recursos inteligentes”, explicando que conexões podem ser feitas depois.

## 6. Decisões técnicas

- A correção de overflow foi aplicada na origem, usando `min-w-0`, `max-w-full` e `overscroll-x-contain`; não foi usado `overflow-x-hidden` no `body` para mascarar conteúdo excedente.
- A variante mobile de empresas reutiliza dados, `Badge`, `Button` e `DropdownMenu`; nenhuma consulta ou estrutura de dados mudou.
- Links de navegação usam `Link` do React Router, preservando as rotas existentes.
- O modal usa APIs nativas de foco e mantém a alteração preexistente de `z-index: 60`.
- Não houve instalação de dependências.

## 7. Testes executados

| Verificação | Resultado |
|---|---|
| `npm run lint` | Aprovado |
| Verificação TypeScript | Aprovada pelo lint e pelo `tsc -b` do build |
| `npm test` | 35 aprovados, 0 falhas |
| `git diff --check` | Sem erros de whitespace; apenas avisos de conversão LF/CRLF do ambiente |
| Console do navegador local | 0 erros e 0 avisos na rota validada |
| 390 px | `clientWidth=375`, `scrollWidth=375` após correção |
| 768 px | `clientWidth=753`, `scrollWidth=753` |
| 1024 px | `clientWidth=1009`, `scrollWidth=1009` |
| 1280 px | `clientWidth=1265`, `scrollWidth=1265` |
| 1440 px | `clientWidth=1425`, `scrollWidth=1425` |

O baseline autenticado de produção foi registrado antes das alterações. A aplicação local foi executada em `127.0.0.1:4174`; por isolamento de origem, ela não compartilhou a sessão autenticada de `essencialstay.com.br`. A validação local pós-alteração cobriu rotas públicas e primitives compartilhados, sem copiar credenciais, cookies ou armazenamento.

## 8. Resultado do build

Build de produção concluído com sucesso:

- 1.862 módulos transformados.
- CSS: 51,11 kB (9,70 kB gzip).
- JavaScript principal: 1.136,25 kB (314,54 kB gzip).
- Tempo informado pelo Vite: 12,51 s.

O Vite emitiu aviso não bloqueante para chunk acima de 500 kB. A aplicação foi gerada normalmente.

## 9. Limitações restantes

- Drawers dos shells ainda não compartilham uma abstração completa de focus trap/restauração.
- Apenas a lista de empresas recebeu composição mobile em cartões; outras tabelas usam rolagem interna.
- A validação visual pós-alteração do `/admin` autenticado deverá ser repetida em um ambiente local com login autorizado ou em homologação após publicação controlada.
- Busca, notificações e destino de suporte não foram modificados para evitar expansão de escopo funcional.
- Ações futuras nas tabs continuam visíveis como “Em breve”, embora agora sejam acessíveis e contidas.
- O bundle principal continua grande.

## 10. Recomendações para a Fase 2

1. Generalizar a gestão de foco para drawer, dropdown e demais overlays.
2. Criar API de tabela responsiva com colunas prioritárias e representação mobile declarativa.
3. Unificar formulários de propriedade/unidade entre os dois shells.
4. Formalizar tokens de superfície, borda, contraste e densidade.
5. Adicionar testes automatizados de acessibilidade e reflow em CI.
6. Implementar code splitting por rota.
7. Validar o Context Bar hierárquico com administradores globais antes de alterar navegação.
8. Evoluir onboarding com revisão e checklist, sem misturar a mudança com esta Fase 1.

## 11. Validação autenticada final — 31/07/2026

### Resultado executivo

A sessão autenticada em `https://essencialstay.com.br/admin` foi acessada com perfil de administração global e permitiu executar uma regressão não destrutiva dos fluxos existentes. Entretanto, o domínio publicado ainda serve o **build anterior à Fase 1**. Como esta validação proíbe deploy, não foi possível certificar visualmente o código novo nesse domínio.

### Evidências de versão

O ambiente publicado ainda apresenta:

- título “Administração Essencial Stay”, em vez de “Administração da plataforma”;
- badge “Global”, em vez de “Escopo global”;
- `aria-label` “Selecionar contexto”, em vez de “Alterar visão atual”;
- opção “Administração Essencial Stay”, em vez de “Administração da plataforma”;
- demonstrações antes das pendências;
- tabela de empresas com quatro botões por linha;
- tabs sem a nova indicação de continuidade;
- modal que mantém o foco no botão de fundo ao abrir.

Esses sinais correspondem diretamente ao código anterior e não podem ser confundidos com cache de texto isolado.

### Medição autenticada do build publicado

| Viewport | `documentElement.clientWidth` | `documentElement.scrollWidth` | `body.scrollWidth` | Resultado |
|---:|---:|---:|---:|---|
| 390 px | 375 | 620 | 620 | Falha; build antigo ainda possui overflow |
| 768 px | 753 | 753 | 753 | Sem overflow |
| 1024 px | 1009 | 1009 | 1009 | Sem overflow |
| 1280 px | 1265 | 1265 | 1265 | Sem overflow |
| 1440 px | 1425 | 1425 | 1425 | Sem overflow |

O resultado de 620 px em 390 px reproduz o baseline anterior. No build local da Fase 1, a mesma classe de validação retornou 375/375 px.

### Regressão autenticada executada

Sem criar, editar, inativar, conectar ou enviar dados, foram verificados:

- `/admin`: dashboard global, números reais, pendências, implantações e ações presentes;
- `/admin/empresas`: quatro empresas, status e ações existentes;
- detalhe da empresa Studio Vila Nova: visão geral, propriedades e usuários;
- propriedades da empresa e estado vazio de usuários vinculados;
- `/admin/ekaza`: health e listagem protegida por chave, sem execução;
- troca de contexto para Hotel Summit Monaco;
- `/dashboard`: indicadores, portfólio e estado das unidades;
- `/reservas`: chegadas, estadias, preparação e detalhe de hospedagem;
- modal de hospedagem: abre, fecha por Escape e não altera dados;
- `/integracoes`: filtros e estado vazio preservados;
- `/propriedades`: portfólio da empresa;
- detalhe de Hotel Monaco: automação, recursos inteligentes e unidade 903.

### Estabilização

Nenhuma correção adicional de código foi necessária nesta etapa. O problema observado é de **disponibilidade do build no ambiente autenticado**, não uma regressão nova no código local. Ações necessárias para concluir a certificação visual:

1. disponibilizar o build da Fase 1 em homologação autenticada, ou iniciar o servidor local com uma sessão de teste autorizada;
2. repetir os cinco breakpoints e os testes de foco nesse ambiente;
3. somente depois considerar a Fase 1 visualmente homologada.

Não foi realizado deploy, push, alteração de autenticação ou cópia de credenciais/cookies/armazenamento.
