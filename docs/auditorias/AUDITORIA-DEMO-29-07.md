# Auditoria rápida — Demo 29/07/2026

## Arquitetura encontrada

- Frontend React 19, TypeScript, Vite e TailwindCSS.
- React Router com áreas pública, autenticada, administrativa e gates de organização.
- Supabase Auth no frontend; dados operacionais acessados por repositories/services.
- SaaS multiempresa com organização → propriedade → unidade. Automação é opcional e vinculada à propriedade.
- Design system baseado em tokens, componentes compartilhados e identidade neutra com verde-petróleo.

## Arquivos relevantes

- `frontend/src/routes/router.tsx`
- `frontend/src/pages/experiencia-hospede.tsx`
- `frontend/src/components/ui/*`
- `frontend/src/components/navigation/brand-mark.tsx`
- `frontend/src/types/database.ts`
- `frontend/src/services/*` e `frontend/src/repositories/*`
- `database/migrations/001_fundacao.sql`, `010_automacao_por_propriedade.sql`, `018_nucleo_integracoes_dispositivos.sql` e `019_nucleo_operacional.sql`
- `docs/architecture.md`, `docs/design-system.md` e `docs/automation-property-model.md`

## Padrões reutilizados

- Componentes, tokens semânticos, badges, cards, botões e toast existentes.
- Rotas React Router e composição por páginas.
- Separação por contrato, adapter e dados tipados.
- Automação independente de fabricante.

## Estruturas ausentes

- Não existe entidade persistida de reserva/hóspede/portal.
- Não existe API PMS ou Akubela disponível.
- Não existem endpoints reais de acesso ou comando.
- Não há suíte automatizada de testes configurada.

## Riscos

- QR dinâmico depende de internet para carregar a imagem; há abertura direta como contingência.
- O portal público é propositalmente demonstrativo e não possui token de hospedagem real.
- A aplicação exige variáveis anônimas do Supabase para inicializar o shell atual.

## Estratégia escolhida

Rotas públicas `/demo/29-07` e `/demo/29-07/portal`, com fixtures fictícias, contratos tipados e adapters em memória. Nenhuma migration, alteração de RLS, autenticação ou integração externa real.
