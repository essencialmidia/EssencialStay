# Diagnóstico

Comece pelo sintoma reproduzível e pelo menor caminho afetado. Pesquise nomes de rota, símbolo, tabela ou código de erro antes de abrir arquivos inteiros. Confirme a camada: UI, contexto, service, repository, RLS/RPC, backend ou provedor.

Use RTK apenas quando reduzir saída. Em falhas, preserve código de saída, mensagem principal, arquivo/linha, request ID sanitizado e menor stack útil. Nunca imprima `.env`, headers de autenticação, corpo externo completo, token, PIN ou dados reais de hóspede.

Para Supabase, diferencie ausência de sessão, vínculo inativo, RLS, schema cache e erro de dados. Para providers, diferencie configuração, autenticação, conectividade, timeout, allowlist e recurso não suportado. Transforme a causa encontrada em teste quando estiver no escopo.
