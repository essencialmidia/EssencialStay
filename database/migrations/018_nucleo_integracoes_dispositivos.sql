begin;

do $$
begin
  if to_regclass('public.organizacoes') is null
     or to_regclass('public.propriedades') is null
     or to_regclass('public.unidades') is null
     or to_regclass('public.integracoes_propriedade') is null then
    raise exception 'Execute as migrations oficiais anteriores antes da migration 018.';
  end if;

  if to_regprocedure('public.usuario_eh_membro(uuid)') is null
     or to_regprocedure('public.usuario_pode_gerenciar(uuid)') is null
     or to_regprocedure('public.eh_administrador_plataforma()') is null
     or to_regprocedure('public.usuario_pode_gerenciar_plataforma()') is null then
    raise exception 'As funcoes oficiais de autorizacao ainda nao estao disponiveis.';
  end if;
end;
$$;

-- A tabela public.integracoes_propriedade pertence ao modelo legado de PMS,
-- channel manager e GRMS. Ela nao e alterada por esta migration.

create unique index if not exists propriedades_id_organizacao_uidx
  on public.propriedades (id, organizacao_id);

create unique index if not exists unidades_id_propriedade_uidx
  on public.unidades (id, propriedade_id);

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.provedores_integracao (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  categoria text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint provedores_integracao_codigo_check check (
    codigo = lower(btrim(codigo))
    and codigo ~ '^[a-z0-9][a-z0-9_-]*$'
  ),
  constraint provedores_integracao_nome_check check (length(btrim(nome)) >= 2),
  constraint provedores_integracao_categoria_check check (length(btrim(categoria)) >= 2)
);

create table public.protocolos_dispositivo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint protocolos_dispositivo_codigo_check check (
    codigo = lower(btrim(codigo))
    and codigo ~ '^[a-z0-9][a-z0-9_-]*$'
  ),
  constraint protocolos_dispositivo_nome_check check (length(btrim(nome)) >= 2)
);

create table public.categorias_dispositivo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  icone text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint categorias_dispositivo_codigo_check check (
    codigo = lower(btrim(codigo))
    and codigo ~ '^[a-z0-9][a-z0-9_-]*$'
  ),
  constraint categorias_dispositivo_nome_check check (length(btrim(nome)) >= 2)
);

create table public.ambientes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  unidade_id uuid,
  ambiente_pai_id uuid,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ambientes_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint ambientes_unidade_propriedade_fkey
    foreign key (unidade_id, propriedade_id)
    references public.unidades(id, propriedade_id),
  constraint ambientes_id_organizacao_propriedade_key
    unique (id, organizacao_id, propriedade_id),
  constraint ambientes_pai_organizacao_propriedade_fkey
    foreign key (ambiente_pai_id, organizacao_id, propriedade_id)
    references public.ambientes(id, organizacao_id, propriedade_id),
  constraint ambientes_nome_check check (length(btrim(nome)) >= 2),
  constraint ambientes_pai_check check (ambiente_pai_id is null or ambiente_pai_id <> id)
);

create table public.conexoes_integracao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  provedor_id uuid not null references public.provedores_integracao(id),
  nome_exibicao text not null,
  ambiente_execucao text not null default 'producao',
  status text not null default 'desconectada',
  configuracao jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint conexoes_integracao_id_organizacao_key unique (id, organizacao_id),
  constraint conexoes_integracao_nome_check check (length(btrim(nome_exibicao)) >= 2),
  constraint conexoes_integracao_ambiente_check check (
    ambiente_execucao in ('producao', 'sandbox', 'laboratorio')
  ),
  constraint conexoes_integracao_status_check check (
    status in ('desconectada', 'conectando', 'conectada', 'erro', 'desativada')
  ),
  constraint conexoes_integracao_configuracao_check check (
    jsonb_typeof(configuracao) = 'object'
  )
);

