begin;

-- MIGRATION OBSOLETA: NAO EXECUTAR.
-- Este arquivo introduz o modelo descartado Cliente -> Empresa. A arquitetura
-- oficial segue diretamente da migration 007 para a 009.
do $$
begin
  raise exception 'Migration 008 obsoleta. Execute 009_administracao_plataforma.sql diretamente apos a 007.';
end;
$$;

-- Remove policies antigas antes de renomear as entidades do tenant.
do $$
declare
  politica record;
begin
  for politica in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('organizacoes', 'membros_organizacao', 'propriedades', 'unidades')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      politica.policyname,
      politica.schemaname,
      politica.tablename
    );
  end loop;
end;
$$;

drop function if exists public.criar_organizacao_onboarding(text, text, text, text, text, text);
drop function if exists public.usuario_eh_membro(uuid);
drop function if exists public.usuario_pode_gerenciar(uuid);
drop function if exists public.usuario_pode_administrar(uuid);

alter table public.organizacoes rename to clientes;
alter table public.membros_organizacao rename to membros_cliente;
alter table public.membros_cliente rename column organizacao_id to cliente_id;

alter table public.clientes
rename constraint organizacoes_status_check to clientes_status_check;

alter table public.membros_cliente
rename constraint membros_organizacao_organizacao_id_fkey to membros_cliente_cliente_id_fkey;

alter table public.membros_cliente
rename constraint membros_organizacao_perfil_id_fkey to membros_cliente_perfil_id_fkey;

alter table public.membros_cliente
rename constraint membros_organizacao_papel_check to membros_cliente_papel_check;

alter table public.membros_cliente
rename constraint membros_organizacao_organizacao_id_perfil_id_key
to membros_cliente_cliente_id_perfil_id_key;

alter table public.clientes
add column tipo text not null default 'pessoa_juridica';

alter table public.clientes
add constraint clientes_tipo_check
check (tipo in ('pessoa_fisica', 'pessoa_juridica'));

alter trigger organizacoes_atualizar_atualizado_em
on public.clientes
rename to clientes_atualizar_atualizado_em;

alter index if exists public.membros_organizacao_organizacao_id_idx
rename to membros_cliente_cliente_id_idx;

alter index if exists public.membros_organizacao_perfil_id_idx
rename to membros_cliente_perfil_id_idx;

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  razao_social text not null,
  nome_fantasia text,
  documento text,
  email text,
  telefone text,
  logo_url text,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint empresas_status_check
    check (status in ('ativa', 'inativa', 'suspensa')),
  constraint empresas_cliente_documento_key
    unique (cliente_id, documento)
);

create index empresas_cliente_id_idx
on public.empresas (cliente_id);

create trigger empresas_atualizar_atualizado_em
before update on public.empresas
for each row
execute function public.atualizar_atualizado_em();

insert into public.empresas (
  id,
  cliente_id,
  razao_social,
  nome_fantasia,
  documento,
  email,
  telefone,
  logo_url,
  status,
  criado_em,
  atualizado_em
)
select
  c.id,
  c.id,
  c.nome,
  c.nome_fantasia,
  c.documento,
  c.email,
  c.telefone,
  c.logo_url,
  case
    when c.status = 'ativo' then 'ativa'
    when c.status = 'suspenso' then 'suspensa'
    else 'inativa'
  end,
  c.criado_em,
  c.atualizado_em
from public.clientes c;

-- Os dados empresariais legados ja foram preservados na empresa inicial.
alter table public.clientes
drop column nome_fantasia,
drop column documento;

alter table public.propriedades
drop constraint if exists propriedades_organizacao_id_fkey;

alter table public.propriedades
rename column organizacao_id to empresa_id;

alter table public.propriedades
add constraint propriedades_empresa_id_fkey
foreign key (empresa_id) references public.empresas(id) on delete cascade;

alter index if exists public.propriedades_organizacao_id_idx
rename to propriedades_empresa_id_idx;

alter table public.propriedades
drop constraint if exists propriedades_tipo_check;

alter table public.propriedades
add constraint propriedades_tipo_check
check (
  tipo in (
    'hotel',
    'resort',
    'pousada',
    'hostel',
    'apartamento',
    'casa',
    'flat',
    'chale',
    'cabana',
    'fazenda',
    'condominio',
    'outro'
  )
);

