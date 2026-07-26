alter table public.perfis enable row level security;

grant select, insert, update on table public.perfis to authenticated;
revoke delete on table public.perfis from authenticated;
revoke all on table public.perfis from anon;

do $$
declare
  politica record;
begin
  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'perfis'
  loop
    execute format(
      'drop policy if exists %I on public.perfis',
      politica.policyname
    );
  end loop;
end;
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

comment on table public.perfis is
'Perfil do usuario autenticado. Leitura, insercao e atualizacao limitadas ao proprio auth.uid().';
