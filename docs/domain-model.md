# Modelo de domínio do Essencial Stay

## Visão geral

O domínio interno e o banco usam português do Brasil. `Organizacao` é a empresa cliente e a raiz do tenant; não existe uma camada genérica de cliente acima dela.

```text
Essencial Stay
├── AdministradorPlataforma -> Perfil
└── Organizacao (empresa cliente)
    ├── MembroOrganizacao -> Perfil
    └── Propriedade
        ├── Unidade
        └── ConfiguracaoAutomacaoPropriedade
            └── RecursoAutomacaoPropriedade
```

## Organizacao

**Objetivo:** representar uma empresa cliente e sua fronteira de isolamento.

**Atributos:** nome ou razão social, nome fantasia, tipo de pessoa, CPF/CNPJ opcional, contato, logotipo, status e datas.

**Relacionamentos:** possui membros e propriedades; futuramente terá assinatura e limites comerciais.

**Regras:** pode ser pessoa física ou jurídica; pode possuir várias propriedades; nunca representa a própria Essencial Stay; exclusão remove dados dependentes; status permitido: ativo, suspenso ou cancelado.

**Exemplos:** `Hotel Mônaco Ltda.` e `Operação Airbnb Claudio`.

## Perfil

**Objetivo:** complementar `auth.users` com os dados da pessoa autenticada.

**Atributos:** ID igual a `auth.users.id`, nome completo, telefone, avatar, status e datas.

**Relacionamentos:** pode participar de várias organizações e, separadamente, ser administrador da plataforma.

**Regras:** o usuário comum consulta e atualiza apenas o próprio perfil; acesso a uma empresa exige membro ativo; desativação não apaga histórico.

**Exemplo:** Claudio pode ser proprietário global e também membro de uma empresa cliente quando necessário.

## MembroOrganizacao

**Objetivo:** resolver a participação de um perfil em uma empresa cliente.

**Atributos:** organização, perfil, papel, ativo e data de criação.

**Relacionamentos:** pertence a `Organizacao` e `Perfil`.

**Regras:** a combinação organização/perfil é única; papéis: proprietário, administrador, gerente, recepção, limpeza e manutenção; membro inativo não acessa o tenant.

**Exemplo:** uma gerente participa do Hotel Mônaco e de uma pousada com papéis diferentes.

## AdministradorPlataforma

**Objetivo:** autorizar operadores internos do SaaS sem transformá-los em empresa cliente.

**Atributos:** perfil, papel, ativo e datas.

**Relacionamentos:** pertence a `Perfil`; não pertence a `Organizacao`.

**Regras:** papéis globais são proprietário, administrador e suporte; promoção não ocorre no frontend; suporte é somente leitura; vínculo inativo bloqueia `/admin`.

**Exemplo:** Claudio como proprietário global da plataforma.

## Propriedade

**Objetivo:** representar um local de hospedagem de uma empresa cliente.

**Atributos:** organização, nome, tipo, descrição, endereço, país, horários e status.

**Relacionamentos:** pertence a uma organização; possui unidades e configuração própria de automação; futuramente terá reservas e integrações.

**Regras:** uma organização pode possuir várias propriedades; automação é opcional; uma propriedade não pertence a usuário; tipos: hotel, pousada, hostel, resort, apartamento, casa, flat, chalé, cabana, fazenda, condomínio e outro.

**Exemplos:** `Hotel Mônaco` e `Casa Mairiporã`.

## Unidade

**Objetivo:** representar o espaço hospedável dentro da propriedade.

**Atributos:** propriedade, nome, código, tipo, andar, capacidade, status e datas.

**Relacionamentos:** pertence a uma propriedade; futuramente terá reservas, dispositivos, limpeza e manutenção.

**Regras:** código é único por propriedade quando informado; códigos nulos podem repetir; tipos: quarto, suíte, apartamento, chalé, casa inteira, propriedade inteira e outro; pode ser inativada sem apagar histórico.

**Exemplos:** quartos `101`, `102`, `Apartamento modelo` e `Quarto Airbnb`.

## ConfiguracaoAutomacaoPropriedade

**Objetivo:** registrar o inventário cadastral de automação de uma propriedade.

**Atributos:** situação, marca, modelo, situação da instalação, instalador e datas.

**Relacionamentos:** possui relação um-para-um com propriedade e vários recursos.

**Regras:** não conecta fabricante; aceita propriedade sem automação; cada propriedade possui configuração independente.

## RecursoAutomacaoPropriedade

**Objetivo:** normalizar capacidades instaladas ou planejadas.

**Atributos:** configuração e recurso.

**Regras:** o mesmo recurso não se repete na configuração; recursos incluem painel, fechadura, iluminação, ar-condicionado, cortinas, sensores, TV, tomadas, cenas, economia de energia e outro.

## Entidades futuras

- `Reserva`: período, origem, unidade e status da hospedagem.
- `Hospede`: pessoa vinculada à reserva e à jornada digital.
- `Dispositivo`: equipamento associado à propriedade ou unidade.
- `Cena`: conjunto de ações de automação.
- `Integracao`: vínculo cadastral e operacional com um provedor.
- `Automacao`: camada operacional de comandos, eventos e regras.
- `TokenAcesso`: acesso temporário e limitado.
- `Notificacao`: comunicação com equipe ou hóspede.
- `Manutencao`: chamado técnico.
- `Limpeza`: tarefa operacional de preparação.

**Decisão pendente:** escopo de permissões por propriedade.

**Decisão pendente:** política de retenção após cancelamento da empresa cliente.
