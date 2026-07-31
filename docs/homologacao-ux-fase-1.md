# Plano de homologação visual — UX Fase 1

**Status:** preparado; publicação e homologação visual ainda não autorizadas

**Data:** 31 de julho de 2026

## 1. Histórico e estado atual

A primeira validação autenticada foi executada em `https://essencialstay.com.br/admin`, mas o domínio ainda servia o build anterior à Fase 1. A regressão funcional autenticada foi aprovada sem ações de escrita: administração global, empresas, detalhes, propriedades, unidades, usuários, integrações, reservas/check-in e modais permaneceram acessíveis.

Em 390 px, o build publicado antigo apresentou:

```text
document.documentElement.clientWidth = 375
document.documentElement.scrollWidth = 620
document.body.scrollWidth = 620
```

O código local da Fase 1 apresentou `clientWidth=375` e `scrollWidth=375`. Nenhuma correção adicional foi necessária após a primeira validação autenticada; a homologação visual depende da disponibilização do build atualizado em ambiente autenticado.

Este documento não marca a homologação como aprovada.

## 2. Infraestrutura identificada

- Hospedagem documentada: EasyPanel.
- Produção: branch `main`, domínio `essencialstay.com.br`, frontend construído pelo `Dockerfile` da raiz.
- Build: Node 22 Alpine, `npm ci`, `npm run build`.
- Runtime: Nginx 1.27 Alpine, porta 80, healthcheck `/healthz`.
- Fallback SPA: configurado no `nginx.conf`.
- Ambiente de staging/preview: não há configuração versionada ou domínio documentado no repositório.
- Branch preparada para homologação: `codex/ux-fase-1-homologacao`.

