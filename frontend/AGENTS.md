# Instruções locais: frontend

- Preserve o fluxo `page/component -> hook/context -> service -> repository -> Supabase`.
- Use TypeScript estrito, componentes funcionais e padrões dos arquivos vizinhos.
- Reutilize `src/components/ui`, tokens e `docs/design-system.md`; mantenha acessibilidade e responsividade.
- Trate loading, erro, vazio e sucesso; bloqueie submissões repetidas.
- Guards/contextos não substituem RLS. Use somente a chave anônima; nunca integre APIs externas ou segredos no navegador.
- Separe fixtures em `src/demo` de dados operacionais e identifique demos claramente.
- Valide com `npm run lint`, `npm test` e, quando pertinente, `npm run build`.
