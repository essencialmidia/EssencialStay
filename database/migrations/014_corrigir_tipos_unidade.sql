begin;

alter table public.unidades
  drop constraint if exists unidades_tipo_check;

-- Normaliza categorias legadas antes de aplicar o conjunto oficial.
update public.unidades
set tipo = case
  when lower(btrim(tipo)) in ('standard', 'padrao', 'padrão', 'quarto') then 'standard'
  when lower(btrim(tipo)) in ('luxo', 'luxury', 'deluxe') then 'luxo'
  when lower(btrim(tipo)) in ('suite', 'suíte') then 'suite'
  when lower(btrim(tipo)) in ('chale', 'chalé') then 'chale'
  when lower(btrim(tipo)) in ('bangalo', 'bangalô') then 'bangalo'
  when lower(btrim(tipo)) in ('casa', 'casa_inteira', 'casa inteira') then 'casa'
  when lower(btrim(tipo)) in ('apartamento', 'apto', 'flat') then 'apartamento'
  when lower(btrim(tipo)) in ('outro', 'outra', 'propriedade_inteira', 'propriedade inteira') then 'outro'
  else 'outro'
end
where tipo not in (
  'standard',
  'luxo',
  'suite',
  'chale',
  'bangalo',
  'casa',
  'apartamento',
  'outro'
);

alter table public.unidades
  add constraint unidades_tipo_check
  check (
    tipo in (
      'standard',
      'luxo',
      'suite',
      'chale',
      'bangalo',
      'casa',
      'apartamento',
      'outro'
    )
  );

comment on column public.unidades.tipo is
'Tipo interno da unidade: standard, luxo, suite, chale, bangalo, casa, apartamento ou outro.';

notify pgrst, 'reload schema';

commit;
