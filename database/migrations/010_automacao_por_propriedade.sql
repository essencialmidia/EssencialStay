begin;

create table public.configuracoes_automacao_propriedade (
  id uuid primary key default gen_random_uuid(),
  propriedade_id uuid not null unique references public.propriedades(id) on delete cascade,
  possui_automacao text not null default 'nao_possui',
  marca text not null default 'nao_informada',
  marca_outro text,
  modelo text,
  situacao_instalacao text,
  instalador_responsavel text not null default 'nao_informado',
  instalador_outro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_automacao_possui_check
    check (possui_automacao in ('nao_possui', 'possui', 'instalacao_futura')),
  constraint configuracoes_automacao_marca_check
    check (marca in ('akubela', 'tuya', 'ekaza', 'aqara', 'shelly', 'sonoff', 'control4', 'knx', 'outra', 'nao_informada')),
  constraint configuracoes_automacao_situacao_check
    check (situacao_instalacao is null or situacao_instalacao in ('funcionando', 'parcial', 'em_instalacao', 'planejada')),
  constraint configuracoes_automacao_instalador_check
    check (instalador_responsavel in ('essencial_stay', 'parceiro', 'outro_fornecedor', 'proprietario', 'nao_informado'))
);

create table public.recursos_automacao_propriedade (
  id uuid primary key default gen_random_uuid(),
  configuracao_id uuid not null references public.configuracoes_automacao_propriedade(id) on delete cascade,
  recurso text not null,
  criado_em timestamptz not null default now(),
  constraint recursos_automacao_recurso_check
    check (recurso in ('painel', 'fechadura', 'iluminacao', 'ar_condicionado', 'cortinas', 'sensores', 'tv', 'tomadas', 'cenas', 'economia_energia', 'outro')),
  constraint recursos_automacao_configuracao_recurso_key
    unique (configuracao_id, recurso)
);

create trigger configuracoes_automacao_atualizar_atualizado_em
before update on public.configuracoes_automacao_propriedade
for each row execute function public.atualizar_atualizado_em();

alter table public.configuracoes_automacao_propriedade enable row level security;
alter table public.recursos_automacao_propriedade enable row level security;

insert into public.configuracoes_automacao_propriedade (
  propriedade_id,
  possui_automacao,
  marca,
  marca_outro,
  situacao_instalacao
)
select
  p.id,
  p.automacao_status,
  coalesce(p.automacao_marca, 'nao_informada'),
  p.automacao_marca_outro,
  p.automacao_instalacao_status
from public.propriedades p;

insert into public.recursos_automacao_propriedade (configuracao_id, recurso)
select
  cap.id,
  case recurso_legado when 'cena_boas_vindas' then 'cenas' else recurso_legado end
from public.configuracoes_automacao_propriedade cap
join public.propriedades p on p.id = cap.propriedade_id
cross join lateral unnest(p.automacao_recursos) as recursos(recurso_legado)
on conflict (configuracao_id, recurso) do nothing;

-- Compatibilidade temporaria: o modelo normalizado e a fonte de verdade e os
-- campos da migration 008 sao espelhados para consumidores legados.
create function public.sincronizar_configuracao_automacao_legada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.propriedades
     set automacao_status = new.possui_automacao,
         automacao_marca = case
           when new.marca in ('akubela', 'tuya', 'ekaza', 'aqara', 'shelly', 'control4', 'knx', 'outra') then new.marca
           else null
         end,
         automacao_marca_outro = case when new.marca = 'outra' then new.marca_outro else null end,
         automacao_instalacao_status = new.situacao_instalacao,
         automacao_configurada = true
   where id = new.propriedade_id;
  return new;
end;
$$;

create trigger configuracoes_automacao_sincronizar_legado
after insert or update on public.configuracoes_automacao_propriedade
for each row execute function public.sincronizar_configuracao_automacao_legada();

create function public.sincronizar_recursos_automacao_legados()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_configuracao_id uuid;
  v_propriedade_id uuid;
