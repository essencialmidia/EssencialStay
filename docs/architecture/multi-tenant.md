# Arquitetura multi-tenant

## Fronteira

`organizacoes` representa empresas clientes e é a raiz do tenant. Propriedades pertencem a uma organização; unidades herdam o tenant pela propriedade. Tabelas operacionais repetem `organizacao_id` e, quando útil, `propriedade_id` para permitir políticas, índices e FKs compostas explícitas.

Usuários não são donos diretos de propriedades. O acesso nasce de um membro ativo em `membros_organizacao`, com papel próprio por organização. Um perfil pode ter vínculos diferentes em empresas diferentes.

## Defesa em profundidade

- RLS filtra operações no banco.
- Funções verificam membro, gestão e administração.
- FKs compostas evitam vínculo cruzado entre tenants.
- Services/repositories sempre transportam o contexto correto.
- Contextos do frontend não substituem autorização.

Administradores da plataforma ficam fora da hierarquia do cliente. Suporte global é leitura; gestão estrutural depende do papel global permitido. Toda nova tabela de tenant deve ter raiz inequívoca, RLS e testes negativos de acesso cruzado.

Veja [empresas](../business/companies.md) e [permissões](../business/permissions.md).
