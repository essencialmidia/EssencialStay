# Sprint 4A - Núcleo operacional

## Objetivo

O Sprint 4A introduz a fundação operacional das unidades sem antecipar reservas, jornadas, check-in ou checkout. O modelo separa o estado real da jornada das restrições operacionais e mantém auditoria transacional de todas as mudanças.

## Estado da unidade

`public.estados_unidade` é a fonte oficial do estado atual. Os estados de jornada são:

- `disponivel`;
- `reservada`;
- `preparando`;
- `pronta_checkin`;
- `ocupada`;
- `aguardando_limpeza`;
- `em_limpeza`.

`manutencao` e `bloqueada` não são estados da jornada. São projeções de restrições ativas de `public.bloqueios_unidade`.

A visão `public.estados_unidade_consolidados` aplica uma única ordem de precedência:

1. manutenção impeditiva;
2. bloqueio impeditivo;
3. estado da jornada.

Essa regra não deve ser reproduzida no frontend.

## Compatibilidade temporária

`public.unidades.status_operacional` foi preservada para as telas legadas. A coluna é um espelho temporário e somente as RPCs operacionais podem alterá-la. Novas unidades sempre começam como `disponivel` e recebem automaticamente seu registro em `estados_unidade`.

O frontend não oferece mais edição direta do status. A remoção definitiva da coluna legada exige uma etapa posterior, depois que todas as leituras forem migradas.

Antes do backfill, a migration contabiliza as unidades legadas com `status_operacional = 'ocupada'`. Essas unidades mantêm o estado `ocupada`, mas não ficam sem saída: a RPC excepcional `resolver_ocupacao_legada_unidade` permite reconciliá-las para `aguardando_limpeza` ou `disponivel`.

Essa RPC não representa checkout. Ela aceita somente estados `ocupada` originados pelo backfill da própria migration 019, exige versão, idempotência e justificativa, e é restrita a proprietário, administrador da empresa ou suporte global. A operação grava histórico e evento com origem explícita. Gerentes continuam autorizados nas operações regulares, mas não nessa reconciliação excepcional de migração.

## Transições

`public.transicionar_estado_unidade` exige versão esperada e chave de idempotência, bloqueia a projeção com `SELECT FOR UPDATE` e grava na mesma transação:

- o novo estado;
- a nova versão;
- o histórico;
- o evento operacional.

Transições de exceção exigem justificativa. A RPC não permite entrar em `ocupada` ou `aguardando_limpeza`, nem sair de `ocupada`. Esses movimentos representarão check-in e checkout e terão RPCs específicas no Sprint 4B.

## Idempotência

As RPCs de criação de tarefa e bloqueio geram uma impressão SHA-256 determinística apenas dos metadados não sensíveis e normalizados do comando. Título, descrição, motivo e justificativa não entram na impressão. Esses campos são validados contra o agregado ou o campo de auditoria correspondente, sem serem duplicados no payload.

Uma repetição com a mesma chave retorna o mesmo agregado apenas quando o tipo do evento, a unidade, o agregado, a impressão e os dados persistidos correspondem ao comando original. A reutilização da chave com qualquer parâmetro essencial diferente falha com `23505`.

Todas as RPCs removem apenas espaços externos da chave antes de validá-la e persisti-la. A capitalização é preservada porque a chave é case-sensitive. Estados e status controlados são normalizados com `lower(btrim(...))`; justificativas e textos livres não recebem essa transformação.

O encerramento de bloqueio também vincula a chave ao comando, ator e justificativa. A repetição aceita somente eventos `bloqueio_unidade.encerrado` ou `bloqueio_unidade.cancelado` do bloqueio solicitado. Uma chave usada na criação nunca é aceita no encerramento.

Para bloqueios de origem PMS, a impressão também inclui a associação entre conexão e propriedade. A RPC exige que `conexao_id` pertença à organização e esteja vinculada à propriedade da unidade por `conexoes_integracao_propriedades`. Associações inativas não aceitam comandos novos; uma repetição exata já persistida continua idempotente.

## Tarefas e bloqueios

