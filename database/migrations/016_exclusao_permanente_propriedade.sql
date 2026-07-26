begin;

do $$
begin
  if to_regclass('public.propriedades') is null then
    raise exception 'Execute as migrations oficiais anteriores antes da migration 016.';
  end if;

  if to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null then
    raise exception 'A funcao oficial de autorizacao da plataforma ainda nao esta disponivel.';
  end if;
end;
$$;

create or replace function public.excluir_propriedade_definitivamente(
  p_propriedade_id uuid,
  p_confirmacao_nome text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nome text;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if not public.usuario_pode_gerenciar_plataforma() then
    raise exception 'Somente um administrador global pode excluir uma propriedade permanentemente.'
      using errcode = '42501';
  end if;

  select p.nome
    into v_nome
    from public.propriedades p
   where p.id = p_propriedade_id
   for update;

  if v_nome is null then
    raise exception 'Propriedade nao encontrada.' using errcode = 'P0002';
  end if;

  if btrim(coalesce(p_confirmacao_nome, '')) <> v_nome then
    raise exception 'O nome informado nao corresponde ao nome da propriedade.'
      using errcode = '22023';
  end if;

  delete from public.propriedades
   where id = p_propriedade_id;

  return true;
end;
$$;

revoke all on function public.excluir_propriedade_definitivamente(uuid, text) from public;
revoke all on function public.excluir_propriedade_definitivamente(uuid, text) from anon;
grant execute on function public.excluir_propriedade_definitivamente(uuid, text) to authenticated;

comment on function public.excluir_propriedade_definitivamente(uuid, text) is
'Exclui permanentemente uma propriedade e seus registros dependentes em cascata, exclusivamente por administrador global e com confirmacao nominal.';

notify pgrst, 'reload schema';

commit;
