# Checklist de teste Akubela — somente leitura

- [ ] Energizar o PG42.
- [ ] Confirmar a conexão de rede.
- [ ] Confirmar o painel no aplicativo/ecossistema Akubela.
- [ ] Confirmar os dois módulos Nova Digital.
- [ ] Anotar os nomes exibidos no sistema.
- [ ] Executar o health em `/admin/akubela`.
- [ ] Listar projetos.
- [ ] Consultar espaços e registrar a limitação retornada.
- [ ] Listar dispositivos.
- [ ] Identificar o PG42 pelos campos reais da API.
- [ ] Identificar os dois módulos pelos campos reais da API.
- [ ] Verificar relação pai/filho.
- [ ] Verificar a quantidade real de canais.
- [ ] Ler o estado inicial disponível.
- [ ] Alterar manualmente uma carga pelo painel físico.
- [ ] Consultar novamente o status pela API.
- [ ] Confirmar se a alteração manual aparece na leitura.
- [ ] Não enviar comandos pela API.
- [ ] Registrar endpoints e respostas sanitizadas.
- [ ] Documentar as limitações observadas.

A alteração de carga deve ocorrer exclusivamente no painel físico. Mantenha `AKUBELA_COMMANDS_ENABLED=false`.
