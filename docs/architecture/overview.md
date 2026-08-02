# Visão arquitetural

## Estado atual

O Essencial Stay é um SaaS de hospitalidade multiempresa. A aplicação funcional combina um frontend React/TypeScript, Supabase para banco, autenticação e storage, e um backend HTTP Node.js dedicado às integrações Akubela e Ekaza/Tuya. O deploy do frontend usa imagem Docker com Nginx; o backend possui imagem própria.

O domínio oficial começa em `organizacoes`, a empresa cliente e fronteira do tenant. Propriedades pertencem à organização; unidades, ambientes, automação e integrações operam abaixo dela. A administração da plataforma é separada dos membros de clientes.

## Fluxos principais

```text
Navegador -> páginas/componentes -> contextos/hooks -> services -> repositories -> Supabase
Navegador -> backend HTTP -> provider Akubela ou Ekaza/Tuya -> API externa
Supabase Auth -> perfil -> membro da organização -> RLS -> dados do tenant
```

O frontend usa a chave anônima e depende de RLS. Segredos de provedores ficam no backend. O backend atual não é NestJS e não implementa o domínio completo do produto.

## Fontes de verdade

- Código executável: `frontend/src` e `backend`.
- Banco: sequência de `database/migrations`, observadas as exceções registradas no README.
- Decisões: `docs/adr` e esta base canônica.
- Produto e histórico: documentos existentes em `docs`, que podem conter planos ainda não entregues.

Veja [frontend](frontend.md), [backend](backend.md), [banco](database.md) e [mapa do projeto](../project-map.md).