create table public.conexoes_integracao_propriedades (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  conexao_id uuid not null,
  propriedade_id uuid not null,
  identificador_externo text,
  configuracao jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint conexoes_integracao_propriedades_conexao_organizacao_fkey
    foreign key (conexao_id, organizacao_id)
    references public.conexoes_integracao(id, organizacao_id)
    on delete cascade,
  constraint conexoes_integracao_propriedades_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint conexoes_integracao_propriedades_conexao_propriedade_key
    unique (conexao_id, propriedade_id),
  constraint conexoes_integracao_propriedades_id_tenant_key
    unique (id, organizacao_id, propriedade_id),
  constraint conexoes_integracao_propriedades_configuracao_check check (
    jsonb_typeof(configuracao) = 'object'
  )
);

create table private.credenciais_integracao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  conexao_id uuid not null,
  referencia_segredo text not null,
  versao integer not null default 1,
  ativa boolean not null default true,
  expira_em timestamptz,
  rotacionada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint credenciais_integracao_conexao_organizacao_fkey
    foreign key (conexao_id, organizacao_id)
    references public.conexoes_integracao(id, organizacao_id)
    on delete cascade,
  constraint credenciais_integracao_versao_check check (versao >= 1),
  constraint credenciais_integracao_referencia_check check (
    length(btrim(referencia_segredo)) >= 1
  )
);

create table public.catalogo_dispositivos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_dispositivo(id),
  fabricante text not null,
  modelo text not null,
  icone text,
  suportado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint catalogo_dispositivos_fabricante_check check (length(btrim(fabricante)) >= 2),
  constraint catalogo_dispositivos_modelo_check check (length(btrim(modelo)) >= 1)
);

create table public.catalogo_dispositivo_protocolos (
  catalogo_id uuid not null references public.catalogo_dispositivos(id) on delete cascade,
  protocolo_id uuid not null references public.protocolos_dispositivo(id),
  principal boolean not null default false,
  criado_em timestamptz not null default now(),
  primary key (catalogo_id, protocolo_id)
);

create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  ambiente_id uuid,
  catalogo_id uuid references public.catalogo_dispositivos(id),
  nome text not null,
  fabricante text,
  modelo text,
  numero_serie text,
  versao_firmware text,
  status_cadastro text not null default 'ativo',
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint dispositivos_propriedade_organizacao_fkey
    foreign key (propriedade_id, organizacao_id)
    references public.propriedades(id, organizacao_id)
    on delete cascade,
  constraint dispositivos_ambiente_tenant_fkey
    foreign key (ambiente_id, organizacao_id, propriedade_id)
    references public.ambientes(id, organizacao_id, propriedade_id),
  constraint dispositivos_id_tenant_key unique (id, organizacao_id, propriedade_id),
  constraint dispositivos_nome_check check (length(btrim(nome)) >= 2),
  constraint dispositivos_status_cadastro_check check (
    status_cadastro in ('ativo', 'inativo', 'manutencao')
  ),
  constraint dispositivos_metadados_check check (jsonb_typeof(metadados) = 'object')
);

create table public.origens_dispositivo (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  dispositivo_id uuid not null,
  conexao_propriedade_id uuid not null,
  identificador_externo text not null,
  identificador_pai text,
  metadados jsonb not null default '{}'::jsonb,
  visto_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint origens_dispositivo_dispositivo_tenant_fkey
    foreign key (dispositivo_id, organizacao_id, propriedade_id)
    references public.dispositivos(id, organizacao_id, propriedade_id)
    on delete cascade,
  constraint origens_dispositivo_conexao_propriedade_tenant_fkey
    foreign key (conexao_propriedade_id, organizacao_id, propriedade_id)
    references public.conexoes_integracao_propriedades(id, organizacao_id, propriedade_id),
  constraint origens_dispositivo_identidade_key
    unique (conexao_propriedade_id, identificador_externo),
  constraint origens_dispositivo_id_tenant_key
    unique (id, organizacao_id, propriedade_id),
  constraint origens_dispositivo_identificador_check check (
    length(btrim(identificador_externo)) >= 1
  ),
  constraint origens_dispositivo_metadados_check check (jsonb_typeof(metadados) = 'object')
);

