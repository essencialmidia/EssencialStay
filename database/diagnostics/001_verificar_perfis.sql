-- Consulta somente de leitura. Substitua o e-mail abaixo antes de executar.
select
  au.id as usuario_id,
  au.email,
  (p.id is not null) as perfil_existe,
  p.nome_completo,
  p.ativo,
  p.criado_em,
  p.atualizado_em
from auth.users au
left join public.perfis p on p.id = au.id
where lower(au.email) = lower('SUBSTITUA_PELO_EMAIL_DO_USUARIO');

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'perfis'
order by policyname;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'perfis'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;
