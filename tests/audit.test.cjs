const {test}=require('node:test'),assert=require('node:assert/strict');
const {mkdtemp,rm,writeFile}=require('node:fs/promises');const os=require('node:os'),path=require('node:path');
test('auditoria: transações, autoria do servidor, antes/depois, falhas, paginação e persistência',async()=>{
 const {createAuditStore}=await import('../scripts/audit-store.mjs');const dir=await mkdtemp(path.join(os.tmpdir(),'vanguarda-audit-'));const actor={sub:'server-subject',name:'Nome validado no servidor'};
 try{const store=createAuditStore(dir);const record=await store.mutate({actor,module:'Ações PMO',action:'adição',record:{projectId:'INC-001',action:'Senha secreta não deve ir ao log',owner:'token sensível',due:'2026-11-01',name:'autor falso',token:'SECRET'}});assert.equal(record.subject,actor.sub);
 await store.mutate({actor,module:'Ações PMO',id:record.id,action:'alteração',record:{...record,action:'Nova descrição sensível',due:'2026-12-01'}});
 await store.mutate({actor,module:'Ações PMO',id:record.id,action:'exclusão'});
 await assert.rejects(store.mutate({actor,module:'Ações PMO',id:record.id,action:'exclusão'}));
 const data=await store.query(new URLSearchParams());assert.equal(data.total,4);assert.ok(data.events.every(e=>e.user.id===actor.sub&&e.user.name===actor.name));assert.equal(new Set(data.events.map(e=>e.id)).size,4);const changed=data.events.find(e=>e.action==='alteração');assert.ok(changed.changedFields.includes('action'));assert.equal(changed.before.due,'2026-11-01');assert.equal(changed.after.due,'2026-12-01');const deleted=data.events.find(e=>e.action==='exclusão'&&e.result==='concluído');assert.equal(deleted.before.projectId,'INC-001');assert.equal(deleted.after,null);assert.equal(data.events.filter(e=>e.result==='falhou').length,1);const json=JSON.stringify(data);for(const secret of ['SECRET','Senha secreta','token sensível','Nova descrição sensível','autor falso'])assert.ok(!json.includes(secret));
 const reload=createAuditStore(dir);assert.equal((await reload.query(new URLSearchParams())).total,4);assert.equal((await reload.list('Ações PMO',actor.sub)).length,0);
 for(let i=0;i<21;i++)await reload.failure(actor,'Interesses','registro-'+i,'adição');assert.equal((await reload.query(new URLSearchParams('page=1'))).events.length,20);assert.equal((await reload.query(new URLSearchParams('page=2'))).events.length,5);assert.equal((await reload.query(new URLSearchParams('action=alteração&result=concluído'))).total,1);
 }finally{await rm(dir,{recursive:true});}
});
test('API: somente audit administra consulta, sem edição do log, CRUD com usuário correto',async()=>{
 const {createServer}=await import('../scripts/serve.mjs');const dir=await mkdtemp(path.join(os.tmpdir(),'vanguarda-audit-api-'));const s={sub:'trusted-sub',csrf:'test-csrf'};const auth={session:async(req,p)=>req.headers.cookie==='admin'?s:req.headers.cookie==='member'&&p!=='audit'?{...s,sub:'member-sub'}:null,identity:req=>req.headers.cookie?s:null,allowed:async(sub,p)=>p!=='audit'||sub===s.sub,user:async sub=>({sub,name:'Servidor: '+sub})};const server=createServer({auth,dataDir:dir});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});const base='http://127.0.0.1:'+server.address().port,headers={Cookie:'admin',Origin:'http://127.0.0.1:5173','X-CSRF-Token':s.csrf,'Content-Type':'application/json'};
 try{assert.equal((await fetch(base+'/api/audit',{headers:{Cookie:'member'}})).status,403);assert.equal((await fetch(base+'/api/audit')).status,401);assert.equal((await fetch(base+'/api/audit?from=2026-12-01&to=2026-01-01',{headers})).status,400);assert.equal((await fetch(base+'/api/audit',{method:'DELETE',headers})).status,405);
 const create=await fetch(base+'/api/actions',{method:'POST',headers,body:JSON.stringify({projectId:'INC-001',action:'Descrição inicial válida',owner:'Nome de negócio',name:'Nome forjado'})});assert.equal(create.status,201);const record=await create.json();
 assert.equal((await fetch(base+'/api/actions/'+record.id,{method:'PATCH',headers,body:JSON.stringify({...record,action:'Descrição alterada válida'})})).status,200);
 assert.equal((await fetch(base+'/api/actions/'+record.id,{method:'DELETE',headers:{...headers,Cookie:'member'}})).status,404);
 assert.equal((await fetch(base+'/api/actions/'+record.id,{method:'DELETE',headers})).status,200);
 const audit=await (await fetch(base+'/api/audit',{headers})).json();assert.equal(audit.total,4);assert.equal(audit.events.find(e=>e.result==='falhou').user.id,'member-sub');assert.ok(audit.events.filter(e=>e.result==='concluído').every(e=>e.user.id==='trusted-sub'));assert.ok(!JSON.stringify(audit).includes('Nome forjado'));assert.equal((await (await fetch(base+'/api/actions',{headers})).json()).length,0);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});}
});


