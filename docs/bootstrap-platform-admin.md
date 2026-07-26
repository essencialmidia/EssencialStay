# Bootstrap do primeiro administrador

## Pré-requisitos

1. Executar `009_administracao_plataforma.sql`, `010_automacao_por_propriedade.sql`, `011_garantir_rpc_onboarding_organizacao.sql` e `012_garantir_administracao_plataforma.sql`, sem executar a migration 008 obsoleta.
2. Criar a conta de Claudio pelo fluxo normal do Supabase Auth.
3. Confirmar o e-mail e localizar o e-mail exato em Authentication > Users.

## SQL manual

Substitua `EMAIL_DO_CLAUDIO` antes de executar no SQL Editor do Supabase:

```sql
do $$
declare
  v_perfil_id uuid;
begin
  select id
    into v_perfil_id
    from auth.users
   where lower(email) = lower('EMAIL_DO_CLAUDIO')
   limit 1;

  if v_perfil_id is null then
    raise exception 'Usuario do Claudio nao encontrado em auth.users.';
  end if;

  insert into public.perfis (id, nome_completo, ativo)
  values (v_perfil_id, 'Claudio', true)
  on conflict (id) do update
    set nome_completo = coalesce(public.perfis.nome_completo, excluded.nome_completo),
        ativo = true;

  insert into public.administradores_plataforma (perfil_id, papel, ativo)
  values (v_perfil_id, 'proprietario', true)
  on conflict (perfil_id) do update
    set papel = 'proprietario',
        ativo = true;
end;
$$;

notify pgrst, 'reload schema';
```

Esse comando deve ser executado apenas no SQL Editor por um operador com acesso ao projeto. O papel `proprietario` pertence à administração do SaaS e não cria vínculo em `membros_organizacao`. O comando não utiliza nem expõe `service_role` no navegador.

## Verificação

Após executar, encerre e reabra a sessão do usuário. A rota `/admin` deve carregar e o papel deve aparecer como `proprietario`. Um usuário comum deve ser redirecionado para `/403`.
