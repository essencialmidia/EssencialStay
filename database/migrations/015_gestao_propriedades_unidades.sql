begin;

do $$
begin
  if to_regclass('public.propriedades') is null
     or to_regclass('public.unidades') is null then
    raise exception 'Execute as migrations oficiais anteriores antes da migration 015.';
  end if;

  if to_regprocedure('public.usuario_eh_membro(uuid)') is null
     or to_regprocedure('public.usuario_pode_gerenciar(uuid)') is null
     or to_regprocedure('public.eh_administrador_plataforma()') is null
     or to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null then
    raise exception 'As funcoes oficiais de autorizacao ainda nao estao disponiveis.';
  end if;
end;
$$;

alter table public.propriedades
  add column if not exists nome_fantasia text,
  add column if not exists documento text;

alter table public.propriedades
  drop constraint if exists propriedades_tipo_check,
  drop constraint if exists propriedades_status_check;

update public.propriedades
set tipo = case
  when lower(btrim(tipo)) in ('hotel', 'resort') then 'hotel'
  when lower(btrim(tipo)) in ('pousada', 'hostel') then 'pousada'
  when lower(btrim(tipo)) = 'casa' then 'casa'
  when lower(btrim(tipo)) in ('apartamento', 'flat') then 'apartamento'
  when lower(btrim(tipo)) in ('chale', 'chalé', 'cabana') then 'chale'
  when lower(btrim(tipo)) in ('bangalo', 'bangalô') then 'bangalo'
  else 'outro'
end;

update public.propriedades
set status = case when lower(btrim(status)) = 'ativa' then 'ativa' else 'inativa' end;

alter table public.propriedades
  add constraint propriedades_tipo_check
    check (tipo in ('hotel', 'pousada', 'casa', 'apartamento', 'chale', 'bangalo', 'outro')),
  add constraint propriedades_status_check
    check (status in ('ativa', 'inativa'));

alter table public.unidades
  add column if not exists numero_identificacao text,
  add column if not exists ativo boolean not null default true;

alter table public.unidades
  drop constraint if exists unidades_tipo_check,
  drop constraint if exists unidades_status_check,
  drop constraint if exists unidades_capacidade_hospedes_check,
  drop constraint if exists unidades_propriedade_id_codigo_key;

update public.unidades
set tipo = case
  when lower(btrim(tipo)) in ('standard', 'padrao', 'padrão', 'quarto') then 'standard'
  when lower(btrim(tipo)) in ('luxo', 'luxury', 'deluxe') then 'luxo'
  when lower(btrim(tipo)) in ('suite', 'suíte') then 'suite'
  when lower(btrim(tipo)) in ('chale', 'chalé') then 'chale'
  when lower(btrim(tipo)) in ('bangalo', 'bangalô') then 'bangalo'
  when lower(btrim(tipo)) in ('casa', 'casa_inteira', 'casa inteira') then 'casa'
  when lower(btrim(tipo)) in ('apartamento', 'apto', 'flat') then 'apartamento'
  else 'outro'
end;

update public.unidades
set ativo = false
where status = 'inativa';

update public.unidades
set status = case
  when status = 'ocupada' then 'ocupada'
  when status in ('limpeza', 'em_limpeza') then 'em_limpeza'
  when status = 'manutencao' then 'manutencao'
  else 'disponivel'
end;

alter table public.unidades
  rename column status to status_operacional;

update public.unidades
set capacidade_hospedes = 1
where capacidade_hospedes is not null
  and capacidade_hospedes < 1;

update public.unidades
set codigo = nullif(upper(btrim(codigo)), ''),
    numero_identificacao = coalesce(nullif(btrim(numero_identificacao), ''), nullif(btrim(codigo), ''));

with codigos_repetidos as (
  select
    id,
    row_number() over (
      partition by propriedade_id, lower(btrim(codigo))
      order by criado_em, id
    ) as ordem
  from public.unidades
  where codigo is not null
)
update public.unidades u
set codigo = u.codigo || '-DUP-' || u.id::text
from codigos_repetidos cr
where cr.id = u.id
  and cr.ordem > 1;

alter table public.unidades
  add constraint unidades_tipo_check
    check (tipo in ('standard', 'luxo', 'suite', 'chale', 'bangalo', 'casa', 'apartamento', 'outro')),
  add constraint unidades_status_operacional_check
    check (status_operacional in ('disponivel', 'ocupada', 'em_limpeza', 'manutencao')),
  add constraint unidades_capacidade_hospedes_check
    check (capacidade_hospedes is null or capacidade_hospedes >= 1);

create index if not exists propriedades_organizacao_status_idx
  on public.propriedades (organizacao_id, status);

create index if not exists unidades_propriedade_ativo_status_idx
  on public.unidades (propriedade_id, ativo, status_operacional);

create unique index if not exists unidades_propriedade_codigo_normalizado_uidx
  on public.unidades (propriedade_id, lower(btrim(codigo)))
  where codigo is not null;

alter table public.propriedades enable row level security;
alter table public.unidades enable row level security;

do $$
declare
  politica record;
begin
  for politica in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('propriedades', 'unidades')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      politica.policyname,
      politica.tablename
    );
  end loop;
end;
$$;

