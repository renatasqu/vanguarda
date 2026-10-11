# Dados históricos e validação temporal para um modelo futuro

Este é um plano de implantação; nenhum modelo foi treinado e nenhuma métrica abaixo foi medida. Os seis projetos sintéticos e as contagens ilustrativas de histórico não são uma base de treinamento.

## Dados necessários

Uma linha por projeto e data de referência, com frequência consistente (por exemplo, semanal). Preservar versões e o momento em que a informação estava disponível; não sobrescrever o passado com a última revisão.

| Grupo | Campos mínimos | Uso e cuidado |
| --- | --- | --- |
| Identificação | project_id, divisão, tipo, unidade, porte, fase | Agrupar revisões do mesmo projeto; controlar diferenças entre divisões |
| Tempo e disponibilidade | as_of, recorded_at, timezone, fonte, versão | Somente dados conhecidos na data da previsão podem ser atributos |
| Linha de base | orçamento aprovado, prazo original, datas, curva de execução planejada, versão e aprovação da base | Comparar com a versão vigente na data, conservando também a base original |
| Execução | avanço físico realizado, dias decorridos, marcos e dependências | Definição homogênea e evidências auditáveis do avanço |
| Finanças | despesas acumuladas e do período, moeda/unidade, pagamentos e compromissos, inflação aplicável | Separar gasto efetivo de comprometido; não misturar R$ com R$ milhões |
| Mudanças | alteração de escopo, data, aprovação, impacto de custo/prazo | Evitar usar mudanças ainda não aprovadas ou desconhecidas na data |
| Riscos e capacidade | riscos abertos, severidade, responsável, recursos, fornecedores, bloqueios | Categoria consistente; não inferir risco só da contagem |
| Qualidade | completude, revisão PMO, inconsistências, retificações, atraso de reporte | Identificar dados provisórios e estabelecer critérios de abstinência |
| Desfechos | custo final auditado, conclusão real, duração final, suspensão/cancelamento, data em que o desfecho foi validado | Alvos de regressão; considerar censura em projetos ainda abertos |
| Ações humanas | ação corretiva, data, responsável, execução e efeito observado | Separar previsão anterior da intervenção; não atribuir causalidade automaticamente |
| Requisitos independentes | estado legal, ambiental e contratual, evidência, aprovação e validade | Governança em trilha própria; bons indicadores não compensam uma pendência |

Retirar identificadores pessoais desnecessários. Registrar a autorização de uso, origem, acesso e retenção. IDs de projeto são chaves de agrupamento; não devem virar atalho para memorizar desfechos.

## Alvos e unidade de avaliação

Definir primeiro o horizonte e a decisão apoiada pelo PMO. Possíveis alvos: custo final, duração total ou desvio final em relação à base. Uma classificação de estouro exigiria alvo e limite definidos antes da avaliação. Projetos em aberto não podem receber desfechos finais inventados; excluir do treino supervisionado quando não houver rótulo maduro, ou escolher uma abordagem explícita para censura.

Múltiplos snapshots de um projeto são correlacionados. Reportar quantidade de projetos distintos além de quantidade de linhas. Avaliar por divisão, fase e porte; a quantidade mínima depende da cobertura e da variabilidade reais, não do número seis do protótipo.

## Protocolo temporal proposto

Não embaralhar snapshots como se fossem observações independentes. Reservar dados posteriores para avaliação e evitar aprender transformações com dados de validação/teste, conforme os cuidados de [validação cruzada](https://scikit-learn.org/stable/modules/cross_validation.html) e [vazamento de dados](https://scikit-learn.org/stable/common_pitfalls.html) descritos pelo scikit-learn.

1. Escolher datas de corte usando o calendário real de reporte. Em cada corte, treinar somente com atributos e desfechos que já estavam disponíveis e validados naquela data.
2. Usar janelas progressivas: treino até T1, validação depois de T1; depois treino até T2 e validação depois de T2. Reservar a última janela como teste final intocado. São etapas do plano, não datas ou resultados já obtidos.
3. Para avaliar generalização a novos projetos, manter o mesmo project_id fora dos dois lados do corte. Quando um projeto atravessar o período, colocá-lo em uma coorte de teste ou retirá-lo do fold, em vez de vazar seu desfecho.
4. Para o uso em projetos já em andamento, criar uma avaliação separada de previsão prospectiva. Só é aceitável reutilizar snapshots passados se eles e seus rótulos realmente estivessem disponíveis no instante de treino. Não misturar esse resultado com generalização a projetos novos.
5. Inserir intervalo de separação quando houver atraso de publicação ou horizonte sobreposto. A duração deve refletir a disponibilidade real de rótulos e relatórios. `TimeSeriesSplit` sozinho não resolve agrupamento por projeto e maturidade dos desfechos; implementar cortes e exclusões explícitos.
6. Ajustar imputação, escala, seleção de atributos e hiperparâmetros somente dentro do treino de cada fold. Escolher limiares usando validação; congelar antes do teste final. Não usar custo/duração finais como atributos dos snapshots.
7. Comparar no mesmo conjunto de teste com o motor demonstrativo CPI/SPI e uma referência simples baseada no histórico de treino. Um modelo deve justificar sua adoção além de reproduzir essas regras.

## Evidências a medir futuramente

Para regressão, medir erro absoluto em reais/dias, erro relativo com denominadores válidos e viés de super/subestimativa. Reportar dispersão, amostra e resultados por divisão/fase, ponderando para que projetos com muitos snapshots não dominem a avaliação. Para eventuais alertas binários, medir precisão, recall, falsos alertas e antecedência útil ao PMO; não confundir essas métricas com CPI/SPI.

Se houver probabilidades, avaliar calibração em dados posteriores; se houver intervalos, verificar cobertura e largura. Esses recursos só podem entrar na interface depois de medidos e documentados. Nenhum valor de precisão ou confiança está disponível nesta entrega.

## Implantação e monitoramento

Versionar dados, código, atributos, modelo, corte de treino, unidades e critérios. Começar em modo de acompanhamento, sem substituir decisões formais. Monitorar atraso/completude de dados, desvios de distribuição, erro quando rótulos amadurecerem e taxa de revisão/ação do PMO. Preservar versão e resultado no registro da ação. Definir critérios de abstinência, contingência com as regras e reversão antes da entrada em produção. Requisitos legais, ambientais e contratuais permanecem independentes.
