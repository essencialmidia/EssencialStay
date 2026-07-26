begin;

do $$
begin
  if to_regclass('public.organizacoes') is null
     or to_regclass('public.perfis') is null
     or to_regclass('public.membros_organizacao') is null
     or to_regclass('public.propriedades') is null
     or to_regclass('public.unidades') is null
     or to_regclass('public.administradores_plataforma') is null
     or to_regclass('public.conexoes_integracao') is null
     or to_regclass('public.conexoes_integracao_propriedades') is null
     or to_regnamespace('private') is null then
    raise exception 'Execute as migrations oficiais ate a 018 antes da migration 019.';
  end if;

  if to_regprocedure('public.usuario_eh_membro(uuid)') is null
     or to_regprocedure('public.usuario_pode_gerenciar(uuid)') is null
     or to_regprocedure('public.eh_administrador_plataforma()') is null
     or to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null
     or to_regprocedure('public.atualizar_atualizado_em()') is null then
    raise exception 'As funcoes oficiais de autorizacao ainda nao estao disponiveis.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_extension
    where extname = 'pgcrypto'
  ) then
    raise exception 'A extensao pgcrypto da migration 001 nao esta disponivel.';
  end if;
end;
$$;

drop function if exists public.excluir_propriedade_definitivamente(uuid, text);
drop function if exists public.excluir_organizacao_definitivamente(uuid, text);

alter table public.propriedades
  add column fuso_horario text,
  add column antecedencia_estado_reservada_horas smallint not null default 24;

update public.propriedades
set fuso_horario = 'America/Sao_Paulo';

alter table public.propriedades
  alter column fuso_horario set not null,
  alter column fuso_horario set default 'America/Sao_Paulo',
  add constraint propriedades_antecedencia_estado_reservada_check
    check (antecedencia_estado_reservada_horas between 0 and 720);

comment on column public.propriedades.fuso_horario is
'Identificador IANA. O backfill usa America/Sao_Paulo; propriedades internacionais devem revisar este valor manualmente.';
comment on column public.propriedades.antecedencia_estado_reservada_horas is
'Antecedencia operacional da reserva. A ativacao automatica sera implementada no Sprint 4B.';

create or replace function public.validar_fuso_horario_propriedade()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.fuso_horario := btrim(new.fuso_horario);

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.fuso_horario
  ) then
    raise exception 'Fuso horario IANA invalido: %.', new.fuso_horario
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_fuso_horario_propriedade() from public, anon, authenticated;

create trigger propriedades_validar_fuso_horario
before insert or update of fuso_horario on public.propriedades
for each row execute function public.validar_fuso_horario_propriedade();

create or replace function public.listar_fusos_horarios()
returns table (nome text, deslocamento_atual interval)
language sql
stable
security definer
set search_path = pg_catalog, public, pg_temp
as $$
  select tz.name::text, tz.utc_offset
  from pg_catalog.pg_timezone_names tz
  where tz.name not like 'posix/%'
    and tz.name not like 'right/%'
    and (position('/' in tz.name) > 0 or tz.name = 'UTC')
  order by tz.name;
$$;

create table public.estados_unidade (
  unidade_id uuid primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  estado_jornada text not null default 'disponivel',
  versao bigint not null default 1,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.perfis(id) on delete set null,
  constraint estados_unidade_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint estados_unidade_unidade_propriedade_fkey
    foreign key (unidade_id, propriedade_id)
    references public.unidades(id, propriedade_id)
    on delete cascade,
  constraint estados_unidade_tenant_key
    unique (unidade_id, organizacao_id, propriedade_id),
  constraint estados_unidade_estado_check
    check (estado_jornada in (
      'disponivel', 'reservada', 'preparando', 'pronta_checkin',
      'ocupada', 'aguardando_limpeza', 'em_limpeza'
    )),
  constraint estados_unidade_versao_check check (versao >= 1)
);

