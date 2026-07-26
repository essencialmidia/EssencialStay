# Deploy do frontend no EasyPanel

Este documento prepara o frontend React/Vite do Essencial Stay para produção. Ele não executa deploy nem altera DNS.

## Arquitetura do container

- Build multi-stage com `node:22-alpine`.
- Dependências instaladas por `npm ci`.
- Build validado por `npm run build`.
- Runtime mínimo com `nginx:1.27-alpine`.
- Porta interna HTTP: `80`.
- Healthcheck: `GET /healthz`, resposta `200 ok`.
- Fallback SPA: rotas desconhecidas no filesystem recebem `index.html`.
- Assets versionados em `/assets/`: cache imutável de um ano.
- `index.html`: sem cache persistente.

## Variáveis públicas

Configure antes do build:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_OU_PUBLISHABLE
VITE_DEMO_PUBLIC_ORIGIN=https://essencialstay.com.br
```

Variáveis `VITE_` são incorporadas ao bundle e ficam públicas. Nunca configure `service_role`, senha de banco, token de PMS/Akubela ou outro segredo.

## Configuração recomendada no EasyPanel

1. **Project:** crie ou selecione o projeto Essencial Stay.
2. **Service:** adicione um serviço do tipo **App**.
3. **Source:** selecione o repositório Git/GitHub e a branch de produção.
4. **Build:** selecione **Dockerfile**.
   - Contexto/root do repositório: `.`
   - Caminho do Dockerfile: `Dockerfile`
   - Não sobrescreva `CMD` ou argumentos.
5. **Environment:** adicione as três variáveis públicas listadas acima antes do primeiro build.
6. **Domains & Proxy:**
   - domínio: `essencialstay.com.br`;
   - protocolo do container: HTTP;
   - proxy/target port: `80`;
   - habilite HTTPS/Let's Encrypt;
   - marque o domínio como principal.
7. **Volumes/Mounts:** nenhum.
8. Faça o deploy somente após aprovação.

O EasyPanel constrói uma imagem Docker a partir do repositório quando encontra um Dockerfile e disponibiliza as variáveis da seção Environment em build e runtime. O proxy deve apontar para a porta em que a aplicação escuta.

## Validação após um deploy aprovado

Verifique acesso direto e atualização do navegador em:

```text
/
/login
/dashboard
/reservas
/experiencia-hospede
/demo/29-07
/demo/29-07/hospedagens
/s/hotel-monaco-demo
/healthz
```

As rotas autenticadas podem redirecionar para `/login` quando não houver sessão; isso confirma que o fallback SPA funcionou. `/s/hotel-monaco-demo` permanece pública e sem menus administrativos.

`/s/studio-vila-nova-demo` não foi criada. A estrutura de rotas aceita sua adição futura sem mudanças no Nginx.

## Teste local

Na raiz do repositório:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="SUA_CHAVE_PUBLICA" \
  --build-arg VITE_DEMO_PUBLIC_ORIGIN="https://essencialstay.com.br" \
  -t essencial-stay-frontend:local .

docker run --rm -p 8080:80 essencial-stay-frontend:local
```

Abra `http://127.0.0.1:8080`.
