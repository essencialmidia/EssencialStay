# Fluxo de trabalho com Codex

## Iniciar uma tarefa

1. Leia `AGENTS.md` e confirme o escopo.
2. Veja `git status --short` para preservar mudancas locais.
3. Liste a estrutura de forma resumida, ignorando dependencias e gerados.
4. Pesquise simbolos e referencias com `rg` antes de abrir arquivos; leia apenas os trechos necessarios.
5. Para banco, leia README, migrations anteriores e ADRs relacionados.

## Usar RTK sem perder diagnostico

Execute primeiro `where.exe rtk`. Se nao estiver no PATH, use `& "C:\Program Files\Tools\RTK\rtk.exe"`. Consulte `rtk --help` ou a ajuda pelo caminho completo e use apenas operacoes confirmadas. Prefira RTK somente quando houver reducao real de saida; caso contrario, use o comando normal. Em falhas, amplie a parte relevante e preserve a mensagem que identifica causa, arquivo e linha.

## Alterar e validar

Mantenha o diff pequeno, siga os padroes existentes e nao misture refatoracoes. Rode primeiro o teste mais proximo da mudanca e depois, conforme o risco, os scripts oficiais de `lint`, `test` e `build` descritos em `AGENTS.md`. Revise `git diff --check` e `git diff --stat`. Testes SQL exigem um ambiente PostgreSQL/Supabase apropriado e devem ser reportados como nao executados quando ele nao estiver disponivel.

## Economizar contexto e diagnosticar erros

Nao abra `.env`, logs completos, dependencias, builds ou caches. Limite buscas por pasta, padrao e numero de resultados; resuma listagens extensas. Se um comando falhar, capture codigo de saida, mensagem principal, arquivo/linha e o menor trecho de stack necessario. Reutilize conclusoes ja verificadas e nao repita a analise inicial.

Ao concluir, informe arquivos alterados, comandos executados, resultados, riscos e limitacoes. Nao faca commit ou push sem pedido explicito.
