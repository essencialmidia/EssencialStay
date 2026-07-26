begin;

do $$
begin
  if to_regclass('public.perfis') is null then
    raise exception 'public.perfis nao existe. Execute primeiro as migrations oficiais anteriores.';
  end if;

  if to_regclass('public.organizacoes') is null then
    raise exception 'public.organizacoes nao existe. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizacoes'
      and column_name = 'tipo'
  ) then
    raise exception 'O modelo administrativo oficial ainda nao foi aplicado. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;

  if to_regclass('public.clientes') is not null
     or to_regclass('public.empresas') is not null
     or to_regclass('public.membros_cliente') is not null then
    raise exception 'Foi detectado o modelo obsoleto Cliente -> Empresa. A migration 008 nao deve ser executada.';
  end if;
end;
$$;

create table if not exists public.administradores_plataforma (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  papel text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint administradores_plataforma_perfil_id_key unique (perfil_id),
  constraint administradores_plataforma_papel_check
    check (papel in ('proprietario', 'administrador', 'suporte'))
);

alter table public.administradores_plataforma
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists perfil_id uuid,
  add column if not exists papel text,
  add column if not exists ativo boolean default true,
  add column if not exists criado_em timestamptz default now(),
  add column if not exists atualizado_em timestamptz default now();

alter table public.administradores_plataforma
  alter column id set default gen_random_uuid(),
  alter column perfil_id set not null,
  alter column papel set not null,
  alter column ativo set default true,
  alter column ativo set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null,
  alter column atualizado_em set default now(),
  alter column atualizado_em set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.administradores_plataforma'::regclass
      and contype = 'p'
  ) then
    alter table public.administradores_plataforma
      add constraint administradores_plataforma_pkey primary key (id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.administradores_plataforma'::regclass
      and conname = 'administradores_plataforma_perfil_id_fkey'
  ) then
    alter table public.administradores_plataforma
      add constraint administradores_plataforma_perfil_id_fkey
      foreign key (perfil_id) references public.perfis(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.administradores_plataforma'::regclass
      and contype = 'u'
      and conkey = array[
        (
          select attnum
          from pg_attribute
          where attrelid = 'public.administradores_plataforma'::regclass
            and attname = 'perfil_id'
        )::smallint
      ]::smallint[]
  ) then
    alter table public.administradores_plataforma
      add constraint administradores_plataforma_perfil_id_key unique (perfil_id);
  end if;
end;
$$;

alter table public.administradores_plataforma
  drop constraint if exists administradores_plataforma_papel_check;

alter table public.administradores_plataforma
  add constraint administradores_plataforma_papel_check
  check (papel in ('proprietario', 'administrador', 'suporte'));

-- A restricao UNIQUE de perfil_id ja cria o indice B-tree necessario.
drop trigger if exists administradores_plataforma_atualizar_atualizado_em
  on public.administradores_plataforma;

create trigger administradores_plataforma_atualizar_atualizado_em
before update on public.administradores_plataforma
for each row execute function public.atualizar_atualizado_em();

alter table public.administradores_plataforma enable row level security;

do $$
declare
  politica record;
begin
  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'administradores_plataforma'
  loop
    execute format(
      'drop policy if exists %I on public.administradores_plataforma',
      politica.policyname
    );
  end loop;
end;
$$;

-- O frontend pode verificar apenas o vinculo do proprio usuario. Nao existem
-- politicas de INSERT, UPDATE ou DELETE para authenticated.
create policy "administradores_plataforma_select_own"
on public.administradores_plataforma
for select to authenticated
using (perfil_id = auth.uid());

revoke all on table public.administradores_plataforma from anon;
revoke all on table public.administradores_plataforma from authenticated;
grant select on table public.administradores_plataforma to authenticated;

create or replace function public.eh_administrador_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.administradores_plataforma ap
    join public.perfis p on p.id = ap.perfil_id
    where ap.perfil_id = auth.uid()
      and ap.ativo = true
      and p.ativo = true
  );
$$;

