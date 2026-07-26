# Design System — Essencial Stay

## Objetivo

O Design System do Essencial Stay organiza a linguagem visual e os padrões de interação da plataforma. Ele existe para que novas telas sejam consistentes, acessíveis e eficientes, independentemente do módulo ou do fabricante de automação usado por cada cliente.

O sistema foi refinado no Sprint 4.5 para sustentar uma experiência SaaS premium, com alta densidade informacional, hierarquia clara e uma camada de hospitalidade discreta. A automação continua sendo apenas um módulo do produto.

## Princípios

1. **Clareza operacional:** dados, estados e próximas ações devem ser compreendidos rapidamente.
2. **Hospitalidade sem excesso decorativo:** a interface deve ser acolhedora, mas continuar produtiva.
3. **Consistência antes de personalização:** componentes compartilhados e tokens vêm antes de estilos locais.
4. **Contexto progressivo:** informações secundárias aparecem sem competir com a tarefa principal.
5. **Todos os estados são projetados:** carregamento, vazio, erro, sucesso, conteúdo escasso e conteúdo denso devem receber tratamento próprio.
6. **Independência de fabricante:** Tuya, Akubela e futuros fornecedores não definem a identidade visual central.

## Referências de produto

As referências foram usadas como princípios, sem reprodução direta de layout ou identidade:

- Airbnb Host: visão diária, contexto da hospedagem e foco nas próximas ações;
- Guesty e Hospitable: organização operacional e continuidade da jornada do hóspede;
- Stripe: consistência entre componentes, tabelas legíveis e hierarquia de dados;
- Linear: navegação compacta, velocidade percebida e microinterações discretas;
- Notion: neutralidade, clareza e composição sem ruído;
- Vercel: tokens semânticos, tipografia funcional, estados completos e contraste.

Referências oficiais consultadas:

