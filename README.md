# Vanguarda — Radar PMO

Protótipo web em português baseado na Atividade 3 de vanguarda_pdf.pdf (páginas 4–5). Preserva Dashboard, Projetos, Simulador e Metodologia. Seis projetos sintéticos: dois por divisão (Incorporações, Logística e Energia solar).

## Executar

`python3 -m http.server 5173 --directory dist` na pasta vanguarda. Abra http://localhost:5173. Sem dependências de execução. Fontes Google opcionais com fontes de sistema alternativas.

## Funcionalidades

Filtros, detalhes, CSV, cenários de custo e prazo, radar explicável e sinal de validação dos dados. Não há persistência ou conexão com sistemas reais.

## Aderência e limites

A atividade propõe IA preditiva: comparar planejado e realizado, antecipar atrasos e custos, emitir alertas verificados pelo PMO. A interface demonstra esse fluxo por regras ilustrativas. Não executa modelo treinado e o índice de exposição não é probabilidade. Pesos, faixas, indicadores SPI/CPI e valores sintéticos são escolhas de implementação, descritas na Metodologia. Os campos de histórico não são usados para treinamento. Nenhum dado sintético é apresentado como dado operacional do caso.
