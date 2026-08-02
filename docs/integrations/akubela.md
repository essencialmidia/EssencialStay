# Integração Akubela

## Estado: implementada em fase somente leitura

O backend possui autenticação, cliente OpenAPI, provider, mapeadores de dispositivos/status/capacidades, cache de token e erros sanitizados. Endpoints consultam saúde, locais, espaços, inventário, detalhes, status e capacidades.

A autenticação e a chave administrativa ficam no servidor. IDs permitidos são controlados por allowlist; listagem pode descobrir itens, mas detalhes e estados exigem autorização. Tokens e credenciais não retornam nas respostas nem nos logs.

O frontend possui repository OpenAPI, repository mock e telas de laboratório/administração. O laboratório não homologa automaticamente, não cria reservas e não inicia comandos reais.

## Limites

Comandos e automação operacional não estão implementados. A fase documentada é de leitura e validação técnica. Consulte `docs/integracoes/akubela-fase-1.md` para detalhes históricos e checklist específico.
