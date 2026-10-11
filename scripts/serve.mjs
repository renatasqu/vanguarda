import http from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAuth} from './auth.mjs';
import {createDemoAuth} from './demo-auth.mjs';
import {catalog} from './catalog.mjs';
import {createAuditStore} from './audit-store.mjs';
const file=fileURLToPath(import.meta.url),root=path.resolve(path.dirname(file),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
export function createServer({auth,demo=false,dataDir=path.resolve(root,'../data')}={}){
 const store=createAuditStore(dataDir,demo||auth?.mode==='demo'?'demo':'secure');
 const onEvent=(actor,action,result,description)=>store.authEvent(actor,action,result,description);
 auth ||= demo?createDemoAuth(process.env,{onEvent}):createAuth(process.env,{onEvent});
 return http.createServer(async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const json=(code,value)=>res.writeHead(code,{'Content-Type':'application/json'}).end(JSON.stringify(value));
 try{
 const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
 if(pathname==='/auth/provider-logout'&&req.method==='GET')return auth.providerLogout(req,res,url);
 if(pathname==='/auth/login'&&req.method==='GET')return await auth.login(req,res,url);
 if(pathname==='/auth/confirm'&&req.method==='POST')return await auth.confirm(req,res,url);
 if(pathname==='/auth/callback'&&req.method==='GET')return await auth.callback(req,res,url);
 const publicFiles={'/login':'login.html','/style.css':'style.css','/login.js':'login.js'};
 if(publicFiles[pathname]&&req.method==='GET'){if(pathname==='/login'&&await auth.session(req))return res.writeHead(303,{Location:'/#dashboard'}).end();let content=await readFile(path.join(root,publicFiles[pathname]));if(pathname==='/login'&&auth.mode==='demo')content=content.toString().replace('class="login-page"','class="login-page" data-auth-mode="demo"').replace('Acesso exclusivo para pessoas autorizadas.','Protótipo demonstrativo · entre para explorar o Vanguarda.').replace('Sua identidade será validada pelo provedor corporativo.','Clique em Confirmar para abrir o Dashboard.').replace('Não há cadastro público. Solicite acesso à administração.','Modo demonstração · dados fictícios · sem autenticação corporativa.');return res.writeHead(200,{'Content-Type':types[path.extname(publicFiles[pathname])]}).end(content);}
 const permission=pathname==='/api/audit'?'audit':pathname.startsWith('/api/incorporacoes')||pathname==='/api/interests'?'commercial':null;
 const s=await auth.session(req,permission||'pmo');
 if(!s){if(pathname.startsWith('/api/')||pathname==='/auth/logout')return json(auth.identity?.(req)?403:401,{error:'Sessão ausente ou acesso não autorizado.'});return res.writeHead(303,{Location:'/login'}).end();}
 if(pathname==='/api/session')return json(200,{mode:auth.mode||'secure',user:auth.mode==='demo'||!auth.user?null:{name:(await auth.user(s.sub)).name},csrf:s.csrf,permissions:(await Promise.all(['pmo','commercial','audit'].map(async p=>await auth.allowed(s.sub,p)?p:null))).filter(Boolean)});
 if(pathname==='/auth/logout'&&req.method==='POST')return await auth.logout(req,res,s);
 if(pathname==='/api/incorporacoes'&&req.method==='GET')return json(200,catalog);
 if(pathname==='/api/audit'){
 if(req.method!=='GET')return json(405,{error:'O log permite somente consulta.'});
 for(const key of ['from','to'])if(url.searchParams.get(key)&&!Number.isFinite(Date.parse(url.searchParams.get(key))))return json(400,{error:'Período inválido.'});
 for(const key of ['from','to'])if(url.searchParams.get(key))url.searchParams.set(key,new Date(url.searchParams.get(key)).toISOString());
 if(url.searchParams.get('from')&&url.searchParams.get('to')&&url.searchParams.get('from')>url.searchParams.get('to'))return json(400,{error:'O início do período deve ser anterior ao fim.'});
 return json(200,await store.query(url.searchParams));
 }
 const projectHistory=pathname.match(/^\/api\/projects\/([^/]+)\/history$/);
 if(projectHistory){
  if(req.method!=='GET')return json(405,{error:'O histórico permite somente consulta.'});
  if(!['INC-001','INC-002','LOG-001','LOG-002','ENE-001','ENE-002'].includes(projectHistory[1]))return json(404,{error:'Projeto não encontrado.'});
  const administrator=await auth.allowed(s.sub,'audit');
  const data=await store.query(new URLSearchParams({page:url.searchParams.get('page')||'1'}),{projectId:projectHistory[1],subject:administrator?null:s.sub});
  return json(200,{...data,scope:administrator?'project':'own',source:'server-journal'});
 }
 const actor=auth.user?await auth.user(s.sub):{sub:s.sub,name:s.sub};
 const actionRoute=pathname==='/api/actions'||/^\/api\/actions\/[^/]+$/.test(pathname);
 if(actionRoute||pathname==='/api/interests'){
 const module=actionRoute?'Ações PMO':'Interesses',recordId=pathname.startsWith('/api/actions/')?pathname.split('/').pop():null;
 if(actionRoute&&req.method==='GET'&&!recordId){let legacy=[];try{legacy=(await readFile(path.join(dataDir,'actions-'+createHash('sha256').update(s.sub).digest('hex')+'.jsonl'),'utf8')).split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}return json(200,[...legacy,...await store.list(module,s.sub)]);}
 const action=req.method==='POST'?'adição':req.method==='PATCH'?'alteração':req.method==='DELETE'?'exclusão':null;
 if(!action||(!recordId&&action!=='adição')||(recordId&&action==='adição')||(!actionRoute&&action!=='adição'))return json(405,{error:'Operação não suportada.'});
 const expectedOrigin=auth.mode==='demo'?new URL(req.headers.origin||'http://invalid').host===req.headers.host:req.headers.origin===(process.env.APP_ORIGIN||'http://127.0.0.1:5173');
 if(!expectedOrigin||req.headers['x-csrf-token']!==s.csrf){await store.failure(actor,module,recordId,action);return json(403,{error:'Requisição não autorizada.'});}
 try{
 let input={};if(action!=='exclusão'){let body='';for await(const chunk of req){body+=chunk;if(body.length>65536)throw Object.assign(Error('Registro muito grande.'),{status:413});}try{input=JSON.parse(body);}catch{throw Object.assign(Error('JSON inválido.'),{status:400});}
 if(actionRoute){if(typeof input.action!=='string'||input.action.length<10||typeof input.owner!=='string'||!input.owner.trim()||!['INC-001','INC-002','LOG-001','LOG-002','ENE-001','ENE-002'].includes(input.projectId)||input.due&&!/^\d{4}-\d{2}-\d{2}$/.test(input.due))throw Object.assign(Error('Registro inválido.'),{status:400});
 input=Object.fromEntries(['projectId','projectName','action','owner','due','original','scenario','checks','analysis','originalAnalysis','recommendations'].filter(k=>k in input).map(k=>[k,input[k]]));
 }else{if(!catalog.some(p=>p.id===input.propertyId))throw Object.assign(Error('Imóvel inválido.'),{status:400});input={propertyId:input.propertyId};}}
 const saved=await store.mutate({actor,module,...(recordId?{id:recordId}:{}),action,record:input});return json(action==='adição'?201:200,action==='exclusão'?{ok:true}:saved);
 }catch(e){if(e.status===400||e.status===413)await store.failure(actor,module,recordId,action);return json(e.status||500,{error:e.status?e.message:'Não foi possível gravar o registro e sua auditoria.'});}
 }
 if(pathname.startsWith('/api/'))return json(404,{error:'Endpoint não encontrado.'});
 if(['app.js','simulator.js'].includes(pathname.slice(1))&&!await auth.allowed(s.sub,'pmo'))return json(403,{error:'Sem permissão PMO.'});
 const allowed=['index.html','engine.js','analysis-service.js','ui.js','app.js','simulator.js','incorporacoes.js','session.js','property.svg','sunburst.js','audit.js'];const name=pathname==='/'?'index.html':pathname.slice(1);if(!allowed.includes(name))return res.writeHead(404).end('Arquivo não encontrado');
 const content=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]}).end(content);
 }catch{if(!res.headersSent)json(500,{error:'Não foi possível concluir a operação. Tente novamente.'});else res.end();}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===file){const demo=process.argv.includes('--demo');const server=createServer({demo});server.listen(Number(process.env.PORT||5173),'127.0.0.1',()=>console.log('Vanguarda: http://127.0.0.1:'+server.address().port));}