alter table public.propriedades
add column automacao_status text not null default 'nao_possui',
add column automacao_marca text,
add column automacao_marca_outro text,
add column automacao_instalacao_status text,
add column automacao_recursos text[] not null default '{}'::text[],
add column automacao_configurada boolean not null default false;

do $$
declare
  registro record;
  metadata jsonb;
begin
  for registro in
    select id, motor_automacao, motor_versao, motor_configurado
    from public.propriedades
  loop
    metadata := null;

    if registro.motor_versao like 'essencial-stay-recursos:v1:%' then
      begin
        metadata := substring(
          registro.motor_versao
          from length('essencial-stay-recursos:v1:') + 1
        )::jsonb;
      exception when others then
        metadata := null;
      end;
    end if;

    update public.propriedades p
       set automacao_status = case
             when metadata ->> 'situacao' in ('nao_possui', 'possui', 'instalacao_futura')
               then metadata ->> 'situacao'
             when registro.motor_versao ilike 'Instalação futura%'
               then 'instalacao_futura'
             when registro.motor_automacao <> 'nenhum' or registro.motor_versao is not null
               then 'possui'
             else 'nao_possui'
           end,
           automacao_marca = case
             when metadata ->> 'marcaCodigo' in ('akubela', 'tuya', 'ekaza', 'aqara', 'shelly', 'control4', 'knx', 'outra')
               then metadata ->> 'marcaCodigo'
             when registro.motor_automacao in ('akubela', 'tuya')
               then registro.motor_automacao
             else null
           end,
           automacao_marca_outro = case
             when metadata ->> 'marcaCodigo' = 'outra' then metadata ->> 'marca'
             else null
           end,
           automacao_instalacao_status = case
             when metadata ->> 'situacaoInstalacao' in ('funcionando', 'parcial', 'em_instalacao')
               then metadata ->> 'situacaoInstalacao'
             when metadata ->> 'situacao' = 'instalacao_futura' then 'planejada'
             when registro.motor_configurado then 'funcionando'
             when registro.motor_automacao <> 'nenhum' then 'parcial'
             else null
           end,
           automacao_recursos = coalesce(
             (
               select array_agg(recurso.valor)
               from jsonb_array_elements_text(
                 coalesce(metadata -> 'recursos', '[]'::jsonb)
               ) as recurso(valor)
               where recurso.valor = any(array[
                 'painel',
                 'fechadura',
                 'iluminacao',
                 'ar_condicionado',
                 'cortinas',
                 'sensores',
                 'tv',
                 'tomadas',
                 'cena_boas_vindas',
                 'economia_energia',
                 'outro'
               ])
             ),
             '{}'::text[]
           ),
           automacao_configurada = registro.motor_configurado
     where p.id = registro.id;
  end loop;
end;
$$;

alter table public.propriedades
drop constraint if exists propriedades_motor_automacao_check;

alter table public.propriedades
drop column motor_automacao,
drop column motor_versao,
drop column motor_configurado;

alter table public.propriedades
add constraint propriedades_automacao_status_check
check (automacao_status in ('nao_possui', 'possui', 'instalacao_futura')),
add constraint propriedades_automacao_marca_check
check (
  automacao_marca is null
  or automacao_marca in ('akubela', 'tuya', 'ekaza', 'aqara', 'shelly', 'control4', 'knx', 'outra')
),
add constraint propriedades_automacao_instalacao_status_check
check (
  automacao_instalacao_status is null
  or automacao_instalacao_status in ('funcionando', 'parcial', 'em_instalacao', 'planejada')
),
add constraint propriedades_automacao_recursos_check
check (
  automacao_recursos <@ array[
    'painel',
    'fechadura',
    'iluminacao',
    'ar_condicionado',
    'cortinas',
    'sensores',
    'tv',
    'tomadas',
    'cena_boas_vindas',
    'economia_energia',
    'outro'
  ]::text[]
);

