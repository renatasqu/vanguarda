import {randomBytes,createHash,createPublicKey,verify} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const random=()=>randomBytes(32).toString('base64url');
export const safeNext=value=>/^\/#(dashboard|projetos|simulador|metodologia|incorporacoes)$/.test(value||'')?value:'/#dashboard';
export function createAuth(env=process.env,{clock=Date.now,onEvent=async()=>{}}={}){
 const sessions=new Map(),transactions=new Map(),logoutTickets=new Map();
 const origin=env.APP_ORIGIN||'http://127.0.0.1:5173',secure=origin.startsWith('https://');
 const configured=!!(env.OIDC_ISSUER&&env.OIDC_CLIENT_ID&&env.OIDC_CLIENT_SECRET&&env.AUTHORIZED_USERS_FILE)&&(secure||env.NODE_ENV!=='production');
 const cookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`;
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=')));
 async function allowed(sub,permission){try{const users=JSON.parse(await readFile(env.AUTHORIZED_USERS_FILE,'utf8'));return users.some(u=>u.sub===sub&&u.permissions?.includes(permission));}catch{return false;}}
 async function session(req,permission='pmo'){const s=sessions.get(cookies(req).vanguarda_session);if(!s||s.expires<=clock()||!await allowed(s.sub,permission))return null;return s;}
 async function metadata(){const issuer=env.OIDC_ISSUER;if(!issuer?.startsWith('https://'))throw Error('Issuer precisa de HTTPS');const r=await fetch(issuer.replace(/\/$/,'')+'/.well-known/openid-configuration',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Provedor indisponível');const m=await r.json();if(m.issuer!==issuer||![m.authorization_endpoint,m.token_endpoint,m.jwks_uri].every(v=>v?.startsWith('https://')))throw Error('Configuração inválida');return m;}
 const dashboard='/#dashboard';
 const json=(res,status,body)=>res.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(body));
 const fail=(res,error,asJSON,status=400)=>asJSON?json(res,status,{error}):res.writeHead(303,{Location:'/login?error='+error}).end();
 async function login(req,res,url,asJSON=false){
 if(await session(req))return asJSON?json(res,200,{redirect:dashboard}):res.writeHead(303,{Location:dashboard}).end();
 if(identity(req))return fail(res,'denied',asJSON,403);
 if(!configured)return fail(res,'config',asJSON,503);
 try{
 const m=await metadata();
 for(const [k,v] of transactions)if(v.expires<=clock())transactions.delete(k);
 // Keep a pending transaction stable across duplicate clicks in this browser.
 const previous=cookies(req).vanguarda_transaction;
 let state=previous,t=transactions.get(previous);
 if(!t||t.expires<=clock()){state=random();t={nonce:random(),verifier:random(),expires:clock()+300000};transactions.set(state,t);}
 const dest=new URL(m.authorization_endpoint);
 dest.search=new URLSearchParams({client_id:env.OIDC_CLIENT_ID,response_type:'code',scope:'openid',redirect_uri:origin+'/auth/callback',state,nonce:t.nonce,code_challenge:createHash('sha256').update(t.verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 const headers={'Set-Cookie':cookie('vanguarda_transaction',state,Math.max(1,Math.ceil((t.expires-clock())/1000)))};
 if(asJSON)return res.writeHead(200,{...headers,'Content-Type':'application/json'}).end(JSON.stringify({redirect:dest.href}));
 return res.writeHead(303,{...headers,Location:dest.href}).end();
 }catch{return fail(res,'provider',asJSON,502);}}
 async function confirm(req,res,url){
 if(req.headers.origin!==origin)return json(res,403,{error:'request'});
 return login(req,res,url,true);
 }
 async function callback(req,res,url){try{
 if(await session(req))return res.writeHead(303,{Location:dashboard}).end();
 const state=url.searchParams.get('state'),t=transactions.get(state);
 if(!t||cookies(req).vanguarda_transaction!==state)throw Error();
 transactions.delete(state);
 if(t.expires<=clock())throw Error('expired');
 if(url.searchParams.has('error'))throw Error('cancelled');
 if(!url.searchParams.get('code'))throw Error();
 const m=await metadata();const r=await fetch(m.token_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:'Basic '+Buffer.from(`${encodeURIComponent(env.OIDC_CLIENT_ID)}:${encodeURIComponent(env.OIDC_CLIENT_SECRET)}`).toString('base64')},body:new URLSearchParams({grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:origin+'/auth/callback',code_verifier:t.verifier}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();
 const token=(await r.json()).id_token;const parts=token.split('.');if(parts.length!==3)throw Error();const header=JSON.parse(Buffer.from(parts[0],'base64url')),claims=JSON.parse(Buffer.from(parts[1],'base64url'));if(header.alg!=='RS256')throw Error();
 const keysResponse=await fetch(m.jwks_uri,{signal:AbortSignal.timeout(10000)});if(!keysResponse.ok)throw Error();const keys=await keysResponse.json();const jwk=keys.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256'));if(!jwk||!verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key:jwk,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw Error();
 const now=clock()/1000;
 if(Number.isFinite(claims.exp)&&claims.exp<=now)throw Error('expired');
 const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];if(claims.iss!==env.OIDC_ISSUER||!aud.includes(env.OIDC_CLIENT_ID)||(aud.length>1&&claims.azp!==env.OIDC_CLIENT_ID)||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||(claims.nbf&&claims.nbf>now)||claims.nonce!==t.nonce||typeof claims.sub!=='string')throw Error();
 if(!await allowed(claims.sub,'pmo')){await onEvent({sub:claims.sub,name:claims.sub},'adição','falhou','Entrada negada: identidade sem autorização PMO.');return res.writeHead(303,{Location:'/login?error=denied','Set-Cookie':cookie('vanguarda_transaction','',0)}).end();}
 await onEvent(await user(claims.sub),'adição','concluído','Identidade OIDC validada e sessão estabelecida.');
 sessions.delete(cookies(req).vanguarda_session);
 const id=random();sessions.set(id,{sub:claims.sub,csrf:random(),idToken:token,expires:Math.min(clock()+3600000,claims.exp*1000)});res.writeHead(303,{Location:dashboard,'Set-Cookie':[cookie('vanguarda_session',id,3600),cookie('vanguarda_transaction','',0)]}).end();
 }catch(error){await onEvent({sub:'unverified',name:'Identidade não validada'},'adição','falhou','Confirmação de identidade recusada; sessão não estabelecida.').catch(()=>{});const reason=['expired','cancelled'].includes(error.message)?error.message:'identity';res.writeHead(303,{Location:'/login?error='+reason,'Set-Cookie':cookie('vanguarda_transaction','',0)}).end();}}
 async function logout(req,res,s){
 if(req.headers.origin!==origin||req.headers['x-csrf-token']!==s.csrf)return res.writeHead(403).end();
 try{const m=await metadata();if(!m.end_session_endpoint?.startsWith('https://'))throw Error();
 const dest=new URL(m.end_session_endpoint);dest.search=new URLSearchParams({id_token_hint:s.idToken,post_logout_redirect_uri:origin+'/login',client_id:env.OIDC_CLIENT_ID}).toString();
 await onEvent(await user(s.sub),'exclusão','concluído','Sessão encerrada pelo usuário.');
 const ticket=random();logoutTickets.set(ticket,{url:dest.href,expires:clock()+60000});sessions.delete(cookies(req).vanguarda_session);
 res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':cookie('vanguarda_session','',0),'Clear-Site-Data':'"cache", "storage"'}).end(JSON.stringify({ok:true,redirect:'/auth/provider-logout?ticket='+ticket}));
 }catch{res.writeHead(502,{'Content-Type':'application/json'}).end(JSON.stringify({error:'Não foi possível encerrar a sessão no provedor.'}));}}
 function providerLogout(req,res,url){const ticket=url.searchParams.get('ticket'),entry=logoutTickets.get(ticket);logoutTickets.delete(ticket);res.writeHead(303,{Location:entry&&entry.expires>clock()?entry.url:'/login'}).end();}
 function identity(req){const s=sessions.get(cookies(req).vanguarda_session);return s&&s.expires>clock()?s:null;}
 async function user(sub){try{const entries=JSON.parse(await readFile(env.AUTHORIZED_USERS_FILE,'utf8'));const u=entries.find(u=>u.sub===sub);return {sub,name:typeof u?.name==='string'?u.name:sub};}catch{return {sub,name:sub};}}
 return {user,configured,session,login,confirm,callback,logout,allowed,identity,providerLogout};
}
