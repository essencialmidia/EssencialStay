# Arquitetura do backend

## Estado atual

`backend` é um serviço HTTP Node.js sem framework, iniciado por `server.js`. Ele expõe health checks e consultas somente leitura para Akubela e Ekaza/Tuya. CORS é limitado por configuração e respostas de erro usam códigos sanitizados.

## Organização

- `automation/provider-contract.js`: operações mínimas do provider.
- `automation/provider-registry.js`: registro validado de providers.
- `akubela`: configuração, autenticação, cliente, provider, mapeadores e erros.
- `ekaza`: configuração, autenticação Tuya, cliente, provider, mapeadores e serviço de fechadura.
- `test`: testes Node para configuração, segurança, mapeamento e endpoints.

O contrato comum cobre saúde, locais, espaços, dispositivos, detalhes, estados e capacidades. A implementação atual bloqueia comandos fora da allowlist de leitura. Endpoints de inventário exigem chave administrativa configurada no servidor; health checks não revelam credenciais.

Pastas vazias de adapters, controllers, routes, services, models e middlewares são fundações, não módulos entregues. NestJS é direção futura, não tecnologia atual. Veja [integrações](../integrations/akubela.md) e [segurança](security.md).
