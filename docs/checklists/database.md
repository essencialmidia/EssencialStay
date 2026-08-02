# Checklist de banco

- [ ] Migrations anteriores e README foram revisados.
- [ ] Migration aplicada não foi reescrita.
- [ ] Mudança preserva dados e possui rollback/mitigação.
- [ ] `organizacao_id` e cadeia da propriedade estão corretos.
- [ ] RLS cobre select/insert/update/delete conforme necessário.
- [ ] Acesso entre tenants e papéis negados foi testado.
- [ ] FKs, constraints e índices suportam integridade/consultas.
- [ ] Locks, concorrência e idempotência foram avaliados.
- [ ] Schema privado e segredos não foram expostos.
- [ ] PostgREST e testes SQL foram considerados.
