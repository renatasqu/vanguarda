# Sunburst e Auditoria

O Dashboard mantém os gráficos, indicadores, filtros e exportações anteriores e adiciona Sunburst SVG sem bibliotecas externas. O orçamento dos seis projetos sintéticos soma 240 R$ milhões: Incorporações 84, Logística 56, Energia 100. O anel interno mostra divisões e o externo projetos; os dois representam o mesmo total e não devem ser somados. Cada ID de projeto é contado uma vez. Não são somados percentuais, índices CPI/SPI nem sinais de risco. Não há categorias estruturadas de risco, somente descrições livres, portanto não foi criado um terceiro anel fictício.

Os filtros do Dashboard controlam o Sunburst. Hover/foco mostram nome, valor, unidade, participação no total filtrado e situação. Clique/Enter/Espaço exploram divisão ou projeto; breadcrumb e “Voltar ao total” restauram níveis. Uma tabela alternativa oferece os mesmos valores e o total. Orçamentos inválidos são excluídos com aviso e ausência de orçamento positivo produz estado vazio. As famílias pervinca, teal e violeta identificam divisões, com cores estáveis ao filtrar. Situações usam nomes no tooltip e tabela; teal, âmbar, vermelho e cinza permanecem na legenda semântica e nos alertas. SVG, controles e legenda adaptam-se ao celular; superfícies usam os tokens de vidro do tema, com aparência sólida e movimento reduzido preservados.

## Operações e autoria

Ações corretivas novas têm identificador UUID, edição e exclusão no Simulador. Interesses continuam sendo adicionados na vitrine. Essas operações gravam estado e evento juntos em uma única entrada do diário JSONL do servidor, com fila de escrita de uma instância, fsync e reversão do tamanho do arquivo se a gravação falhar. Leitura reconstrói registros usando somente operações concluídas; exclusões mantêm no evento ID e identificação mínima do registro. Tentativas recusadas são eventos separados, com resultado “falhou”, sem mudança de estado. Falhas na persistência impedem confirmação de sucesso.

Isso é um diário transacional local, não um banco de dados com garantias distribuídas. Exige uma única instância e disco persistente. Uma linha incompleta ou corrupção impede a leitura; deve ser restaurada de backup por administrador. Para produção com múltiplas instâncias ou exigência de transações de banco, migrar estado e eventos para a mesma transação SQL. A interface/API não permitem editar nem apagar eventos; administradores do sistema operacional continuam capazes de modificar o arquivo, portanto imutabilidade regulatória exige armazenamento externo apropriado.

A identidade do autor vem da sessão (`sub`). O nome, quando disponível, vem do arquivo de autorizados mantido no servidor (`name`); sem nome disponível, é exibido o identificador. O campo “Responsável” de uma ação é dado de negócio e não prova de autoria. Texto da ação e responsável são omitidos/mascarados no log; token, cookie, senha e corpo bruto da requisição não são incluídos. Detalhes exibem somente campos permitidos, como projeto, imóvel, prazo, execução e despesa. Campos alterados são calculados antes do mascaramento.

Registros antigos dos arquivos de ações continuam legíveis, sem inventar eventos, datas ou autores. Eles não podem ser editados/excluídos pela nova interface; a ausência de ID auditável é informada. Novos registros usam `data/audit-journal.jsonl` no modo seguro e `data/demo-journal.jsonl` no protótipo. Os interesses antigos continuam no arquivo legado e não recebem histórico retroativo.

## Permissões e eventos de autenticação

`GET /api/audit` exige permissão `audit` validada no servidor. Para consultar a página no modo seguro, a pessoa deve ter `pmo` e `audit` no arquivo `AUTHORIZED_USERS_FILE`. Adicione `name` verdadeiro quando disponível. Não há concessão automática dessa permissão no modo seguro. Não existem endpoints de alteração/exclusão do log. Busca, usuário, período UTC, ação, módulo e resultado são filtrados no servidor; página tem 20 eventos, ordenados do mais recente para o mais antigo.

Entradas OIDC concluídas, recusadas e saídas realizadas pelo aplicativo são registradas quando o servidor cria o adaptador de autenticação. Uma confirmação inválida sem identidade verificável recebe “Identidade não validada”, não uma autoria inventada. Não existe integração com o feed de eventos externos do provedor nem editor de permissões no aplicativo. Mudanças no arquivo feitas fora da aplicação e eventos externos do provedor não têm ator disponível: sua ingestão permanece pendente de integração com o serviço administrativo/provedor, com identidade verificável. Não são inferidos nem fabricados eventos a partir de diferenças do arquivo.

## Demonstração e configuração

`npm start` mantém entrada direta no protótipo. A Auditoria está disponível nessa demonstração e identifica todos os eventos como operações do protótipo com identidade não verificada; não é apresentado como auditoria corporativa real. Os modos têm diários separados. A produção continua exigindo `npm run start:secure`, OIDC real, lista de autorizados e disco persistente; consulte ACESSO.md. Mantenha a pasta data fora da publicação web, com permissões restritas e backup.

## Verificação

`npm test` verifica totais e filtros da hierarquia, exclusão de bases inválidas, ausência de dupla contagem, CRUD, autoria vinda do servidor, isolamento de conta, resultado de falhas, mascaramento, UUIDs, paginação, consulta por administrador e persistência ao abrir novamente o store. Verificações HTTP adicionais são realizadas no servidor local. A verificação visual em desktop/celular depende da disponibilidade do navegador integrado e é reportada separadamente; os testes de dados não equivalem à validação visual.

## Histórico no projeto

Os detalhes e cartões de cada projeto disponibilizam Histórico de alterações. A leitura usa `GET /api/projects/:id/history`, sem criar eventos. Os dados exibem autoria validada pelo servidor (ou identificação demonstrativa), horário de Brasília, operação, campo, valor anterior e novo; justificativa aparece somente quando existe. A consulta apresenta valores mascarados como no log administrativo. PMO consulta eventos próprios; `audit` permite todos os eventos daquele projeto. Ausência de eventos, falhas de leitura e paginação têm estados explícitos.
