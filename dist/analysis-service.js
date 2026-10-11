/* Fronteira entre apresentação e análise. Não acessa DOM ou armazenamento. */
(function(root){
 'use strict';
 const inputKeys=['id','sector','budget','spent','progress','planned','days','validated','scope','openRisks','asOf','recordedAt','baselineVersion','currency','elapsedDays'];
 const fields=['budget','spent','days','progress','planned','actualRelative','plannedRelative','expenseRelative','ev','pv','cpi','spi','eac','duration'];
 function snapshot(project={}){return Object.fromEntries(inputKeys.map(key=>[key,project?.[key]]));}
 function check(result){
  if(!result||typeof result!=='object')throw new TypeError('O provedor deve retornar uma análise.');
  for(const key of fields)if(result[key]!==null&&(!Number.isFinite(result[key])||result[key]<0))throw new TypeError(`Resultado inválido: ${key} deve ser número finito não negativo ou null.`);
  if(!['Saudável','Atenção','Crítico','Sem base'].includes(result.status))throw new TypeError('Situação inválida.');
  if(!Array.isArray(result.issues)||!result.issues.every(x=>typeof x==='string'))throw new TypeError('Motivos inválidos.');
  if(!Array.isArray(result.alerts)||!result.alerts.every(a=>a&&typeof a.code==='string'&&typeof a.critical==='boolean'&&typeof a.title==='string'&&typeof a.factors==='string'))throw new TypeError('Alertas inválidos.');
  return result;
 }
 function create(provider){
  if(!provider||typeof provider.analyze!=='function'||!provider.id||!provider.version||!['demonstrative','trained'].includes(provider.kind))throw new TypeError('Provedor sem identidade, versão, tipo ou método analyze.');
  const metadata=Object.freeze({id:provider.id,version:provider.version,kind:provider.kind});
  const normalize=result=>Object.freeze({...check(result),metadata});
  return Object.freeze({metadata,
   evaluate(project){const result=provider.analyze(snapshot(project));if(result&&typeof result.then==='function')throw new TypeError('Provedor assíncrono: use evaluateAsync e aguarde antes de atualizar a interface.');return normalize(result);},
   async evaluateAsync(project){return normalize(await provider.analyze(snapshot(project)));}
  });
 }
 const demonstration=create({id:'earned-value-rules',version:'1.0.0',kind:'demonstrative',analyze:root.VanguardaEngine.calculate});
 const api=Object.freeze({create,snapshot,...demonstration});
 root.VanguardaAnalysis=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
