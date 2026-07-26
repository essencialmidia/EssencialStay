# Modelo de automação por propriedade

## Decisão

Automação é uma capacidade opcional da propriedade. Não pertence à empresa inteira e não representa o núcleo do produto.

## Estrutura

`configuracoes_automacao_propriedade` mantém uma relação um-para-um com `propriedades` e registra:

- não possui, já possui ou será instalada;
- marca e marca livre quando necessária;
- tipo ou modelo em texto;
- situação da instalação;
- instalador responsável.

`recursos_automacao_propriedade` mantém os recursos em linhas únicas, evitando arrays crescentes no modelo principal.

## Marcas

Akubela, Tuya, Ekaza, Aqara, Shelly, Sonoff, Control4, KNX, outra e não informada.

## Recursos

Painel, fechadura, iluminação, ar-condicionado, cortinas, sensores, TV, tomadas, cenas, economia de energia e outro.

## Compatibilidade legada

Os campos `automacao_status`, `automacao_marca`, `automacao_marca_outro`, `automacao_instalacao_status`, `automacao_recursos` e `automacao_configurada` em `propriedades` são espelhos temporários. O modelo normalizado é a fonte de verdade após a migration 010.

Mapeamento relevante:

- recurso legado `cena_boas_vindas` -> `cenas`;
- marcas `sonoff` e `nao_informada` não existem no check legado e são espelhadas como marca nula;
- existir uma configuração marca `automacao_configurada` como verdadeira.

**Decisão pendente:** sprint de remoção dos campos legados após todos os consumidores migrarem.

## Fora do escopo

Não existem credenciais, dispositivos, comandos, cenas executáveis ou chamadas a fabricantes. Tuya e Akubela serão adapters futuros acessados somente pelo backend.
