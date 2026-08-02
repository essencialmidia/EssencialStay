# Workflow de desenvolvimento

1. Leia `AI_CONTEXT.md`, o `AGENTS.md` aplicável e o documento canônico do domínio.
2. Verifique `git status --short`; preserve alterações locais.
3. Pesquise referências e identifique a causa antes de editar.
4. Declare escopo, riscos e arquivos esperados.
5. Faça um diff pequeno, reutilizando padrões existentes.
6. Execute teste relacionado, lint/test e build conforme o risco.
7. Revise segurança, documentação e `git diff --check`.
8. Informe arquivos, validações, limitações e rollback.

Não misture refatoração, migration ou mudança visual não solicitada. O guia operacional do Codex permanece em `docs/CODEX_WORKFLOW.md`.
