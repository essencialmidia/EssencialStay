# Checklist de segurança

- [ ] Autenticação e autorização são verificadas no servidor/banco.
- [ ] RLS permanece ativa e há teste negativo entre tenants.
- [ ] Frontend usa somente chave anônima.
- [ ] `.env`, tokens, chaves, senhas e PINs não aparecem em código/logs.
- [ ] Erros e payloads externos são sanitizados.
- [ ] Allowlist, timeout e limites do provider permanecem ativos.
- [ ] Entrada é validada e operações repetidas são seguras.
- [ ] Dados de teste são fictícios e mínimos.
- [ ] Administração global não recebe acesso indevido a segredos.
- [ ] Risco, mitigação e rollback estão documentados.
