# Fronteira entre análise e interface

- `dist/engine.js`: motor puro determinístico; não acessa DOM, navegador, armazenamento ou rede. Recebe uma cópia de entradas em unidades documentadas e retorna números finitos ou null, situação, motivos e alertas.
- `dist/analysis-service.js`: contrato validado de provedor. A interface usa `VanguardaAnalysis.evaluate`; não importa as fórmulas do motor diretamente. A resposta inclui `metadata.id`, `version` e `kind`.
- `dist/app.js`: filtros, agregações, apresentação e navegação.
- `dist/simulator.js`: entrada/saída do cenário, verificações independentes, revisão do PMO, exportação e registros locais.

O contrato preserva orçamento, despesas, execução, prazo, EV/PV, CPI/SPI, `eac`, `duration`, `status`, `issues[]` e `alerts[]`. Alertas incluem `code`, `critical`, `title` e `factors`. Resultados inválidos são rejeitados; ausência válida deve ser null. Não há acesso ao DOM ou localStorage na fronteira de análise.

## Substituição futura

`VanguardaAnalysis.create({id,version,kind,analyze})` cria um adaptador testável. O provedor ativo desta entrega é `earned-value-rules`, versão 1.0.0, tipo `demonstrative`. Não há endpoint ou modelo treinado conectado.

Um modelo deve conservar os fatos e CPI/SPI como diagnóstico, colocar suas estimativas em eac/duration e explicar os fatores de seus alertas. Separar a regra de governança do modelo. Não inserir probabilidades em campos de índices.

```js
const provider = VanguardaAnalysis.create({
  id: 'modelo-pmo-validado',
  version: 'versao-real-do-modelo',
  kind: 'trained',
  analyze: input => adaptadorValidado(input)
});
const result = provider.evaluate(project); // provedor síncrono, por exemplo já carregado
```

Para um endpoint, `evaluateAsync(project)` aguarda uma promessa e aplica o mesmo contrato. A apresentação atual usa o caminho síncrono: ao integrar um endpoint, o controlador deve aguardar evaluateAsync antes de renderizar, mostrar carregamento/erro e descartar respostas antigas quando o cenário mudar. O suporte assíncrono do contrato é testado; a conexão e a experiência de carregamento de um modelo remoto não estão implementadas. Autenticação, acesso e contingência pertencem à futura integração.

Os registros novos de ações guardam a análise e a identidade/versão do provedor; exportar não recalcula esses resultados. Registros antigos sem análise são identificados como legado recalculado. Os rótulos de “regras demonstrativas” devem ser revisados junto da integração treinada, sem apresentar regras como IA.
