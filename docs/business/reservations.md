# Reservas

## Estado: demonstrativo e planejado

O frontend possui telas, fixtures e reservas manuais de demonstração para representar origem PMS/Airbnb e jornadas guiadas. Não existe tabela operacional de reservas nas migrations 001-019, nem sincronização real com PMS, channel manager ou Airbnb.

Portanto, dados em `frontend/src/demo` não são fonte operacional. Uma implementação futura deverá ligar organização, propriedade, unidade, período, origem e status; tratar concorrência, idempotência, cancelamento, privacidade e sobreposição; e manter integrações na propriedade.

Ao documentar ou testar, identifique sempre conteúdo fictício. Não apresente as jornadas de demo como reservas persistidas.