create table public.historico_estados_unidade (
  id bigint generated always as identity primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  unidade_id uuid not null,
  estado_anterior text,
  estado_novo text not null,
  versao_anterior bigint,
  versao_nova bigint not null,
  origem text not null,
  chave_idempotencia text,
  correlacao_id uuid not null default gen_random_uuid(),
  criado_por uuid,
  justificativa text,
  criado_em timestamptz not null default now(),
  constraint historico_estados_unidade_tenant_fkey
    foreign key (unidade_id, organizacao_id, propriedade_id)
    references public.estados_unidade(unidade_id, organizacao_id, propriedade_id)
    on delete cascade,
  constraint historico_estados_unidade_estado_anterior_check
    check (estado_anterior is null or estado_anterior in (
      'disponivel', 'reservada', 'preparando', 'pronta_checkin',
      'ocupada', 'aguardando_limpeza', 'em_limpeza'
    )),
  constraint historico_estados_unidade_estado_novo_check
    check (estado_novo in (
      'disponivel', 'reservada', 'preparando', 'pronta_checkin',
      'ocupada', 'aguardando_limpeza', 'em_limpeza'
    )),
  constraint historico_estados_unidade_versoes_check
    check (
      (versao_anterior is null and versao_nova = 1)
      or (versao_anterior is not null and versao_nova = versao_anterior + 1)
    ),
  constraint historico_estados_unidade_origem_check
    check (origem = lower(btrim(origem)) and origem ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint historico_estados_unidade_idempotencia_check
    check (chave_idempotencia is null or length(btrim(chave_idempotencia)) >= 8),
  constraint historico_estados_unidade_justificativa_check
    check (justificativa is null or length(btrim(justificativa)) >= 3)
);

create table public.tarefas_operacionais (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  unidade_id uuid not null,
  tipo text not null,
  status text not null default 'pendente',
  prioridade text not null default 'normal',
  titulo text not null,
  descricao text,
  obrigatoria boolean not null default false,
  responsavel_perfil_id uuid references public.perfis(id) on delete set null,
  agendada_para timestamptz,
  prazo_em timestamptz,
  iniciada_em timestamptz,
  concluida_em timestamptz,
  versao bigint not null default 1,
  criado_por uuid references public.perfis(id) on delete set null,
  concluida_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint tarefas_operacionais_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint tarefas_operacionais_unidade_propriedade_fkey
    foreign key (unidade_id, propriedade_id)
    references public.unidades(id, propriedade_id)
    on delete cascade,
  constraint tarefas_operacionais_tenant_key
    unique (id, organizacao_id, propriedade_id, unidade_id),
  constraint tarefas_operacionais_tipo_check
    check (tipo in ('preparacao', 'limpeza', 'manutencao')),
  constraint tarefas_operacionais_status_check
    check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  constraint tarefas_operacionais_prioridade_check
    check (prioridade in ('baixa', 'normal', 'alta', 'urgente')),
  constraint tarefas_operacionais_titulo_check check (length(btrim(titulo)) >= 2),
  constraint tarefas_operacionais_datas_check check (
    (prazo_em is null or agendada_para is null or prazo_em >= agendada_para)
    and (iniciada_em is null or iniciada_em >= criado_em)
    and (concluida_em is null or iniciada_em is null or concluida_em >= iniciada_em)
  ),
  constraint tarefas_operacionais_versao_check check (versao >= 1)
);

create table public.bloqueios_unidade (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  unidade_id uuid not null,
  tipo text not null,
  motivo text not null,
  impeditivo boolean not null default true,
  situacao text not null default 'ativo',
  inicio_em timestamptz not null default now(),
  fim_em timestamptz,
  conexao_id uuid,
  identificador_externo text,
  criado_por uuid references public.perfis(id) on delete set null,
  encerrado_por uuid references public.perfis(id) on delete set null,
  encerrado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint bloqueios_unidade_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint bloqueios_unidade_unidade_propriedade_fkey
    foreign key (unidade_id, propriedade_id)
    references public.unidades(id, propriedade_id)
    on delete cascade,
  constraint bloqueios_unidade_conexao_organizacao_fkey
    foreign key (conexao_id, organizacao_id)
    references public.conexoes_integracao(id, organizacao_id),
  constraint bloqueios_unidade_tenant_key
    unique (id, organizacao_id, propriedade_id, unidade_id),
  constraint bloqueios_unidade_tipo_check
    check (tipo in ('manutencao', 'manual', 'pms')),
  constraint bloqueios_unidade_situacao_check
    check (situacao in ('ativo', 'encerrado', 'cancelado')),
  constraint bloqueios_unidade_motivo_check check (length(btrim(motivo)) >= 3),
  constraint bloqueios_unidade_intervalo_check check (fim_em is null or fim_em > inicio_em),
  constraint bloqueios_unidade_encerramento_check check (
    (situacao = 'ativo' and encerrado_em is null)
    or (situacao in ('encerrado', 'cancelado') and encerrado_em is not null)
  ),
  constraint bloqueios_unidade_origem_externa_check check (
    tipo <> 'pms'
    or (conexao_id is not null and identificador_externo is not null)
  )
);

create table public.eventos_operacionais (
  id bigint generated always as identity primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  unidade_id uuid not null,
  agregado_tipo text not null,
  agregado_id uuid not null,
  tipo_evento text not null,
  versao_schema integer not null default 1,
  origem text not null,
  chave_idempotencia text,
  correlacao_id uuid not null default gen_random_uuid(),
  payload jsonb not null default '{}'::jsonb,
  ocorrido_em timestamptz not null,
  recebido_em timestamptz not null default now(),
  criado_por uuid,
  justificativa text,
  constraint eventos_operacionais_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint eventos_operacionais_unidade_propriedade_fkey
    foreign key (unidade_id, propriedade_id)
    references public.unidades(id, propriedade_id)
    on delete cascade,
  constraint eventos_operacionais_agregado_tipo_check
    check (agregado_tipo = lower(btrim(agregado_tipo)) and agregado_tipo ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint eventos_operacionais_tipo_evento_check
    check (tipo_evento = lower(btrim(tipo_evento)) and tipo_evento ~ '^[a-z0-9][a-z0-9_.-]*$'),
  constraint eventos_operacionais_origem_check
    check (origem = lower(btrim(origem)) and origem ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint eventos_operacionais_idempotencia_check
    check (chave_idempotencia is null or length(btrim(chave_idempotencia)) >= 8),
  constraint eventos_operacionais_versao_schema_check check (versao_schema >= 1),
  constraint eventos_operacionais_payload_check check (jsonb_typeof(payload) = 'object'),
  constraint eventos_operacionais_justificativa_check
    check (justificativa is null or length(btrim(justificativa)) >= 3)
);

create index estados_unidade_tenant_estado_idx
  on public.estados_unidade (organizacao_id, propriedade_id, estado_jornada);
create index estados_unidade_tenant_listagem_idx
  on public.estados_unidade (organizacao_id, propriedade_id, atualizado_em desc, unidade_id desc);
create index estados_unidade_organizacao_listagem_idx
  on public.estados_unidade (organizacao_id, atualizado_em desc, unidade_id desc);
create index estados_unidade_atualizado_por_idx
  on public.estados_unidade (atualizado_por)
  where atualizado_por is not null;
create index historico_estados_unidade_tenant_unidade_idx
  on public.historico_estados_unidade (organizacao_id, unidade_id, criado_em desc, id desc);
create index tarefas_operacionais_tenant_listagem_idx
  on public.tarefas_operacionais (organizacao_id, atualizado_em desc, id desc);
create index tarefas_operacionais_tenant_tipo_listagem_idx
  on public.tarefas_operacionais (
    organizacao_id, tipo, atualizado_em desc, id desc
  );
create index tarefas_operacionais_propriedade_status_listagem_idx
  on public.tarefas_operacionais (
    organizacao_id, propriedade_id, status, atualizado_em desc, id desc
  );
create index tarefas_operacionais_unidade_status_listagem_idx
  on public.tarefas_operacionais (
    unidade_id, propriedade_id, status, atualizado_em desc, id desc
  );
create index tarefas_operacionais_responsavel_status_idx
  on public.tarefas_operacionais (responsavel_perfil_id, status, prazo_em)
  where responsavel_perfil_id is not null;
create index tarefas_operacionais_criado_por_idx
  on public.tarefas_operacionais (criado_por)
  where criado_por is not null;
create index tarefas_operacionais_concluida_por_idx
  on public.tarefas_operacionais (concluida_por)
  where concluida_por is not null;
create index bloqueios_unidade_tenant_listagem_idx
  on public.bloqueios_unidade (organizacao_id, criado_em desc, id desc);
create index bloqueios_unidade_tenant_situacao_listagem_idx
  on public.bloqueios_unidade (
    organizacao_id, situacao, criado_em desc, id desc
  );
create index bloqueios_unidade_propriedade_situacao_listagem_idx
  on public.bloqueios_unidade (
    organizacao_id, propriedade_id, situacao, criado_em desc, id desc
  );
create index bloqueios_unidade_unidade_situacao_listagem_idx
  on public.bloqueios_unidade (
    unidade_id, propriedade_id, situacao, criado_em desc, id desc
  );
create index bloqueios_unidade_conexao_tenant_idx
  on public.bloqueios_unidade (conexao_id, organizacao_id)
  where conexao_id is not null;
create index bloqueios_unidade_criado_por_idx
  on public.bloqueios_unidade (criado_por)
  where criado_por is not null;
create index bloqueios_unidade_encerrado_por_idx
  on public.bloqueios_unidade (encerrado_por)
  where encerrado_por is not null;
create index bloqueios_unidade_impeditivos_idx
  on public.bloqueios_unidade (
    organizacao_id,
    propriedade_id,
    unidade_id,
    (case when tipo = 'manutencao' then 0 else 1 end),
    criado_em desc,
    inicio_em,
    fim_em
  )
  where impeditivo = true and situacao = 'ativo';
create index eventos_operacionais_tenant_ocorrido_idx
  on public.eventos_operacionais (organizacao_id, propriedade_id, ocorrido_em desc, id desc);
create index eventos_operacionais_unidade_propriedade_idx
  on public.eventos_operacionais (unidade_id, propriedade_id);
create index eventos_operacionais_agregado_idx
  on public.eventos_operacionais (organizacao_id, agregado_tipo, agregado_id, ocorrido_em desc, id desc);
create unique index eventos_operacionais_idempotencia_uidx
  on public.eventos_operacionais (organizacao_id, origem, chave_idempotencia)
  where chave_idempotencia is not null;

create trigger estados_unidade_atualizar_atualizado_em
before update on public.estados_unidade
for each row execute function public.atualizar_atualizado_em();
create trigger tarefas_operacionais_atualizar_atualizado_em
before update on public.tarefas_operacionais
for each row execute function public.atualizar_atualizado_em();
create trigger bloqueios_unidade_atualizar_atualizado_em
before update on public.bloqueios_unidade
for each row execute function public.atualizar_atualizado_em();

do $$
declare
  v_status_invalidos text;
begin
  select string_agg(
    distinct coalesce(status_operacional, '<NULL>'),
    ', '
  )
  into v_status_invalidos
  from public.unidades
  where status_operacional is null
     or status_operacional not in (
       'disponivel',
       'ocupada',
       'em_limpeza',
       'manutencao'
     );

  if v_status_invalidos is not null then
    raise exception
      'Foram encontrados status operacionais legados nao reconhecidos: %.',
      v_status_invalidos
      using errcode = '23514';
  end if;
end;
$$;

do $$
declare
  v_unidades_ocupadas bigint;
begin
  select count(*)
  into v_unidades_ocupadas
  from public.unidades
  where status_operacional = 'ocupada';

  if v_unidades_ocupadas > 0 then
    raise notice
      'Migration 019 encontrou % unidade(s) legada(s) ocupada(s). Use exclusivamente resolver_ocupacao_legada_unidade para reconciliar cada estado com justificativa e auditoria.',
      v_unidades_ocupadas;
  end if;
end;
$$;

insert into public.estados_unidade (
  unidade_id,
  organizacao_id,
  propriedade_id,
  estado_jornada,
  versao,
  atualizado_por
)
select
  u.id,
  p.organizacao_id,
  u.propriedade_id,
  case u.status_operacional
    when 'disponivel' then 'disponivel'
    when 'ocupada' then 'ocupada'
    when 'em_limpeza' then 'em_limpeza'
    when 'manutencao' then 'disponivel'
  end,
  1,
  null
from public.unidades u
join public.propriedades p on p.id = u.propriedade_id;

insert into public.historico_estados_unidade (
  organizacao_id,
  propriedade_id,
  unidade_id,
  estado_anterior,
  estado_novo,
  versao_anterior,
  versao_nova,
  origem,
  chave_idempotencia,
  correlacao_id,
  justificativa
)
select
  e.organizacao_id,
  e.propriedade_id,
  e.unidade_id,
  null,
  e.estado_jornada,
  null,
  1,
  'migracao',
  'migracao-019-estado-' || e.unidade_id::text,
  gen_random_uuid(),
  'Inicializacao do nucleo operacional pela migration 019.'
from public.estados_unidade e;

insert into public.eventos_operacionais (
  organizacao_id,
  propriedade_id,
  unidade_id,
  agregado_tipo,
  agregado_id,
  tipo_evento,
  origem,
  chave_idempotencia,
  correlacao_id,
  payload,
  ocorrido_em,
  justificativa
)
select
  e.organizacao_id,
  e.propriedade_id,
  e.unidade_id,
  'estado_unidade',
  e.unidade_id,
  'estado_unidade.inicializado',
  'migracao',
  'migracao-019-estado-' || e.unidade_id::text,
  h.correlacao_id,
  jsonb_build_object('estado_novo', e.estado_jornada, 'versao_nova', e.versao),
  e.atualizado_em,
  'Inicializacao do nucleo operacional pela migration 019.'
from public.estados_unidade e
join public.historico_estados_unidade h
  on h.unidade_id = e.unidade_id
 and h.origem = 'migracao'
 and h.versao_nova = 1;

insert into public.bloqueios_unidade (
  organizacao_id,
  propriedade_id,
  unidade_id,
  tipo,
  motivo,
  impeditivo,
  situacao,
  inicio_em
)
select
  p.organizacao_id,
  u.propriedade_id,
  u.id,
  'manutencao',
  'Manutencao migrada do status operacional legado.',
  true,
  'ativo',
  u.atualizado_em
from public.unidades u
join public.propriedades p on p.id = u.propriedade_id
where u.status_operacional = 'manutencao';

insert into public.eventos_operacionais (
  organizacao_id,
  propriedade_id,
  unidade_id,
  agregado_tipo,
  agregado_id,
  tipo_evento,
  origem,
  chave_idempotencia,
  correlacao_id,
  payload,
  ocorrido_em,
  justificativa
)
select
  b.organizacao_id,
  b.propriedade_id,
  b.unidade_id,
  'bloqueio_unidade',
  b.id,
  'bloqueio_unidade.criado',
  'migracao',
  'migracao-019-bloqueio-' || b.id::text,
  gen_random_uuid(),
  jsonb_build_object('tipo', b.tipo, 'impeditivo', b.impeditivo, 'situacao', b.situacao),
  b.criado_em,
  'Conversao do status legado manutencao em restricao independente.'
from public.bloqueios_unidade b;

alter table public.unidades
  drop constraint if exists unidades_status_operacional_check;

update public.unidades
set status_operacional = 'disponivel'
where status_operacional = 'manutencao';

alter table public.unidades
  add constraint unidades_status_operacional_check
    check (status_operacional in (
      'disponivel', 'reservada', 'preparando', 'pronta_checkin',
      'ocupada', 'aguardando_limpeza', 'em_limpeza'
    ));

create or replace function public.impedir_mutacao_registro_operacional_imutavel()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Registros de historico e eventos operacionais sao imutaveis.'
    using errcode = '55000';
end;
$$;

revoke all on function public.impedir_mutacao_registro_operacional_imutavel() from public, anon, authenticated;

create trigger historico_estados_unidade_impedir_mutacao
before update or delete on public.historico_estados_unidade
for each row execute function public.impedir_mutacao_registro_operacional_imutavel();
create trigger eventos_operacionais_impedir_mutacao
before update or delete on public.eventos_operacionais
for each row execute function public.impedir_mutacao_registro_operacional_imutavel();

create or replace function public.proteger_status_operacional_legado()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.status_operacional <> 'disponivel' then
    raise exception 'Novas unidades devem iniciar com estado operacional disponivel.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and new.status_operacional is distinct from old.status_operacional
     and coalesce(current_setting('app.transicao_estado_unidade', true), '') <> 'permitida' then
    raise exception 'O status operacional deve ser alterado pelas RPCs do nucleo operacional.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.proteger_status_operacional_legado() from public, anon, authenticated;

create trigger unidades_proteger_status_operacional_legado
before update of status_operacional on public.unidades
for each row execute function public.proteger_status_operacional_legado();
create trigger unidades_proteger_status_operacional_inicial
before insert on public.unidades
for each row execute function public.proteger_status_operacional_legado();

create or replace function public.inicializar_estado_operacional_unidade()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_organizacao_id uuid;
  v_correlacao_id uuid := gen_random_uuid();
  v_origem text := case when auth.uid() is null then 'sistema' else 'usuario' end;
  v_chave text := 'unidade-inicializada-' || new.id::text;
begin
  select p.organizacao_id
  into v_organizacao_id
  from public.propriedades p
  where p.id = new.propriedade_id;

  insert into public.estados_unidade (
    unidade_id, organizacao_id, propriedade_id, estado_jornada, versao, atualizado_por
  ) values (
    new.id, v_organizacao_id, new.propriedade_id, new.status_operacional, 1, auth.uid()
  );

  insert into public.historico_estados_unidade (
    organizacao_id, propriedade_id, unidade_id, estado_anterior, estado_novo,
    versao_anterior, versao_nova, origem, chave_idempotencia, correlacao_id,
    criado_por, justificativa
  ) values (
    v_organizacao_id, new.propriedade_id, new.id, null, new.status_operacional,
    null, 1, v_origem, v_chave, v_correlacao_id,
    auth.uid(), 'Inicializacao do estado operacional da unidade.'
  );

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_organizacao_id, new.propriedade_id, new.id, 'estado_unidade', new.id,
    'estado_unidade.inicializado', v_origem, v_chave, v_correlacao_id,
    jsonb_build_object('estado_novo', new.status_operacional, 'versao_nova', 1),
    now(), auth.uid(), 'Inicializacao do estado operacional da unidade.'
  );

  return new;
end;
$$;

revoke all on function public.inicializar_estado_operacional_unidade() from public, anon, authenticated;

create trigger unidades_inicializar_estado_operacional
after insert on public.unidades
for each row execute function public.inicializar_estado_operacional_unidade();

create view public.estados_unidade_consolidados
with (security_invoker = true)
as
select
  e.unidade_id,
  e.organizacao_id,
  e.propriedade_id,
  e.estado_jornada,
  case
    when restricao.tipo = 'manutencao' then 'manutencao'
    when restricao.id is not null then 'bloqueada'
    else e.estado_jornada
  end as estado_consolidado,
  restricao.id as bloqueio_impeditivo_id,
  restricao.tipo as tipo_restricao,
  e.versao,
  e.atualizado_em,
  e.atualizado_por
from public.estados_unidade e
left join lateral (
  select b.id, b.tipo
  from public.bloqueios_unidade b
  where b.organizacao_id = e.organizacao_id
    and b.propriedade_id = e.propriedade_id
    and b.unidade_id = e.unidade_id
    and b.impeditivo = true
    and b.situacao = 'ativo'
    and b.inicio_em <= now()
    and (b.fim_em is null or b.fim_em > now())
  order by case when b.tipo = 'manutencao' then 0 else 1 end, b.criado_em desc
  limit 1
) restricao on true;

comment on view public.estados_unidade_consolidados is
'Projecao unica: manutencao impeditiva, depois bloqueio impeditivo, depois estado da jornada.';

create or replace function public.listar_estados_unidade_operacionais(
  p_organizacao_id uuid,
  p_propriedade_id uuid default null,
  p_estado_consolidado text default null,
  p_cursor_atualizado_em timestamptz default null,
  p_cursor_unidade_id uuid default null,
  p_limite integer default 50
)
returns table (
  unidade_id uuid,
  organizacao_id uuid,
  propriedade_id uuid,
  estado_jornada text,
  estado_consolidado text,
  bloqueio_impeditivo_id uuid,
  tipo_restricao text,
  versao bigint,
  atualizado_em timestamptz,
  atualizado_por uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_estado_consolidado text := nullif(lower(btrim(p_estado_consolidado)), '');
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado obrigatorio.' using errcode = '42501';
  end if;

  if p_limite is null or p_limite < 1 or p_limite > 200 then
    raise exception 'O limite deve estar entre 1 e 200.' using errcode = '22023';
  end if;

  if (p_cursor_atualizado_em is null) <> (p_cursor_unidade_id is null) then
    raise exception 'Os dois campos do cursor devem ser informados em conjunto.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organizacoes o
    where o.id = p_organizacao_id
  ) then
    raise exception 'Organizacao nao encontrada.' using errcode = 'P0002';
  end if;

  if not public.eh_administrador_plataforma()
     and not public.usuario_eh_membro(p_organizacao_id) then
    raise exception 'Usuario sem acesso a esta organizacao.' using errcode = '42501';
  end if;

  if p_propriedade_id is not null and not exists (
    select 1
    from public.propriedades p
    where p.id = p_propriedade_id
      and p.organizacao_id = p_organizacao_id
  ) then
    raise exception 'Propriedade nao pertence a organizacao informada.'
      using errcode = '23503';
  end if;

  if v_estado_consolidado is not null
     and v_estado_consolidado not in (
       'disponivel',
       'reservada',
       'preparando',
       'pronta_checkin',
       'ocupada',
       'aguardando_limpeza',
       'em_limpeza',
       'bloqueada',
       'manutencao'
     ) then
    raise exception 'Estado consolidado invalido: %.', v_estado_consolidado
      using errcode = '22023';
  end if;

  return query
  select
    c.unidade_id,
    c.organizacao_id,
    c.propriedade_id,
    c.estado_jornada,
    c.estado_consolidado,
    c.bloqueio_impeditivo_id,
    c.tipo_restricao,
    c.versao,
    c.atualizado_em,
    c.atualizado_por
  from public.estados_unidade_consolidados c
  where c.organizacao_id = p_organizacao_id
    and (p_propriedade_id is null or c.propriedade_id = p_propriedade_id)
    and (v_estado_consolidado is null or c.estado_consolidado = v_estado_consolidado)
    and (
      p_cursor_atualizado_em is null
      or c.atualizado_em < p_cursor_atualizado_em
      or (
        c.atualizado_em = p_cursor_atualizado_em
        and c.unidade_id < p_cursor_unidade_id
      )
    )
  order by c.atualizado_em desc, c.unidade_id desc
  limit p_limite;
end;
$$;

create or replace function private.gerar_impressao_comando(p_comando jsonb)
returns text
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_schema_extensao name;
  v_hash text;
begin
  select n.nspname
  into v_schema_extensao
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_schema_extensao is null then
    raise exception 'A extensao pgcrypto nao esta disponivel.' using errcode = '0A000';
  end if;

  execute pg_catalog.format(
    'select pg_catalog.encode(%I.digest($1::text, ''sha256''), ''hex'')',
    v_schema_extensao
  )
  into v_hash
  using p_comando;

  return v_hash;
end;
$$;

revoke all on function private.gerar_impressao_comando(jsonb) from public, anon, authenticated;

create or replace function private.bloquear_contexto_operacional_unidade(
  p_unidade_id uuid,
  p_atualizar_unidade boolean
)
returns table (organizacao_id uuid, propriedade_id uuid)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_unidade_id uuid;
begin
  select p.organizacao_id, u.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from public.unidades u
  join public.propriedades p on p.id = u.propriedade_id
  where u.id = p_unidade_id;

  if not found then
    raise exception 'Unidade nao encontrada.' using errcode = 'P0002';
  end if;

  perform 1
  from public.organizacoes o
  where o.id = v_organizacao_id
  for key share;

  if not found then
    raise exception 'Organizacao da unidade nao encontrada.' using errcode = 'P0002';
  end if;

  perform 1
  from public.propriedades p
  where p.id = v_propriedade_id
    and p.organizacao_id = v_organizacao_id
  for key share;

  if not found then
    raise exception 'Propriedade da unidade nao encontrada.' using errcode = 'P0002';
  end if;

  if p_atualizar_unidade then
    select u.id
    into v_unidade_id
    from public.unidades u
    where u.id = p_unidade_id
      and u.propriedade_id = v_propriedade_id
    for update;
  else
    select u.id
    into v_unidade_id
    from public.unidades u
    where u.id = p_unidade_id
      and u.propriedade_id = v_propriedade_id
    for key share;
  end if;

  if v_unidade_id is null then
    raise exception 'A unidade foi alterada durante a operacao. Tente novamente.'
      using errcode = '40001';
  end if;

  return query select v_organizacao_id, v_propriedade_id;
end;
$$;

revoke all on function private.bloquear_contexto_operacional_unidade(uuid, boolean)
  from public, anon, authenticated;

create or replace function private.validar_autorizacao_operacional(
  p_organizacao_id uuid,
  p_justificativa text
)
returns text
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado obrigatorio.' using errcode = '42501';
  end if;

  if public.eh_administrador_plataforma() then
    if nullif(btrim(p_justificativa), '') is null then
      raise exception 'Acoes de suporte exigem justificativa.' using errcode = '22023';
    end if;
    return 'suporte';
  end if;

  if not public.usuario_pode_gerenciar(p_organizacao_id) then
    raise exception 'Usuario sem permissao operacional para esta organizacao.' using errcode = '42501';
  end if;

  return 'usuario';
end;
$$;

revoke all on function private.validar_autorizacao_operacional(uuid, text) from public, anon, authenticated;

create or replace function private.aplicar_transicao_estado_unidade(
  p_unidade_id uuid,
  p_estado_destino text,
  p_versao_esperada bigint,
  p_origem text,
  p_chave_idempotencia text,
  p_correlacao_id uuid,
  p_justificativa text,
  p_tipo_evento text
)
returns public.estados_unidade
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado public.estados_unidade%rowtype;
  v_versao_nova bigint;
begin
  if p_tipo_evento not in (
    'estado_unidade.alterado',
    'estado_unidade.ocupacao_legada_resolvida'
  ) then
    raise exception 'Tipo de evento de transicao invalido.' using errcode = '22023';
  end if;

  select *
  into v_estado
  from public.estados_unidade
  where unidade_id = p_unidade_id
  for update;

  if not found then
    raise exception 'Estado operacional da unidade nao encontrado.' using errcode = 'P0002';
  end if;

  if v_estado.versao <> p_versao_esperada then
    raise exception 'Conflito de versao: esperado %, atual %.', p_versao_esperada, v_estado.versao
      using errcode = '40001';
  end if;

  if v_estado.estado_jornada = p_estado_destino then
    raise exception 'A unidade ja esta no estado solicitado.' using errcode = '22023';
  end if;

  v_versao_nova := v_estado.versao + 1;

  perform set_config('app.transicao_estado_unidade', 'permitida', true);

  update public.estados_unidade
  set estado_jornada = p_estado_destino,
      versao = v_versao_nova,
      atualizado_por = auth.uid()
  where unidade_id = p_unidade_id;

  update public.unidades
  set status_operacional = p_estado_destino
  where id = p_unidade_id;

  insert into public.historico_estados_unidade (
    organizacao_id, propriedade_id, unidade_id, estado_anterior, estado_novo,
    versao_anterior, versao_nova, origem, chave_idempotencia, correlacao_id,
    criado_por, justificativa
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    v_estado.estado_jornada, p_estado_destino, v_estado.versao, v_versao_nova,
    p_origem, p_chave_idempotencia, p_correlacao_id, auth.uid(), nullif(btrim(p_justificativa), '')
  );

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    'estado_unidade', v_estado.unidade_id, p_tipo_evento,
    p_origem, p_chave_idempotencia, p_correlacao_id,
    jsonb_build_object(
      'estado_anterior', v_estado.estado_jornada,
      'estado_novo', p_estado_destino,
      'versao_anterior', v_estado.versao,
      'versao_nova', v_versao_nova
    ),
    now(), auth.uid(), nullif(btrim(p_justificativa), '')
  );

  return (
    select e
    from public.estados_unidade e
    where e.unidade_id = p_unidade_id
  );
end;
$$;

revoke all on function private.aplicar_transicao_estado_unidade(uuid, text, bigint, text, text, uuid, text, text) from public, anon, authenticated;

create or replace function public.transicionar_estado_unidade(
  p_unidade_id uuid,
  p_estado_destino text,
  p_versao_esperada bigint,
  p_chave_idempotencia text,
  p_correlacao_id uuid default null,
  p_justificativa text default null
)
returns table (
  unidade_id uuid,
  estado_jornada text,
  estado_consolidado text,
  versao bigint,
  atualizado_em timestamptz
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado public.estados_unidade%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_estado_destino text := lower(btrim(p_estado_destino));
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_origem text;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento_existente public.eventos_operacionais%rowtype;
  v_exige_justificativa boolean;
begin
  if p_versao_esperada is null or p_versao_esperada < 1 then
    raise exception 'Versao esperada obrigatoria.' using errcode = '22023';
  end if;

  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(p_unidade_id, true) contexto;

  select e.*
  into v_estado
  from public.estados_unidade e
  where e.unidade_id = p_unidade_id
    and e.organizacao_id = v_organizacao_id
    and e.propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'Estado operacional da unidade nao encontrado.' using errcode = 'P0002';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_estado.organizacao_id, p_justificativa);

  select eo.*
  into v_evento_existente
  from public.eventos_operacionais eo
  where eo.organizacao_id = v_estado.organizacao_id
    and eo.origem = v_origem
    and eo.chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento_existente.tipo_evento <> 'estado_unidade.alterado'
       or v_evento_existente.agregado_tipo <> 'estado_unidade'
       or v_evento_existente.agregado_id <> p_unidade_id
       or v_evento_existente.payload ->> 'estado_novo' is distinct from v_estado_destino then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;

    return query
    select c.unidade_id, c.estado_jornada, c.estado_consolidado, c.versao, c.atualizado_em
    from public.estados_unidade_consolidados c
    where c.unidade_id = p_unidade_id;
    return;
  end if;

  if v_estado_destino is null or v_estado_destino not in (
    'disponivel', 'reservada', 'preparando', 'pronta_checkin',
    'ocupada', 'aguardando_limpeza', 'em_limpeza'
  ) then
    raise exception 'Estado de destino invalido.' using errcode = '22023';
  end if;

  if v_estado_destino in ('ocupada', 'aguardando_limpeza')
     or v_estado.estado_jornada = 'ocupada' then
    raise exception 'Ocupacao e saida serao controladas por RPCs especificas no Sprint 4B.'
      using errcode = '0A000';
  end if;

  if not (
    (v_estado.estado_jornada = 'disponivel' and v_estado_destino in ('reservada', 'preparando'))
    or (v_estado.estado_jornada = 'reservada' and v_estado_destino in ('disponivel', 'preparando', 'pronta_checkin'))
    or (v_estado.estado_jornada = 'preparando' and v_estado_destino in ('disponivel', 'reservada', 'pronta_checkin'))
    or (v_estado.estado_jornada = 'pronta_checkin' and v_estado_destino in ('disponivel', 'preparando'))
    or (v_estado.estado_jornada = 'aguardando_limpeza' and v_estado_destino = 'em_limpeza')
    or (v_estado.estado_jornada = 'em_limpeza' and v_estado_destino in ('disponivel', 'pronta_checkin'))
  ) then
    raise exception 'Transicao operacional nao permitida: % -> %.', v_estado.estado_jornada, v_estado_destino
      using errcode = '22023';
  end if;

  v_exige_justificativa :=
    (v_estado.estado_jornada = 'reservada' and v_estado_destino = 'disponivel')
    or (v_estado.estado_jornada = 'preparando' and v_estado_destino in ('disponivel', 'reservada'))
    or (v_estado.estado_jornada = 'pronta_checkin' and v_estado_destino in ('disponivel', 'preparando'));

  if v_exige_justificativa and nullif(btrim(p_justificativa), '') is null then
    raise exception 'Esta transicao de excecao exige justificativa.' using errcode = '22023';
  end if;

  perform private.aplicar_transicao_estado_unidade(
    p_unidade_id,
    v_estado_destino,
    p_versao_esperada,
    v_origem,
    v_chave_idempotencia,
    v_correlacao_id,
    p_justificativa,
    'estado_unidade.alterado'
  );

  return query
  select c.unidade_id, c.estado_jornada, c.estado_consolidado, c.versao, c.atualizado_em
  from public.estados_unidade_consolidados c
  where c.unidade_id = p_unidade_id;
end;
$$;

create or replace function public.resolver_ocupacao_legada_unidade(
  p_unidade_id uuid,
  p_estado_destino text,
  p_versao_esperada bigint,
  p_chave_idempotencia text,
  p_justificativa text,
  p_correlacao_id uuid default null
)
returns table (
  unidade_id uuid,
  estado_jornada text,
  estado_consolidado text,
  versao bigint,
  atualizado_em timestamptz
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado public.estados_unidade%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_estado_destino text := lower(btrim(p_estado_destino));
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_origem text;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento public.eventos_operacionais%rowtype;
  v_justificativa text := nullif(btrim(p_justificativa), '');
begin
  if p_versao_esperada is null or p_versao_esperada < 1 then
    raise exception 'Versao esperada obrigatoria.' using errcode = '22023';
  end if;

  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  if v_justificativa is null or length(v_justificativa) < 3 then
    raise exception 'A reconciliacao de ocupacao legada exige justificativa.' using errcode = '22023';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(p_unidade_id, true) contexto;

  select e.*
  into v_estado
  from public.estados_unidade e
  where e.unidade_id = p_unidade_id
    and e.organizacao_id = v_organizacao_id
    and e.propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'Estado operacional da unidade nao encontrado.' using errcode = 'P0002';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_estado.organizacao_id, v_justificativa);

  if v_origem = 'usuario' then
    if not exists (
      select 1
      from public.membros_organizacao mo
      where mo.organizacao_id = v_estado.organizacao_id
        and mo.perfil_id = auth.uid()
        and mo.ativo = true
        and mo.papel in ('proprietario', 'administrador')
    ) then
      raise exception 'A reconciliacao de ocupacao legada exige proprietario, administrador ou suporte global.'
        using errcode = '42501';
    end if;

    v_origem := 'migracao_assistida';
  end if;

  select eo.*
  into v_evento
  from public.eventos_operacionais eo
  where eo.organizacao_id = v_estado.organizacao_id
    and eo.origem = v_origem
    and eo.chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento.tipo_evento <> 'estado_unidade.ocupacao_legada_resolvida'
       or v_evento.agregado_tipo <> 'estado_unidade'
       or v_evento.agregado_id <> p_unidade_id
       or v_evento.unidade_id <> p_unidade_id
       or v_evento.payload ->> 'estado_novo' is distinct from v_estado_destino then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;

    return query
    select c.unidade_id, c.estado_jornada, c.estado_consolidado, c.versao, c.atualizado_em
    from public.estados_unidade_consolidados c
    where c.unidade_id = p_unidade_id;
    return;
  end if;

  if v_estado.estado_jornada <> 'ocupada' then
    raise exception 'A unidade nao possui ocupacao legada pendente de reconciliacao.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.historico_estados_unidade h
    where h.unidade_id = p_unidade_id
      and h.estado_anterior is null
      and h.estado_novo = 'ocupada'
      and h.versao_nova = 1
      and h.origem = 'migracao'
      and h.chave_idempotencia = 'migracao-019-estado-' || p_unidade_id::text
  ) then
    raise exception 'Somente ocupacoes originadas pelo backfill da migration 019 podem usar esta RPC.'
      using errcode = '42501';
  end if;

  if v_estado_destino is null
     or v_estado_destino not in ('aguardando_limpeza', 'disponivel') then
    raise exception 'Destino invalido para ocupacao legada. Use aguardando_limpeza ou disponivel.'
      using errcode = '22023';
  end if;

  perform private.aplicar_transicao_estado_unidade(
    p_unidade_id,
    v_estado_destino,
    p_versao_esperada,
    v_origem,
    v_chave_idempotencia,
    v_correlacao_id,
    v_justificativa,
    'estado_unidade.ocupacao_legada_resolvida'
  );

  return query
  select c.unidade_id, c.estado_jornada, c.estado_consolidado, c.versao, c.atualizado_em
  from public.estados_unidade_consolidados c
  where c.unidade_id = p_unidade_id;