begin
  if tg_op = 'DELETE' then
    v_configuracao_id := old.configuracao_id;
  else
    v_configuracao_id := new.configuracao_id;
  end if;

  select propriedade_id
    into v_propriedade_id
    from public.configuracoes_automacao_propriedade
   where id = v_configuracao_id;

  if v_propriedade_id is not null then
    update public.propriedades
       set automacao_recursos = coalesce(
         (
           select array_agg(
             case r.recurso when 'cenas' then 'cena_boas_vindas' else r.recurso end
             order by r.recurso
           )
           from public.recursos_automacao_propriedade r
           where r.configuracao_id = v_configuracao_id
         ),
         '{}'::text[]
       )
     where id = v_propriedade_id;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger recursos_automacao_sincronizar_legado
after insert or update or delete on public.recursos_automacao_propriedade
for each row execute function public.sincronizar_recursos_automacao_legados();

create policy "configuracoes_automacao_select_authorized"
on public.configuracoes_automacao_propriedade
for select to authenticated
using (
  exists (
    select 1 from public.propriedades p
    where p.id = configuracoes_automacao_propriedade.propriedade_id
      and (public.usuario_eh_admin_plataforma() or public.usuario_eh_membro(p.organizacao_id))
  )
);

create policy "configuracoes_automacao_manage_authorized"
on public.configuracoes_automacao_propriedade
for all to authenticated
using (
  exists (
    select 1 from public.propriedades p
    where p.id = configuracoes_automacao_propriedade.propriedade_id
      and (public.usuario_pode_gerenciar_plataforma() or public.usuario_pode_gerenciar(p.organizacao_id))
  )
)
with check (
  exists (
    select 1 from public.propriedades p
    where p.id = configuracoes_automacao_propriedade.propriedade_id
      and (public.usuario_pode_gerenciar_plataforma() or public.usuario_pode_gerenciar(p.organizacao_id))
  )
);

create policy "recursos_automacao_select_authorized"
on public.recursos_automacao_propriedade
for select to authenticated
using (
  exists (
    select 1
    from public.configuracoes_automacao_propriedade cap
    join public.propriedades p on p.id = cap.propriedade_id
    where cap.id = recursos_automacao_propriedade.configuracao_id
      and (public.usuario_eh_admin_plataforma() or public.usuario_eh_membro(p.organizacao_id))
  )
);

create policy "recursos_automacao_manage_authorized"
on public.recursos_automacao_propriedade
for all to authenticated
using (
  exists (
    select 1
    from public.configuracoes_automacao_propriedade cap
    join public.propriedades p on p.id = cap.propriedade_id
    where cap.id = recursos_automacao_propriedade.configuracao_id
      and (public.usuario_pode_gerenciar_plataforma() or public.usuario_pode_gerenciar(p.organizacao_id))
  )
)
with check (
  exists (
    select 1
    from public.configuracoes_automacao_propriedade cap
    join public.propriedades p on p.id = cap.propriedade_id
    where cap.id = recursos_automacao_propriedade.configuracao_id
      and (public.usuario_pode_gerenciar_plataforma() or public.usuario_pode_gerenciar(p.organizacao_id))
  )
);

grant select, insert, update, delete on public.configuracoes_automacao_propriedade to authenticated;
grant select, insert, update, delete on public.recursos_automacao_propriedade to authenticated;
revoke all on public.configuracoes_automacao_propriedade from anon;
revoke all on public.recursos_automacao_propriedade from anon;

comment on table public.configuracoes_automacao_propriedade is
'Configuracao cadastral de automacao de uma propriedade, sem integracao com fabricantes.';
comment on table public.recursos_automacao_propriedade is
'Recursos de automacao instalados ou planejados na propriedade.';
comment on column public.propriedades.automacao_status is
'LEGADO: espelho temporario de configuracoes_automacao_propriedade.possui_automacao.';
comment on column public.propriedades.automacao_recursos is
'LEGADO: espelho temporario de recursos_automacao_propriedade.';

notify pgrst, 'reload schema';

commit;