`tarefas_operacionais` suporta preparação, limpeza e manutenção. O Sprint 4A não cria tarefas automaticamente e não associa limpeza a checkout.

`bloqueios_unidade` registra manutenção impeditiva, bloqueio manual e futura origem PMS. Um bloqueio nunca destrói ou substitui o estado da jornada.

## Segurança

As tabelas operacionais usam RLS por organização. O cliente possui somente leitura direta; criação e alteração ocorrem por RPC. Histórico e eventos são imutáveis durante a operação normal.

Administradores globais permanecem fora de `membros_organizacao`. Toda mutação feita por suporte exige justificativa e registra ator, tenant, origem, correlação e data.

`historico_estados_unidade.criado_por` e `eventos_operacionais.criado_por` guardam o UUID histórico sem FK para `perfis`. Assim, a exclusão posterior de um perfil não apaga a identidade registrada. As FKs de ator foram mantidas somente nas estruturas mutáveis, como tarefas e bloqueios.

UPDATE e DELETE no histórico e nos eventos são bloqueados incondicionalmente por trigger. Não existe marcador, exceção administrativa ou RPC `SECURITY DEFINER` capaz de alterar ou remover esses registros. Organizações, propriedades e unidades utilizam exclusivamente cancelamento ou inativação lógica.

## Concorrência e locks

A ordem oficial de locks do núcleo operacional é:

1. organização;
2. propriedade;
3. unidade;
4. estado da unidade;
5. tarefa ou bloqueio específico;
6. inserção de histórico e eventos.

`transicionar_estado_unidade`, `resolver_ocupacao_legada_unidade`, `criar_tarefa_operacional`, `alterar_status_tarefa_operacional`, `criar_bloqueio_unidade` e `encerrar_bloqueio_unidade` seguem essa ordem. Não há retry interno: conflitos de versão retornam `40001`, e um eventual deadlock residual do PostgreSQL retorna `40P01` para retry controlado pelo chamador.

## Paginação e índices

A consulta de estados usa a RPC `listar_estados_unidade_operacionais` e paginação por cursor composto, sem OFFSET, com ordenação estável por `atualizado_em desc, unidade_id desc`. O frontend solicita um item adicional para determinar se existe próxima página e mantém localmente os cursores das páginas já visitadas.

Os índices de listagem começam pelo tenant e cobrem os filtros reais de propriedade, tipo ou situação e os critérios estáveis de ordenação. Há um índice para consultas com propriedade (`organizacao_id, propriedade_id, atualizado_em desc, unidade_id desc`) e outro para a listagem de toda a organização (`organizacao_id, atualizado_em desc, unidade_id desc`). Os índices de chaves estrangeiras cobrem unidade/propriedade, conexão/organização e os campos de ator mantidos com FK. A busca lateral da projeção consolidada possui índice parcial apenas para bloqueios ativos e impeditivos, incluindo a prioridade de manutenção.

## Testes Release Candidate

Os testes descartáveis ficam em `database/tests`. O arquivo `019_nucleo_operacional_rc.sql` valida imutabilidade, inicialização automática e cascatas oficiais de propriedade e organização dentro de uma transação encerrada com rollback. O arquivo `019_nucleo_operacional_concorrencia.sql` contém blocos separados para duas sessões, cobrindo optimistic locking, idempotência, isolamento por tenant, origem e independência entre unidades.

Esses testes exigem PostgreSQL/Supabase local com as migrations aplicáveis até a 019. Eles não devem ser executados no projeto remoto.

## Fuso horário

Todas as propriedades existentes recebem inicialmente `America/Sao_Paulo`. Novos valores são validados no banco contra `pg_timezone_names`, e a lista utilizada pelo formulário vem da RPC `listar_fusos_horarios`.

Propriedades internacionais devem revisar manualmente o fuso após a aplicação da migration.

## Fora do Sprint 4A

Permanecem para o Sprint 4B ou posteriores: alocações, sobreposição de reservas, jornadas, check-in, checkout, pré-check-in, ativação automática da reserva 24 horas antes, timeline completa, PMS, fechaduras, IoT, filas, Inbox/Outbox e reconciliação automática.
