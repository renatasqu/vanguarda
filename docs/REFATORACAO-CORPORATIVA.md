# Front-end final — 11 de outubro de 2026

A stack continua HTML/CSS/JavaScript estático em `dist`, sem dependências novas e sem etapa de build. Foram reutilizados os componentes de `ui.js` e o Sunburst SVG existentes. Neste anexo somente o texto do pedido estava disponível: o gradiente segue as cores descritas e os componentes seguem a base atual do projeto. Não houve comparação com uma imagem ou com arquivos externos de design system ausentes.

## Identidade e navegação

Inter 400/500/600, números tabulares, fundo #F3F5F7 e títulos externos #172438. Cards mantêm a paleta escura original. Tokens centralizam paleta, raios, espaçamentos, sombras, reflexo e blur. A marca existente é composta em HTML, com espaço de 208 px no menu/login; não foi recriada como imagem.

Login com topo quase preto, transição roxa e luz violeta inferior. Marca/apresentação à esquerda, uma superfície de vidro para confirmação à direita; uma coluna no celular. Nenhum campo de credenciais foi inventado: o fluxo atual exige Confirmar, com carregamento, erros e OIDC no modo seguro preservados.

Menu com vidro escuro, blur de 20 px, variações discretas violeta/azul/teal e item ativo em cápsula. Menu de usuário no cabeçalho inclui Sair com encerramento real da sessão. Dropdown permanece fora do overflow do menu lateral. Navegação móvel recolhível, foco por teclado, fallback sólido, preferência sem transparência e movimento reduzido preservados.

## Dashboard e limites dos dados

Os cinco indicadores do Conselho aparecem em destaque: entregues no prazo; dentro do orçamento; viabilidade/aprovações completas; benefícios alcançados versus planejados; críticos com planos atualizados. Todos mostram **Sem dados**, pois a fonte não registra conclusão/custos finais, aprovações formais, benefícios medidos nem planos aprovados com política de revisão. Despesas acumuladas e SPI não foram usados como substitutos. Metodologia explica as bases necessárias. Não foram fabricados históricos, probabilidades ou percentuais.

Orçamento, despesas, projeção demonstrativa e contagem de sinais críticos continuam calculados a partir dos filtros. Sunburst principal Vanguarda → Divisão → Projeto, setores por orçamento (R$ milhões), cores estáveis, tooltip com participação no total filtrado, clique/teclado, breadcrumb, retorno ao total, legenda, estado vazio e tabela acessível. Os dois anéis representam o mesmo orçamento; não são somados. Total sintético: 240 R$ milhões, com divisões 84/56/100. Não há medida distribuível por tipo de risco, portanto não foi criado terceiro anel.

Barras de custos e distribuição de situações mantidas. Projeções têm cor neutra; vermelho e âmbar comunicam risco/atenção. Vidro selecionado em contêineres de gráficos, legenda e tooltip mantém densidade escura suficiente. Projetos, Simulador, Metodologia e Incorporações usam a mesma identidade, preservando funcionalidades e exportações.

## Histórico e governança

Cartões e detalhes de cada projeto oferecem Histórico de alterações. O novo endpoint de leitura `GET /api/projects/:id/history` consulta o diário existente: autoria do servidor, horário, operação, campos, valores anteriores/novos e justificativa quando disponível. Descrições e responsáveis continuam mascarados como no log existente. Justificativa ausente é explicitamente identificada, sem confundir descrição automática da operação com motivo de negócio.

PMO vê eventos próprios; perfis com `audit` veem eventos do projeto de todas as contas. Escopo definido no servidor, sem expansão por parâmetros. Não existe histórico de edição da base sintética nem eventos retroativos fabricados. Registros antigos sem diário permanecem preservados, sem autoria/data inventadas.

Log geral em Administração → Auditoria (`#administracao/auditoria`), com `#log` compatível. Entrada exige `audit`, Incorporações exige `commercial`; ocultar navegação não substitui a autorização HTTP. Autenticação, cálculos, permissões, armazenamento, edição/exclusão de ações e logout existentes foram preservados.

## Verificação e evidências

- `npm test`: 25 testes aprovados, incluindo OIDC controlado, autorização, CSRF, logout, persistência, mascaramento, isolamento do novo histórico e reconciliação do Sunburst.
- `npm run test:browser`: Chrome local com servidor e registros demonstrativos isolados em pasta temporária. Login e seis telas em 1440, 1024, 768 e 390 px. Sem overflow, erros JavaScript ou violações automáticas WCAG A/AA avaliadas pelo axe.
- Exercitados filtros, exploração por clique e teclado, participação percentual, retorno ao total, exportação CSV, detalhes/foco, busca, simulador, evidência, gravação/edição/recarregamento de ações, histórico/tabela de alterações, Administração, exportação Markdown, modo sólido, movimento reduzido, navegação móvel, menu de usuário e logout demonstrativo.
- Capturas revisadas de login/dashboard desktop e móvel; histórico disponível em `output/qa/desktop-project-history.png`. Relatório em `output/qa/results.json`.

O navegador integrado estava indisponível; a revisão usou Chrome local. O provedor corporativo real continua dependente de OIDC e da lista externa de autorizados em ACESSO.md. Dados operacionais são necessários para os cinco KPIs. Inter usa Google Fonts com fallback de sistema. Não foi feita certificação WCAG, revisão integral com leitor de tela nem verificação em Safari/Firefox ou aparelho físico.
