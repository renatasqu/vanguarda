# Vanguarda — Radar PMO

Trabalho FIAP.

Protótipo web em português baseado na Atividade 3 de vanguarda_pdf.pdf (páginas 4–5). Preserva Dashboard, Projetos, Simulador e Metodologia. Seis projetos sintéticos: dois por divisão (Incorporações, Logística e Energia solar).

## Executar

`npm start` na pasta vanguarda (Node.js 20+). Abra http://127.0.0.1:5173. Não use servidor estático: o acesso protegido exige o servidor Node. Sem dependências de execução. Fontes Google opcionais com fontes de sistema alternativas.

## Funcionalidades

Filtros, detalhes, CSV, cenários de custo e prazo, radar explicável e sinal de validação dos dados. Ações corretivas persistem localmente no navegador; não há conexão com sistemas corporativos.

## Aderência e limites

A atividade propõe IA preditiva: comparar planejado e realizado, antecipar atrasos e custos, emitir alertas verificados pelo PMO. A interface demonstra esse fluxo por regras ilustrativas. Não executa modelo treinado e os alertas não são probabilidades. Faixas e indicadores SPI/CPI e valores sintéticos são escolhas de implementação, descritas na Metodologia. Os campos de histórico não são usados para treinamento. Nenhum dado sintético é apresentado como dado operacional do caso.

## Aparência e acessibilidade

Identidade Liquid Glass escura baseada no Cadence, com fundos #060610/#0A0A18/#0D0D1F, acentos teal, títulos Outfit e texto Inter. Cartões com superfícies translúcidas, desfoque condicionado ao suporte do navegador, bordas iluminadas e sombras suaves. Navegação lateral flutuante em desktop e dock inferior em celular.

O botão “Sem transparência” alterna superfícies sólidas e guarda a preferência localmente quando o navegador permite. A preferência do sistema `prefers-reduced-transparency` é respeitada até o usuário escolher um modo. Navegadores sem suporte a backdrop-filter recebem superfícies opacas. Movimento reduzido, cores forçadas, foco visível, link de salto para o conteúdo, identificação do modal e retorno de foco estão contemplados. Tabelas podem ser percorridas horizontalmente com o teclado.


## Motor demonstrativo por valor agregado

Implementado em `dist/engine.js`, acessado pelo contrato de `dist/analysis-service.js` e compartilhado entre Dashboard, Projetos, detalhes e Simulador. Situação e alertas são recalculados da base, sem rótulos fixos ou índice ponderado paralelo.

- Realizada relativa = execução realizada (%) / 100.
- Despesa relativa = despesas / orçamento.
- CPI = realizada relativa / despesa relativa.
- SPI = execução realizada / execução planejada.
- Custo final estimado = orçamento / CPI.
- Prazo total estimado = prazo original / SPI.

Valores ausentes, textos, negativos, não finitos e porcentagens fora de 0–100 não são convertidos em zero. Orçamento e prazo original devem ser positivos. Despesas e execuções podem ser zero, mas denominadores zero impedem a divisão e produzem ausência de base com motivo. Indicadores independentes continuam disponíveis. Estimativas nunca retornam NaN ou infinito.

As regras de desempenho usam o menor CPI/SPI: saudável ≥ 0,95; atenção ≥ 0,85 e < 0,95; crítico < 0,85. Custo ou prazo estimado mais de 20% acima da base aciona um sinal crítico. Base insuficiente e validação pendente também geram sinais. Cada alerta explica seus fatores; as faixas são demonstrativas, não aprendidas. Sinais e projetos sinalizados são contados separadamente.

O Dashboard filtra divisão/situação e o CSV respeita a seleção. Totais de custos e médias de prazos exigem cobertura completa. Cada projeto apresenta quatro gráficos com valores numéricos. PV não é um cronograma de pagamentos, e não há série histórica fabricada.

O Simulador varia execução realizada e despesas acumuladas, mantém orçamento, execução planejada e prazo original e usa o mesmo motor. Dias decorridos são informativos, não entram na projeção de prazo. As projeções mantêm CPI/SPI constantes e não consideram caminho crítico, dependências ou mudanças de escopo. São regras demonstrativas, sem IA treinada, probabilidades ou métricas de precisão.

## Verificação

`node --test tests/engine.test.cjs` verifica fórmulas, limites, ausência de dados e divisões por zero. O motor não exige dependências externas.


## Simulador e ações corretivas

Controles numéricos e deslizantes para execução realizada (%) e despesas acumuladas (R$ milhões). Comparação imediata entre cenário original e simulado: CPI, SPI, estimativas, situação, alertas, variações e gráficos. Restaurar volta aos valores do projeto selecionado, preservando ações e verificações. A base original nunca é alterada.

Recomendações ao PMO derivam dos indicadores, qualidade dos dados, riscos e escopo. Verificações legais, ambientais e contratuais mantêm estado e referência independentes. Nenhuma delas modifica CPI/SPI nem constitui aprovação automática; bom desempenho não compensa uma pendência. Selecionar “Verificado no exercício” exige referência antes do registro da ação.

Ações corretivas incluem responsável, prazo opcional, cópia da base e cenário, verificações e recomendações. São salvas no localStorage deste navegador. Se o armazenamento falhar, ficam apenas na sessão e a interface orienta exportar. Rascunhos e ajustes de cenário ficam na memória da sessão; registros salvos voltam após recarregar. Não há envio externo ou registro em sistema corporativo.

A exportação Markdown inclui cenários, alertas e fatores, recomendações, verificações independentes, histórico de ações, rascunho e limitações. O horário usa America/Sao_Paulo.


## Entrega e apresentação

- [Abrir e apresentar](docs/APRESENTACAO.md): execução, roteiro de cinco minutos e repetição dos testes.
- [Verificações e limites](docs/VERIFICACOES.md): verificações concluídas, correções e limitações.
- [Arquitetura e contrato](docs/ARQUITETURA.md): separação da análise e integração futura.
- [Modelo futuro](docs/MODELO_FUTURO.md): dados históricos, prevenção de vazamento e validação temporal.

A execução do site é estática e sem dependências externas de JavaScript. As dependências de desenvolvimento são apenas para testes automatizados. `npm test` executa 10 testes de motor/contrato; `npm ci` e `npm run test:browser` repetem os fluxos no Chrome e geram capturas em output/qa.


A refatoração visual e os componentes estão descritos em [TEMA.md](docs/TEMA.md). Stack, dependências, rotas, dados e motor foram preservados.

## Acesso e Incorporações

Login OIDC, autorização por subject no servidor e vitrine comercial interna com exemplos fictícios. O acesso fica bloqueado até configurar o provedor e a lista de autorizados. Consulte [configuração de acesso](docs/ACESSO.md). As ações do simulador agora persistem no servidor por conta, com exportação preservada.

## Apresentar o protótipo

Execute `npm start`, abra http://127.0.0.1:5173/login e clique em **Confirmar**. A entrada é demonstrativa e abre diretamente o Dashboard, sem configuração externa. Para autenticação corporativa real, use `npm run start:secure` com a configuração em [ACESSO.md](docs/ACESSO.md).

## Sunburst e Log do sistema

Dashboard com Sunburst de orçamento (R$ milhões), exploração por divisão/projeto e tabela acessível. Log persistente no servidor com consulta administrativa, filtros e paginação; ações do Simulador podem ser adicionadas, editadas e excluídas com auditoria. A demonstração é explicitamente identificada. Consulte [implementação e limites](docs/SUNBURST-AUDITORIA.md).
