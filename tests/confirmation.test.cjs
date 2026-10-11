const {test} = require('node:test');
const assert = require('node:assert/strict');
const {mkdtemp, writeFile, readFile, rm} = require('node:fs/promises');
const {generateKeyPairSync, sign} = require('node:crypto');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');

function response() {
  return {statusCode:0, headers:{}, writeHead(code, headers={}) {this.statusCode=code;this.headers=headers;return this;}, end(body) {this.body=body;return this;}};
}

test('confirmação OIDC: sucesso, expiração, identidade, autorização, sessão e ausência de repetição', async () => {
  const {createAuth} = await import('../scripts/auth.mjs');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'vanguarda-confirm-'));
  const usersFile = path.join(directory, 'users.json');
  const origin = 'http://127.0.0.1:5173', issuer = 'https://confirmation.invalid';
  const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength:2048});
  const jwk = {...publicKey.export({format:'jwk'}),kid:'confirmation-key',alg:'RS256',use:'sig'};
  let time = Date.now(), subject = 'authorized-test', nonce, expiredToken = false, brokenSignature = false;
  let tokenCalls=0, metadataCalls=0;
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (String(url).endsWith('/.well-known/openid-configuration')) {
      metadataCalls++;
      return Response.json({issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/keys'});
    }
    if (String(url).endsWith('/keys')) return Response.json({keys:[jwk]});
    if (String(url).endsWith('/token')) {
      tokenCalls++;
      assert.equal(options.body.get('grant_type'),'authorization_code');
      assert.ok(options.body.get('code_verifier'));
      const seconds = Math.floor(time/1000);
      const header = Buffer.from(JSON.stringify({alg:'RS256',kid:jwk.kid})).toString('base64url');
      const claims = Buffer.from(JSON.stringify({iss:issuer,aud:'client',sub:subject,iat:seconds,exp:seconds+(expiredToken?-1:3600),nonce})).toString('base64url');
      const signature = brokenSignature?Buffer.alloc(256).toString('base64url'):sign('RSA-SHA256',Buffer.from(header+'.'+claims),privateKey).toString('base64url');
      return Response.json({id_token:header+'.'+claims+'.'+signature});
    }
    throw Error('Unexpected request');
  };
  await writeFile(usersFile, JSON.stringify([{sub:subject,permissions:['pmo']}])) ;
  const auth = createAuth({APP_ORIGIN:origin,OIDC_ISSUER:issuer,OIDC_CLIENT_ID:'client',OIDC_CLIENT_SECRET:'test-secret',AUTHORIZED_USERS_FILE:usersFile},{clock:()=>time});
  async function begin(cookie='') {
    const res=response();
    await auth.confirm({headers:{origin,cookie}},res,new URL(origin+'/auth/confirm'));
    if(res.statusCode!==200) return {res};
    const target=new URL(JSON.parse(res.body).redirect,origin);
    nonce=target.searchParams.get('nonce');
    assert.equal(target.searchParams.has('prompt'),false);
    return {res,target,cookie:res.headers['Set-Cookie']?.split(';')[0]};
  }
  async function finish(transaction, cookie=transaction.cookie) {
    const res=response();
    await auth.callback({headers:{cookie}},res,new URL(origin+'/auth/callback?state='+transaction.target.searchParams.get('state')+'&code=confirmed-code'));
    return res;
  }
  try {
    let transaction=await begin();
    const duplicate=await begin(transaction.cookie);
    assert.equal(duplicate.target.href,transaction.target.href);
    let res=await finish(transaction,'vanguarda_transaction=wrong');
    assert.equal(res.headers.Location,'/login?error=identity');
    assert.equal(tokenCalls,0);
    res=await finish(transaction);
    assert.equal(res.headers.Location,'/#dashboard');
    assert.match(res.headers['Set-Cookie'][0],/HttpOnly; SameSite=Lax/);
    const cookie=res.headers['Set-Cookie'][0].split(';')[0];
    const req={headers:{cookie}};
    assert.equal((await auth.session(req)).sub,'authorized-test');
    const callsBefore=metadataCalls;
    const repeated=response();
    await auth.confirm({headers:{origin,cookie}},repeated,new URL(origin+'/auth/confirm'));
    assert.deepEqual(JSON.parse(repeated.body),{redirect:'/#dashboard'});
    assert.equal(metadataCalls,callsBefore);
    const repeatedCallback=response();
    await auth.callback(req,repeatedCallback,new URL(origin+'/auth/callback?state=used&code=used'));
    assert.equal(repeatedCallback.headers.Location,'/#dashboard');
    assert.equal(metadataCalls,callsBefore);
    assert.equal((await finish(transaction)).headers.Location,'/login?error=identity');

    transaction=await begin(); time+=300001;
    assert.equal((await finish(transaction)).headers.Location,'/login?error=expired');
    transaction=await begin(); expiredToken=true;
    assert.equal((await finish(transaction)).headers.Location,'/login?error=expired');
    expiredToken=false;transaction=await begin();brokenSignature=true;
    assert.equal((await finish(transaction)).headers.Location,'/login?error=identity');
    brokenSignature=false;subject='not-authorized';transaction=await begin();
    res=await finish(transaction);
    assert.equal(res.headers.Location,'/login?error=denied');
    assert.equal(res.headers['Set-Cookie'].includes('vanguarda_session'),false);
    subject='authorized-test';transaction=await begin();res=await finish(transaction);
    const restoredReq={headers:{cookie:res.headers['Set-Cookie'][0].split(';')[0]}};
    assert.ok(await auth.session(restoredReq));
    await writeFile(usersFile,'[]');
    const revoked=response();await auth.confirm({...restoredReq,headers:{...restoredReq.headers,origin}},revoked,new URL(origin+'/auth/confirm'));
    assert.equal(revoked.statusCode,403);
    assert.equal(JSON.parse(revoked.body).error,'denied');
    assert.equal(await auth.session(restoredReq),null);
  } finally {global.fetch=originalFetch;await rm(directory,{recursive:true});}
});

