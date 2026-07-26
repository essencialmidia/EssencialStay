# Produto: Essencial Stay

## Visao geral

O Essencial Stay e uma plataforma SaaS de gestao de hospedagens inteligentes para proprietarios de Airbnb, casas de temporada, pousadas e hoteis.

O produto nasce para centralizar a operacao da hospedagem em uma unica plataforma: propriedades, unidades, reservas, hospedes, equipe, experiencia do hospede, automacao e integracoes externas.

A automacao e um modulo da plataforma, nao o centro do produto. O Essencial Stay deve funcionar para clientes sem automacao, com Tuya, com Akubela e, no futuro, com outros fabricantes.

## Publico-alvo

O publico-alvo inclui:

- proprietarios de um ou poucos imoveis anunciados no Airbnb ou em canais similares;
- administradores de casas de temporada;
- pousadas pequenas e medias;
- hoteis independentes;
- operadores que desejam oferecer uma experiencia digital ao hospede;
- empresas que precisam gerenciar multiplas propriedades, unidades, usuarios e integracoes.

## Problema que resolve

Operacoes de hospedagem costumam depender de ferramentas separadas: planilhas, grupos de mensagem, aplicativos de automacao, PMS, canais de reserva, fechaduras, controles de ar-condicionado e comunicacao manual com hospedes.

Isso cria problemas recorrentes:

- dificuldade para acompanhar reservas, status das unidades e demandas da equipe;
- dependencia de aplicativos de fabricantes de automacao;
- pouca padronizacao na experiencia do hospede;
- gestao fragmentada entre propriedades e usuarios;
- risco operacional ao compartilhar senhas, acessos e credenciais;
- falta de visibilidade sobre eventos, alteracoes e historico da operacao.

## Proposta de valor

O Essencial Stay oferece uma base unica para operar hospedagens de forma profissional, escalavel e independente de fabricante.

A proposta de valor e:

- organizar propriedades, unidades, reservas, hospedes e equipe;
- permitir automacao quando ela existir, sem tornar o produto dependente dela;
- integrar canais, PMS e fabricantes por meio de adapters;
- entregar ao hospede uma experiencia digital simples e controlada;
- preparar a operacao para crescimento multiempresa;
- preservar isolamento, seguranca e governanca entre clientes.

## Pilares do produto

### 1. Gestao da propriedade

Cadastro e organizacao de empresas clientes, propriedades, unidades, configuracoes, regras, equipe e permissoes de acesso.

### 2. Gestao da hospedagem

Controle operacional de reservas, hospedes, check-in, checkout, status das unidades, limpeza, manutencao e recepcao.

### 3. Experiencia do hospede

Portal ou link temporario para o hospede acessar informacoes essenciais da estadia, como Wi-Fi, regras, contato do anfitriao, QR Code, mensagens e controles permitidos.

### 4. Automacao

Modulo opcional para conectar dispositivos, cenas e comandos de automacao. Deve suportar operacao sem automacao, com Tuya, com Akubela e futuramente com outros fabricantes.

### 5. Integracoes

Conexoes com servicos externos como Airbnb, WuBook, Stays.net, WhatsApp, pagamentos, PMS e outros sistemas usados na operacao.

## Modulos principais

- empresas clientes;
- usuarios e perfis de acesso;
- propriedades;
- unidades ou quartos;
- reservas;
- hospedes;
- status operacional da unidade;
- automacao;
- dispositivos;
- cenas;
- portal do hospede;
- integracoes externas;
- logs e auditoria;
- planos e faturamento, em fase comercial futura.

## Escopo do MVP

O MVP deve validar a base operacional do SaaS antes de expandir para integracoes complexas.

Entram na primeira versao:

- autenticacao;
- empresas clientes;
- usuarios;
- propriedades;
- unidades;
- estrutura inicial de banco de dados;
- dashboard inicial;
- cadastro basico de hospedes;
- reservas manuais;
- check-in e checkout basicos;
- status da unidade;
- portal basico do hospede;
- base tecnica preparada para adapters.

Ficam para versoes futuras:

- integracao completa com Tuya;
- integracao completa com Akubela;
- importacao automatica de dispositivos;
- controle de luzes, tomadas, ar-condicionado, cenas e fechaduras;
- senhas temporarias em fechaduras quando suportadas;
- integracoes PMS;
- integracao Airbnb;
- integracao WuBook;
- integracao Stays.net;
- WhatsApp;
- pagamentos;
- planos, assinaturas e faturamento;
- white label;
- permissoes avancadas;
- relatorios avancados.

## Tuya e Akubela dentro do produto

Tuya e Akubela devem ser tratados como integracoes por adapter. Eles nao definem a arquitetura principal, a experiencia central nem o modelo de negocio do Essencial Stay.

O produto deve continuar util mesmo quando um cliente nao tiver nenhum dispositivo conectado. A automacao aumenta o valor da plataforma, mas nao deve bloquear a gestao da hospedagem.

## Exemplos de uso

### Proprietario com um Airbnb

Um proprietario com um apartamento anunciado no Airbnb pode usar o Essencial Stay para cadastrar sua propriedade, controlar reservas manuais, organizar dados dos hospedes, acompanhar check-in e checkout e compartilhar um link com informacoes da estadia.

Se o apartamento tiver automacao Tuya, o proprietario podera futuramente associar dispositivos a unidade e liberar controles especificos para o hospede durante o periodo da reserva.

### Pousada pequena

Uma pousada com poucos quartos pode usar o Essencial Stay para cadastrar cada quarto como uma unidade, acompanhar o status de limpeza e manutencao, registrar hospedes, organizar reservas e orientar a recepcao.

Com automacao, a pousada podera futuramente padronizar cenas por quarto, controlar ar-condicionado e consultar logs de uso.

### Hotel

Um hotel pode usar a plataforma para estruturar sua empresa cliente, suas propriedades, quartos, reservas, perfis de equipe e integracoes com sistemas externos.

O Essencial Stay deve permitir evolucao para operacoes com muitas unidades, multiplos perfis de acesso, logs, permissoes avancadas e integracoes PMS.

### Cliente sem automacao

Um cliente sem automacao pode usar o Essencial Stay para gestao de propriedades, unidades, reservas, hospedes, equipe, status operacional e portal basico do hospede.

Nesse caso, o modulo de automacao fica desativado ou vazio, sem prejudicar o uso principal da plataforma.

## Decisoes pendentes

- Decisao pendente: definir o nome comercial dos planos.
- Decisao pendente: definir os limites de cada plano.
- Decisao pendente: definir se o MVP tera portal do hospede publico, autenticado ou por token temporario.
- Decisao pendente: definir quais funcionalidades de automacao entram no primeiro piloto real.
