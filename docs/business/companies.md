# Empresas clientes

No código e banco, a empresa cliente é `organizacao`. Ela pode representar pessoa física ou jurídica e é a fronteira de isolamento do tenant. A própria Essencial Stay não é cadastrada como organização.

Uma organização possui membros e propriedades, pode estar ativa, suspensa ou cancelada e pode ter identidade visual. Pessoas acessam a empresa por vínculo em `membros_organizacao`; não recebem propriedade direta dos imóveis.

O modelo histórico `clientes -> empresas` da migration 008 é obsoleto e não deve orientar novas implementações. Cancelamento/inativação lógica é o modelo vigente após a migration 019.

Veja [multi-tenant](../architecture/multi-tenant.md) e `docs/domain-model.md`.