- [Airbnb — ferramentas para anfitriões](https://www.airbnb.com/resources/hosting-homes/a/exploring-your-hosting-tools-738)
- [Stripe — princípios de design para aplicações](https://docs.stripe.com/stripe-apps/design)
- [Vercel Geist — cores](https://vercel.com/geist/colors)
- [Vercel Geist — tipografia](https://vercel.com/geist/typography)
- [Vercel — diretrizes de interface](https://vercel.com/design/guidelines)
- [Hospitable — experiência do hóspede](https://help.hospitable.com/en/collections/2572729-guest-experience)

## Identidade visual

A aparência combina superfícies neutras, texto de alto contraste e acentos semânticos. Verde-petróleo representa ações relevantes e estados de produto; âmbar aparece apenas em atenção, destaque e recursos futuros. Azul é reservado para informação. Vermelho é exclusivo para risco e remoção.

A interface não deve ser dominada por uma única família cromática. Cor comunica significado e nunca deve ser o único indicador de estado.

**Decisão pendente:** substituir o símbolo provisório pelo logotipo oficial quando o arquivo final da marca for disponibilizado no repositório.

## Temas

Há suporte completo a:

- tema claro;
- tema escuro;
- preferência do sistema.

A preferência é persistida no navegador e aplicada por classe no elemento raiz. O seletor compacto alterna entre as três opções. Todos os componentes devem consumir tokens semânticos para funcionar nos dois temas.

## Design tokens

### Superfícies

- `background`: fundo geral da aplicação;
- `card`: superfície principal de componentes;
- `surface`: superfície secundária;
- `surface-elevated`: menus e elementos acima do fluxo;
- `surface-sunken`: áreas de demonstração e planos recuados;
- `sidebar`: superfície escura e estável da navegação;
- `sidebar-active`: estado ativo da navegação.

### Conteúdo e ação

- `foreground`: texto principal;
- `muted-foreground`: texto de apoio;
- `primary`: ação principal neutra e de alto contraste;
- `accent`: ação funcional e destaque de produto;
- `info`, `success`, `warning` e `destructive`: estados semânticos;
- `border`, `input` e `ring`: limites, campos e foco.

### Elevação

- `shadow-xs`: inputs, tabelas e elementos estáticos;
- `shadow-sm`: cartões e hover leve;
- `shadow-md`: cartões interativos;
- `shadow-lg`: modal, menu e elementos flutuantes.

Sombras são mais densas no tema escuro para manter separação entre superfícies.

### Bordas e raios

O raio base é `8px`. Controles compactos usam `4px` a `6px`. Raios maiores são reservados à moldura demonstrativa de dispositivo, não a cartões operacionais.

### Movimento

- rápido: `140ms` para hover e foco;
- base: `220ms` para menus, botões e componentes;
- entrada de página: `320ms`;
- curva padrão: `cubic-bezier(0.22, 1, 0.36, 1)`.

As animações usam opacidade e pequenos deslocamentos. A preferência `prefers-reduced-motion` reduz movimentos automaticamente.

## Tipografia

A pilha principal prioriza Inter e fontes nativas de sistema. A tipografia é compacta e adequada a software operacional.

- título de página: `28px`, semibold;
- título de seção ou cartão: `15px`, semibold;
- corpo e controles: `14px`;
- apoio e metadados: `12px`;
- rótulos de grupo: `11px`, semibold;
- números comparáveis usam algarismos tabulares.

Letter spacing negativo não é utilizado. Textos longos usam line-height confortável e largura limitada.

## Espaçamento e layout

O grid usa base de `4px`. Combinações recorrentes: `8`, `12`, `16`, `20`, `24` e `32px`.

- sidebar expandida: `264px`;
- sidebar recolhida: `72px`;
- topbar: `72px`;
- conteúdo máximo: `1440px`;
- margens laterais: `16px` no mobile, `24px` em tablets e `32px` no desktop.

Seções são áreas sem moldura. Cartões são usados para itens repetidos, ferramentas e agrupamentos que precisam de limite visual. Não devem existir cartões decorativos aninhados.

## Shell da aplicação

### Sidebar

A navegação é organizada em Gestão, Operação, Ecossistema, Análises e Sistema. A Experiência do Hóspede integra o grupo principal de Gestão. O estado ativo usa contraste, ícone e marcador lateral. No modo recolhido, tooltips preservam a compreensão.

### Topbar

A topbar operacional oferece o contexto da empresa cliente ativa, busca visual, tema, notificações e menu de usuário. No mobile, prioriza o título atual e a empresa selecionada. A área global usa um shell próprio e identifica claramente `Administração Essencial Stay`.

### Conteúdo

Cada rota entra com animação curta e respeita uma largura máxima estável. O cabeçalho de página aceita breadcrumb, descrição, badge e ações reutilizáveis.

## Componentes

Componentes base:

- `Button`, com variantes primary, accent, secondary, outline, ghost e destructive;
- `Card`, com variantes default, subtle e interactive;
- `Input`, `Select`, `Textarea`, `Checkbox` e `Switch`;
- `FormField`, com label, descrição, indicação opcional e erro;
- `Badge`, com estados semânticos e redundância textual;
- `DataTable`, com células React, hover, rolagem horizontal e colunas configuráveis;
- `Modal`, com overlay, fechamento por Escape e bloqueio do scroll;
- `Toast`, com estados de sucesso e erro;
- `DropdownMenu`, com clique externo e suporte a Escape;
- `Avatar`, `Breadcrumb`, `Tooltip` e `SegmentedControl`;
- `PageHeader`, `SectionHeading` e `StatCard`;
- `EmptyState`, `LoadingState`, `ErrorState` e `Skeleton`.

## Padrões de conteúdo

### Dashboard

Indicadores devem responder às perguntas mais frequentes da operação. O primeiro bloco apresenta no máximo quatro métricas principais. Tabelas ficam abaixo das métricas, e áreas futuras são apresentadas como próximos movimentos, sem simular dados reais.

### Tabelas

Cabeçalhos usam caixa normal, sem excesso de uppercase. Ações por linha usam ícones reconhecíveis com tooltip e nome acessível. Números usam alinhamento visual estável. Em telas estreitas, a tabela rola horizontalmente sem comprimir conteúdo.

### Formulários

Todo campo possui rótulo visível. Placeholder é exemplo, não substituto do rótulo. Erros aparecem junto ao campo. Ações finais ficam separadas por borda e alinhadas à direita em modais.

### Estados vazios

Estados vazios explicam o que falta e oferecem uma próxima ação quando ela existe. Não devem culpar o usuário nem exibir instruções técnicas.

### Experiência do Hóspede

A prévia do portal usa dados fictícios e indica explicitamente seu caráter demonstrativo. Link, QR Code, check-in, Wi-Fi, fechadura e automação são apenas representações visuais. A experiência continua relevante sem dispositivos conectados, por meio de informações, contato e orientações da propriedade.

## Acessibilidade

- foco visível em controles interativos;
- contraste semântico nos temas claro e escuro;
- labels acessíveis em botões de ícone;
- estados com texto além da cor;
- navegação e modais com atributos ARIA;
- suporte à redução de movimento;
- áreas de toque com dimensões estáveis.

## Regras de implementação

- não criar CSS isolado por tela;
- usar TailwindCSS, tokens e componentes compartilhados;
- usar `lucide-react` para iconografia;
- não introduzir valores de cor soltos quando existir token equivalente;
- não conectar páginas diretamente a fabricantes ou serviços externos;
- não duplicar padrões de formulário, cabeçalho, tabela ou estado;
- validar tema claro, tema escuro e responsividade em cada novo módulo.

## Decisões pendentes

- **Decisão pendente:** adicionar o arquivo oficial do logotipo Essencial Stay.
- **Decisão pendente:** avaliar a adoção de Geist Sans ou Inter como arquivo de fonte hospedado pela própria aplicação.
- **Decisão pendente:** definir tokens de white label sem comprometer a consistência semântica.
- **Decisão pendente:** separar o Design System em pacote interno quando houver mais de uma aplicação consumidora.