end;
$$;

create or replace function public.criar_tarefa_operacional(
  p_unidade_id uuid,
  p_tipo text,
  p_titulo text,
  p_descricao text,
  p_prioridade text,
  p_obrigatoria boolean,
  p_responsavel_perfil_id uuid,
  p_agendada_para timestamptz,
  p_prazo_em timestamptz,
  p_chave_idempotencia text,
  p_correlacao_id uuid default null,
  p_justificativa text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado public.estados_unidade%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_origem text;
  v_id uuid;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento public.eventos_operacionais%rowtype;
  v_tipo text := lower(btrim(p_tipo));
  v_titulo text := btrim(p_titulo);
  v_descricao text := nullif(btrim(p_descricao), '');
  v_prioridade text := lower(btrim(p_prioridade));
  v_obrigatoria boolean := coalesce(p_obrigatoria, false);
  v_justificativa text := nullif(btrim(p_justificativa), '');
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_comando jsonb;
  v_comando_hash text;
begin
  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(p_unidade_id, false) contexto;

  select * into v_estado
  from public.estados_unidade
  where unidade_id = p_unidade_id
    and organizacao_id = v_organizacao_id
    and propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'Unidade nao encontrada.' using errcode = 'P0002';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_estado.organizacao_id, v_justificativa);

  v_comando := jsonb_build_object(
    'operacao', 'criar_tarefa_operacional',
    'ator_id', auth.uid(),
    'unidade_id', p_unidade_id,
    'tipo', v_tipo,
    'prioridade', v_prioridade,
    'obrigatoria', v_obrigatoria,
    'responsavel_perfil_id', p_responsavel_perfil_id,
    'agendada_para_epoch', extract(epoch from p_agendada_para),
    'prazo_em_epoch', extract(epoch from p_prazo_em)
  );
  v_comando_hash := private.gerar_impressao_comando(v_comando);

  select * into v_evento
  from public.eventos_operacionais
  where organizacao_id = v_estado.organizacao_id
    and origem = v_origem
    and chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento.tipo_evento <> 'tarefa_operacional.criada'
       or v_evento.agregado_tipo <> 'tarefa_operacional'
       or v_evento.unidade_id <> p_unidade_id
       or v_evento.payload ->> 'comando_hash' is distinct from v_comando_hash
       or v_evento.justificativa is distinct from v_justificativa
       or not exists (
         select 1
         from public.tarefas_operacionais t
         where t.id = v_evento.agregado_id
           and t.organizacao_id = v_estado.organizacao_id
           and t.propriedade_id = v_estado.propriedade_id
           and t.unidade_id = p_unidade_id
           and t.tipo = v_tipo
           and t.titulo = v_titulo
           and t.descricao is not distinct from v_descricao
           and t.prioridade = v_prioridade
           and t.obrigatoria = v_obrigatoria
           and t.responsavel_perfil_id is not distinct from p_responsavel_perfil_id
           and t.agendada_para is not distinct from p_agendada_para
           and t.prazo_em is not distinct from p_prazo_em
       ) then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;
    return v_evento.agregado_id;
  end if;

  if p_responsavel_perfil_id is not null and not exists (
    select 1
    from public.membros_organizacao mo
    where mo.organizacao_id = v_estado.organizacao_id
      and mo.perfil_id = p_responsavel_perfil_id
      and mo.ativo = true
  ) then
    raise exception 'Responsavel nao pertence a organizacao da tarefa.' using errcode = '23503';
  end if;

  insert into public.tarefas_operacionais (
    organizacao_id, propriedade_id, unidade_id, tipo, titulo, descricao,
    prioridade, obrigatoria, responsavel_perfil_id, agendada_para, prazo_em,
    criado_por
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    v_tipo, v_titulo, v_descricao, v_prioridade,
    v_obrigatoria, p_responsavel_perfil_id, p_agendada_para,
    p_prazo_em, auth.uid()
  ) returning id into v_id;

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    'tarefa_operacional', v_id, 'tarefa_operacional.criada', v_origem,
    v_chave_idempotencia, v_correlacao_id,
    jsonb_build_object(
      'comando_hash', v_comando_hash,
      'tipo', v_tipo,
      'prioridade', v_prioridade,
      'obrigatoria', v_obrigatoria,
      'responsavel_perfil_id', p_responsavel_perfil_id,
      'agendada_para', p_agendada_para,
      'prazo_em', p_prazo_em,
      'status', 'pendente'
    ),
    now(), auth.uid(), v_justificativa
  );

  return v_id;
