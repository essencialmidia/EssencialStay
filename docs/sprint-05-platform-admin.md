# Sprint 05 - Administração da plataforma

## Objetivo entregue

O Sprint 05 estabelece a primeira administração funcional do SaaS e corrige a hierarquia para:

```text
Essencial Stay -> Empresas clientes -> Propriedades -> Unidades/Automação
```

## Banco

### Migration 009

- consolida os registros intermediários de `empresas` como `organizacoes`;
- replica os membros existentes para cada empresa migrada;
- restaura `organizacao_id` em propriedades;
- cria `administradores_plataforma`;
- recompõe funções auxiliares e RLS;
- cria a RPC de onboarding com sete parâmetros, idêntica ao repository;
- preserva dados e remove a camada intermediária somente depois da migração.

### Migration 010

- cria `configuracoes_automacao_propriedade`;
- cria `recursos_automacao_propriedade`;
- migra dados dos campos `automacao_*` legados;
- mantém espelho temporário por triggers;
- aplica RLS transitivo pela propriedade.

## Frontend

- contexto de organização para troca segura de empresa ativa;
- contexto de administrador global com papel e status;
- `AdminGate` e página `/403`;
- shell administrativo independente;
- dashboard com dados reais e pendências;
- cadastro/listagem/detalhes de empresas;
- várias propriedades por empresa;
- cadastro, edição, visualização e inativação de unidades;
- configuração cadastral reutilizável de automação;
- alternância entre administração global e operação;
- onboarding oficial sem a camada Cliente -> Empresa.

## Cenários preparados

### Hotel Mônaco

Empresa `Hotel Mônaco Ltda.`, propriedade `Hotel Mônaco`, automação Akubela modelo PG42 em instalação e unidade `Apartamento modelo`.

### Operação Airbnb Claudio

Empresa `Operação Airbnb Claudio`, propriedade `Casa Mairiporã`, automação Tuya em funcionamento e unidade `Quarto Airbnb`.

PMS, GRMS, Airbnb e Tuya Cloud continuam apenas como integrações futuras.

## Limitações

- não há paginação global;
- não há auditoria persistida;
- gestão de convites e papéis ainda não possui interface;
- não há integração externa;
- fluxos completos dependem da aplicação manual das migrations 009 e 010.

## Validação esperada

Após aplicar as migrations e fazer o bootstrap:

1. proprietário global acessa `/admin`;
2. usuário comum recebe `/403`;
3. duas empresas não compartilham dados para membros comuns;
4. uma empresa aceita várias propriedades;
5. uma propriedade aceita várias unidades;
6. automação salva apenas na propriedade selecionada;
7. repetir onboarding não duplica empresa, propriedade ou unidade identificável.
