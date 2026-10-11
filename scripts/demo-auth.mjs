import {randomBytes} from 'node:crypto';

// Explicit prototype navigation session. This does not verify a real identity.
export function createDemoAuth(env=process.env,{onEvent=async()=>{}}={}) {
  if(env.NODE_ENV==='production')throw Error('O modo de demonstração é exclusivo do protótipo local.');
  const sessions=new Map();
  const random=()=>randomBytes(32).toString('base64url');
  const cookie=(value,age)=>`vanguarda_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}`;
  const id=req=>(req.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith('vanguarda_session='))?.slice('vanguarda_session='.length);
  const identity=req=>{const current=sessions.get(id(req));return current&&current.expires>Date.now()?current:null;};
  const validOrigin=req=>{try{const origin=new URL(req.headers.origin);return origin.host===req.headers.host&&['127.0.0.1','localhost','[::1]'].includes(origin.hostname);}catch{return false;}};
  const allowed=async(sub,permission)=>sub==='prototype-demo'&&['pmo','commercial','audit'].includes(permission);
  const session=async(req,permission='pmo')=>{const current=identity(req);return current&&await allowed(current.sub,permission)?current:null;};
  async function enter(req,res,json=false){
    let current=identity(req),sessionId=id(req);
    if(!current){await onEvent({sub:'prototype-demo',name:'Sessão demonstrativa (identidade não verificada)'},'adição','concluído','Entrada no protótipo local.');sessionId=random();current={sub:'prototype-demo',csrf:random(),expires:Date.now()+3600000};sessions.set(sessionId,current);}
    const headers={'Set-Cookie':cookie(sessionId,3600)};
    if(json)return res.writeHead(200,{...headers,'Content-Type':'application/json'}).end(JSON.stringify({redirect:'/#dashboard',mode:'demo'}));
    return res.writeHead(303,{...headers,Location:'/#dashboard'}).end();
  }
  function confirm(req,res){if(!validOrigin(req))return res.writeHead(403,{'Content-Type':'application/json'}).end('{"error":"request"}');return enter(req,res,true);}
  async function logout(req,res,current){
    if(!validOrigin(req)||req.headers['x-csrf-token']!==current.csrf)return res.writeHead(403,{'Content-Type':'application/json'}).end('{"error":"request"}');
    await onEvent({sub:current.sub,name:'Sessão demonstrativa (identidade não verificada)'},'exclusão','concluído','Saída do protótipo local.');
    sessions.delete(id(req));res.writeHead(200,{'Set-Cookie':cookie('',0),'Content-Type':'application/json'}).end('{"ok":true,"redirect":"/login"}');
  }
  return {user:async sub=>({sub,name:'Sessão demonstrativa (identidade não verificada)'}),mode:'demo',session,identity,allowed,confirm,login:(req,res)=>enter(req,res),logout,callback:(req,res)=>res.writeHead(303,{Location:'/login'}).end(),providerLogout:(req,res)=>res.writeHead(303,{Location:'/login'}).end()};
}
