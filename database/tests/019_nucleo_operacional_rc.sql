\set ON_ERROR_STOP on

-- TESTE DESTRUTIVO E DESCARTAVEL. EXECUTAR SOMENTE EM SUPABASE LOCAL.
-- Requer as migrations oficiais aplicaveis ate 019 e termina com ROLLBACK.

begin;

create or replace function pg_temp.assert_true(p_condicao boolean, p_mensagem text)
returns void
language plpgsql
as $$
begin
  if not coalesce(p_condicao, false) then
    raise exception 'FALHA RC: %', p_mensagem;
  end if;
end;
$$;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '01900000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'rc019-admin@local.invalid',
  crypt('rc019-admin', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.perfis (id, nome_completo)
values ('01900000-0000-4000-8000-000000000001', 'RC 019 Admin');

insert into public.administradores_plataforma (perfil_id, papel, ativo)
values ('01900000-0000-4000-8000-000000000001', 'proprietario', true);

insert into public.organizacoes (id, nome, status)
values (
  '01910000-0000-4000-8000-000000000001',
  'RC 019 Empresa Preservada',
  'ativo'
);

insert into public.propriedades (
  id,
  organizacao_id,
  nome,
  tipo,
  motor_automacao,
  status
) values (
  '01920000-0000-4000-8000-000000000001',
  '01910000-0000-4000-8000-000000000001',
  'RC 019 Propriedade Preservada',
  'hotel',
  'nenhum',
  'ativa'
);

insert into public.unidades (
  id,
  propriedade_id,
  nome,
  codigo,
  tipo,
  capacidade_hospedes,
  ativo
) values (
  '01930000-0000-4000-8000-000000000001',
  '01920000-0000-4000-8000-000000000001',
  'RC 019 Unidade 101',
  'RC019-101',
  'standard',
  2,
  true
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.estados_unidade
    where unidade_id = '01930000-0000-4000-8000-000000000001'
  ),
  'estado operacional nao foi criado automaticamente'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.historico_estados_unidade
    where unidade_id = '01930000-0000-4000-8000-000000000001'
  ),
  'historico inicial nao foi criado automaticamente'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.eventos_operacionais
    where unidade_id = '01930000-0000-4000-8000-000000000001'
      and tipo_evento = 'estado_unidade.inicializado'
  ),
  'evento inicial nao foi criado automaticamente'
);

do $$
declare
  v_historico_id bigint;
  v_evento_id bigint;
begin
  select min(id)
  into v_historico_id
  from public.historico_estados_unidade
  where unidade_id = '01930000-0000-4000-8000-000000000001';

  select min(id)
  into v_evento_id
  from public.eventos_operacionais
  where unidade_id = '01930000-0000-4000-8000-000000000001';

  begin
    update public.historico_estados_unidade
    set justificativa = 'Mutacao indevida'
    where id = v_historico_id;
    raise exception 'UPDATE direto no historico foi aceito';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    delete from public.historico_estados_unidade
    where id = v_historico_id;
    raise exception 'DELETE direto no historico foi aceito';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    update public.eventos_operacionais
    set justificativa = 'Mutacao indevida'
    where id = v_evento_id;
    raise exception 'UPDATE direto no evento foi aceito';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    delete from public.eventos_operacionais
    where id = v_evento_id;
    raise exception 'DELETE direto no evento foi aceito';
  exception
    when sqlstate '55000' then null;
  end;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01900000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.criar_tarefa_operacional(
  '01930000-0000-4000-8000-000000000001',
  'limpeza',
  'RC 019 Limpeza',
  'Teste local de preservacao logica',
  'normal',
  true,
  null,
  null,
  null,
  'rc019-tarefa-preservacao',
  '01940000-0000-4000-8000-000000000001',
  'Teste local do nucleo operacional'
);

select public.criar_bloqueio_unidade(
  '01930000-0000-4000-8000-000000000001',
  'manual',
  'RC 019 bloqueio de teste',
  true,
  now(),
  null,
  null,
  null,
  'rc019-bloqueio-preservacao',
  '01940000-0000-4000-8000-000000000002',
  'Teste local do nucleo operacional'
);

reset role;

update public.unidades
set ativo = false
where id = '01930000-0000-4000-8000-000000000001';

update public.propriedades
set status = 'inativa'
where id = '01920000-0000-4000-8000-000000000001';

update public.organizacoes
set status = 'cancelado'
where id = '01910000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  exists (
    select 1
    from public.organizacoes
    where id = '01910000-0000-4000-8000-000000000001'
      and status = 'cancelado'
  ),
  'cancelamento logico removeu ou nao atualizou a organizacao'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.propriedades
    where id = '01920000-0000-4000-8000-000000000001'
      and status = 'inativa'
  ),
  'inativacao logica removeu ou nao atualizou a propriedade'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.unidades
    where id = '01930000-0000-4000-8000-000000000001'
      and ativo = false
  ),
  'inativacao logica removeu ou nao atualizou a unidade'
);

do $$
begin
  begin
    delete from public.unidades
    where id = '01930000-0000-4000-8000-000000000001';
    raise exception 'DELETE fisico da unidade foi aceito';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    delete from public.propriedades
    where id = '01920000-0000-4000-8000-000000000001';
    raise exception 'DELETE fisico da propriedade foi aceito';
  exception
    when sqlstate '55000' then null;
  end;

  begin
    delete from public.organizacoes
    where id = '01910000-0000-4000-8000-000000000001';
    raise exception 'DELETE fisico da organizacao foi aceito';
  exception
    when sqlstate '55000' then null;
  end;
end;
$$;

select pg_temp.assert_true(
  exists (
    select 1
    from public.historico_estados_unidade
    where unidade_id = '01930000-0000-4000-8000-000000000001'
  ),
  'historico nao foi preservado'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.eventos_operacionais
    where unidade_id = '01930000-0000-4000-8000-000000000001'
  ),
  'eventos nao foram preservados'
);

rollback;