end;
$$;

create or replace function public.alterar_status_tarefa_operacional(
  p_tarefa_id uuid,
  p_status_destino text,
  p_versao_esperada bigint,
  p_chave_idempotencia text,
  p_correlacao_id uuid default null,
  p_justificativa text default null
)
returns public.tarefas_operacionais
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_tarefa public.tarefas_operacionais%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_status_destino text := lower(btrim(p_status_destino));
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_origem text;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento public.eventos_operacionais%rowtype;
begin
  if p_versao_esperada is null or p_versao_esperada < 1 then
    raise exception 'Versao esperada obrigatoria.' using errcode = '22023';
  end if;

  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  if v_status_destino is null
     or v_status_destino not in ('em_andamento', 'concluida', 'cancelada') then
    raise exception 'Status de destino da tarefa invalido: %.', v_status_destino
      using errcode = '22023';
  end if;

  select * into v_tarefa
  from public.tarefas_operacionais
  where id = p_tarefa_id;

  if not found then
    raise exception 'Tarefa operacional nao encontrada.' using errcode = 'P0002';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(v_tarefa.unidade_id, false) contexto;

  if v_tarefa.organizacao_id <> v_organizacao_id
     or v_tarefa.propriedade_id <> v_propriedade_id then
    raise exception 'Contexto multi-tenant da tarefa operacional invalido.' using errcode = '23503';
  end if;

  select * into v_tarefa
  from public.tarefas_operacionais
  where id = p_tarefa_id
    and organizacao_id = v_organizacao_id
    and propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'A tarefa foi alterada durante a operacao. Tente novamente.' using errcode = '40001';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_tarefa.organizacao_id, p_justificativa);

  select * into v_evento
  from public.eventos_operacionais
  where organizacao_id = v_tarefa.organizacao_id
    and origem = v_origem
    and chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento.tipo_evento <> 'tarefa_operacional.status_alterado'
       or v_evento.agregado_tipo <> 'tarefa_operacional'
       or v_evento.agregado_id <> p_tarefa_id
       or v_evento.payload ->> 'status_novo' is distinct from v_status_destino then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;
    return (select t from public.tarefas_operacionais t where t.id = p_tarefa_id);
  end if;

  if v_tarefa.versao <> p_versao_esperada then
    raise exception 'Conflito de versao: esperado %, atual %.', p_versao_esperada, v_tarefa.versao
      using errcode = '40001';
  end if;

  if not (
    (v_tarefa.status = 'pendente' and v_status_destino in ('em_andamento', 'cancelada'))
    or (v_tarefa.status = 'em_andamento' and v_status_destino in ('concluida', 'cancelada'))
  ) then
    raise exception 'Transicao de tarefa nao permitida: % -> %.', v_tarefa.status, v_status_destino
      using errcode = '22023';
  end if;

  if v_status_destino = 'cancelada' and nullif(btrim(p_justificativa), '') is null then
    raise exception 'Cancelamento de tarefa exige justificativa.' using errcode = '22023';
  end if;

  update public.tarefas_operacionais
  set status = v_status_destino,
      versao = versao + 1,
      iniciada_em = case when v_status_destino = 'em_andamento' then now() else iniciada_em end,
      concluida_em = case when v_status_destino = 'concluida' then now() else concluida_em end,
      concluida_por = case when v_status_destino = 'concluida' then auth.uid() else concluida_por end
  where id = p_tarefa_id;

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_tarefa.organizacao_id, v_tarefa.propriedade_id, v_tarefa.unidade_id,
    'tarefa_operacional', v_tarefa.id, 'tarefa_operacional.status_alterado',
    v_origem, v_chave_idempotencia, v_correlacao_id,
    jsonb_build_object(
      'status_anterior', v_tarefa.status,
      'status_novo', v_status_destino,
      'versao_anterior', v_tarefa.versao,
      'versao_nova', v_tarefa.versao + 1
    ),
    now(), auth.uid(), nullif(btrim(p_justificativa), '')
  );

  return (select t from public.tarefas_operacionais t where t.id = p_tarefa_id);