create table public.capacidades_dispositivo (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  dispositivo_id uuid not null,
  codigo text not null,
  permite_leitura boolean not null default true,
  permite_escrita boolean not null default false,
  configuracao jsonb not null default '{}'::jsonb,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint capacidades_dispositivo_dispositivo_tenant_fkey
    foreign key (dispositivo_id, organizacao_id, propriedade_id)
    references public.dispositivos(id, organizacao_id, propriedade_id)
    on delete cascade,
  constraint capacidades_dispositivo_codigo_key unique (dispositivo_id, codigo),
  constraint capacidades_dispositivo_codigo_check check (
    codigo = lower(btrim(codigo))
    and codigo ~ '^[a-z0-9][a-z0-9_.-]*$'
  ),
  constraint capacidades_dispositivo_configuracao_check check (
    jsonb_typeof(configuracao) = 'object'
  )
);

create table public.estados_dispositivo (
  dispositivo_id uuid primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  online boolean,
  nivel_bateria integer,
  intensidade_sinal integer,
  estado jsonb not null default '{}'::jsonb,
  observado_em timestamptz,
  atualizado_em timestamptz not null default now(),
  constraint estados_dispositivo_dispositivo_tenant_fkey
    foreign key (dispositivo_id, organizacao_id, propriedade_id)
    references public.dispositivos(id, organizacao_id, propriedade_id)
    on delete cascade,
  constraint estados_dispositivo_bateria_check check (
    nivel_bateria is null or nivel_bateria between 0 and 100
  ),
  constraint estados_dispositivo_sinal_check check (
    intensidade_sinal is null or intensidade_sinal between -200 and 100
  ),
  constraint estados_dispositivo_estado_check check (jsonb_typeof(estado) = 'object')
);

create table public.eventos_dispositivo (
  id bigint generated always as identity primary key,
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  propriedade_id uuid not null,
  dispositivo_id uuid not null,
  origem_id uuid,
  tipo_evento text not null,
  chave_idempotencia text,
  versao_schema integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  ocorrido_em timestamptz not null,
  recebido_em timestamptz not null default now(),
  constraint eventos_dispositivo_dispositivo_tenant_fkey
    foreign key (dispositivo_id, organizacao_id, propriedade_id)
    references public.dispositivos(id, organizacao_id, propriedade_id)
    on delete cascade,
  constraint eventos_dispositivo_origem_tenant_fkey
    foreign key (origem_id, organizacao_id, propriedade_id)
    references public.origens_dispositivo(id, organizacao_id, propriedade_id),
  constraint eventos_dispositivo_tipo_check check (length(btrim(tipo_evento)) >= 1),
  constraint eventos_dispositivo_versao_check check (versao_schema >= 1),
  constraint eventos_dispositivo_payload_check check (jsonb_typeof(payload) = 'object')
);

create table public.execucoes_sincronizacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes(id) on delete cascade,
  conexao_id uuid not null,
  tipo text not null,
  status text not null default 'pendente',
  cursor_sincronizacao text,
  erro text,
  detalhes jsonb not null default '{}'::jsonb,
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint execucoes_sincronizacao_conexao_organizacao_fkey
    foreign key (conexao_id, organizacao_id)
    references public.conexoes_integracao(id, organizacao_id)
    on delete cascade,
  constraint execucoes_sincronizacao_tipo_check check (length(btrim(tipo)) >= 1),
  constraint execucoes_sincronizacao_status_check check (
    status in ('pendente', 'executando', 'concluida', 'erro', 'cancelada')
  ),
  constraint execucoes_sincronizacao_periodo_check check (
    finalizado_em is null or iniciado_em is null or finalizado_em >= iniciado_em
  ),
  constraint execucoes_sincronizacao_detalhes_check check (
    jsonb_typeof(detalhes) = 'object'
  )
);

create unique index provedores_integracao_nome_uidx
  on public.provedores_integracao (lower(btrim(nome)));
create unique index protocolos_dispositivo_nome_uidx
  on public.protocolos_dispositivo (lower(btrim(nome)));
create unique index categorias_dispositivo_nome_uidx
  on public.categorias_dispositivo (lower(btrim(nome)));
