# Integração Ekaza/Tuya

## Estado: implementada em fase segura de leitura

Ekaza é tratada como experiência/provedor e Tuya como API técnica subjacente. O backend possui configuração por ambiente, assinatura HMAC, cache de token, paginação de dispositivos, mapeamento, sanitização e health check. Endpoints protegidos consultam inventário, detalhes, status e especificações.

O modo real é desligado por padrão. Dispositivos fora da allowlist não têm detalhes consultados. Ausência de conectividade não é convertida automaticamente em estado offline. Logs removem identificadores e campos sensíveis.

## Limites

Comandos de fechadura e PINs operacionais não estão liberados. O Automation Lab usa sessões temporárias, mocks e leitura controlada; não cria reserva, faturamento ou efeito operacional. Veja `docs/integracoes/ekaza-tuya-fase-1.md`.
