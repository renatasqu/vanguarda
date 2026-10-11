# Vanguarda — Radar PMO

Protótipo web em português baseado na Atividade 3 de vanguarda_pdf.pdf (páginas 4–5). Preserva Dashboard, Projetos, Simulador e Metodologia. Seis projetos sintéticos: dois por divisão (Incorporações, Logística e Energia solar).

## Executar

`python3 -m http.server 5173 --directory dist` na pasta vanguarda. Abra http://localhost:5173. Sem dependências de execução. Fontes Google opcionais com fontes de sistema alternativas.

## Funcionalidades

Filtros, detalhes, CSV, cenários de custo e prazo, radar explicável e sinal de validação dos dados. Não há persistência ou conexão com sistemas reais.

## Aderência e limites

A atividade propõe IA preditiva: comparar planejado e realizado, antecipar atrasos e custos, emitir alertas verificados pelo PMO. A interface demonstra esse fluxo por regras ilustrativas. Não executa modelo treinado e o índice de exposição não é probabilidade. Pesos, faixas, indicadores SPI/CPI e valores sintéticos são escolhas de implementação, descritas na Metodologia. Os campos de histórico não são usados para treinamento. Nenhum dado sintético é apresentado como dado operacional do caso.

## Aparência e acessibilidade

Identidade Liquid Glass em verde profundo, branco e azul. Cartões com superfícies translúcidas, desfoque condicionado ao suporte do navegador, bordas iluminadas e sombras suaves. Navegação lateral flutuante em desktop e dock inferior em celular.

O botão “Sem transparência” alterna superfícies sólidas e guarda a preferência localmente quando o navegador permite. A preferência do sistema `prefers-reduced-transparency` é respeitada até o usuário escolher um modo. Navegadores sem suporte a backdrop-filter recebem superfícies opacas. Movimento reduzido, cores forçadas, foco visível, link de salto para o conteúdo, identificação do modal e retorno de foco estão contemplados. Tabelas podem ser percorridas horizontalmente com o teclado.


## Indicadores e projeções calculados

O Dashboard filtra por divisão e situação. Quantidade de projetos, orçamento, despesas, avanço, situações e sinais são recalculados da seleção; o CSV usa os mesmos filtros. Situação deriva do menor SPI/CPI, sem rótulos fixos. Sinais contam cada regra acionada (desempenho crítico, projeção de custo ou prazo mais de 20% acima da base e validação pendente); o total de projetos sinalizados é mostrado separadamente.

- EV = orçamento × execução realizada / 100; PV = orçamento × execução planejada / 100.
- SPI = EV / PV; CPI = EV / despesas.
- Custo final projetado = despesas / (execução realizada / 100).
- Prazo total projetado = dias decorridos / (execução realizada / 100).

Os dias decorridos são entradas demonstrativas. As projeções assumem continuidade do ritmo; não constituem inferência de IA treinada. O custo do portfólio é a soma das projeções e o prazo é uma média, não uma data final corporativa. Zero de execução gera ausência de base para projetar. Dias são arredondados para cima na apresentação.

Ao selecionar um projeto, o modal apresenta orçamento, despesas, prazo base, dias decorridos, execução planejada/realizada, SPI/CPI, riscos e quatro gráficos com valores textuais. PV representa valor equivalente ao avanço planejado, não um cronograma de pagamentos. Não há curvas históricas fabricadas ou métricas de precisão inventadas.
