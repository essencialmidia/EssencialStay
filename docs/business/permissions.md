# Permissões

## Empresa cliente

Papéis de membro existentes: proprietário, administrador, gerente, recepção, limpeza e manutenção. Um vínculo inativo não concede acesso. Funções do banco distinguem participação, gestão e administração; políticas RLS aplicam essas decisões por tabela/operação.

## Plataforma

Papéis globais: proprietário, administrador e suporte. Administração global não transforma a Essencial Stay em tenant. Suporte é consulta; promoção global não ocorre pelo frontend.

## Regras invariáveis

- O contexto selecionado no frontend não concede permissão.
- A mesma pessoa pode ter papéis diferentes em organizações diferentes.
- Recursos de propriedade devem resolver a organização antes de autorizar.
- Novas permissões exigem RLS e testes de negação entre tenants.

O detalhamento executável está nas migrations vigentes; a UI apenas reflete capacidades concedidas.