create policy "propriedades_select_authorized"
on public.propriedades
for select to authenticated
using (
  public.eh_administrador_plataforma()
  or public.usuario_eh_membro(organizacao_id)
);

create policy "propriedades_insert_authorized"
on public.propriedades
for insert to authenticated
with check (
  public.usuario_pode_gerenciar_plataforma()
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "propriedades_update_authorized"
on public.propriedades
for update to authenticated
using (
  public.usuario_pode_gerenciar_plataforma()
  or public.usuario_pode_gerenciar(organizacao_id)
)
with check (
  public.usuario_pode_gerenciar_plataforma()
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "unidades_select_authorized"
on public.unidades
for select to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and (
        public.eh_administrador_plataforma()
        or public.usuario_eh_membro(p.organizacao_id)
      )
  )
);

create policy "unidades_insert_authorized"
on public.unidades
for insert to authenticated
with check (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and (
        public.usuario_pode_gerenciar_plataforma()
        or public.usuario_pode_gerenciar(p.organizacao_id)
      )
  )
);

create policy "unidades_update_authorized"
on public.unidades
for update to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and (
        public.usuario_pode_gerenciar_plataforma()
        or public.usuario_pode_gerenciar(p.organizacao_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and (
        public.usuario_pode_gerenciar_plataforma()
        or public.usuario_pode_gerenciar(p.organizacao_id)
      )
  )
);

revoke all on table public.propriedades from anon;
revoke all on table public.unidades from anon;
revoke all on table public.propriedades from authenticated;
revoke all on table public.unidades from authenticated;
grant select, insert, update on table public.propriedades to authenticated;
grant select, insert, update on table public.unidades to authenticated;

create or replace function public.criar_unidades_em_lote(
  p_propriedade_id uuid,
  p_prefixo text,
  p_numero_inicial integer,
  p_numero_final integer,
  p_tipo text,
  p_capacidade_hospedes integer,
  p_andar text
)
returns table (criadas integer, ignoradas integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_organizacao_id uuid;
  v_prefixo text := upper(coalesce(btrim(p_prefixo), ''));
  v_tipo text := lower(btrim(p_tipo));
  v_andar text := nullif(btrim(p_andar), '');
  v_total integer;
  v_criadas bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  select p.organizacao_id
    into v_organizacao_id
    from public.propriedades p
   where p.id = p_propriedade_id;

  if v_organizacao_id is null then
    raise exception 'Propriedade nao encontrada.' using errcode = '22023';
  end if;

  if not (
    public.usuario_pode_gerenciar_plataforma()
    or public.usuario_pode_gerenciar(v_organizacao_id)
  ) then
    raise exception 'Usuario sem permissao para gerenciar esta propriedade.'
      using errcode = '42501';
  end if;

  if p_numero_inicial is null
     or p_numero_final is null
     or p_numero_inicial < 0
     or p_numero_final < p_numero_inicial then
    raise exception 'Intervalo de unidades invalido.' using errcode = '22023';
  end if;

  v_total := p_numero_final - p_numero_inicial + 1;

  if v_total > 500 then
    raise exception 'O lote pode conter no maximo 500 unidades.' using errcode = '22023';
  end if;

  if v_tipo is null
     or v_tipo not in ('standard', 'luxo', 'suite', 'chale', 'bangalo', 'casa', 'apartamento', 'outro') then
    raise exception 'Tipo de unidade invalido.' using errcode = '22023';
  end if;

  if p_capacidade_hospedes is null or p_capacidade_hospedes < 1 then
    raise exception 'A capacidade deve ser maior que zero.' using errcode = '22023';
  end if;

  with inseridas as (
    insert into public.unidades (
      propriedade_id,
      nome,
      codigo,
      tipo,
      andar,
      numero_identificacao,
      capacidade_hospedes,
      status_operacional,
      ativo
    )
    select
      p_propriedade_id,
      'Unidade ' || v_prefixo || numero::text,
      v_prefixo || numero::text,
      v_tipo,
      v_andar,
      numero::text,
      p_capacidade_hospedes,
      'disponivel',
      true
    from generate_series(p_numero_inicial, p_numero_final) as numero
    on conflict do nothing
    returning 1
  )
  select count(*) into v_criadas from inseridas;

  return query
  select v_criadas::integer, (v_total - v_criadas)::integer;
end;
$$;

revoke all on function public.criar_unidades_em_lote(
  uuid, text, integer, integer, text, integer, text
) from public;
revoke all on function public.criar_unidades_em_lote(
  uuid, text, integer, integer, text, integer, text
) from anon;
grant execute on function public.criar_unidades_em_lote(
  uuid, text, integer, integer, text, integer, text
) to authenticated;

comment on column public.propriedades.nome_fantasia is
'Nome comercial ou identificacao interna da propriedade.';
comment on column public.unidades.status_operacional is
'Estado operacional independente da ativacao cadastral da unidade.';
comment on column public.unidades.ativo is
'Controla a inativacao logica da unidade sem exclusao fisica.';
comment on function public.criar_unidades_em_lote(
  uuid, text, integer, integer, text, integer, text
) is
'Cria unidades em lote de forma atomica e idempotente, respeitando tenant e RLS.';

notify pgrst, 'reload schema';

commit;
