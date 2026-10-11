# Ajustes de layout — 11/10/2026

O login e o shell usam o mesmo `--app-background`, aplicado uma vez ao corpo da página. O gradiente acompanha a altura do documento sem reiniciar por seção. `--card-shadow`, `--content-padding` e `--content-gap` compartilham sombra gelo direcionada à direita e espaçamentos. As grids alinham cards pelo início, com altura conforme o conteúdo.

O dashboard apresenta orçamento por divisão e quantidade por situação em roscas; barras agrupadas comparam orçamento/custo projetado e avanço planejado/realizado. As divisões e situações particionam os projetos filtrados sem dupla contagem. As comparações monetárias usam o mesmo máximo entre todos os projetos selecionados; avanço usa 0–100%. Dados ausentes permanecem sem base. O Sunburst é carregado ao abrir a exploração. Os cinco indicadores indisponíveis do Conselho têm aviso compacto e link para a metodologia.

Os cards de projetos priorizam nome, divisão, situação, orçamento, prazo e duas barras de avanço. Riscos e contexto permanecem nos detalhes. No simulador, custo em reais e prazo em dias aparecem em gráficos separados antes da tabela expansível. A tabela preserva o estado aberto durante alterações dos controles.

O login mantém confirmação/redirecionamento, largura máxima de 400px, padding de 28px, botão de 48px e indicação breve do modo demonstração. Textos de erro e estado continuam acessíveis.

## Verificação

- `npm test`: 25 testes aprovados, incluindo motor, acesso, confirmação, auditoria e APIs.
- `npm run test:browser`: Chrome local, login e seis rotas em 1440, 1024, 768 e 390px. Verifica rolagem horizontal, acessibilidade automática, filtros, busca, detalhes, Sunburst, simulação, exportações, histórico, aparência, menu móvel e logout.
- Capturas em `output/qa/`, com relatório `output/qa/results.json`.
- O navegador integrado não estava disponível; a inspeção e capturas usaram o Chrome local. O acesso corporativo real não foi exercitado com um provedor externo; os testes de OIDC usam um provedor controlado de teste.