create table public.integracoes_propriedade (
  id uuid primary key default gen_random_uuid(),
  propriedade_id uuid not null references public.propriedades(id) on delete cascade,
  categoria text not null,
  provedor text,
  status text not null default 'nao_configurada',
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint integracoes_propriedade_categoria_check
    check (
      categoria in (
        'pms',
        'channel_manager',
        'motor_reservas',
        'checkin_digital',
        'grms',
        'ia'
      )
    ),
  constraint integracoes_propriedade_status_check
    check (status in ('nao_configurada', 'configurada', 'ativa', 'pausada', 'erro')),
  constraint integracoes_propriedade_categoria_key
    unique (propriedade_id, categoria)
);

create index integracoes_propriedade_propriedade_id_idx
on public.integracoes_propriedade (propriedade_id);

create trigger integracoes_propriedade_atualizar_atualizado_em
before update on public.integracoes_propriedade
for each row
execute function public.atualizar_atualizado_em();

alter table public.clientes enable row level security;
alter table public.membros_cliente enable row level security;
alter table public.empresas enable row level security;
alter table public.propriedades enable row level security;
alter table public.unidades enable row level security;
alter table public.integracoes_propriedade enable row level security;

-- Mantem o nome fisico legado do bucket para preservar URLs ja emitidas.
insert into storage.buckets (id, name, public)
values ('organization-logos', 'organization-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "organization_logos_select_public" on storage.objects;
drop policy if exists "organization_logos_insert_authenticated" on storage.objects;
drop policy if exists "organization_logos_update_authenticated" on storage.objects;
drop policy if exists "organization_logos_insert_own_folder" on storage.objects;
drop policy if exists "organization_logos_update_own_folder" on storage.objects;
drop policy if exists "organization_logos_delete_own_folder" on storage.objects;
drop policy if exists "client_logos_select_public" on storage.objects;
drop policy if exists "client_logos_insert_own_folder" on storage.objects;
drop policy if exists "client_logos_update_own_folder" on storage.objects;
drop policy if exists "client_logos_delete_own_folder" on storage.objects;

create policy "client_logos_select_public"
on storage.objects
for select
to public
using (bucket_id = 'organization-logos');

create policy "client_logos_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "client_logos_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "client_logos_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.usuario_eh_membro_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_cliente mc
    where mc.cliente_id = p_cliente_id
      and mc.perfil_id = auth.uid()
      and mc.ativo = true
  );
$$;

create or replace function public.usuario_pode_gerenciar_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_cliente mc
    where mc.cliente_id = p_cliente_id
      and mc.perfil_id = auth.uid()
      and mc.ativo = true
      and mc.papel in ('proprietario', 'administrador', 'gerente')
  );
$$;

create or replace function public.usuario_pode_administrar_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_cliente mc
    where mc.cliente_id = p_cliente_id
      and mc.perfil_id = auth.uid()
      and mc.ativo = true
      and mc.papel in ('proprietario', 'administrador')
  );
$$;

create policy "clientes_select_member"
on public.clientes
for select
to authenticated
using (public.usuario_eh_membro_cliente(id));

create policy "clientes_update_manager"
on public.clientes
for update
to authenticated
using (public.usuario_pode_gerenciar_cliente(id))
with check (public.usuario_pode_gerenciar_cliente(id));

create policy "clientes_delete_admin"
on public.clientes
for delete
to authenticated
using (public.usuario_pode_administrar_cliente(id));

create policy "membros_cliente_select_member"
on public.membros_cliente
for select
to authenticated
using (
  perfil_id = auth.uid()
  or public.usuario_eh_membro_cliente(cliente_id)
);

create policy "membros_cliente_update_admin"
on public.membros_cliente
for update
to authenticated
using (public.usuario_pode_administrar_cliente(cliente_id))
with check (public.usuario_pode_administrar_cliente(cliente_id));

create policy "empresas_select_member"
on public.empresas
for select
to authenticated
using (public.usuario_eh_membro_cliente(cliente_id));

create policy "empresas_insert_manager"
on public.empresas
for insert
to authenticated
with check (public.usuario_pode_gerenciar_cliente(cliente_id));

create policy "empresas_update_manager"
on public.empresas
for update
to authenticated
using (public.usuario_pode_gerenciar_cliente(cliente_id))
with check (public.usuario_pode_gerenciar_cliente(cliente_id));

