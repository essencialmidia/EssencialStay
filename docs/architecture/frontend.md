# Arquitetura do frontend

## Stack e entrada

O frontend está em `frontend`, usa React 19, TypeScript estrito, Vite, React Router e TailwindCSS. `src/main.tsx` inicia a aplicação; `src/app.tsx` compõe providers; `src/routes/router.tsx` declara rotas públicas, autenticadas, administrativas e de cliente.

## Camadas

- `pages`: composição de casos de uso e estados da tela.
- `components`: UI compartilhada e componentes de domínio.
- `contexts`: sessão, organização, cliente e administração global.
- `hooks`: consultas e estados reutilizáveis.
- `services`: validação e orquestração da aplicação.
- `repositories`: acesso ao Supabase.
- `lib`: cliente Supabase, navegação, formatação e utilidades.
- `types`: contratos TypeScript, inclusive tipos do banco.

Fluxo preferido: `page/component -> hook/context -> service -> repository -> Supabase`. A autorização efetiva permanece no banco; guards e seletores do navegador melhoram navegação, mas não concedem acesso.

## UI e estado

O design system usa tokens CSS, Tailwind e componentes de `src/components/ui`. Telas devem representar carregamento, erro, vazio e sucesso. Formulários existentes usam React Hook Form e Zod. Demos ficam em `src/demo` e não equivalem a persistência operacional.

O frontend não deve acessar diretamente APIs externas nem receber segredos. Veja [autenticação](authentication.md), [Supabase](../integrations/supabase.md) e `docs/design-system.md`.
