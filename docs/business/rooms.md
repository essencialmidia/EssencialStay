# Unidades e quartos

`unidade` é o espaço hospedável dentro de uma propriedade. Pode ser quarto, suíte, apartamento, chalé, casa/propriedade inteira ou outro tipo aceito. O termo “quarto” é uma apresentação possível, não substitui a entidade genérica.

O código, quando informado, é único dentro da propriedade. A unidade registra capacidade, andar, ativação e estado operacional. A migration 019 separa estado atual, histórico, tarefas e bloqueios; transições críticas usam RPCs, locks e idempotência.

Uma unidade herda o tenant pela propriedade. Dispositivos e ambientes podem se relacionar a ela sem romper essa cadeia. Exclusão física não é o padrão atual.