Variáveis públicas necessárias no build de homologação:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEMO_PUBLIC_ORIGIN`
- `VITE_EKAZA_API_BASE_URL`, quando os testes de integração exigirem a API existente

Valores não devem ser registrados neste documento. Variáveis `VITE_` são públicas no bundle; nenhuma chave privilegiada, senha ou `service_role` deve ser configurada.

## 3. Opção recomendada

Criar um **serviço EasyPanel separado de preview por branch**, apontando exclusivamente para `codex/ux-fase-1-homologacao`, com domínio dedicado semelhante a `ux-fase-1-homolog.essencialstay.com.br`.

Motivos:

- reutiliza o Dockerfile e o Nginx já validados;
- não substitui o serviço nem o domínio de produção;
- permite autenticação usando a configuração pública autorizada;
- mantém rollback simples, removendo/revertendo apenas o serviço de preview;
- a branch contém somente a Fase 1 e sua documentação;
- evita criar nova infraestrutura de banco nesta etapa.

Antes da publicação, o responsável por Supabase deve confirmar se o domínio de preview precisa ser autorizado para redirects de autenticação. Essa configuração não deve ser alterada sem aprovação específica.

## 4. Configuração proposta do preview

- **Plataforma:** EasyPanel.
- **Projeto:** projeto Essencial Stay existente, em serviço separado.
- **Tipo:** App.
- **Fonte:** mesmo repositório Git, branch `codex/ux-fase-1-homologacao`.
- **Contexto:** raiz `.`.
- **Dockerfile:** `Dockerfile`.
- **Porta do container:** 80.
- **Domínio esperado:** `ux-fase-1-homolog.essencialstay.com.br` ou domínio temporário equivalente aprovado no EasyPanel.
- **Volumes:** nenhum.
- **Banco:** nenhuma migration e nenhuma alteração de estrutura.
- **Dados:** acesso controlado; preferir usuário administrativo de teste. Não criar dados fictícios no ambiente de produção.

Arquivos de configuração envolvidos, sem alteração nesta preparação:

- `Dockerfile`
- `nginx.conf`
- `frontend/vite.config.ts`
- `frontend/.env.example`
- configuração externa do serviço EasyPanel e domínio/DNS
- configuração externa de redirects permitidos no provedor de autenticação, somente se necessária e autorizada

## 5. Riscos e controles

| Risco | Controle |
|---|---|
| Preview usar a mesma base de produção | usar conta controlada e testes somente de leitura; não submeter formulários |
| Redirect de autenticação não aceitar o novo domínio | validar allowlist antes; não alterar sem aprovação |
| Serviço apontar acidentalmente para `main` | conferir branch e hash do commit antes do primeiro build |
| Domínio de preview substituir produção | criar serviço e domínio separados; nunca editar `essencialstay.com.br` |
| Variáveis públicas incorretas | comparar apenas nomes e destinos autorizados, sem registrar valores |
| Cache servir build antigo | conferir textos-sentinela da Fase 1 e hash dos assets antes dos testes |
| Dados pessoais em capturas | usar enquadramento mínimo, mascarar quando necessário e não versionar capturas |

## 6. Critério de identificação do build

Antes de homologar, confirmar simultaneamente:

- título “Administração da plataforma”;
- badge “Escopo global”;
- rótulo “Visão atual”/nome acessível “Alterar visão atual”;
- seção “Atenção necessária” antes dos indicadores;
- lista mobile de empresas em cartões;
- ações desktop agrupadas em menu;
- termo “tenant” ausente da interface.

Se esses sinais não estiverem presentes, interromper: o preview não está usando o commit correto.

## 7. Plano de validação visual

### Rotas e fluxos

1. `/admin`: contexto, cabeçalho, pendências, KPIs, implantações e demos.
2. `/admin/empresas`: tabela desktop, cartões mobile e menu de ações.
3. Detalhe de empresa: cabeçalho, ações e tabs.
4. Tabs Propriedades e Usuários: conteúdo, estado vazio e tabela interna.
5. Troca de contexto global → empresa → retorno à administração.
6. `/dashboard`: cards de navegação por teclado.
7. Propriedade/unidade: formulários e modais apenas para abrir/fechar, sem salvar.
8. Reservas/check-in: detalhe e modais sem executar ações de negócio.
9. Integrações e recursos inteligentes: estados existentes, sem conectar provedores.

### Breakpoints

Repetir em 390, 768, 1024, 1280 e 1440 px:

- ausência de sobreposição e corte;
- header e seletor de contexto;
- grid de indicadores;
- tabela/cartões;
- tabs;
- modais e rolagem interna;
- áreas de toque e foco visível.

Em 390 px, registrar no console:

```javascript
document.documentElement.clientWidth
document.documentElement.scrollWidth
document.body.scrollWidth
```

Critério obrigatório: ambos os valores de `scrollWidth` devem ser menores ou iguais ao `clientWidth`.

### Teclado e foco

- percorrer header, navegação, ações e tabs com Tab/Shift+Tab;
- acionar links e botões com Enter/Espaço conforme semântica;
- abrir modal e confirmar foco inicial dentro dele;
- confirmar que Tab não sai do modal;
- fechar com Escape;
- confirmar retorno do foco ao acionador;
- verificar anel de foco em tema claro e escuro.

### Console e regressão

- console sem novos erros ou avisos atribuíveis à Fase 1;
- números e registros iguais aos dados reais do ambiente;
- nenhuma rota, informação ou ação anterior removida;
- nenhuma submissão ou mutação durante a homologação visual.

## 8. Aprovação e evidências

Registrar após a publicação autorizada:

- URL do preview;
- branch e hash implantados;
- data, navegador e usuário/papel de teste sem dados pessoais;
- medições dos cinco breakpoints;
- resultado do teclado/foco;
- console;
- problemas encontrados e correções pequenas, se houver;
- decisão final: aprovado, aprovado com ressalvas ou reprovado.

Até a execução desses testes no build atualizado, o estado permanece **pendente de homologação visual**.

## 9. Rollback

Como o preview será um serviço separado, o rollback recomendado é:

1. desativar ou remover o domínio do serviço de preview;
2. interromper o serviço de preview;
3. manter produção intocada na branch `main` e no serviço atual;
4. se necessário, retornar a branch de preview ao commit anterior por novo commit/redeploy autorizado, sem reescrever `main`.

Nenhuma ação de rollback deve envolver banco, RLS ou autenticação.

## 10. Ação pendente de autorização

Após o commit local e a revisão desta preparação, é necessária autorização explícita para:

1. fazer push da branch `codex/ux-fase-1-homologacao`;
2. criar ou configurar o serviço separado no EasyPanel;
3. associar um domínio de preview;
4. configurar variáveis públicas e eventual redirect de autenticação;
5. iniciar o primeiro deploy de homologação.

Nenhuma dessas ações foi executada nesta preparação.
