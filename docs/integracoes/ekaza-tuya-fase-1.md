# Ekaza/Tuya — Fase 1 segura

## Diagnóstico do legado

O pacote legado confirmou a assinatura HMAC-SHA256 da Tuya, cache local de `access_token`, renovação baseada em `expire_time` e o fluxo de senha temporária por `password-ticket` com AES-256-ECB para o ticket e AES-128-ECB/PKCS7 para o PIN.

Ele não é adotado como serviço de produção porque aceita `deviceId` e comandos livres do navegador, retorna respostas brutas da Tuya, retorna o PIN em HTTP, não isola organização/propriedade/unidade e usa validade fixa de 90 dias. O endpoint de abertura remota foi deliberadamente descartado.

## Implementado

`backend/ekaza` reaproveita somente o motor de assinatura, token e criptografia, em módulos separados. A Fase 1 expõe:

- `GET /api/v1/integrations/ekaza/health`
- `GET /api/v1/integrations/ekaza/devices` (somente quando `EKAZA_MODE=real`, `EKAZA_REAL_ENABLED=true` e `EKAZA_DEVICE_READ_ENABLED=true`)
- `GET /api/v1/integrations/ekaza/devices/:providerDeviceId/status` (mesmas flags e allowlist)

As respostas são sanitizadas e nunca incluem credenciais, tokens, `ticket_key`, resposta bruta ou PIN. O segundo endpoint exige sempre a chave `x-ekaza-admin-key`; ele permanece bloqueado até que `EKAZA_ADMIN_API_KEY` esteja configurada. Ambos possuem rate limit local de 30 requisições por minuto por origem de socket.

Não existem endpoints de comando, abertura de porta, geração de PIN, revogação, portal ou migrations nesta fase. Portanto não há associação persistida de organização, propriedade e unidade ainda.

## Flags

Todas começam desabilitadas no arquivo `backend/.env.example`:

`EKAZA_MODE`, `EKAZA_REAL_ENABLED`, `EKAZA_DEVICE_READ_ENABLED`, `EKAZA_DEVICE_COMMANDS_ENABLED`, `EKAZA_TEMPORARY_ACCESS_ENABLED`, `EKAZA_GUEST_PORTAL_ENABLED` e `EKAZA_AUTOMATIC_REVOCATION_ENABLED`.

## Próximas fases

Fase 2 associa dispositivos ao modelo interno e limita leitura por organização/unidade. Fase 3 permite uma lâmpada de teste por allowlist. Fase 4 implementa senha temporária e revogação idempotente após confirmar na documentação primária da Tuya o endpoint de remoção. Fases 5 e 6 conectam o portal e o checkout.

## EasyPanel

A arquitetura final recomendada é migrar este backend para o serviço oficial do Essencial Stay e expor `api.essencialstay.com.br`. Como transição, o serviço legado `stay` pode permanecer somente em rede privada, protegido por segredo interno, CORS restrito e autenticação; ele não deve expor endpoints sensíveis publicamente.

O primeiro teste manual seguro é configurar as flags de leitura, chamar o health check e depois listar/status de um dispositivo explicitamente permitido. Não criar PIN, executar comando ou abrir porta nessa validação.
