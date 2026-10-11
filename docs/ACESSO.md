# Modo de demonstração do protótipo

`npm start` abre o Vanguarda em modo local de demonstração. Clique em **Confirmar** para entrar diretamente no Dashboard, sem provedor, credenciais ou cadastro. A tela identifica esse modo como demonstração, com dados fictícios e sem autenticação corporativa. “Sair” encerra a sessão de navegação do protótipo.

Esse modo foi adicionado a pedido do usuário, para apresentar o protótipo. Não autentica uma pessoa real nem aplica uma lista corporativa de autorizados. Os registros de interesse e ações pertencem à sessão de demonstração compartilhada do protótipo. O servidor escuta somente no endereço local; `--demo` é recusado quando `NODE_ENV=production`.

Para usar a integração de autenticação real existente, execute `npm run start:secure` e configure as variáveis abaixo. O modo seguro mantém acesso negado por padrão.

---

# Acesso protegido e configuração externa

Para autenticação real, execute `npm run start:secure` em `vanguarda` com Node 20+. Não publique `dist` por servidor estático: o controle de acesso depende de `scripts/serve.mjs`. As rotas com hash compartilham o documento protegido `/`; `app.js` e `simulator.js` exigem permissão PMO. APIs comerciais exigem `commercial`. A autorização é relida no arquivo a cada requisição. As regras desta seção aplicam-se somente ao modo seguro.

## Configuração obrigatória

Defina no ambiente do processo, sem salvar segredos no repositório:

- `APP_ORIGIN`: origem exata, por exemplo `http://127.0.0.1:5173` local; HTTPS obrigatório em produção.
- `NODE_ENV=production` em produção.
- `OIDC_ISSUER`: issuer HTTPS exato do provedor, sem ajustar a barra final.
- `OIDC_CLIENT_ID`: identificador do cliente confidencial.
- `OIDC_CLIENT_SECRET`: segredo apenas no ambiente do servidor.
- `AUTHORIZED_USERS_FILE`: caminho absoluto de JSON fora de `dist`, legível apenas pelo processo/administradores.

Crie inicialmente esse arquivo com `[]`: ninguém recebe acesso. Cada entrada deve conter `sub` real emitido pelo issuer configurado e `permissions`, com `pmo` para Dashboard, Projetos, Simulador e Metodologia, e adicionalmente `commercial` para Incorporações e registro de interesse. Não há usuários pré-configurados; o administrador deve obter o subject pelo provedor. O orçamento PMO não serve como preço comercial.

Registre no provedor a URL de callback `${APP_ORIGIN}/auth/callback` e a URL de saída `${APP_ORIGIN}/login`. Configure Authorization Code, PKCE S256, assinatura RS256 e autenticação `client_secret_basic`. O discovery deve anunciar issuer, authorization_endpoint, token_endpoint, jwks_uri e end_session_endpoint HTTPS. O logout usa RP-Initiated Logout com id_token_hint e post_logout_redirect_uri. Valide esses recursos no seu provedor (ex.: Keycloak, Auth0 ou Entra ID com configuração compatível). O provedor deve restringir cadastro público.

A sessão usa identificador aleatório opaco no cookie HttpOnly, SameSite=Lax, Secure em HTTPS, com limite de uma hora ou expiração do ID token. São verificados assinatura RSA, issuer, audience, azp para múltiplas audiences, validade e nonce; state é vinculado ao navegador e a transação tem cinco minutos. Tokens e segredos permanecem no servidor. Após confirmar, o destino é sempre `/#dashboard`; parâmetros de retorno fornecidos pelo visitante não alteram esse destino.

Sessões residem em memória e são invalidadas ao reiniciar. Esta implementação exige uma única instância; múltiplas instâncias requerem store de sessões compartilhado. Use proxy HTTPS e controle de acesso aos arquivos do servidor. A lista é relida por requisição; sua remoção revoga o acesso imediatamente na próxima validação.

## Persistência e logout

O interesse é anexado a `data/interests.jsonl`, com subject, imóvel e horário; a confirmação só retorna após escrita e sync. A pasta deve ter disco persistente, permissão restrita e backup. Não expor essa pasta por servidor web. Falhas de disco retornam erro, sem confirmação falsa. Dois imóveis e suas imagens são exemplos fictícios; não existe compra ou pagamento.

Ações do simulador continuam persistidas e exportáveis, agora em arquivos privados no servidor separados por subject, via API protegida PMO. Dados anteriores do localStorage não são importados automaticamente, pois não é possível atribuir sua autoria com segurança. Rascunhos ficam na sessão. Logout limpa ações e cenários em memória, o conteúdo visível e o cookie, e encaminha ao logout do provedor. O header Clear-Site-Data solicita limpeza de cache/storage em navegadores compatíveis. O retorno por histórico e a retomada de aba revalidam a sessão antes de exibir conteúdo. Após perder conexão com o provedor durante a preparação da saída, o aplicativo mostra erro e permite tentar novamente.

