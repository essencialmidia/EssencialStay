create extension if not exists "pgcrypto";

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text,
  telefone text,
  avatar_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_fantasia text,
  documento text,
  email text,
  telefone text,
  status text not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint organizacoes_status_check
    check (status in ('ativo', 'suspenso', 'cancelado'))
);

create table public.membros_organizacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  papel text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint membros_organizacao_papel_check
    check (papel in ('proprietario', 'administrador', 'gerente', 'recepcao', 'limpeza', 'manutencao')),
  constraint membros_organizacao_organizacao_id_perfil_id_key
    unique (organizacao_id, perfil_id)
);

create table public.propriedades (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  nome text not null,
  tipo text not null,
  motor_automacao text not null default 'nenhum',
  motor_versao text,
  motor_configurado boolean not null default false,
  descricao text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  pais text not null default 'Brasil',
  horario_checkin time,
  horario_checkout time,
  wifi_nome text,
  wifi_senha text,
  status text not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint propriedades_tipo_check
    check (tipo in ('casa', 'apartamento', 'pousada', 'hotel', 'chale', 'outro')),
  constraint propriedades_motor_automacao_check
    check (motor_automacao in ('nenhum', 'tuya', 'akubela')),
  constraint propriedades_status_check
    check (status in ('ativa', 'inativa', 'manutencao'))
);

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  propriedade_id uuid not null references public.propriedades(id) on delete cascade,
  nome text not null,
  codigo text,
  tipo text not null,
  andar text,
  capacidade_hospedes integer,
  status text not null default 'disponivel',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint unidades_tipo_check
    check (tipo in ('propriedade_inteira', 'quarto', 'suite', 'apartamento', 'chale', 'outro')),
  constraint unidades_status_check
    check (status in ('disponivel', 'ocupada', 'limpeza', 'manutencao', 'inativa')),
  constraint unidades_capacidade_hospedes_check
    check (capacidade_hospedes is null or capacidade_hospedes >= 0),
  constraint unidades_propriedade_id_codigo_key
    unique (propriedade_id, codigo)
);

create index membros_organizacao_organizacao_id_idx
  on public.membros_organizacao (organizacao_id);

create index membros_organizacao_perfil_id_idx
  on public.membros_organizacao (perfil_id);

create index propriedades_organizacao_id_idx
  on public.propriedades (organizacao_id);

create index unidades_propriedade_id_idx
  on public.unidades (propriedade_id);

create trigger perfis_atualizar_atualizado_em
before update on public.perfis
for each row
execute function public.atualizar_atualizado_em();

create trigger organizacoes_atualizar_atualizado_em
before update on public.organizacoes
for each row
execute function public.atualizar_atualizado_em();

create trigger propriedades_atualizar_atualizado_em
before update on public.propriedades
for each row
execute function public.atualizar_atualizado_em();

create trigger unidades_atualizar_atualizado_em
before update on public.unidades
for each row
execute function public.atualizar_atualizado_em();

alter table public.perfis enable row level security;
alter table public.organizacoes enable row level security;
alter table public.membros_organizacao enable row level security;
alter table public.propriedades enable row level security;
alter table public.unidades enable row level security;

comment on table public.perfis is
'Perfil do usuario autenticado no Essencial Stay';

comment on table public.organizacoes is
'Empresas proprietarias das hospedagens';

comment on table public.propriedades is
'Casas, apartamentos, hoteis, pousadas e chales';

comment on table public.unidades is
'Quartos, suites ou propriedades inteiras';

-- RLS ativado em todas as tabelas.
-- As politicas de leitura e escrita serao criadas na proxima migration.
-- Ate que as politicas sejam criadas, clientes anon/authenticated nao terao acesso direto aos dados.
