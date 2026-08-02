# Checklist de backend

- [ ] Contrato provider-agnostic foi preservado.
- [ ] Configuração vem do ambiente e falha de modo seguro.
- [ ] Endpoint protegido exige autorização adequada.
- [ ] Allowlist, timeout e modo somente leitura estão corretos.
- [ ] Tokens, IDs sensíveis e payloads foram sanitizados.
- [ ] Erros externos viram códigos internos seguros.
- [ ] Cache/renovação não vazam credenciais.
- [ ] CORS e health check continuam corretos.
- [ ] Testes cobrem sucesso, falha e negação.
- [ ] `npm run lint` e `npm test` passaram.