create unique index ambientes_escopo_nome_uidx
  on public.ambientes (
    organizacao_id,
    propriedade_id,
    coalesce(unidade_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(ambiente_pai_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(btrim(nome))
  );
create index ambientes_organizacao_propriedade_ativo_idx
  on public.ambientes (organizacao_id, propriedade_id, ativo);
create index ambientes_organizacao_unidade_idx
  on public.ambientes (organizacao_id, unidade_id)
  where unidade_id is not null;
create unique index conexoes_integracao_organizacao_nome_uidx
  on public.conexoes_integracao (organizacao_id, lower(btrim(nome_exibicao)));
create index conexoes_integracao_organizacao_status_provedor_idx
  on public.conexoes_integracao (organizacao_id, status, provedor_id);
create index conexoes_prop_organizacao_propriedade_ativo_idx
  on public.conexoes_integracao_propriedades (organizacao_id, propriedade_id, ativo);
create index conexoes_integracao_propriedades_organizacao_conexao_ativo_idx
  on public.conexoes_integracao_propriedades (organizacao_id, conexao_id, ativo);
create unique index credenciais_integracao_conexao_versao_uidx
  on private.credenciais_integracao (conexao_id, versao);
create unique index credenciais_integracao_conexao_ativa_uidx
  on private.credenciais_integracao (conexao_id)
  where ativa;
create unique index catalogo_dispositivos_identidade_uidx
  on public.catalogo_dispositivos (
    categoria_id,
    lower(btrim(fabricante)),
    lower(btrim(modelo))
  );
create index catalogo_dispositivos_categoria_suportado_idx
  on public.catalogo_dispositivos (categoria_id, suportado);
create index catalogo_dispositivo_protocolos_protocolo_idx
  on public.catalogo_dispositivo_protocolos (protocolo_id, catalogo_id);
create unique index dispositivos_propriedade_serie_uidx
  on public.dispositivos (organizacao_id, propriedade_id, lower(btrim(numero_serie)))
  where numero_serie is not null and btrim(numero_serie) <> '';
create index dispositivos_organizacao_propriedade_status_idx
  on public.dispositivos (organizacao_id, propriedade_id, status_cadastro);
create index dispositivos_organizacao_ambiente_idx
  on public.dispositivos (organizacao_id, ambiente_id)
  where ambiente_id is not null;
create index dispositivos_organizacao_catalogo_idx
  on public.dispositivos (organizacao_id, catalogo_id)
  where catalogo_id is not null;
create index dispositivos_ativos_idx
  on public.dispositivos (organizacao_id, propriedade_id, criado_em desc)
  where status_cadastro <> 'inativo';
create index origens_dispositivo_organizacao_dispositivo_idx
  on public.origens_dispositivo (organizacao_id, dispositivo_id);
create index capacidades_dispositivo_organizacao_dispositivo_ativa_idx
  on public.capacidades_dispositivo (organizacao_id, dispositivo_id, ativa);
create index estados_dispositivo_offline_idx
  on public.estados_dispositivo (organizacao_id, propriedade_id, atualizado_em desc)
  where online = false;
create index eventos_dispositivo_dispositivo_ocorrido_idx
  on public.eventos_dispositivo (dispositivo_id, ocorrido_em desc, id desc);
create index eventos_dispositivo_tenant_ocorrido_idx
  on public.eventos_dispositivo (organizacao_id, propriedade_id, ocorrido_em desc, id desc);
create unique index eventos_dispositivo_idempotencia_uidx
  on public.eventos_dispositivo (organizacao_id, origem_id, chave_idempotencia)
  where origem_id is not null and chave_idempotencia is not null;
create index execucoes_sincronizacao_organizacao_conexao_status_idx
  on public.execucoes_sincronizacao (organizacao_id, conexao_id, status, criado_em desc);

create trigger provedores_integracao_atualizar_atualizado_em
before update on public.provedores_integracao
for each row execute function public.atualizar_atualizado_em();
create trigger protocolos_dispositivo_atualizar_atualizado_em
before update on public.protocolos_dispositivo
for each row execute function public.atualizar_atualizado_em();
create trigger categorias_dispositivo_atualizar_atualizado_em
before update on public.categorias_dispositivo
for each row execute function public.atualizar_atualizado_em();
create trigger ambientes_atualizar_atualizado_em
before update on public.ambientes
for each row execute function public.atualizar_atualizado_em();
create trigger conexoes_integracao_atualizar_atualizado_em
before update on public.conexoes_integracao
for each row execute function public.atualizar_atualizado_em();
create trigger conexoes_integracao_propriedades_atualizar_atualizado_em
before update on public.conexoes_integracao_propriedades
for each row execute function public.atualizar_atualizado_em();
create trigger credenciais_integracao_atualizar_atualizado_em
before update on private.credenciais_integracao
for each row execute function public.atualizar_atualizado_em();
create trigger catalogo_dispositivos_atualizar_atualizado_em
before update on public.catalogo_dispositivos
for each row execute function public.atualizar_atualizado_em();
create trigger dispositivos_atualizar_atualizado_em
before update on public.dispositivos
for each row execute function public.atualizar_atualizado_em();
create trigger origens_dispositivo_atualizar_atualizado_em
before update on public.origens_dispositivo
for each row execute function public.atualizar_atualizado_em();
create trigger capacidades_dispositivo_atualizar_atualizado_em
before update on public.capacidades_dispositivo
for each row execute function public.atualizar_atualizado_em();
create trigger estados_dispositivo_atualizar_atualizado_em
before update on public.estados_dispositivo
for each row execute function public.atualizar_atualizado_em();
create trigger execucoes_sincronizacao_atualizar_atualizado_em
before update on public.execucoes_sincronizacao
for each row execute function public.atualizar_atualizado_em();

insert into public.provedores_integracao (codigo, nome, categoria) values
  ('tuya', 'Tuya', 'automacao'),
  ('akubela', 'Akubela', 'automacao'),
  ('yale', 'Yale Connect', 'controle_acesso'),
  ('ttlock', 'TTLock', 'controle_acesso'),
  ('shelly', 'Shelly', 'automacao'),
  ('matter', 'Matter', 'conectividade'),
  ('mqtt', 'MQTT', 'conectividade'),
  ('wubook', 'WuBook', 'pms'),
  ('hospy', 'Hospy', 'pms'),
  ('hits', 'HITS', 'pms'),
  ('cloudbeds', 'Cloudbeds', 'pms'),
  ('stays', 'Stays.net', 'pms'),
  ('custom', 'Personalizada', 'custom')
on conflict (codigo) do nothing;

insert into public.protocolos_dispositivo (codigo, nome) values
  ('zigbee', 'Zigbee'),
  ('wifi', 'Wi-Fi'),
  ('bluetooth', 'Bluetooth'),
  ('matter', 'Matter'),
  ('knx', 'KNX'),
  ('modbus', 'Modbus'),
  ('mqtt', 'MQTT'),
  ('ethernet', 'Ethernet'),
  ('proprietario', 'Proprietário')
on conflict (codigo) do nothing;

insert into public.categorias_dispositivo (codigo, nome, icone) values
  ('gateway', 'Gateway', 'router'),
  ('painel', 'Painel inteligente', 'panel-top'),
  ('interruptor', 'Interruptor', 'toggle-left'),
  ('rele', 'Relé', 'circuit-board'),
  ('fechadura', 'Fechadura', 'lock-keyhole'),
  ('sensor', 'Sensor', 'scan-line'),
  ('termostato', 'Termostato', 'thermometer'),
  ('ar_condicionado', 'Ar-condicionado', 'snowflake'),
  ('infravermelho', 'Infravermelho', 'radio'),
  ('tv', 'TV', 'tv'),
  ('luz', 'Luz', 'lightbulb'),
  ('cortina', 'Cortina', 'panels-top-left'),
  ('tomada', 'Tomada', 'plug'),
  ('camera', 'Câmera', 'camera'),
  ('outro', 'Outro', 'box')
on conflict (codigo) do nothing;

alter table public.provedores_integracao enable row level security;
alter table public.protocolos_dispositivo enable row level security;
alter table public.categorias_dispositivo enable row level security;
alter table public.ambientes enable row level security;
alter table public.conexoes_integracao enable row level security;
alter table public.conexoes_integracao_propriedades enable row level security;
alter table private.credenciais_integracao enable row level security;
alter table public.catalogo_dispositivos enable row level security;
alter table public.catalogo_dispositivo_protocolos enable row level security;
alter table public.dispositivos enable row level security;
alter table public.origens_dispositivo enable row level security;
alter table public.capacidades_dispositivo enable row level security;
alter table public.estados_dispositivo enable row level security;
alter table public.eventos_dispositivo enable row level security;
alter table public.execucoes_sincronizacao enable row level security;

create policy "provedores_integracao_select_authenticated"
on public.provedores_integracao for select to authenticated using (true);
create policy "provedores_integracao_insert_platform_admin"
on public.provedores_integracao for insert to authenticated
with check ((select public.usuario_pode_gerenciar_plataforma()));
create policy "provedores_integracao_update_platform_admin"
on public.provedores_integracao for update to authenticated
using ((select public.usuario_pode_gerenciar_plataforma()))
with check ((select public.usuario_pode_gerenciar_plataforma()));

create policy "protocolos_dispositivo_select_authenticated"
on public.protocolos_dispositivo for select to authenticated using (true);
create policy "protocolos_dispositivo_insert_platform_admin"
on public.protocolos_dispositivo for insert to authenticated
with check ((select public.usuario_pode_gerenciar_plataforma()));
create policy "protocolos_dispositivo_update_platform_admin"
on public.protocolos_dispositivo for update to authenticated
using ((select public.usuario_pode_gerenciar_plataforma()))
with check ((select public.usuario_pode_gerenciar_plataforma()));

create policy "categorias_dispositivo_select_authenticated"
on public.categorias_dispositivo for select to authenticated using (true);
create policy "categorias_dispositivo_insert_platform_admin"
on public.categorias_dispositivo for insert to authenticated
with check ((select public.usuario_pode_gerenciar_plataforma()));
create policy "categorias_dispositivo_update_platform_admin"
on public.categorias_dispositivo for update to authenticated
using ((select public.usuario_pode_gerenciar_plataforma()))
with check ((select public.usuario_pode_gerenciar_plataforma()));

create policy "ambientes_select_authorized"
on public.ambientes for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "ambientes_insert_authorized"
on public.ambientes for insert to authenticated
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);
create policy "ambientes_update_authorized"
on public.ambientes for update to authenticated
using (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
)
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "conexoes_integracao_select_authorized"
on public.conexoes_integracao for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "conexoes_integracao_insert_authorized"
on public.conexoes_integracao for insert to authenticated
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);
create policy "conexoes_integracao_update_authorized"
on public.conexoes_integracao for update to authenticated
using (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
)
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "conexoes_integracao_propriedades_select_authorized"
on public.conexoes_integracao_propriedades for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "conexoes_integracao_propriedades_insert_authorized"
on public.conexoes_integracao_propriedades for insert to authenticated
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);
create policy "conexoes_integracao_propriedades_update_authorized"
on public.conexoes_integracao_propriedades for update to authenticated
using (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
)
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "catalogo_dispositivos_select_authenticated"
on public.catalogo_dispositivos for select to authenticated using (true);
create policy "catalogo_dispositivos_insert_platform_admin"
on public.catalogo_dispositivos for insert to authenticated
with check ((select public.usuario_pode_gerenciar_plataforma()));
create policy "catalogo_dispositivos_update_platform_admin"
on public.catalogo_dispositivos for update to authenticated
using ((select public.usuario_pode_gerenciar_plataforma()))
with check ((select public.usuario_pode_gerenciar_plataforma()));