create policy "empresas_delete_admin"
on public.empresas
for delete
to authenticated
using (public.usuario_pode_administrar_cliente(cliente_id));

create policy "propriedades_select_member"
on public.propriedades
for select
to authenticated
using (
  exists (
    select 1
    from public.empresas e
    where e.id = propriedades.empresa_id
      and public.usuario_eh_membro_cliente(e.cliente_id)
  )
);

create policy "propriedades_insert_manager"
on public.propriedades
for insert
to authenticated
with check (
  exists (
    select 1
    from public.empresas e
    where e.id = propriedades.empresa_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
);

create policy "propriedades_update_manager"
on public.propriedades
for update
to authenticated
using (
  exists (
    select 1
    from public.empresas e
    where e.id = propriedades.empresa_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
)
with check (
  exists (
    select 1
    from public.empresas e
    where e.id = propriedades.empresa_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
);

create policy "propriedades_delete_admin"
on public.propriedades
for delete
to authenticated
using (
  exists (
    select 1
    from public.empresas e
    where e.id = propriedades.empresa_id
      and public.usuario_pode_administrar_cliente(e.cliente_id)
  )
);

create policy "unidades_select_member"
on public.unidades
for select
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = unidades.propriedade_id
      and public.usuario_eh_membro_cliente(e.cliente_id)
  )
);

create policy "unidades_insert_manager"
on public.unidades
for insert
to authenticated
with check (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
);

create policy "unidades_update_manager"
on public.unidades
for update
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
)
with check (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
);

create policy "unidades_delete_admin"
on public.unidades
for delete
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = unidades.propriedade_id
      and public.usuario_pode_administrar_cliente(e.cliente_id)
  )
);

create policy "integracoes_select_member"
on public.integracoes_propriedade
for select
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = integracoes_propriedade.propriedade_id
      and public.usuario_eh_membro_cliente(e.cliente_id)
  )
);

create policy "integracoes_manage_manager"
on public.integracoes_propriedade
for all
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = integracoes_propriedade.propriedade_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
)
with check (
  exists (
    select 1
    from public.propriedades p
    join public.empresas e on e.id = p.empresa_id
    where p.id = integracoes_propriedade.propriedade_id
      and public.usuario_pode_gerenciar_cliente(e.cliente_id)
  )
);

grant select, update, delete on public.clientes to authenticated;
grant select, update on public.membros_cliente to authenticated;
grant select, insert, update, delete on public.empresas to authenticated;
grant select, insert, update, delete on public.propriedades to authenticated;
grant select, insert, update, delete on public.unidades to authenticated;
grant select, insert, update, delete on public.integracoes_propriedade to authenticated;

revoke all on public.clientes from anon;
revoke all on public.membros_cliente from anon;
revoke all on public.empresas from anon;
revoke all on public.propriedades from anon;
revoke all on public.unidades from anon;
revoke all on public.integracoes_propriedade from anon;

revoke insert on public.clientes from authenticated;
revoke insert, delete on public.membros_cliente from authenticated;

revoke all on function public.usuario_eh_membro_cliente(uuid) from public;
revoke all on function public.usuario_pode_gerenciar_cliente(uuid) from public;
revoke all on function public.usuario_pode_administrar_cliente(uuid) from public;
grant execute on function public.usuario_eh_membro_cliente(uuid) to authenticated;
grant execute on function public.usuario_pode_gerenciar_cliente(uuid) to authenticated;
grant execute on function public.usuario_pode_administrar_cliente(uuid) to authenticated;

