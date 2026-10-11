# Vanguarda — Radar PMO

Protótipo web em português baseado na Atividade 3 de vanguarda_pdf.pdf (páginas 4–5). Preserva Dashboard, Projetos, Simulador e Metodologia. Seis projetos sintéticos: dois por divisão (Incorporações, Logística e Energia solar).

## Executar

`python3 -m http.server 5173 --directory dist` na pasta vanguarda. Abra http://localhost:5173. Sem dependências de execução. Fontes Google opcionais com fontes de sistema alternativas.

## Funcionalidades

Filtros, detalhes, CSV, cenários de custo e prazo, radar explicável e sinal de validação dos dados. Não há persistência ou conexão com sistemas reais.

## Aderência e limites

A atividade propõe IA preditiva: comparar planejado e realizado, antecipar atrasos e custos, emitir alertas verificados pelo PMO. A interface demonstra esse fluxo por regras ilustrativas. Não executa modelo treinado e os alertas não são probabilidades. Faixas e indicadores SPI/CPI e valores sintéticos são escolhas de implementação, descritas na Metodologia. Os campos de histórico não são usados para treinamento. Nenhum dado sintético é apresentado como dado operacional do caso.

## Aparência e acessibilidade

Identidade Liquid Glass em verde profundo, branco e azul. Cartões com superfícies translúcidas, desfoque condicionado ao suporte do navegador, bordas iluminadas e sombras suaves. Navegação lateral flutuante em desktop e dock inferior em celular.

O botão “Sem transparência” alterna superfícies sólidas e guarda a preferência localmente quando o navegador permite. A preferência do sistema `prefers-reduced-transparency` é respeitada até o usuário escolher um modo. Navegadores sem suporte a backdrop-filter recebem superfícies opacas. Movimento reduzido, cores forçadas, foco visível, link de salto para o conteúdo, identificação do modal e retorno de foco estão contemplados. Tabelas podem ser percorridas horizontalmente com o teclado.


## Motor demonstrativo por valor agregado

Implementado em `dist/engine.js`, compartilhado entre Dashboard, Projetos, detalhes e Simulador. Situação e alertas são recalculados da base, sem rótulos fixos ou índice ponderado paralelo.

- Realizada relativa = execução realizada (%) / 100.
- Despesa relativa = despesas / orçamento.
- CPI = realizada relativa / despesa relativa.
- SPI = execução realizada / execução planejada.
- Custo final estimado = orçamento / CPI.
- Prazo total estimado = prazo original / SPI.

Valores ausentes, textos, negativos, não finitos e porcentagens fora de 0–100 não são convertidos em zero. Orçamento e prazo original devem ser positivos. Despesas e execuções podem ser zero, mas denominadores zero impedem a divisão e produzem ausência de base com motivo. Indicadores independentes continuam disponíveis. Estimativas nunca retornam NaN ou infinito.

As regras de desempenho usam o menor CPI/SPI: saudável ≥ 0,95; atenção ≥ 0,85 e < 0,95; crítico < 0,85. Custo ou prazo estimado mais de 20% acima da base aciona um sinal crítico. Base insuficiente e validação pendente também geram sinais. Cada alerta explica seus fatores; as faixas são demonstrativas, não aprendidas. Sinais e projetos sinalizados são contados separadamente.

O Dashboard filtra divisão/situação e o CSV respeita a seleção. Totais de custos e médias de prazos exigem cobertura completa. Cada projeto apresenta quatro gráficos com valores numéricos. PV não é um cronograma de pagamentos, e não há série histórica fabricada.

O Simulador varia despesas e prazo original, mantém orçamento/execução física e usa o mesmo motor. Dias decorridos são informativos, não entram na projeção de prazo. As projeções mantêm CPI/SPI constantes e não consideram caminho crítico, dependências ou mudanças de escopo. São regras demonstrativas, sem IA treinada, probabilidades ou métricas de precisão.

## Verificação

`node --test tests/engine.test.cjs` verifica fórmulas, limites, ausência de dados e divisões por zero. O motor não exige dependências externas.