create policy "catalogo_dispositivo_protocolos_select_authenticated"
on public.catalogo_dispositivo_protocolos for select to authenticated using (true);
create policy "catalogo_dispositivo_protocolos_insert_platform_admin"
on public.catalogo_dispositivo_protocolos for insert to authenticated
with check ((select public.usuario_pode_gerenciar_plataforma()));
create policy "catalogo_dispositivo_protocolos_update_platform_admin"
on public.catalogo_dispositivo_protocolos for update to authenticated
using ((select public.usuario_pode_gerenciar_plataforma()))
with check ((select public.usuario_pode_gerenciar_plataforma()));

create policy "dispositivos_select_authorized"
on public.dispositivos for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "dispositivos_insert_authorized"
on public.dispositivos for insert to authenticated
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);
create policy "dispositivos_update_authorized"
on public.dispositivos for update to authenticated
using (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
)
with check (
  (select public.usuario_pode_gerenciar_plataforma())
  or public.usuario_pode_gerenciar(organizacao_id)
);

create policy "origens_dispositivo_select_authorized"
on public.origens_dispositivo for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "capacidades_dispositivo_select_authorized"
on public.capacidades_dispositivo for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "estados_dispositivo_select_authorized"
on public.estados_dispositivo for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "eventos_dispositivo_select_authorized"
on public.eventos_dispositivo for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);
create policy "execucoes_sincronizacao_select_authorized"
on public.execucoes_sincronizacao for select to authenticated
using (
  (select public.eh_administrador_plataforma())
  or public.usuario_eh_membro(organizacao_id)
);

