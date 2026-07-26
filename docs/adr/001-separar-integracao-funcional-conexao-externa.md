# ADR 001 - Separar integração funcional de conexão externa

## Status

Aceito.

## Contexto

O banco já possui `public.integracoes_propriedade`, criada em uma etapa anterior para representar integrações funcionais diretamente relacionadas a uma propriedade, incluindo PMS, channel manager, motor de reservas, check-in digital, GRMS e IA.

O novo núcleo precisa representar outro conceito: uma conta ou conexão técnica com um provedor externo que pertence à organização e pode atender uma ou várias propriedades.

## Decisão

`public.integracoes_propriedade` será preservada integralmente para o modelo funcional legado.

O novo núcleo utilizará:

- `public.conexoes_integracao` para a conexão externa da organização;
- `public.conexoes_integracao_propriedades` para a associação N:N com propriedades;
- `public.origens_dispositivo` para identidades de dispositivos fornecidas por essas conexões.

Não serão criados aliases, views ou abstrações que apresentem os dois modelos como equivalentes.

## Justificativa

Integração funcional descreve uma capacidade de negócio associada à propriedade, como PMS ou GRMS. Conexão externa descreve uma conta técnica, ambiente de execução e provedor, podendo ser compartilhada por várias propriedades.

Reutilizar a tabela existente mudaria sua semântica, exigiria remover constraints e poderia invalidar dados ou consumidores atuais. Alterar a migration 008, já considerada aplicada no ambiente, também destruiria a rastreabilidade do banco.

## Consequências

- Os dois modelos coexistirão com nomes explícitos.
- O novo núcleo não consulta nem modifica `integracoes_propriedade`.
- Conexões e propriedades podem evoluir independentemente das integrações funcionais.
- A duplicidade conceitual aparente é aceita para preservar compatibilidade e clareza semântica.

## Revisão futura

O modelo legado deverá ser revisado quando o módulo de PMS, channel manager ou GRMS entrar em implementação real. Nesse momento serão conhecidos os contratos, identificadores externos e requisitos de sincronização necessários.

Uma eventual unificação exigirá sprint próprio, inventário dos dados existentes, estratégia de migração, compatibilidade temporária, validação de RLS e plano de reversão. Ela não poderá ser realizada como refatoração incidental de outro sprint.