test('confirmação HTTP: configuração ausente e origem inválida não criam sessão', async () => {
  const {createServer} = await import('../scripts/serve.mjs');
  const {createAuth} = await import('../scripts/auth.mjs');
  const server=createServer({auth:createAuth({})});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base='http://127.0.0.1:'+server.address().port;
  try {
    let res=await fetch(base+'/auth/confirm',{method:'POST',headers:{Origin:'https://other.invalid'}});
    assert.equal(res.status,403);assert.equal(res.headers.get('set-cookie'),null);
    res=await fetch(base+'/auth/confirm',{method:'POST',headers:{Origin:'http://127.0.0.1:5173'}});
    assert.equal(res.status,503);assert.deepEqual(await res.json(),{error:'config'});assert.equal(res.headers.get('set-cookie'),null);
  } finally {await new Promise(resolve=>server.close(resolve));}
});

test('Confirmar mostra Entrando, bloqueia duplicação e permite nova tentativa após erro', async () => {
  const listeners={};
  const form={addEventListener:(name,handler)=>listeners[name]=handler,setAttribute:(name,value)=>form[name]=value};
  const button={}, status={};
  let fetchCalls=0, resolveFetch, destination;
  const context={URL,URLSearchParams,AbortSignal,location:{origin:'http://127.0.0.1:5173',search:''},window:{location:{replace:value=>destination=value},addEventListener:()=>{}},document:{querySelector:id=>({'#confirm-form':form,'#confirm-access':button,'#login-status':status}[id])},fetch:()=>{fetchCalls++;return new Promise(resolve=>resolveFetch=resolve);}};
  vm.runInNewContext(await readFile(path.join(__dirname,'../dist/login.js'),'utf8'),context);
  const event={preventDefault(){}};
  const first=listeners.submit(event);
  assert.equal(button.textContent,'Entrando…');assert.equal(button.disabled,true);assert.equal(form['aria-busy'],'true');
  await listeners.submit(event);assert.equal(fetchCalls,1);
  resolveFetch({ok:false,json:async()=>({error:'expired'})});await first;
  assert.match(status.textContent,/expirou/);assert.equal(button.disabled,false);assert.equal(button.textContent,'Confirmar');
  const second=listeners.submit(event);
  resolveFetch({ok:true,json:async()=>({redirect:'/#dashboard'})});await second;
  assert.equal(destination,'http://127.0.0.1:5173/#dashboard');assert.equal(button.disabled,true);
});