end;
$$;

create or replace function public.criar_bloqueio_unidade(
  p_unidade_id uuid,
  p_tipo text,
  p_motivo text,
  p_impeditivo boolean,
  p_inicio_em timestamptz,
  p_fim_em timestamptz,
  p_conexao_id uuid,
  p_identificador_externo text,
  p_chave_idempotencia text,
  p_correlacao_id uuid default null,
  p_justificativa text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_estado public.estados_unidade%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_origem text;
  v_id uuid;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento public.eventos_operacionais%rowtype;
  v_tipo text := lower(btrim(p_tipo));
  v_motivo text := btrim(p_motivo);
  v_impeditivo boolean := coalesce(p_impeditivo, true);
  v_inicio_em timestamptz := coalesce(p_inicio_em, now());
  v_identificador_externo text := nullif(btrim(p_identificador_externo), '');
  v_justificativa text := nullif(btrim(p_justificativa), '');
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_comando jsonb;
  v_comando_hash text;
  v_conexao_propriedade_id uuid;
  v_conexao_propriedade_ativa boolean;
begin
  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(p_unidade_id, false) contexto;

  select * into v_estado
  from public.estados_unidade
  where unidade_id = p_unidade_id
    and organizacao_id = v_organizacao_id
    and propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'Unidade nao encontrada.' using errcode = 'P0002';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_estado.organizacao_id, v_justificativa);

  if v_tipo = 'pms'
     and (p_conexao_id is null or v_identificador_externo is null) then
    raise exception 'Bloqueio PMS exige conexao e identificador externo.' using errcode = '22023';
  end if;

  if p_conexao_id is not null then
    select cip.id, cip.ativo
    into v_conexao_propriedade_id, v_conexao_propriedade_ativa
    from public.conexoes_integracao_propriedades cip
    join public.conexoes_integracao ci
      on ci.id = cip.conexao_id
     and ci.organizacao_id = cip.organizacao_id
    where cip.organizacao_id = v_estado.organizacao_id
      and cip.propriedade_id = v_estado.propriedade_id
      and cip.conexao_id = p_conexao_id
    for share of cip;

    if not found then
      raise exception 'A conexao nao esta associada a esta propriedade e organizacao.' using errcode = '23503';
    end if;
  end if;

  v_comando := jsonb_build_object(
    'operacao', 'criar_bloqueio_unidade',
    'ator_id', auth.uid(),
    'unidade_id', p_unidade_id,
    'tipo', v_tipo,
    'impeditivo', v_impeditivo,
    'inicio_em_informado_epoch', extract(epoch from p_inicio_em),
    'fim_em_epoch', extract(epoch from p_fim_em),
    'conexao_id', p_conexao_id,
    'conexao_propriedade_id', v_conexao_propriedade_id,
    'identificador_externo', v_identificador_externo
  );
  v_comando_hash := private.gerar_impressao_comando(v_comando);

  select * into v_evento
  from public.eventos_operacionais
  where organizacao_id = v_estado.organizacao_id
    and origem = v_origem
    and chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento.tipo_evento <> 'bloqueio_unidade.criado'
       or v_evento.agregado_tipo <> 'bloqueio_unidade'
       or v_evento.unidade_id <> p_unidade_id
       or v_evento.payload ->> 'comando_hash' is distinct from v_comando_hash
       or v_evento.payload ->> 'conexao_propriedade_id'
          is distinct from v_conexao_propriedade_id::text
       or v_evento.justificativa is distinct from v_justificativa
       or not exists (
         select 1
         from public.bloqueios_unidade b
         where b.id = v_evento.agregado_id
           and b.organizacao_id = v_estado.organizacao_id
           and b.propriedade_id = v_estado.propriedade_id
           and b.unidade_id = p_unidade_id
           and b.tipo = v_tipo
           and b.motivo = v_motivo
           and b.impeditivo = v_impeditivo
           and (p_inicio_em is null or b.inicio_em = p_inicio_em)
           and b.fim_em is not distinct from p_fim_em
           and b.conexao_id is not distinct from p_conexao_id
           and b.identificador_externo is not distinct from v_identificador_externo
       ) then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;
    return v_evento.agregado_id;
  end if;

  if p_conexao_id is not null and not coalesce(v_conexao_propriedade_ativa, false) then
    raise exception 'A associacao entre conexao e propriedade esta inativa.' using errcode = '23503';
  end if;

  insert into public.bloqueios_unidade (
    organizacao_id, propriedade_id, unidade_id, tipo, motivo, impeditivo,
    inicio_em, fim_em, conexao_id, identificador_externo, criado_por
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    v_tipo, v_motivo, v_impeditivo,
    v_inicio_em, p_fim_em, p_conexao_id,
    v_identificador_externo, auth.uid()
  ) returning id into v_id;

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_estado.organizacao_id, v_estado.propriedade_id, v_estado.unidade_id,
    'bloqueio_unidade', v_id, 'bloqueio_unidade.criado', v_origem,
    v_chave_idempotencia, v_correlacao_id,
    jsonb_build_object(
      'comando_hash', v_comando_hash,
      'tipo', v_tipo,
      'impeditivo', v_impeditivo,
      'inicio_em', v_inicio_em,
      'fim_em', p_fim_em,
      'conexao_id', p_conexao_id,
      'conexao_propriedade_id', v_conexao_propriedade_id,
      'identificador_externo', v_identificador_externo,
      'situacao', 'ativo'
    ),
    now(), auth.uid(), v_justificativa
  );

  return v_id;
