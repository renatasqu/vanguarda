const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculate}=require('../dist/engine.js');
const base={budget:100,spent:60,progress:50,planned:60,days:200,elapsedDays:999,validated:true};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
test('fórmulas usam frações compatíveis e prazo original/SPI, sem dias decorridos',()=>{
 const m=calculate(base);close(m.actualRelative,.5);close(m.expenseRelative,.6);close(m.cpi,5/6);close(m.spi,5/6);close(m.eac,120);close(m.duration,240);assert.equal(m.ev,50);assert.equal(m.pv,60);assert.equal(m.status,'Crítico');assert.deepEqual(m.issues,[]);
 close(calculate({...base,elapsedDays:1}).duration,m.duration);
});
test('zeros não geram divisão por zero e preservam indicadores independentes',()=>{
 let m=calculate({...base,spent:0});assert.equal(m.cpi,null);assert.equal(m.eac,null);close(m.spi,5/6);close(m.duration,240);assert(m.issues.some(v=>v.includes('despesa relativa igual a zero')));
 m=calculate({...base,planned:0});assert.equal(m.spi,null);assert.equal(m.duration,null);close(m.eac,120);
 m=calculate({...base,progress:0});assert.equal(m.cpi,0);assert.equal(m.spi,0);assert.equal(m.eac,null);assert.equal(m.duration,null);
 for(const key of ['budget','days'])assert.equal(calculate({...base,[key]:0})[key],null);
});
test('ausência e entradas inválidas não são silenciosamente convertidas',()=>{
 for(const value of [null,undefined,'','50',NaN,Infinity,-1]){
  const m=calculate({...base,progress:value});assert.equal(m.progress,null);assert.equal(m.cpi,null);assert.equal(m.spi,null);assert.equal(m.eac,null);assert.equal(m.duration,null);assert(m.issues.length);
 }
 for(const key of ['planned','progress'])assert.equal(calculate({...base,[key]:101})[key],null);
 for(const key of ['budget','spent','days']){const m=calculate({...base,[key]:null});assert.equal(m[key],null);assert(m.issues.length);}
 assert.equal(calculate(null).status,'Sem base');
});
test('limites são aplicados antes de arredondar e alertas explicam fatores',()=>{
 const boundary=calculate(base);assert(!boundary.alerts.some(a=>a.code==='cost'||a.code==='schedule'));
 const beyond=calculate({...base,spent:60.001,planned:60.001});assert(beyond.alerts.some(a=>a.code==='cost'));assert(beyond.alerts.some(a=>a.code==='schedule'));
 for(const a of beyond.alerts){assert(a.title);assert(a.factors);assert(a.factors.includes('CPI')||a.factors.includes('SPI'));}
 const pending=calculate({...base,validated:false});assert(pending.alerts.some(a=>a.code==='validation'&&a.factors.includes('PMO')));
});
test('situação depende de CPI e SPI e alertas de atenção são explicados',()=>{
 assert.equal(calculate({...base,spent:50,planned:50}).status,'Saudável');
 const m=calculate({...base,spent:55,planned:55});assert.equal(m.status,'Atenção');assert(m.alerts.some(a=>a.code==='performance'&&!a.critical));
 assert.equal(calculate({...base,spent:null}).status,'Sem base');
});
test('nenhum resultado numérico é não finito, mesmo em valores extremos',()=>{
 for(const p of [{},null,{...base,budget:Number.MAX_VALUE,spent:Number.MIN_VALUE},{...base,days:Number.MAX_VALUE,progress:Number.MIN_VALUE}]){
  for(const v of Object.values(calculate(p)))if(typeof v==='number')assert(Number.isFinite(v));
 }
});