revoke all on table public.provedores_integracao from anon, authenticated;
revoke all on table public.protocolos_dispositivo from anon, authenticated;
revoke all on table public.categorias_dispositivo from anon, authenticated;
revoke all on table public.ambientes from anon, authenticated;
revoke all on table public.conexoes_integracao from anon, authenticated;
revoke all on table public.conexoes_integracao_propriedades from anon, authenticated;
revoke all on table private.credenciais_integracao from public, anon, authenticated;
revoke all on table public.catalogo_dispositivos from anon, authenticated;
revoke all on table public.catalogo_dispositivo_protocolos from anon, authenticated;
revoke all on table public.dispositivos from anon, authenticated;
revoke all on table public.origens_dispositivo from anon, authenticated;
revoke all on table public.capacidades_dispositivo from anon, authenticated;
revoke all on table public.estados_dispositivo from anon, authenticated;
revoke all on table public.eventos_dispositivo from anon, authenticated;
revoke all on table public.execucoes_sincronizacao from anon, authenticated;

grant select, insert, update on table public.provedores_integracao to authenticated;
grant select, insert, update on table public.protocolos_dispositivo to authenticated;
grant select, insert, update on table public.categorias_dispositivo to authenticated;
grant select, insert, update on table public.ambientes to authenticated;
grant select, insert, update on table public.conexoes_integracao to authenticated;
grant select, insert, update on table public.conexoes_integracao_propriedades to authenticated;
grant select, insert, update on table public.catalogo_dispositivos to authenticated;
grant select, insert, update on table public.catalogo_dispositivo_protocolos to authenticated;
grant select, insert, update on table public.dispositivos to authenticated;
grant select on table public.origens_dispositivo to authenticated;
grant select on table public.capacidades_dispositivo to authenticated;
grant select on table public.estados_dispositivo to authenticated;
grant select on table public.eventos_dispositivo to authenticated;
grant select on table public.execucoes_sincronizacao to authenticated;

