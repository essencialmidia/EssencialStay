begin;

do $$
begin
  if to_regclass('public.organizacoes') is null then
    raise exception 'Execute as migrations oficiais anteriores antes da migration 017.';
  end if;

  if to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null then
    raise exception 'A funcao oficial de autorizacao da plataforma ainda nao esta disponivel.';
  end if;
end;
$$;

create or replace function public.excluir_organizacao_definitivamente(
  p_organizacao_id uuid,
  p_confirmacao text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_confirmacao_esperada text;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if not public.usuario_pode_gerenciar_plataforma() then
    raise exception 'Somente um administrador global pode excluir uma empresa cliente permanentemente.'
      using errcode = '42501';
  end if;

  select
    o.status,
    coalesce(
      nullif(btrim(o.documento), ''),
      nullif(btrim(o.nome_fantasia), ''),
      o.nome
    )
    into v_status, v_confirmacao_esperada
    from public.organizacoes o
   where o.id = p_organizacao_id
   for update;

  if v_status is null then
    raise exception 'Empresa cliente nao encontrada.' using errcode = 'P0002';
  end if;

  if v_status <> 'cancelado' then
    raise exception 'A empresa precisa estar cancelada antes da exclusao permanente.'
      using errcode = '55000';
  end if;

  if btrim(coalesce(p_confirmacao, '')) <> v_confirmacao_esperada then
    raise exception 'A confirmacao informada nao corresponde a empresa cliente.'
      using errcode = '22023';
  end if;

  delete from public.organizacoes
   where id = p_organizacao_id;

  return true;
end;
$$;

revoke all on function public.excluir_organizacao_definitivamente(uuid, text) from public;
revoke all on function public.excluir_organizacao_definitivamente(uuid, text) from anon;
grant execute on function public.excluir_organizacao_definitivamente(uuid, text) to authenticated;

comment on function public.excluir_organizacao_definitivamente(uuid, text) is
'Exclui uma empresa cliente cancelada e todo o tenant dependente em cascata, exclusivamente por administrador global e com confirmacao explicita.';

notify pgrst, 'reload schema';

commit;