## Verificação realizada e pendências

`npm test` inclui fórmulas existentes e testes HTTP de bloqueio de documentos/bundles/APIs, autorização por arquivo, permissão comercial, CSRF, gravação de interesse e retorno após logout. Há também teste do fluxo OIDC com tokens RSA assinados por um provedor controlado, incluindo nonce inválido, identidade não autorizada e logout. Sessões controladas existem apenas nos testes, por injeção no construtor; não há rota para gerar sessão de teste no servidor de produção.

A autenticação e o logout completos com o provedor real dependem das configurações acima. Os testes HTTP com sessão controlada verificam a barreira e o contrato, não certificam o fluxo remoto. `npm run test:browser` usa servidor demonstrativo isolado, entra pelo botão Confirmar e verifica as telas e os fluxos de busca, filtros, detalhes, Sunburst, histórico, simulador, exportação, menu de usuário e logout no Chrome local. Essa validação não certifica a integração com o provedor real; consulte REFATORACAO-CORPORATIVA.md para evidências e limitações.

Referência: [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html).


## Correção da confirmação de acesso

No código anterior não havia botão local “Confirmar”, nem fluxo de convite/magic link: havia um formulário GET para iniciar OIDC. O formulário não tratava erros de conexão na própria página, `/login` não reconhecia sessão concluída, `/auth/login` forçava `prompt=login`, e o retorno podia seguir outra página interna. Na execução local inspecionada, as quatro variáveis OIDC/lista também estavam ausentes; sem elas, o servidor recusava corretamente a entrada.

O botão agora é “Confirmar”. A interface envia `POST /auth/confirm`, exibe “Entrando…”, impede duplicação e libera nova tentativa com mensagem clara quando há erro. O servidor verifica a origem, reaproveita apenas sessão válida e ainda autorizada, ou inicia Authorization Code + PKCE no provedor. Não força uma nova autenticação se o provedor já tiver uma identidade válida. O callback valida assinatura, issuer, audience, nonce, expiração, state e subject autorizado antes de estabelecer a sessão; o identificador anterior é invalidado quando a sessão é substituída. Confirmações expiradas e canceladas têm mensagens próprias. A transação só pode ser consumida uma vez e exige o cookie do navegador correspondente. Uma sessão já concluída é encaminhada ao Dashboard ao retornar para `/login`, clicar novamente ou retornar ao callback, sem nova confirmação.

Não existe endpoint de aceitação de convites nem de tokens arbitrários nesta versão. Se a confirmação acontecer no provedor, ele deve retornar um código OIDC para `${APP_ORIGIN}/auth/callback`, preservando `state`. Um link sem essa transação válida não autentica ninguém. Não se deve apontar a URL de callback para `/login` nem para uma página de confirmação externa adicional. Se o botão “Confirmar” estiver na interface do próprio provedor, sua configuração deve completar esse retorno OIDC.

Os testes de `tests/confirmation.test.cjs` usam um provedor controlado com assinatura RSA para confirmação válida, assinatura inválida, transação expirada, ID token expirado, cookie incorreto, reuso, usuário sem autorização e autorização revogada. Verificam também ausência de configuração, origem inválida, texto “Entrando…”, cliques duplicados, liberação após erro e redirecionamento. O teste HTTP verifica que `/login` redireciona uma sessão autorizada diretamente ao Dashboard. Isso não substitui a validação no provedor real, que permanece dependente das credenciais e da lista reais descritas acima.


## Sunburst e auditoria

Consulte [SUNBURST-AUDITORIA.md](SUNBURST-AUDITORIA.md). Novas ações e interesses agora usam um diário único com alteração e evento, em vez dos arquivos separados anteriores. Para consulta de auditoria real, inclua `audit` além de `pmo` nas permissões da pessoa autorizada e, se disponível, `name` no cadastro mantido no servidor. A demonstração identifica a sessão como não verificada e não é auditoria corporativa.

## Histórico por projeto e Administração

A navegação coloca a consulta geral em **Administração → Auditoria** (`#administracao/auditoria`); `#log` permanece compatível. A entrada fica visível somente para quem tem `audit`, sem substituir o bloqueio no servidor. Incorporações exige `commercial` como antes.

`GET /api/projects/:id/history` exige `pmo`. Perfis sem `audit` veem somente operações da própria conta vinculadas ao projeto. Perfis com `audit` veem as operações vinculadas ao projeto de todas as contas. O escopo é definido no servidor e não pode ser ampliado por parâmetros do visitante. A API é somente leitura, paginada e usa os mesmos eventos mascarados do diário. Não existe edição da base sintética de projetos nem histórico retroativo fabricado. Justificativas ausentes são identificadas como não registradas.
