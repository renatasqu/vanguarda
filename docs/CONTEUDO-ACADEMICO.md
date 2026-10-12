# Complementação acadêmica

Fontes conferidas diretamente nos PDFs locais:
- Estudo de caso Vanguarda I(2).pdf: fatos do caso nas páginas 1–3; requisitos da Atividade 3 na página 4.
- vanguarda_pdf.pdf: governança e processo nas páginas 1–2; critérios, pesos e exemplos nas páginas 2–3; PMO e KPIs na página 4; IA aplicada nas páginas 4–5.

A Metodologia inclui seções expansíveis para proposta de IA, contexto do Grupo Vanguarda, governança, fontes e cinco KPIs com definição, cálculo e dados necessários. Os fatos do enunciado não alimentam os seis projetos sintéticos. Os KPIs permanecem Sem dados. Treinamento, validação temporal, referência simples e avaliação dos erros são requisitos de evolução, não capacidades implementadas.

## Contagens

O card “Projetos com alertas críticos” conta projetos distintos com pelo menos um alerta crítico do motor: desempenho, projeção de custo/prazo acima de 20%, dados insuficientes ou validação pendente. A rosca “Situação por CPI/SPI” classifica somente pelo menor dos dois índices, conforme as faixas existentes.

Na seleção completa, INC-002 tem situação crítica e LOG-001 tem situação de atenção com validação pendente. Portanto, há dois projetos com alertas críticos e um com situação crítica. Os nomes, tooltips e Metodologia explicitam a diferença. As duas contagens, os demais indicadores, gráficos e tabela usam selectedProjects(), que aplica divisão e situação. A busca por nome pertence à página Projetos e não é um filtro disponível no Dashboard.

## Verificação

- npm test: 25 testes aprovados.
- npm run test:browser: aprovado no Chrome local; navegação, exportação, simulador, histórico, auditoria e logout preservados.
- Testes acrescentados: contagens por divisão/situação, seleção vazia, abertura das cinco seções por teclado, cinco KPIs Sem dados e ausência de overflow com seções abertas em 1440 e 390 pixels.
- Suíte existente: seis páginas em quatro larguras, sem overflow, erros JavaScript ou violações automáticas de acessibilidade.
- Capturas das seções abertas: output/qa/academic-expanded-1440.png e output/qa/academic-expanded-390.png.

O navegador integrado estava indisponível; a verificação usou a suíte de navegador já existente no projeto.
