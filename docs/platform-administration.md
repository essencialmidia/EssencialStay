# Administração da plataforma

## Propósito

A área `/admin` administra o SaaS Essencial Stay. Ela não representa uma hospedagem e não cria a Essencial Stay como empresa cliente.

## Autorização

O acesso depende de um registro ativo em `public.administradores_plataforma` para o `auth.uid()` atual.

| Papel | Leitura global | Gestão cadastral | Promoção de administradores |
| --- | --- | --- | --- |
| proprietário | sim | sim | somente bootstrap SQL controlado |
| administrador | sim | sim | não pelo frontend |
| suporte | sim | não | não |

Usuários sem vínculo são enviados para `/403`. Não há e-mail fixo no código e não existe uso de `service_role` no frontend.

## Rotas

- `/admin`: dashboard global;
- `/admin/empresas`: empresas clientes;
- `/admin/empresas/nova`: novo tenant;
- `/admin/empresas/:id`: visão geral, propriedades e usuários;
- `/admin/empresas/:id/propriedades/nova`: nova propriedade;
- `/admin/propriedades/:id`: dados, unidades e automação;
- `/admin/propriedades/:id/unidades/nova`: nova unidade.

## Dashboard

Todos os números são derivados de consultas reais sujeitas a RLS: empresas ativas, propriedades, unidades, usuários únicos, propriedades com e sem automação, implantações e pendências cadastrais. Sem dados, a interface usa estados vazios.

## Seletor de contexto

No backoffice, o cabeçalho exibe `Administração Essencial Stay`. Selecionar uma empresa abre sua operação e grava apenas o contexto visual. A autorização permanece no banco. Na operação, administradores globais podem retornar ao backoffice pelo ícone de escudo.

## Fluxos de gestão

O administrador pode cadastrar uma empresa, abrir detalhes, adicionar várias propriedades e, em cada uma, administrar unidades e a configuração cadastral de automação. Plano, histórico, reservas, integrações, equipe e manutenção estão identificados como futuros.

## RLS

- administradores globais ativos leem todos os tenants;
- proprietário e administrador global escrevem cadastros;
- suporte global é somente leitura;
- membros comuns enxergam apenas organizações às quais pertencem;
- gerente, administrador e proprietário de tenant gerenciam dados operacionais;
- proprietário e administrador de tenant podem inativar estruturas sem remover o histórico;
- a tabela de administradores não aceita promoção pelo cliente autenticado.

## Operação inicial

O primeiro proprietário global deve ser criado manualmente após as migrations, seguindo `docs/bootstrap-platform-admin.md`.

**Decisão pendente:** workflow auditável para convidar novos administradores globais.

**Decisão pendente:** política de impersonação para suporte; nenhuma impersonação existe hoje.