create function public.criar_cliente_onboarding(
  p_email text,
  p_logo_url text,
  p_nome text,
  p_telefone text,
  p_tipo text
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil_id uuid := auth.uid();
  v_cliente_id uuid;
begin
  if v_perfil_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if nullif(btrim(p_nome), '') is null then
    raise exception 'O nome do cliente e obrigatorio.' using errcode = '22023';
  end if;

  if p_tipo not in ('pessoa_fisica', 'pessoa_juridica') then
    raise exception 'Tipo de cliente invalido.' using errcode = '22023';
  end if;

  select c.id
    into v_cliente_id
    from public.clientes c
    join public.membros_cliente mc on mc.cliente_id = c.id
   where mc.perfil_id = v_perfil_id
     and mc.papel = 'proprietario'
     and lower(btrim(c.nome)) = lower(btrim(p_nome))
   order by c.criado_em
   limit 1;

  if v_cliente_id is null then
    insert into public.clientes (
      nome,
      email,
      telefone,
      logo_url,
      tipo
    )
    values (
      btrim(p_nome),
      nullif(lower(btrim(p_email)), ''),
      nullif(btrim(p_telefone), ''),
      nullif(btrim(p_logo_url), ''),
      p_tipo
    )
    returning clientes.id into v_cliente_id;
  else
    update public.clientes c
       set nome = btrim(p_nome),
           email = nullif(lower(btrim(p_email)), ''),
           telefone = nullif(btrim(p_telefone), ''),
           logo_url = coalesce(nullif(btrim(p_logo_url), ''), c.logo_url),
           tipo = p_tipo
     where c.id = v_cliente_id;
  end if;

  insert into public.membros_cliente (
    cliente_id,
    perfil_id,
    papel,
    ativo
  )
  values (
    v_cliente_id,
    v_perfil_id,
    'proprietario',
    true
  )
  on conflict (cliente_id, perfil_id)
  do update set papel = 'proprietario', ativo = true;

  return query select v_cliente_id;
end;
$$;

create function public.criar_empresa_onboarding(
  p_cliente_id uuid,
  p_documento text,
  p_email text,
  p_logo_url text,
  p_nome_fantasia text,
  p_razao_social text,
  p_telefone text
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  if not public.usuario_pode_gerenciar_cliente(p_cliente_id) then
    raise exception 'Usuario sem permissao para gerenciar o cliente.' using errcode = '42501';
  end if;

  if nullif(btrim(p_razao_social), '') is null then
    raise exception 'A razao social e obrigatoria.' using errcode = '22023';
  end if;

  select e.id
    into v_empresa_id
    from public.empresas e
   where e.cliente_id = p_cliente_id
     and (
       (nullif(btrim(p_documento), '') is not null and e.documento = nullif(btrim(p_documento), ''))
       or lower(btrim(e.razao_social)) = lower(btrim(p_razao_social))
     )
   order by e.criado_em
   limit 1;

  if v_empresa_id is null then
    insert into public.empresas (
      cliente_id,
      razao_social,
      nome_fantasia,
      documento,
      email,
      telefone,
      logo_url
    )
    values (
      p_cliente_id,
      btrim(p_razao_social),
      nullif(btrim(p_nome_fantasia), ''),
      nullif(btrim(p_documento), ''),
      nullif(lower(btrim(p_email)), ''),
      nullif(btrim(p_telefone), ''),
      nullif(btrim(p_logo_url), '')
    )
    returning empresas.id into v_empresa_id;
  else
    update public.empresas e
       set razao_social = btrim(p_razao_social),
           nome_fantasia = nullif(btrim(p_nome_fantasia), ''),
           documento = nullif(btrim(p_documento), ''),
           email = nullif(lower(btrim(p_email)), ''),
           telefone = nullif(btrim(p_telefone), ''),
           logo_url = coalesce(nullif(btrim(p_logo_url), ''), e.logo_url)
     where e.id = v_empresa_id;
  end if;

  return query select v_empresa_id;
end;
$$;

revoke all on function public.criar_cliente_onboarding(text, text, text, text, text) from public;
grant execute on function public.criar_cliente_onboarding(text, text, text, text, text) to authenticated;

revoke all on function public.criar_empresa_onboarding(uuid, text, text, text, text, text, text) from public;
grant execute on function public.criar_empresa_onboarding(uuid, text, text, text, text, text, text) to authenticated;

comment on table public.clientes is
'Conta tenant do SaaS Essencial Stay.';

comment on column public.clientes.logo_url is
'URL publica do logotipo do cliente.';

comment on table public.empresas is
'Entidades empresariais ou operacionais pertencentes a um cliente.';

comment on table public.propriedades is
'Hoteis, pousadas, casas, apartamentos e demais hospedagens de uma empresa.';

comment on table public.integracoes_propriedade is
'Preparacao de integracoes futuras por propriedade, sem credenciais secretas.';

notify pgrst, 'reload schema';

commit;