create or replace function public.salvar_conexao_integracao(
  p_id uuid,
  p_organizacao_id uuid,
  p_provedor_id uuid,
  p_nome_exibicao text,
  p_ambiente_execucao text,
  p_status text,
  p_propriedade_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_conexao_id uuid;
  v_total_propriedades integer;
  v_total_validas integer;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.' using errcode = '42501';
  end if;

  if not (
    public.usuario_pode_gerenciar_plataforma()
    or public.usuario_pode_gerenciar(p_organizacao_id)
  ) then
    raise exception 'Usuario sem permissao para gerenciar esta organizacao.'
      using errcode = '42501';
  end if;

  select count(distinct propriedade_id)
    into v_total_propriedades
    from unnest(coalesce(p_propriedade_ids, '{}'::uuid[]))
      as propriedades(propriedade_id);

  if v_total_propriedades = 0 then
    raise exception 'Selecione ao menos uma propriedade.' using errcode = '22023';
  end if;

  select count(*)
    into v_total_validas
    from public.propriedades p
   where p.organizacao_id = p_organizacao_id
     and p.id = any(p_propriedade_ids);

  if v_total_validas <> v_total_propriedades then
    raise exception 'Uma ou mais propriedades nao pertencem a organizacao informada.'
      using errcode = '23503';
  end if;

  if p_id is null then
    insert into public.conexoes_integracao (
      organizacao_id,
      provedor_id,
      nome_exibicao,
      ambiente_execucao,
      status
    ) values (
      p_organizacao_id,
      p_provedor_id,
      btrim(p_nome_exibicao),
      p_ambiente_execucao,
      p_status
    )
    returning id into v_conexao_id;
  else
    update public.conexoes_integracao c
       set provedor_id = p_provedor_id,
           nome_exibicao = btrim(p_nome_exibicao),
           ambiente_execucao = p_ambiente_execucao,
           status = p_status
     where c.id = p_id
       and c.organizacao_id = p_organizacao_id
    returning c.id into v_conexao_id;

    if v_conexao_id is null then
      raise exception 'Conexao de integracao nao encontrada.' using errcode = '22023';
    end if;
  end if;

  insert into public.conexoes_integracao_propriedades (
    organizacao_id,
    conexao_id,
    propriedade_id,
    ativo
  )
  select
    p_organizacao_id,
    v_conexao_id,
    propriedade_id,
    true
  from (
    select distinct propriedade_id
    from unnest(p_propriedade_ids) as propriedades(propriedade_id)
  ) propriedades_selecionadas
  on conflict (conexao_id, propriedade_id)
  do update set ativo = true;

  update public.conexoes_integracao_propriedades cip
     set ativo = false
   where cip.conexao_id = v_conexao_id
     and cip.organizacao_id = p_organizacao_id
     and not (cip.propriedade_id = any(p_propriedade_ids));

  return v_conexao_id;
end;
$$;

revoke all on function public.salvar_conexao_integracao(
  uuid, uuid, uuid, text, text, text, uuid[]
) from public;
revoke all on function public.salvar_conexao_integracao(
  uuid, uuid, uuid, text, text, text, uuid[]
) from anon;
grant execute on function public.salvar_conexao_integracao(
  uuid, uuid, uuid, text, text, text, uuid[]
) to authenticated;

comment on table public.conexoes_integracao is
'Conexoes externas por organizacao. Nao armazena segredos nem executa chamadas a provedores.';
comment on table public.conexoes_integracao_propriedades is
'Associacao N:N exclusiva do novo nucleo entre conexoes externas e propriedades.';
comment on column public.conexoes_integracao.configuracao is
'Somente configuracao nao sensivel. Segredos sao proibidos nesta coluna.';
comment on table private.credenciais_integracao is
'Metadados privados e referencia a segredo externo. Nao exposta ao PostgREST ou ao frontend.';
comment on column private.credenciais_integracao.referencia_segredo is
'Referencia opaca para Supabase Vault ou gerenciador externo; nunca recebe o segredo em texto puro.';
comment on table public.dispositivos is
'Inventario interno independente de fabricante e conexao externa.';
comment on table public.origens_dispositivo is
'Identidades externas de um dispositivo por conexao e propriedade.';
comment on table public.estados_dispositivo is
'Ultimo estado observado. Somente leitura para clientes frontend.';
comment on table public.eventos_dispositivo is
'Historico imutavel e preparado para particionamento futuro; somente leitura no frontend.';
comment on table public.execucoes_sincronizacao is
'Registro simples de sincronizacoes futuras; nao implementa fila ou processamento neste sprint.';
comment on function public.salvar_conexao_integracao(
  uuid, uuid, uuid, text, text, text, uuid[]
) is
'Salva atomicamente uma conexao externa e seus vinculos ativos com propriedades do mesmo tenant.';

notify pgrst, 'reload schema';

commit;
