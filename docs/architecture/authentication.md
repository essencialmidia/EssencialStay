# Autenticação e sessão

## Fluxo

Supabase Auth autentica o usuário. O cliente em `frontend/src/lib/supabase.ts` usa PKCE, persiste a sessão, renova tokens e detecta retorno de autenticação na URL. `AuthProvider` recupera e acompanha a sessão; o serviço garante o perfil correspondente sem invalidar a sessão quando a sincronização falha.

`ProtectedRoute` separa rotas autenticadas das públicas. Os gates de cliente e administração carregam vínculos específicos antes de liberar a interface. Isso é conveniência de navegação: RLS e RPCs continuam sendo a fronteira de autorização.

## Identidades e vínculos

`auth.users.id` corresponde a `perfis.id`. Um perfil pode participar de várias organizações por `membros_organizacao` e, separadamente, possuir vínculo em `administradores_plataforma`. Selecionar organização no frontend não cria permissão.

## Regras

O navegador usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Nunca use `service_role`, promova administradores globais ou grave tokens em logs. O bootstrap do primeiro administrador é manual e controlado; veja `docs/bootstrap-platform-admin.md`.
