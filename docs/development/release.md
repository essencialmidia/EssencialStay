# Processo de release

O repositório documenta deploy via EasyPanel e imagens Docker separadas. Não há pipeline CI/CD ou script de release versionado.

Antes de liberar: revisar escopo e migrations; executar lint, testes e build; confirmar variáveis sem expor valores; revisar diff, segurança e rollback; construir a imagem correspondente; validar health check e navegação essencial no ambiente alvo.

Frontend: Docker multi-stage executa `npm ci`, build Vite e serve `dist` por Nginx. Backend: imagem Node instala dependências de produção, executa como usuário não root e expõe health check Ekaza.

Siga `docs/deploy`, o [template de release](../templates/release.md) e o [checklist](../checklists/release.md). Não declare automação inexistente.
