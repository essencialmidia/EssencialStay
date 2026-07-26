begin;

-- A RPC administrativa depende apenas do modelo oficial criado diretamente
-- pela migration 009. A migration 008 e obsoleta e nao deve ser executada.
do $$
begin
  if to_regclass('public.organizacoes') is null then
    raise exception 'public.organizacoes nao existe. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;

  if to_regclass('public.administradores_plataforma') is null then
    raise exception 'public.administradores_plataforma nao existe. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;

  if to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null then
    raise exception 'A autorizacao global da plataforma nao existe. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizacoes'
      and column_name = 'tipo'
  ) then
    raise exception 'A coluna public.organizacoes.tipo nao existe. Execute primeiro a migration 009_administracao_plataforma.sql.';
  end if;
end;
$$;

-- DROP e CREATE garantem os nomes exatos dos argumentos expostos pelo PostgREST.
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

  if not public.usuario_pode_gerenciar_plataforma() then
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

  -- A chave global serializa retries e requisicoes concorrentes equivalentes.
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

  -- Administradores globais nao recebem vinculo operacional com o tenant.
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

comment on function public.criar_organizacao_onboarding(
  text, text, text, text, text, text, text
) is
'Cria ou atualiza uma empresa cliente por autorizacao global, sem criar membro operacional.';

notify pgrst, 'reload schema';

commit;
