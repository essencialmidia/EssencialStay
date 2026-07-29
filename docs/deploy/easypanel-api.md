# API Essencial Stay no EasyPanel

Este guia prepara somente o serviço independente da API. Ele não altera o serviço do frontend nem o serviço legado `stay`.

## Configuração do serviço

- **Build Context:** `backend`
- **Dockerfile:** `backend/Dockerfile` (o caminho é relativo à raiz do repositório)
- **Porta interna:** `3000`
- **Comando de inicialização:** `npm start` no ambiente local; a imagem executa `node server.js`.
- **Health check:** `GET /api/v1/integrations/ekaza/health`

Ao criar a App no EasyPanel, aponte o repositório para esta raiz e informe `backend` como contexto de build. Se a interface solicitar o Dockerfile relativo ao contexto, use `Dockerfile`; se solicitar o caminho relativo ao repositório, use `backend/Dockerfile`.

## Variáveis de ambiente

Configure as variáveis no serviço da API — nunca envie um arquivo `.env` ao repositório.

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `PORT` | Não (padrão `3000`) | Porta HTTP interna. Use `3000` no EasyPanel. |
| `ALLOWED_ORIGINS` | Sim para consumo pelo frontend | Lista separada por vírgulas dos domínios autorizados, por exemplo `https://essencialstay.com.br`. |
| `EKAZA_ADMIN_API_KEY` | Sim para os endpoints administrativos | Chave privada enviada no cabeçalho `x-ekaza-admin-key`. Não exponha no frontend. |
| `EKAZA_MODE` | Não (padrão `demo`) | Use `real` somente após validação da integração. |
| `EKAZA_REAL_ENABLED` | Sim no modo real | `true` permite a conexão real; mantenha `false` inicialmente. |
| `EKAZA_DEVICE_READ_ENABLED` | Sim para leitura real de dispositivos | `true` libera somente leituras autorizadas. |
| `EKAZA_ALLOWED_DEVICE_IDS` | Sim para leitura real | IDs permitidos separados por vírgula. |
| `TUYA_BASE_URL` | Sim no modo real | Endpoint regional OpenAPI da Tuya. |
| `TUYA_CLIENT_ID` | Sim no modo real | Credencial da aplicação Tuya. |
| `TUYA_CLIENT_SECRET` | Sim no modo real | Segredo da aplicação Tuya. |
| `TUYA_UID` | Sim para listar dispositivos reais | Usuário Tuya associado. |
| `TUYA_TIMEOUT_MS` | Não (padrão `8000`) | Limite de tempo das chamadas Tuya. |
| `TUYA_SPACE_ID` | Não nesta fase | Reservado para as próximas fases. |

As flags `EKAZA_DEVICE_COMMANDS_ENABLED`, `EKAZA_TEMPORARY_ACCESS_ENABLED`, `EKAZA_GUEST_PORTAL_ENABLED` e `EKAZA_AUTOMATIC_REVOCATION_ENABLED` permanecem em `false`. A Fase 1 não expõe comandos, criação de PIN, portal nem revogação.

## Domínio e deploy

Associe ao serviço da API apenas um domínio próprio de API, como `api.essencialstay.com.br`, quando ele estiver disponível. Não altere o domínio ou o container do frontend. Após configurar as variáveis, faça o deploy da App; o container usa Node 22 Alpine, executa como usuário não-root e não inclui credenciais na imagem.

Confirme a disponibilidade com:

```text
https://api.seu-dominio/api/v1/integrations/ekaza/health
```

Esse endpoint é seguro para health check e não retorna segredos. Os endpoints de dispositivos exigem a chave administrativa e continuam bloqueados no modo demonstrativo.
