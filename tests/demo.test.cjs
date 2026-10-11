const {test}=require('node:test');
const assert=require('node:assert/strict');

test('protótipo: Confirmar abre Dashboard sem configuração; dados e saída funcionam',async()=>{
  const {createServer}=await import('../scripts/serve.mjs');
  const {createDemoAuth}=await import('../scripts/demo-auth.mjs');
  assert.throws(()=>createDemoAuth({NODE_ENV:'production'}),/protótipo local/);
  const server=createServer({auth:createDemoAuth({})});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const base='http://127.0.0.1:'+server.address().port;
  try {
    const page=await (await fetch(base+'/login')).text();
    assert.match(page,/data-auth-mode="demo"/);
    assert.match(page,/sem autenticação corporativa/);
    const confirmation=await fetch(base+'/auth/confirm',{method:'POST',headers:{Origin:base}});
    assert.equal(confirmation.status,200);
    assert.equal((await confirmation.json()).redirect,'/#dashboard');
    const cookie=confirmation.headers.get('set-cookie').split(';')[0];
    const headers={Cookie:cookie};
    assert.equal((await fetch(base+'/',{headers})).status,200);
    assert.equal((await fetch(base+'/app.js',{headers})).status,200);
    assert.equal((await fetch(base+'/simulator.js',{headers})).status,200);
    const session=await (await fetch(base+'/api/session',{headers})).json();
    assert.deepEqual(session.permissions,['pmo','commercial','audit']);
    assert.equal((await fetch(base+'/api/incorporacoes',{headers})).status,200);
    const second=await fetch(base+'/auth/confirm',{method:'POST',headers:{...headers,Origin:base}});
    assert.equal(second.headers.get('set-cookie').split(';')[0],cookie);
    assert.equal((await second.json()).redirect,'/#dashboard');
    const logout=await fetch(base+'/auth/logout',{method:'POST',headers:{...headers,Origin:base,'X-CSRF-Token':session.csrf}});
    assert.equal(logout.status,200);
    assert.equal((await logout.json()).redirect,'/login');
    assert.equal((await fetch(base+'/api/session',{headers})).status,401);
    assert.equal((await fetch(base+'/',{headers,redirect:'manual'})).headers.get('location'),'/login');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
