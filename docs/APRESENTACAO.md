# Como abrir e apresentar

## Abrir

A versão publicada privada está em https://vanguarda-radar-pmo.darkjelly32.chatgpt.site. Para executar a cópia local, tenha Node.js 20 ou superior, abra um terminal na pasta vanguarda e execute:

```sh
npm start
```

Abra http://127.0.0.1:5173. A execução usa apenas módulos nativos do Node; não precisa instalar dependências de testes. Encerre com Ctrl+C. Se a porta estiver ocupada, use `PORT=5174 npm start` no macOS/Linux e abra a URL exibida. Como alternativa, `python3 -m http.server 5173 --directory dist`.

Mantenha a pasta dist com seus arquivos juntos. Prefira HTTP local a abrir o HTML diretamente, especialmente para consistência do armazenamento local. Sem internet, a interface funciona com fontes de sistema; Google Fonts é opcional. Os dados são sintéticos. Ações ficam neste navegador/origem; dados locais da URL publicada e do localhost são separados.

## Roteiro de cinco minutos

1. Dashboard: apontar os seis projetos, três divisões e a identificação demonstrativa. Mostrar que sinais são regras e um projeto pode acionar vários sinais.
2. Filtrar Incorporações e Crítico; abrir Parque das Oliveiras. Mostrar despesas, execução planejada/realizada, CPI/SPI e os quatro gráficos. Explicar que as projeções mantêm os índices constantes.
3. Simulador: escolher Residencial Aurora; alterar execução para 25% e despesas para 90 milhões. Comparar original e simulado: CPI ≈ 0,133, SPI = 0,5, custo final estimado 360 milhões e prazo total estimado 720 dias. São hipóteses, não previsões de IA.
4. Mostrar as verificações legal, ambiental e contratual. Alterar uma situação e demonstrar que isso não melhora os indicadores. “Verificado no exercício” exige referência para registro, mas não é aprovação formal.
5. Preencher ação e responsável, registrar, exportar a análise e restaurar os valores. A base original permanece intacta. Encerrar na Metodologia e citar que modelo treinado exigiria dados históricos e validação temporal.

Para apresentação em celular, use a navegação inferior. Tabelas podem ser roladas horizontalmente dentro do cartão. Use “Sem transparência” para superfícies sólidas. Tab percorre controles, Enter ativa ações, Escape fecha detalhes, e o link inicial permite pular para o conteúdo.

## Repetir as verificações

```sh
npm test
npm ci
npm run test:browser
```

`npm test` não exige bibliotecas externas. O teste de navegador precisa das dependências de desenvolvimento e Chrome instalado. No macOS, o caminho padrão é /Applications/Google Chrome.app/Contents/MacOS/Google Chrome. Em outro local ou sistema, use `CHROME_PATH="/caminho/do/chrome" npm run test:browser`. Não é necessário instalar outro navegador. Ele usa perfil temporário, porta local livre e fecha ambos ao terminar.

As capturas e o resultado automático são gerados em output/qa. O teste de navegador não substitui uma auditoria completa de acessibilidade ou teste em aparelho físico.
