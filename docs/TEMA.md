# Tema Vanguarda — versão corporativa final

A direção atual usa Inter 400/500/600, área principal gelo e títulos azul-marinho, mantendo a paleta escura original nos cards de dados. A stack é HTML/CSS/JavaScript estático. Não foram acrescentadas dependências. Ícones SVG locais usam a composição existente; licenças em LICENSE-ICONS.txt.

`dist/ui.js` oferece GlassCard, GovernanceCard, StatCard, StatusBadge, Button, FilterBar, Field, ChartContainer e Icon. Valores, motor e contrato de análise permanecem separados dos componentes. O CSS centraliza cores, raios, espaçamentos 8/12/16/24/32 px, reflexos, blur e sombras em tokens.

O login tem gradiente #101012 → #241640 → #49308C, com luz difusa #7040E8 na parte inferior e um único painel de vidro. Confirmação e integração OIDC existentes foram preservadas. A marca horizontal existente em HTML recebe espaço de 208 px, mantendo proporção.

O menu escuro translúcido usa blur de 20 px e cápsula ativa, com menu de usuário e logout real. Cards mantêm leitura densa; superfícies selecionadas de gráficos, legenda, filtros e tooltip recebem vidro discreto. Bordas são reservadas a campos, foco, seleção e divisórias necessárias. Projeções usam pervinca neutra; vermelho/âmbar representam risco. Vidro tem fallback sólido, opção persistida sem transparência e suporte às preferências de transparência/movimento reduzidos. Transições são de 200 ms.

No celular, a marca permanece visível ao lado do botão Menu. Escape recolhe a navegação e devolve o foco ao botão. A tabela acessível do Sunburst também informa a participação de cada projeto e da exploração atual no total filtrado; os anéis representam níveis do mesmo orçamento, sem soma entre níveis. A legenda identifica explicitamente sua base como o total filtrado.

Os cinco KPIs do Conselho mostram ausência de dados explicitamente. Valores financeiros existentes, Sunburst, barras, filtros, exportações, simulador e operações continuam funcionais. Histórico por projeto e Administração → Auditoria usam eventos reais do servidor com o escopo de permissões e mascaramento existentes. Operações demonstrativas continuam identificadas como não verificadas.

Evidências, checks, comportamento dos KPIs e limitações estão em [REFATORACAO-CORPORATIVA.md](REFATORACAO-CORPORATIVA.md). O pedido anexado continha somente texto; os componentes existentes e as cores descritas orientaram esta revisão, sem comparação com arquivos de referência ausentes.
