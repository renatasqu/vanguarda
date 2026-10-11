window.VanguardaSession={csrf:null,permissions:[]};
function applySessionNavigation(){
 document.querySelectorAll('[data-permission]').forEach(el=>el.hidden=!VanguardaSession.permissions.includes(el.dataset.permission));
 const demo=VanguardaSession.mode==='demo';
 const name=demo?'Sessão demonstrativa':VanguardaSession.user?.name||'Conta corporativa';
 const role=demo?'Protótipo local':VanguardaSession.user?.role||'Acesso autorizado';
 document.querySelector('#account-name').textContent=name;
 document.querySelector('#account-role').textContent=role;
 document.querySelector('#account-avatar').textContent=demo?'D':VanguardaSession.user?.name?name.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase('pt-BR'):'●';
 document.querySelector('#account-menu > summary').removeAttribute('aria-label');
 document.querySelector('#account-menu > summary').title='Menu da conta';
 document.querySelector('#account-label').textContent=demo?'Sessão demonstrativa':'Conta corporativa';
 document.querySelector('#account-description').textContent=demo?'Identidade não verificada · protótipo local':'Acesso conforme suas permissões';
}
window.sessionReady=fetch('/api/session',{cache:'no-store'}).then(async r=>{if(!r.ok){location.replace('/login');throw Error('Sessão inválida');}Object.assign(VanguardaSession,await r.json());applySessionNavigation();return VanguardaSession;});
async function validateSession(){document.body.style.visibility='hidden';try{const r=await fetch('/api/session',{cache:'no-store'});if(!r.ok)return location.replace('/login');Object.assign(VanguardaSession,await r.json());applySessionNavigation();document.body.style.visibility='';}catch{location.replace('/login?error=provider');}}
window.addEventListener('pageshow',e=>{if(e.persisted)validateSession();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.body.style.visibility='hidden';else validateSession();});
window.addEventListener('pagehide',()=>{document.body.style.visibility='hidden';});
document.querySelector('#logout').onclick=async()=>{const button=document.querySelector('#logout');button.disabled=true;try{await sessionReady;const r=await fetch('/auth/logout',{method:'POST',headers:{'X-CSRF-Token':VanguardaSession.csrf}});if(!r.ok)throw Error();const result=await r.json();Simulation.clear();document.querySelector('#main').replaceChildren();document.querySelector('#detail-content').replaceChildren();VanguardaSession.csrf=null;window.location.replace(result.redirect||'/login');}catch{document.querySelector('#user-feedback').textContent='Não foi possível encerrar a sessão. Tente novamente.';button.disabled=false;}};
document.querySelector('#menu-toggle').onclick=()=>{const button=document.querySelector('#menu-toggle'),open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));document.querySelector('aside').classList.toggle('menu-open',open);};
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('aside').classList.remove('menu-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');}));

const accountMenu=document.querySelector('#account-menu');
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(accountMenu.open){accountMenu.open=false;accountMenu.querySelector('summary').setAttribute('aria-expanded','false');accountMenu.querySelector('summary').focus();return;}
 const menuButton=document.querySelector('#menu-toggle');
 if(menuButton.getAttribute('aria-expanded')==='true'){
  document.querySelector('aside').classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.focus();
 }
});
document.addEventListener('click',e=>{if(!accountMenu.contains(e.target))accountMenu.open=false;});

accountMenu.addEventListener('toggle',()=>accountMenu.querySelector('summary').setAttribute('aria-expanded',String(accountMenu.open)));
accountMenu.querySelector('summary').setAttribute('aria-expanded','false');
