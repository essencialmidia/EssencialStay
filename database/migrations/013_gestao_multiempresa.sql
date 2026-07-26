begin;

alter table public.unidades
  drop constraint if exists unidades_tipo_check;

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
      'quarto',
      'casa_inteira',
      'propriedade_inteira',
      'outro'
    )
  );

comment on column public.unidades.tipo is
'Categoria comercial ou estrutural da unidade, como standard, luxo, suite, chale, bangalo, casa ou apartamento.';

notify pgrst, 'reload schema';

commit;
