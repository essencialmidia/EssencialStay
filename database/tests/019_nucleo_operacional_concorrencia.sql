-- TESTE MANUAL MULTISSESSAO. EXECUTAR SOMENTE EM SUPABASE LOCAL DESCARTAVEL.
-- Este arquivo documenta blocos independentes. Nao execute o arquivo inteiro
-- de uma vez: use os blocos SETUP, SESSAO A, SESSAO B, VALIDACOES e ENCERRAMENTO.

-- ============================================================================
-- SETUP (executar uma vez como postgres)
-- ============================================================================
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '01950000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'rc019-concorrencia-admin@local.invalid',
    crypt('rc019-concorrencia-admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '01950000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'rc019-concorrencia-gerente@local.invalid',
    crypt('rc019-concorrencia-gerente', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.perfis (id, nome_completo)
values
  ('01950000-0000-4000-8000-000000000001', 'RC 019 Concorrencia Admin'),
  ('01950000-0000-4000-8000-000000000002', 'RC 019 Concorrencia Gerente');

insert into public.administradores_plataforma (perfil_id, papel, ativo)
values ('01950000-0000-4000-8000-000000000001', 'proprietario', true);

insert into public.organizacoes (id, nome, status)
values
  ('01960000-0000-4000-8000-000000000001', 'RC 019 Concorrencia A', 'ativo'),
  ('01960000-0000-4000-8000-000000000002', 'RC 019 Concorrencia B', 'ativo');

insert into public.membros_organizacao (
  organizacao_id, perfil_id, papel, ativo
) values (
  '01960000-0000-4000-8000-000000000001',
  '01950000-0000-4000-8000-000000000002',
  'gerente',
  true
);

insert into public.propriedades (
  id, organizacao_id, nome, tipo, motor_automacao, status
) values
  (
    '01970000-0000-4000-8000-000000000001',
    '01960000-0000-4000-8000-000000000001',
    'RC 019 Concorrencia Propriedade A',
    'hotel',
    'nenhum',
    'ativa'
  ),
  (
    '01970000-0000-4000-8000-000000000002',
    '01960000-0000-4000-8000-000000000002',
    'RC 019 Concorrencia Propriedade B',
    'hotel',
    'nenhum',
    'ativa'
  );

insert into public.unidades (
  id, propriedade_id, nome, codigo, tipo, capacidade_hospedes, ativo
) values
  (
    '01980000-0000-4000-8000-000000000001',
    '01970000-0000-4000-8000-000000000001',
    'RC 019 Unidade A1',
    'RC019-A1',
    'standard',
    2,
    true
  ),
  (
    '01980000-0000-4000-8000-000000000002',
    '01970000-0000-4000-8000-000000000001',
    'RC 019 Unidade A2',
    'RC019-A2',
    'standard',
    2,
    true
  ),
  (
    '01980000-0000-4000-8000-000000000003',
    '01970000-0000-4000-8000-000000000002',
    'RC 019 Unidade B1',
    'RC019-B1',
    'standard',
    2,
    true
  );

commit;

-- ============================================================================
-- SESSAO A (iniciar primeiro; mantem o lock por oito segundos)
-- ============================================================================
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000001',
  ' Reservada ',
  1,
  'RC019-Chave-Concorrente',
  '01990000-0000-4000-8000-000000000001',
  'Teste local de concorrencia pelo suporte'
);

select pg_sleep(8);
commit;

-- ============================================================================
-- SESSAO B (executar enquanto a SESSAO A estiver em pg_sleep)
-- Deve aguardar a SESSAO A e falhar com SQLSTATE 40001, nunca 40P01.
-- ============================================================================
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000001',
  'PREPARANDO',
  1,
  'RC019-Chave-Concorrente-B',
  '01990000-0000-4000-8000-000000000002',
  'Teste local de concorrencia pelo suporte'
);
rollback;

-- ============================================================================
-- SESSAO B, EM PARALELO COM A SESSAO A, EM OUTRA UNIDADE
-- Deve concluir sem aguardar o lock da unidade A1.
-- ============================================================================
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);

select clock_timestamp() as inicio_unidade_independente;
select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000002',
  'PREPARANDO',
  1,
  'RC019-Chave-Unidade-Independente',
  '01990000-0000-4000-8000-000000000003',
  'Teste local em unidade independente'
);
select clock_timestamp() as fim_unidade_independente;
commit;

-- ============================================================================
-- VALIDACOES SEQUENCIAIS (executar depois das duas sessoes)
-- ============================================================================

-- Repeticao exata: deve retornar o resultado existente mesmo com versao antiga.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);
select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000001',
  'RESERVADA',
  1,
  'RC019-Chave-Concorrente',
  '01990000-0000-4000-8000-000000000004',
  'Teste local de concorrencia pelo suporte'
);
commit;

-- Mesma chave e parametros diferentes: deve falhar com SQLSTATE 23505.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);
select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000001',
  'PREPARANDO',
  2,
  'RC019-Chave-Concorrente',
  '01990000-0000-4000-8000-000000000005',
  'Teste local de concorrencia pelo suporte'
);
rollback;

-- Mesma chave em outra organizacao: deve ser aceita.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000001',
  true
);
select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000003',
  'RESERVADA',
  1,
  'RC019-Chave-Concorrente',
  '01990000-0000-4000-8000-000000000006',
  'Teste local em outro tenant'
);
commit;

-- Mesma chave e mesma organizacao, mas origem usuario em vez de suporte.
-- O indice atual inclui origem; portanto, deve ser aceita.
begin;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '01950000-0000-4000-8000-000000000002',
  true
);
select *
from public.transicionar_estado_unidade(
  '01980000-0000-4000-8000-000000000001',
  'PREPARANDO',
  2,
  'RC019-Chave-Concorrente',
  '01990000-0000-4000-8000-000000000007',
  null
);
commit;

-- ============================================================================
-- ENCERRAMENTO LOGICO (executar como postgres depois de todas as validacoes)
-- O ambiente local deve ser recriado para remover definitivamente estes dados.
-- ============================================================================
begin;
update public.unidades
set ativo = false
where id in (
  '01980000-0000-4000-8000-000000000001',
  '01980000-0000-4000-8000-000000000002',
  '01980000-0000-4000-8000-000000000003'
);

update public.propriedades
set status = 'inativa'
where id in (
  '01970000-0000-4000-8000-000000000001',
  '01970000-0000-4000-8000-000000000002'
);

update public.organizacoes
set status = 'cancelado'
where id in (
  '01960000-0000-4000-8000-000000000001',
  '01960000-0000-4000-8000-000000000002'
);

update public.membros_organizacao
set ativo = false
where perfil_id = '01950000-0000-4000-8000-000000000002';

update public.administradores_plataforma
set ativo = false
where perfil_id = '01950000-0000-4000-8000-000000000001';

update public.perfis
set ativo = false
where id in (
  '01950000-0000-4000-8000-000000000001',
  '01950000-0000-4000-8000-000000000002'
);
commit;
