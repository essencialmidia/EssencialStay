alter table public.organizacoes
add column if not exists logo_url text;

comment on column public.organizacoes.logo_url is
'URL publica do logotipo da organizacao.';

notify pgrst, 'reload schema';
