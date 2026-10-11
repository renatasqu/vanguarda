# Verificações da entrega — 11/10/2026

## Concluídas

| Área | Verificação | Resultado |
| --- | --- | --- |
| Cálculos | CPI, SPI, custo e prazo, zeros, ausências, inválidos, valores extremos e limites sem arredondamento intermediário | 6 testes do motor passaram |
| Separação | Contrato de provedor, versão/tipo, substituição, caminho assíncrono e rejeição de saídas inválidas | 4 testes do serviço passaram |
| Filtros | Divisão e situação combinadas, seleção vazia e busca sem perda de foco | Passou no Chrome |
| Exportação | CSV da seleção; Markdown com cenários, fatores, verificações e ação registrada | Downloads reais conferidos no Chrome |
| Simulador | Valores numéricos, atualização imediata, dados zero/ausentes, restauração e seleção por projeto | Passou no Chrome |
| Registros | Referência exigida para verificação, registro local, recarga e identidade/resultado da análise preservados | Passou; falha de armazenamento também exercitada em DOM isolado |
| Teclado | Navegação por Enter, salto ao conteúdo, Escape e retorno de foco no modal | Passou no Chrome |
| Acessibilidade automática | axe-core com regras WCAG 2 A/AA e 2.1 A/AA nas quatro páginas e no modal | Sem violações detectadas nos estados testados |
| Aparência sólida | Alternância, ausência de blur e manutenção após recarga | Passou no Chrome |
| Layout | Quatro páginas em 1440×1000, 1024×900, 768×1024 e 390×844 | 16 combinações sem estouro horizontal da página |
| Inspeção visual | Capturas de Dashboard, Simulador e detalhes em desktop/celular | Inspecionadas; filtros móveis corrigidos |
| Foco no celular | Campo focado permanece acima do dock | Passou no Chrome |

Navegador: Chrome 154.0.8037.99, sessão headless isolada no macOS. O navegador integrado estava indisponível; as verificações de navegador usaram o Chrome local. O script tests/browser.mjs gera capturas e resultado JSON, e encerra perfil/servidor ao terminar. Não foi necessário acessar as abas pessoais.

## Correções aplicadas

- Filtros móveis deixaram de herdar uma altura de flexbox inadequada.
- Controles deslizantes respeitam o valor decimal digitado; são desabilitados quando o campo está ausente/inválido, sem esconder o motivo.
- A abertura dos detalhes posiciona o conteúdo no topo e o foco no título, com botão de fechar visível no topo; Escape retorna ao botão de origem.
- Acrescentado espaço de rolagem para foco acima da navegação inferior.
- Ações novas preservam análise e identificação/versão do provedor. A exportação não substitui a análise registrada pela versão corrente; registros antigos sem análise são identificados como legado.
- Motor puro e contrato de análise separados da interface; documentação corrigida para reconhecer a persistência local de ações.

## Limites

Sem teste em aparelho físico, Safari/Firefox, leitor de tela, orientação paisagem ou auditoria integral WCAG. Análise automática sem violações não certifica acessibilidade. Foram usados viewports de celular no Chrome, não hardware móvel.

Nenhum modelo treinado, acurácia, probabilidade ou validação temporal empírica foi produzido. docs/MODELO_FUTURO.md descreve o plano e dados necessários; docs/ARQUITETURA.md delimita a integração de um provedor remoto assíncrono ainda não conectado.


## Refatoração visual Cadence

Tema Liquid Glass escuro validado em 1440, 1024, 768 e 390px. Os 10 testes de motor/contrato continuaram passando. Fluxos no Chrome e análise automática de acessibilidade sem erros/violações. Componentes e estados documentados em TEMA.md; nenhum comportamento comercial ou gráfico aleatório da referência foi incorporado. A inspeção em 768px também usou capturas de viewport durante a rolagem, devido a artefatos de composição em uma captura longa do Chrome com backdrop-filter.