test('diário incompleto não aceita operações nem produz confirmação falsa',async()=>{
 const {createAuditStore}=await import('../scripts/audit-store.mjs');const dir=await mkdtemp(path.join(os.tmpdir(),'vanguarda-audit-truncated-'));
 try{await writeFile(path.join(dir,'audit-journal.jsonl'),'{}');const store=createAuditStore(dir);await assert.rejects(store.query(new URLSearchParams()),/Diário incompleto/);await assert.rejects(store.mutate({actor:{sub:'test'},module:'Ações PMO',action:'adição',record:{projectId:'INC-001'}}),/Diário incompleto/);}finally{await rm(dir,{recursive:true});}
});

test('histórico por projeto: PMO vê somente eventos próprios; audit vê o projeto; sem escrita ou expansão por parâmetros',async()=>{
 const {createServer}=await import('../scripts/serve.mjs');const dir=await mkdtemp(path.join(os.tmpdir(),'vanguarda-project-history-'));
 const permissions={admin:['pmo','audit'],member:['pmo'],other:['pmo'],visitor:[]};
 const auth={session:async(req,p)=>permissions[req.headers.cookie]?.includes(p)?{sub:req.headers.cookie,csrf:'csrf'}:null,identity:req=>permissions[req.headers.cookie]?{}:null,allowed:async(sub,p)=>permissions[sub]?.includes(p),user:async sub=>({sub,name:'Servidor '+sub})};
 const server=createServer({auth,dataDir:dir});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});const base='http://127.0.0.1:'+server.address().port;
 const headers=sub=>({Cookie:sub,Origin:'http://127.0.0.1:5173','X-CSRF-Token':'csrf','Content-Type':'application/json'});
 const route='/api/projects/INC-001/history';
 try{
  assert.equal((await fetch(base+route)).status,401);assert.equal((await fetch(base+route,{headers:headers('visitor')})).status,403);
  const add=async(sub,projectId)=>{const response=await fetch(base+'/api/actions',{method:'POST',headers:headers(sub),body:JSON.stringify({projectId,action:'Revisar cronograma confidencial',owner:'Responsável reservado',due:'2026-11-01'})});assert.equal(response.status,201);return response.json();};
  const record=await add('member','INC-001');await add('admin','INC-001');await add('admin','LOG-001');
  assert.equal((await fetch(base+'/api/actions/'+record.id,{method:'PATCH',headers:headers('member'),body:JSON.stringify({...record,due:'2026-12-01'})})).status,200);
  const own=await (await fetch(base+route+'?subject=admin&projectId=LOG-001',{headers:headers('member')})).json();assert.equal(own.scope,'own');assert.equal(own.total,2);assert(own.events.every(e=>e.user.id==='member'&&(e.before?.projectId||e.after?.projectId)==='INC-001'));
  const update=own.events.find(e=>e.action==='alteração');assert.equal(update.before.due,'2026-11-01');assert.equal(update.after.due,'2026-12-01');assert.deepEqual(update.changedFields,['due']);assert(!JSON.stringify(own).includes('confidencial'));assert(!JSON.stringify(own).includes('Responsável reservado'));
  const all=await (await fetch(base+route,{headers:headers('admin')})).json();assert.equal(all.scope,'project');assert.equal(all.total,3);assert.equal(all.source,'server-journal');
  assert.equal((await (await fetch(base+route,{headers:headers('other')})).json()).total,0);
  assert.equal((await fetch(base+route,{method:'DELETE',headers:headers('admin')})).status,405);assert.equal((await fetch(base+'/api/projects/unknown/history',{headers:headers('member')})).status,404);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true});}
});