-- Mantem compatibilidade com as politicas oficiais criadas pela migration 009.
create or replace function public.usuario_eh_admin_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.eh_administrador_plataforma();
$$;

create or replace function public.usuario_pode_gerenciar_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.eh_administrador_plataforma()
    and exists (
      select 1
      from public.administradores_plataforma ap
      where ap.perfil_id = auth.uid()
        and ap.papel in ('proprietario', 'administrador')
    );
$$;

revoke all on function public.eh_administrador_plataforma() from public;
revoke all on function public.eh_administrador_plataforma() from anon;
revoke all on function public.usuario_eh_admin_plataforma() from public;
revoke all on function public.usuario_eh_admin_plataforma() from anon;
revoke all on function public.usuario_pode_gerenciar_plataforma() from public;
revoke all on function public.usuario_pode_gerenciar_plataforma() from anon;
grant execute on function public.eh_administrador_plataforma() to authenticated;
grant execute on function public.usuario_eh_admin_plataforma() to authenticated;
grant execute on function public.usuario_pode_gerenciar_plataforma() to authenticated;

drop function if exists public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
);

create function public.criar_organizacao_onboarding(
  p_documento text,
  p_email text,
  p_logo_url text,
  p_nome text,
  p_nome_fantasia text,
  p_telefone text,
  p_tipo text
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_administrador_id uuid := auth.uid();
  v_organizacao_id uuid;
  v_documento text := nullif(regexp_replace(coalesce(p_documento, ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(btrim(p_email)), '');
  v_nome text := nullif(btrim(p_nome), '');
  v_nome_fantasia text := nullif(btrim(p_nome_fantasia), '');
  v_telefone text := nullif(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'), '');
  v_logo_url text := nullif(btrim(p_logo_url), '');
  v_tipo text := nullif(lower(btrim(p_tipo)), '');
begin
  if v_administrador_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if not public.eh_administrador_plataforma()
     or not public.usuario_pode_gerenciar_plataforma() then
    raise exception 'Usuario sem permissao para criar empresas clientes.'
      using errcode = '42501';
  end if;

  if v_nome is null then
    raise exception 'O nome da empresa cliente e obrigatorio.'
      using errcode = '22023';
  end if;

  if v_tipo is null or v_tipo not in ('pessoa_fisica', 'pessoa_juridica') then
    raise exception 'Tipo de pessoa invalido.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'organizacao:' || coalesce('documento:' || v_documento, 'nome:' || lower(v_nome)),
      0
    )
  );

  select o.id
    into v_organizacao_id
    from public.organizacoes o
   where (
       v_documento is not null
       and regexp_replace(coalesce(o.documento, ''), '\D', '', 'g') = v_documento
     )
     or (
       v_documento is null
       and lower(btrim(o.nome)) = lower(v_nome)
     )
   order by o.criado_em
   limit 1;

  if v_organizacao_id is null then
    insert into public.organizacoes (
      nome, nome_fantasia, documento, email, telefone, logo_url, tipo
    )
    values (
      v_nome, v_nome_fantasia, v_documento, v_email, v_telefone, v_logo_url, v_tipo
    )
    returning organizacoes.id into v_organizacao_id;
  else
    update public.organizacoes o
       set nome = v_nome,
           nome_fantasia = v_nome_fantasia,
           documento = v_documento,
           email = v_email,
           telefone = v_telefone,
           logo_url = coalesce(v_logo_url, o.logo_url),
           tipo = v_tipo
     where o.id = v_organizacao_id;
  end if;

  return query select v_organizacao_id;
end;
$$;

revoke all on function public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
) from public;
revoke all on function public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
) from anon;
grant execute on function public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
) to authenticated;

comment on table public.administradores_plataforma is
'Administradores globais do SaaS, separados dos membros operacionais dos tenants.';
comment on function public.eh_administrador_plataforma() is
'Verifica somente o usuario autenticado sem expor a lista de administradores.';
comment on function public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
) is
'Cria ou atualiza empresa cliente por autorizacao global, sem criar membro operacional.';

notify pgrst, 'reload schema';

commit;
