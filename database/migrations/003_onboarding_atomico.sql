drop policy if exists "organizacoes_insert_authenticated" on public.organizacoes;
drop policy if exists "membros_insert_own" on public.membros_organizacao;

create or replace function public.criar_organizacao_onboarding(
  p_nome text,
  p_nome_fantasia text default null,
  p_documento text default null,
  p_email text default null,
  p_telefone text default null,
  p_logo_url text default null
)
returns public.organizacoes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil_id uuid := auth.uid();
  v_organizacao public.organizacoes;
begin
  if v_perfil_id is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if nullif(btrim(p_nome), '') is null then
    raise exception 'O nome da organizacao e obrigatorio.' using errcode = '22023';
  end if;

  select o.*
    into v_organizacao
    from public.organizacoes o
    join public.membros_organizacao mo on mo.organizacao_id = o.id
   where mo.perfil_id = v_perfil_id
     and mo.papel = 'proprietario'
     and lower(btrim(o.nome)) = lower(btrim(p_nome))
   order by o.criado_em
   limit 1;

  if v_organizacao.id is null then
    insert into public.organizacoes (
      nome,
      nome_fantasia,
      documento,
      email,
      telefone,
      logo_url
    )
    values (
      btrim(p_nome),
      nullif(btrim(p_nome_fantasia), ''),
      nullif(btrim(p_documento), ''),
      nullif(btrim(p_email), ''),
      nullif(btrim(p_telefone), ''),
      nullif(btrim(p_logo_url), '')
    )
    returning * into v_organizacao;
  else
    update public.organizacoes
       set nome = btrim(p_nome),
           nome_fantasia = nullif(btrim(p_nome_fantasia), ''),
           documento = nullif(btrim(p_documento), ''),
           email = nullif(btrim(p_email), ''),
           telefone = nullif(btrim(p_telefone), ''),
           logo_url = coalesce(nullif(btrim(p_logo_url), ''), logo_url)
     where id = v_organizacao.id
     returning * into v_organizacao;
  end if;

  insert into public.membros_organizacao (
    organizacao_id,
    perfil_id,
    papel,
    ativo
  )
  values (
    v_organizacao.id,
    v_perfil_id,
    'proprietario',
    true
  )
  on conflict (organizacao_id, perfil_id)
  do update set ativo = true;

  return v_organizacao;
end;
$$;

revoke all on function public.criar_organizacao_onboarding(text, text, text, text, text, text) from public;
grant execute on function public.criar_organizacao_onboarding(text, text, text, text, text, text) to authenticated;

comment on function public.criar_organizacao_onboarding(text, text, text, text, text, text) is
'Cria ou reutiliza a organizacao inicial e garante o vinculo do proprietario na mesma transacao.';