end;
$$;

create or replace function public.encerrar_bloqueio_unidade(
  p_bloqueio_id uuid,
  p_chave_idempotencia text,
  p_correlacao_id uuid default null,
  p_justificativa text default null
)
returns public.bloqueios_unidade
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_bloqueio public.bloqueios_unidade%rowtype;
  v_organizacao_id uuid;
  v_propriedade_id uuid;
  v_origem text;
  v_correlacao_id uuid := coalesce(p_correlacao_id, gen_random_uuid());
  v_evento public.eventos_operacionais%rowtype;
  v_situacao_nova text;
  v_justificativa text := nullif(btrim(p_justificativa), '');
  v_chave_idempotencia text := nullif(btrim(p_chave_idempotencia), '');
  v_comando jsonb;
  v_comando_hash text;
begin
  if v_chave_idempotencia is null
     or length(v_chave_idempotencia) < 8 then
    raise exception 'Chave de idempotencia obrigatoria com ao menos 8 caracteres.' using errcode = '22023';
  end if;

  select * into v_bloqueio
  from public.bloqueios_unidade
  where id = p_bloqueio_id;

  if not found then
    raise exception 'Bloqueio nao encontrado.' using errcode = 'P0002';
  end if;

  select contexto.organizacao_id, contexto.propriedade_id
  into v_organizacao_id, v_propriedade_id
  from private.bloquear_contexto_operacional_unidade(v_bloqueio.unidade_id, false) contexto;

  if v_bloqueio.organizacao_id <> v_organizacao_id
     or v_bloqueio.propriedade_id <> v_propriedade_id then
    raise exception 'Contexto multi-tenant do bloqueio invalido.' using errcode = '23503';
  end if;

  select * into v_bloqueio
  from public.bloqueios_unidade
  where id = p_bloqueio_id
    and organizacao_id = v_organizacao_id
    and propriedade_id = v_propriedade_id
  for update;

  if not found then
    raise exception 'O bloqueio foi alterado durante a operacao. Tente novamente.' using errcode = '40001';
  end if;

  v_origem := private.validar_autorizacao_operacional(v_bloqueio.organizacao_id, v_justificativa);

  v_comando := jsonb_build_object(
    'operacao', 'encerrar_bloqueio_unidade',
    'bloqueio_id', p_bloqueio_id,
    'ator_id', auth.uid()
  );
  v_comando_hash := private.gerar_impressao_comando(v_comando);

  select * into v_evento
  from public.eventos_operacionais
  where organizacao_id = v_bloqueio.organizacao_id
    and origem = v_origem
    and chave_idempotencia = v_chave_idempotencia;

  if found then
    if v_evento.tipo_evento not in (
         'bloqueio_unidade.encerrado',
         'bloqueio_unidade.cancelado'
       )
       or v_evento.agregado_tipo <> 'bloqueio_unidade'
       or v_evento.agregado_id <> p_bloqueio_id
       or v_evento.unidade_id <> v_bloqueio.unidade_id
       or v_evento.payload ->> 'comando_hash' is distinct from v_comando_hash
       or v_evento.justificativa is distinct from v_justificativa
       or coalesce(v_evento.payload ->> 'situacao_nova', '') not in ('encerrado', 'cancelado')
       or v_evento.tipo_evento is distinct from
         'bloqueio_unidade.' || (v_evento.payload ->> 'situacao_nova') then
      raise exception 'Chave de idempotencia ja utilizada por outro comando.' using errcode = '23505';
    end if;
    return (select b from public.bloqueios_unidade b where b.id = p_bloqueio_id);
  end if;

  if v_bloqueio.situacao <> 'ativo' then
    raise exception 'Somente bloqueios ativos podem ser encerrados.' using errcode = '22023';
  end if;

  v_situacao_nova := case when v_bloqueio.inicio_em > now() then 'cancelado' else 'encerrado' end;

  update public.bloqueios_unidade
  set situacao = v_situacao_nova,
      encerrado_em = now(),
      encerrado_por = auth.uid(),
      fim_em = case
        when v_situacao_nova = 'cancelado' then fim_em
        else least(coalesce(fim_em, now()), now())
      end
  where id = p_bloqueio_id;

  insert into public.eventos_operacionais (
    organizacao_id, propriedade_id, unidade_id, agregado_tipo, agregado_id,
    tipo_evento, origem, chave_idempotencia, correlacao_id, payload,
    ocorrido_em, criado_por, justificativa
  ) values (
    v_bloqueio.organizacao_id, v_bloqueio.propriedade_id, v_bloqueio.unidade_id,
    'bloqueio_unidade', v_bloqueio.id,
    case when v_situacao_nova = 'cancelado' then 'bloqueio_unidade.cancelado' else 'bloqueio_unidade.encerrado' end,
    v_origem,
    v_chave_idempotencia, v_correlacao_id,
    jsonb_build_object(
      'comando_hash', v_comando_hash,
      'tipo', v_bloqueio.tipo,
      'situacao_anterior', v_bloqueio.situacao,
      'situacao_nova', v_situacao_nova
    ),
    now(), auth.uid(), v_justificativa
  );

  return (select b from public.bloqueios_unidade b where b.id = p_bloqueio_id);
