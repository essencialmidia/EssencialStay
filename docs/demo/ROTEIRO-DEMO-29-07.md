# Roteiro — Demo Essencial Stay 29/07/2026

Tempo estimado: 5 minutos.

## Narrativa

1. **Dashboard e piloto (25 s).** Abra o Dashboard e explique que o Hotel Summit Monaco possui um apartamento piloto aprovado.
2. **Operação de hospedagens (35 s).** Entre em **Reservas**. Mostre chegadas, hospedados, saídas, próximas hospedagens e a única pendência.
3. **Hospedagem principal (35 s).** Abra Claudio Palombo, Apartamento 901. “A reserva continua sendo gerenciada pelo PMS e chegaria automaticamente à Essencial Stay.”
4. **Preparação da experiência (35 s).** Percorra a timeline: unidade, experiência, portal, automação e comunicação.
5. **Comunicação (30 s).** Mostre a mensagem enviada ao hóspede e os canais demonstrativos.
6. **Experiência do Hóspede (25 s).** Abra a tela administrativa da experiência e destaque que a Akubela é integrada, não protagonista.
7. **Portal Premium (45 s).** Abra `/s/hotel-monaco-demo`. “O hóspede não precisa instalar aplicativo.”
8. **Acesso e informações (35 s).** Revele o PIN fictício, masque novamente, copie Wi-Fi e mostre validade.
9. **Automação, concierge e serviços (45 s).** Alterne luz, climatização e cenas; mostre guia, recepção e checkout.
10. **Dados necessários do PMS (30 s).** Retorne aos detalhes e explique os dados e eventos necessários, sem afirmar integração concluída.
11. **Encerramento (20 s).** “Menos atrito para o hóspede, menos tarefas repetitivas para a recepção e uma experiência consistente em todos os canais.”

## Cenário short stay

- A hospedagem poderá ser cadastrada manualmente.
- A origem será informada somente durante o cadastro e permanecerá secundária na operação.
- A senha Yale será inicialmente criada manualmente no Yale Connect e apenas confirmada na Essencial Stay.
- O mesmo registro de hospedagem gerará portal, preparação e comunicação ao hóspede.

## O que é real

- Interface responsiva e navegável.
- Contratos tipados e separação entre interface, adapters e fixtures.
- QR apontando para a URL atual do portal.
- Estados e feedback visual dos comandos.

## O que está simulado

- Reserva e origem PMS.
- Hóspede, PIN, Wi-Fi e conteúdo do hotel.
- Resposta Akubela e comandos de automação.
- Checkout e dicas locais.

## Perguntas prováveis

- **Já integra com o PMS?** A demonstração usa um adapter isolado. A integração real depende da documentação, autenticação e eventos oferecidos pelo PMS escolhido.
- **A fechadura está sendo acionada?** Não. O adapter Akubela é demonstrativo e nenhum comando real é enviado.
- **Funciona com outros canais?** Sim, a jornada é independente do canal; o PMS permanece como fonte de reservas.
- **Como será a segurança?** Tokens e credenciais ficarão no backend, com isolamento por tenant e acesso temporário vinculado à hospedagem.
- **O hotel pode personalizar?** A base suporta conteúdo e identidade da propriedade; regras de white label ainda serão definidas.

## Contingência

- **Internet indisponível:** o QR é gerado localmente e continua visível. A interface e os adapters não dependem da internet; mantenha o computador e o celular na mesma rede local.
- **QR Code indisponível:** use o botão **Abrir Portal do Hóspede** ao lado do QR ou digite `/demo/29-07/portal`. A tela exibe uma mensagem amigável se até o fallback falhar.
- **Celular fora da rede:** apresente o portal no navegador do computador, usando a largura móvel, ou conecte ambos ao mesmo hotspot antes da reunião.
- **Servidor local fechado:** abra o terminal no diretório `frontend` e execute `npm.cmd run dev -- --host 0.0.0.0`. Confirme a rota administrativa antes de iniciar a apresentação.
- Para celular na mesma rede, descubra o IPv4 do computador com `ipconfig` e abra `http://IP:5173/demo/29-07`. O QR codifica automaticamente `http://IP:5173/s/hotel-monaco-demo`.
- Quando publicada no domínio oficial, a rota preparada é `https://essencialstay.com.br/s/hotel-monaco-demo`. Até a publicação, a aplicação seleciona automaticamente a origem local.
- Deploy, preview ou túnel somente com aprovação.

## Abertura e encerramento

- **Frase inicial:** “O PMS cuida da reserva; a Essencial Stay transforma essa reserva em uma experiência digital completa para o hóspede.”
- **Frase final:** “Com a Essencial Stay, cada hospedagem ganha acesso, conforto e informação em uma jornada simples para o hóspede e eficiente para o hotel.”
