# Padrões de código

Siga o padrão do arquivo vizinho e mantenha mudanças pequenas. O frontend usa TypeScript estrito, imports ES modules, componentes funcionais, nomes de domínio em português e componentes em arquivos `kebab-case`. Separe acesso a dados em repositories, regras/orquestração em services e composição em pages/hooks/contexts.

Reutilize `src/components/ui`, tokens Tailwind e utilidades existentes. Cubra loading, erro, vazio e sucesso; preserve acessibilidade e responsividade. Não crie abstração para um único uso sem ganho claro.

O backend usa JavaScript ES modules, APIs nativas do Node e providers isolados. Sanitização, timeout, allowlist e erros tipados permanecem próximos do adapter. Nunca registre segredos ou payloads completos.

SQL usa português, `snake_case`, migrations ordenadas, RLS explícita e funções/RPCs para operações atômicas. Comentários devem explicar decisões, não repetir o código.