end;
$$;

create or replace function public.obter_resumo_operacional(
  p_organizacao_id uuid,
  p_propriedade_id uuid default null
)
returns table (
  total_unidades bigint,
  disponiveis bigint,
  reservadas bigint,
  preparando bigint,
  prontas_checkin bigint,
  ocupadas bigint,
  aguardando_limpeza bigint,
  em_limpeza bigint,
  manutencoes_impeditivas bigint,
  bloqueios_impeditivos bigint,
  tarefas_pendentes bigint
)
language plpgsql
stable
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado obrigatorio.' using errcode = '42501';
  end if;

  if not public.eh_administrador_plataforma()
     and not public.usuario_eh_membro(p_organizacao_id) then
    raise exception 'Usuario sem acesso a esta organizacao.' using errcode = '42501';
  end if;

  if p_propriedade_id is not null and not exists (
    select 1 from public.propriedades p
    where p.id = p_propriedade_id and p.organizacao_id = p_organizacao_id
  ) then
    raise exception 'Propriedade nao pertence a organizacao informada.' using errcode = '23503';
  end if;

  return query
  with resumo_estados as (
    select
      count(*) filter (where u.ativo) as total_unidades,
      count(*) filter (where u.ativo and c.estado_consolidado = 'disponivel') as disponiveis,
      count(*) filter (where u.ativo and c.estado_consolidado = 'reservada') as reservadas,
      count(*) filter (where u.ativo and c.estado_consolidado = 'preparando') as preparando,
      count(*) filter (where u.ativo and c.estado_consolidado = 'pronta_checkin') as prontas_checkin,
      count(*) filter (where u.ativo and c.estado_consolidado = 'ocupada') as ocupadas,
      count(*) filter (where u.ativo and c.estado_consolidado = 'aguardando_limpeza') as aguardando_limpeza,
      count(*) filter (where u.ativo and c.estado_consolidado = 'em_limpeza') as em_limpeza,
      count(*) filter (where u.ativo and c.estado_consolidado = 'manutencao') as manutencoes_impeditivas,
      count(*) filter (where u.ativo and c.estado_consolidado = 'bloqueada') as bloqueios_impeditivos
    from public.estados_unidade_consolidados c
    join public.unidades u on u.id = c.unidade_id
    where c.organizacao_id = p_organizacao_id
      and (p_propriedade_id is null or c.propriedade_id = p_propriedade_id)
  ),
  resumo_tarefas as (
    select count(*) as tarefas_pendentes
    from public.tarefas_operacionais t
    where t.organizacao_id = p_organizacao_id
      and (p_propriedade_id is null or t.propriedade_id = p_propriedade_id)
      and t.status in ('pendente', 'em_andamento')
  )
  select
    coalesce(r.total_unidades, 0),
    coalesce(r.disponiveis, 0),
    coalesce(r.reservadas, 0),
    coalesce(r.preparando, 0),
    coalesce(r.prontas_checkin, 0),
    coalesce(r.ocupadas, 0),
    coalesce(r.aguardando_limpeza, 0),
    coalesce(r.em_limpeza, 0),
    coalesce(r.manutencoes_impeditivas, 0),
    coalesce(r.bloqueios_impeditivos, 0),
    coalesce(t.tarefas_pendentes, 0)
  from resumo_estados r
  cross join resumo_tarefas t;
