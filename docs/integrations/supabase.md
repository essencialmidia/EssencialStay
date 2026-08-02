# Integração Supabase

## Estado: infraestrutura central implementada

Supabase fornece PostgreSQL, Auth e Storage. O frontend usa `@supabase/supabase-js` com URL e chave anônima públicas de build. Repositories consultam tabelas e RPCs; RLS define a autorização efetiva.

Migrations em `database/migrations` criam o domínio, políticas, índices, funções e RPCs. Storage é usado para logotipos com políticas próprias. O schema `private` reserva referências opacas de credenciais sem expor segredos ao navegador.

Não existe diretório ou CLI `supabase` configurado neste repositório. Aplicação de migrations e testes SQL depende de ambiente Supabase/PostgreSQL externo e deve ser documentada por execução. Nunca use `service_role` no frontend.
