alter table public.organizacoes
add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('organization-logos', 'organization-logos', true)
on conflict (id) do nothing;

create or replace function public.usuario_eh_membro(p_organizacao_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_organizacao mo
    where mo.organizacao_id = p_organizacao_id
      and mo.perfil_id = auth.uid()
      and mo.ativo = true
  );
$$;

create or replace function public.usuario_pode_gerenciar(p_organizacao_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_organizacao mo
    where mo.organizacao_id = p_organizacao_id
      and mo.perfil_id = auth.uid()
      and mo.ativo = true
      and mo.papel in ('proprietario', 'administrador', 'gerente')
  );
$$;

create or replace function public.usuario_pode_administrar(p_organizacao_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_organizacao mo
    where mo.organizacao_id = p_organizacao_id
      and mo.perfil_id = auth.uid()
      and mo.ativo = true
      and mo.papel in ('proprietario', 'administrador')
  );
$$;

create policy "perfis_select_own"
on public.perfis
for select
to authenticated
using (id = auth.uid());

create policy "perfis_insert_own"
on public.perfis
for insert
to authenticated
with check (id = auth.uid());

create policy "perfis_update_own"
on public.perfis
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "organizacoes_select_member"
on public.organizacoes
for select
to authenticated
using (public.usuario_eh_membro(id));

create policy "organizacoes_insert_authenticated"
on public.organizacoes
for insert
to authenticated
with check (true);

create policy "organizacoes_update_manager"
on public.organizacoes
for update
to authenticated
using (public.usuario_pode_gerenciar(id))
with check (public.usuario_pode_gerenciar(id));

create policy "organizacoes_delete_admin"
on public.organizacoes
for delete
to authenticated
using (public.usuario_pode_administrar(id));

create policy "membros_select_own"
on public.membros_organizacao
for select
to authenticated
using (perfil_id = auth.uid() or public.usuario_eh_membro(organizacao_id));

create policy "membros_insert_own"
on public.membros_organizacao
for insert
to authenticated
with check (perfil_id = auth.uid());

create policy "membros_update_admin"
on public.membros_organizacao
for update
to authenticated
using (public.usuario_pode_administrar(organizacao_id))
with check (public.usuario_pode_administrar(organizacao_id));

create policy "propriedades_select_member"
on public.propriedades
for select
to authenticated
using (public.usuario_eh_membro(organizacao_id));

create policy "propriedades_insert_manager"
on public.propriedades
for insert
to authenticated
with check (public.usuario_pode_gerenciar(organizacao_id));

create policy "propriedades_update_manager"
on public.propriedades
for update
to authenticated
using (public.usuario_pode_gerenciar(organizacao_id))
with check (public.usuario_pode_gerenciar(organizacao_id));

create policy "propriedades_delete_admin"
on public.propriedades
for delete
to authenticated
using (public.usuario_pode_administrar(organizacao_id));

create policy "unidades_select_member"
on public.unidades
for select
to authenticated
using (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and public.usuario_eh_membro(p.organizacao_id)
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
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar(p.organizacao_id)
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
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar(p.organizacao_id)
  )
)
with check (
  exists (
    select 1
    from public.propriedades p
    where p.id = unidades.propriedade_id
      and public.usuario_pode_gerenciar(p.organizacao_id)
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
    where p.id = unidades.propriedade_id
      and public.usuario_pode_administrar(p.organizacao_id)
  )
);

create policy "organization_logos_select_public"
on storage.objects
for select
to public
using (bucket_id = 'organization-logos');

create policy "organization_logos_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'organization-logos');

create policy "organization_logos_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'organization-logos')
with check (bucket_id = 'organization-logos');