end;
$$;

alter table public.estados_unidade enable row level security;
alter table public.historico_estados_unidade enable row level security;
alter table public.tarefas_operacionais enable row level security;
alter table public.bloqueios_unidade enable row level security;
alter table public.eventos_operacionais enable row level security;

create policy "estados_unidade_select_authorized"
on public.estados_unidade for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

create policy "historico_estados_unidade_select_authorized"
on public.historico_estados_unidade for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

create policy "tarefas_operacionais_select_authorized"
on public.tarefas_operacionais for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

create policy "bloqueios_unidade_select_authorized"
on public.bloqueios_unidade for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

create policy "eventos_operacionais_select_authorized"
on public.eventos_operacionais for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

revoke all on table public.estados_unidade from anon, authenticated;
revoke all on table public.historico_estados_unidade from anon, authenticated;
revoke all on table public.tarefas_operacionais from anon, authenticated;
revoke all on table public.bloqueios_unidade from anon, authenticated;
revoke all on table public.eventos_operacionais from anon, authenticated;
revoke all on table public.estados_unidade_consolidados from anon, authenticated;

grant select on table public.estados_unidade to authenticated;
grant select on table public.historico_estados_unidade to authenticated;
grant select on table public.tarefas_operacionais to authenticated;
grant select on table public.bloqueios_unidade to authenticated;
grant select on table public.eventos_operacionais to authenticated;
grant select on table public.estados_unidade_consolidados to authenticated;

revoke all on function public.listar_fusos_horarios() from public, anon;
revoke all on function public.listar_estados_unidade_operacionais(uuid, uuid, text, timestamptz, uuid, integer) from public, anon;
revoke all on function public.transicionar_estado_unidade(uuid, text, bigint, text, uuid, text) from public, anon;
revoke all on function public.resolver_ocupacao_legada_unidade(uuid, text, bigint, text, text, uuid) from public, anon;
revoke all on function public.criar_tarefa_operacional(uuid, text, text, text, text, boolean, uuid, timestamptz, timestamptz, text, uuid, text) from public, anon;
revoke all on function public.alterar_status_tarefa_operacional(uuid, text, bigint, text, uuid, text) from public, anon;
revoke all on function public.criar_bloqueio_unidade(uuid, text, text, boolean, timestamptz, timestamptz, uuid, text, text, uuid, text) from public, anon;
revoke all on function public.encerrar_bloqueio_unidade(uuid, text, uuid, text) from public, anon;
revoke all on function public.obter_resumo_operacional(uuid, uuid) from public, anon;

grant execute on function public.listar_fusos_horarios() to authenticated;
grant execute on function public.listar_estados_unidade_operacionais(uuid, uuid, text, timestamptz, uuid, integer) to authenticated;
grant execute on function public.transicionar_estado_unidade(uuid, text, bigint, text, uuid, text) to authenticated;
grant execute on function public.resolver_ocupacao_legada_unidade(uuid, text, bigint, text, text, uuid) to authenticated;
grant execute on function public.criar_tarefa_operacional(uuid, text, text, text, text, boolean, uuid, timestamptz, timestamptz, text, uuid, text) to authenticated;
grant execute on function public.alterar_status_tarefa_operacional(uuid, text, bigint, text, uuid, text) to authenticated;
grant execute on function public.criar_bloqueio_unidade(uuid, text, text, boolean, timestamptz, timestamptz, uuid, text, text, uuid, text) to authenticated;
grant execute on function public.encerrar_bloqueio_unidade(uuid, text, uuid, text) to authenticated;
grant execute on function public.obter_resumo_operacional(uuid, uuid) to authenticated;

comment on table public.estados_unidade is
'Fonte oficial do estado atual da jornada da unidade.';
comment on table public.historico_estados_unidade is
  'Historico imutavel de transicoes do estado da jornada.';
comment on column public.historico_estados_unidade.criado_por is
  'UUID historico imutavel do ator, sem FK para perfis, preservado mesmo apos exclusao do perfil.';
comment on table public.tarefas_operacionais is
'Tarefas de preparacao, limpeza e manutencao sem automacao de checkout no Sprint 4A.';
comment on table public.bloqueios_unidade is
'Restricoes independentes que nunca substituem o estado da jornada.';
comment on table public.eventos_operacionais is
  'Registro imutavel e idempotente dos eventos internos do nucleo operacional.';
comment on column public.eventos_operacionais.criado_por is
  'UUID historico imutavel do ator, sem FK para perfis, preservado mesmo apos exclusao do perfil.';
comment on function private.bloquear_contexto_operacional_unidade(uuid, boolean) is
  'Aplica a ordem canonica de locks: organizacao, propriedade e unidade; as RPCs bloqueiam estado e tarefa ou bloqueio somente depois.';
comment on function public.transicionar_estado_unidade(uuid, text, bigint, text, uuid, text) is
  'Executa transicoes gerais do Sprint 4A. Ocupacao e saida exigirao RPCs especificas no Sprint 4B.';
comment on function public.listar_estados_unidade_operacionais(uuid, uuid, text, timestamptz, uuid, integer) is
  'Lista estados operacionais por cursor composto, com isolamento por organizacao e filtros opcionais de propriedade e estado consolidado.';
comment on function public.resolver_ocupacao_legada_unidade(uuid, text, bigint, text, text, uuid) is
'Reconciliacao excepcional, justificada e auditada de unidades ocupadas no backfill da migration 019; nao substitui check-out.';

notify pgrst, 'reload schema';

commit;
