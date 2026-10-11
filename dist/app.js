const projects=[
{id:'INC-001',elapsedDays:180,name:'Residencial Aurora',sector:'Incorporações',budget:48,spent:24,progress:52,planned:50,days:360,owner:'Mariana Costa',risk:'Aprovações de fornecedores',action:'Manter acompanhamento semanal da obra.'},
{id:'INC-002',elapsedDays:180,name:'Parque das Oliveiras',sector:'Incorporações',budget:36,spent:22,progress:48,planned:60,days:300,owner:'Rafael Almeida',risk:'Atraso nas licenças e fundações',action:'Priorizar licenças e revisar o caminho crítico.'},
{id:'LOG-001',elapsedDays:149,name:'Modernização WMS Horizonte',sector:'Logística',budget:32,spent:19,progress:58,planned:62,days:240,owner:'Camila Rocha',risk:'Inconsistências no reporte e integração do WMS',action:'Validar os registros de custo e recuperar o cronograma do WMS.'},
{id:'LOG-002',elapsedDays:151,name:'Centro de Distribuição Sul',sector:'Logística',budget:24,spent:17,progress:75,planned:72,days:210,owner:'Pedro Santos',risk:'Integração dos sistemas',action:'Validar integração antes da operação assistida.'},
{id:'ENE-001',elapsedDays:208,name:'Usina Solar Alvorada',sector:'Energia',budget:42,spent:26,progress:65,planned:63,days:330,owner:'Beatriz Lima',risk:'Conexão à rede',action:'Confirmar janela de conexão com a distribuidora.'},
{id:'ENE-002',elapsedDays:206,name:'Expansão Solar Ventos do Norte',sector:'Energia',budget:58,spent:28,progress:44,planned:49,days:420,owner:'Lucas Ferreira',risk:'Licenciamento ambiental e entrega de módulos',action:'Validar licenças ambientais e a entrega dos módulos solares.'}
];
// Entradas sintéticas; não são dados operacionais do estudo de caso.
const signals=[{scope:1,openRisks:1,history:12,validated:true},{scope:4,openRisks:4,history:8,validated:true},{scope:3,openRisks:3,history:10,validated:false},{scope:1,openRisks:1,history:14,validated:true},{scope:2,openRisks:1,history:9,validated:true},{scope:3,openRisks:3,history:7,validated:true}];
projects.forEach((p,i)=>{Object.assign(p,signals[i]);Object.defineProperty(p,'status',{enumerable:true,get:()=>indicators(p).status});});
const indicators=p=>VanguardaAnalysis.evaluate(p);
const criticalSignals=p=>indicators(p).alerts.filter(a=>a.critical).map(a=>a.title+' — '+a.factors);
const alertMarkup=m=>m.alerts.map(a=>`<li><b>${escapeHTML(a.title)}</b><p>${escapeHTML(a.factors)}</p></li>`).join('')||'<li>Nenhum alerta pelas regras demonstrativas atuais.</li>';
const sumValues=values=>values.length&&values.every(Number.isFinite)?values.reduce((sum,v)=>sum+v,0):null;
const meanValues=values=>values.length&&values.every(Number.isFinite)?sumValues(values)/values.length:null;
const percentText=value=>Number.isFinite(value)?number(value)+'%':'Sem base';
const number=(n,digits=1)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:digits}):'—';
const durationText=n=>Number.isFinite(n)?number(Math.ceil(n),0)+' dias':'Sem base';
const changeText=(n,base,unit='')=>Number.isFinite(n)&&Number.isFinite(base)?(n-base>0?'+':'')+number(n-base)+(unit?' '+unit:''):'Sem base';
function comparison(title,items,format){
 const max=Math.max(1,...items.map(i=>Number.isFinite(i.value)?i.value:0));
 return VanguardaUI.ChartContainer(title,`${items.map(i=>`<div class="compare-row"><div class="bar-label"><span>${i.label}</span><b>${format(i.value)}</b></div><div class="compare-track"><span class="compare-fill ${i.kind||''}" style="width:${Number.isFinite(i.value)?Math.max(0,i.value)/max*100:0}%" aria-hidden="true"></span></div></div>`).join('')}`);
}
const money=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:1})+' mi':'Sem base';
const statusClass=s=>s==='Crítico'?'Critico':s==='Atenção'?'Atencao':'';
const badge=p=>VanguardaUI.StatusBadge(p.status);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sector='Todos os setores',query='',statusFilter='Todos os status';
const selectedProjects=()=>projects.filter(p=>(sector==='Todos os setores'||p.sector===sector)&&(statusFilter==='Todos os status'||p.status===statusFilter));
const filtered=()=>selectedProjects().filter(p=>p.name.toLowerCase().includes(query.toLowerCase()));
const head=(eyebrow,title,description,extra='')=>`<div class="heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;
const filters=(search=false)=>VanguardaUI.FilterBar(`<label class="filter-control">Divisão<select id="sector" aria-label="Filtrar por divisão">${['Todos os setores','Incorporações','Logística','Energia'].map(v=>`<option value="${v}" ${v===sector?'selected':''}>${v==='Todos os setores'?'Todas as divisões':v}</option>`).join('')}</select></label><label class="filter-control">Situação<select id="status" aria-label="Filtrar por situação">${['Todos os status','Saudável','Atenção','Crítico','Sem base'].map(v=>`<option value="${v}" ${v===statusFilter?'selected':''}>${v==='Todos os status'?'Todas as situações':v}</option>`).join('')}</select></label>${search?`<label class="filter-control">Nome do projeto<input type="search" id="search" aria-label="Buscar projeto" placeholder="Buscar projeto…" value="${escapeHTML(query)}"></label>`:''}<span class="stamp" role="status">Dados demonstrativos · ${search?filtered().length:selectedProjects().length} de ${projects.length} projetos</span>`);
function rows(list){return list.map(p=>{const m=indicators(p);return `<tr><td><button class="project-link" data-detail="${p.id}">${p.name}</button><small>${p.id}</small></td><td>${p.sector}</td><td>${badge(p)}</td><td>${money(p.budget)}</td><td>${money(m.eac)}</td><td>${durationText(m.duration)}</td><td>${percentText(indicators(p).planned)} / ${percentText(indicators(p).progress)}</td><td><button class="rowbutton button icon-button" data-detail="${p.id}" aria-label="Ver detalhes de ${p.name}">${VanguardaUI.Icon('arrow')}</button></td></tr>`}).join('')}
// Each ring uses mutually exclusive parts of the filtered total.
function ringChart(parts,total,unit){
 const sum=sumValues(parts.map(p=>p.value));let edge=0;
 const stops=parts.map(p=>{const start=edge;edge+=sum>0?p.value/sum*100:0;return `${p.color} ${start}% ${edge}%`;});
 return `<div class="chart"><div class="donut" style="background:${sum>0?'conic-gradient('+stops.join(',')+')':'var(--track)'}" role="img" aria-label="${escapeHTML(parts.map(p=>p.label+': '+number(p.value)).join('; '))}"><div class="donut-center"><b>${total}</b><span>${unit}</span></div></div><div class="legend">${parts.map(p=>`<div class="legend-row"><span><i class="dot" style="background:${p.color}" aria-hidden="true"></i>${p.label}</span><b>${number(p.value)}</b></div>`).join('')}</div></div>`;
}
function divisionDonut(list){
 const parts=['Incorporações','Logística','Energia'].map((label,i)=>({label,value:list.some(p=>p.sector===label)?sumValues(list.filter(p=>p.sector===label).map(p=>indicators(p).budget)):0,color:`var(--division-${i+1})`}));
 if(parts.some(p=>p.value===null))return '<p>Sem base completa para participação do orçamento.</p>';
 return ringChart(parts,number(sumValues(parts.map(p=>p.value)),0),'R$ milhões');
}
function projectComparisons(list,execution){
 const maximum=execution?100:Math.max(1,...list.flatMap(p=>{const m=indicators(p);return [m.budget,m.eac].filter(Number.isFinite);}));
 return `<div class="grouped-plot"><p class="plot-key"><span>● ${execution?'Planejada':'Orçamento'}</span><span>● ${execution?'Realizada':'Projetado'}</span> · ${execution?'%':'R$ mi'} · escala 0–${number(maximum)}</p>${list.map(p=>{const m=indicators(p);return `<div class="plot-project"><span>${escapeHTML(p.name)}</span>${[execution?m.planned:m.budget,execution?m.progress:m.eac].map((value,i)=>`<div class="plot-line"><div class="compare-track"><span class="compare-fill ${i?'actual':'planned'}" style="width:${Number.isFinite(value)?value/maximum*100:0}%"></span></div><b>${execution?percentText(value):number(value)}</b></div>`).join('')}</div>`;}).join('')||'<p>Sem projetos na seleção.</p>'}</div>`;
}
function dashboard(){
 const list=selectedProjects(),count=list.length,metrics=list.map(indicators);
 const budget=sumValues(metrics.map(m=>m.budget)),spent=sumValues(metrics.map(m=>m.spent));
 const eac=sumValues(metrics.map(m=>m.eac));
 const flagged=list.filter(p=>indicators(p).alerts.length),critical=list.filter(p=>criticalSignals(p).length);
 const counts=['Saudável','Atenção','Crítico','Sem base'].map(v=>list.filter(p=>p.status===v).length);
 return `<div class="executive-header">${head('Visão executiva','Portfólio de investimentos','Dados sintéticos · projeções demonstrativas',VanguardaUI.Button({label:'Exportar seleção',id:'export',icon:'download'}))}${filters()}</div>
 <div class="governance-notice" aria-label="Indicadores do Conselho">Os cinco indicadores do Conselho estão sem dados. <a href="#metodologia">Consultar bases necessárias →</a></div>
 <div class="kpis dashboard-kpis financial-kpis">${[
 {label:'Orçamento aprovado',value:money(budget),note:`${count} projetos na seleção`,icon:'wallet'},
 {label:'Despesas realizadas',value:money(spent),note:'Acumulado na base de referência',icon:'activity'},
 {label:'Custo final projetado',value:money(eac),note:eac===null?'Base incompleta':changeText(eac,budget,'mi versus orçamento'),icon:'arrow'},
 {label:'Projetos com sinais críticos',value:String(critical.length),note:`${flagged.length} com alertas de revisão`,icon:'warning',tone:critical.length?'stat-warning':''}
 ].map(VanguardaUI.StatCard).join('')}</div>
 ${count?'':'<p class="notice" role="status">Nenhum projeto combina com os filtros. Ajuste a divisão ou a situação.</p>'}
 <div class="dashboard-charts">
 <section class="card"><div class="card-head"><h2>Orçamento por divisão</h2><span class="tag">R$ milhões</span></div>${divisionDonut(list)}</section>
 <section class="card"><div class="card-head"><h2>Situação dos projetos</h2><span class="tag">Quantidade</span></div>${ringChart(['Saudável','Atenção','Crítico','Sem base'].map((label,i)=>({label,value:counts[i],color:['var(--success)','var(--warning)','var(--danger)','var(--text-muted)'][i]})),String(count),'projetos')}</section>
 <section class="card"><h2>Orçamento × custo projetado</h2>${projectComparisons(list,false)}</section>
 <section class="card"><h2>Execução planejada × realizada</h2>${projectComparisons(list,true)}</section>
 </div>
 <details class="card exploration"><summary>Explorar orçamento em Sunburst</summary><section id="sunburst-chart"></section></details>
 <section class="card attention-panel"><div class="card-head"><h2>Projetos que exigem atenção</h2><a href="#projetos">Todos os projetos →</a></div><div class="attention-list">${flagged.map(p=>`<article class="attention-row"><div><button class="project-link" data-detail="${p.id}">${p.name}</button><p>${p.sector} · ${p.owner}</p></div>${badge(p)}<p>${escapeHTML(indicators(p).alerts[0].title)} · ${indicators(p).alerts.length} alertas</p><button class="button" data-detail="${p.id}" aria-label="Revisar ${p.name}">Revisar</button></article>`).join('')||'<p>Nenhum alerta nesta seleção.</p>'}</div></section>
 <section class="card table-card portfolio-register"><div class="table-head"><h2>Radar de projetos</h2><a href="#simulador">Simular cenário →</a></div><div class="table-scroll" role="region" aria-label="Indicadores dos projetos; tabela rolável" tabindex="0"><table><caption class="sr-only">Orçamentos, projeções e execução dos projetos sintéticos</caption><thead><tr><th>Projeto</th><th>Divisão</th><th>Situação</th><th>Orçamento</th><th>Custo projetado</th><th>Prazo projetado</th><th>Execução plan. / real.</th><th><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${rows(list)||'<tr><td colspan="8">Sem projetos na seleção.</td></tr>'}</tbody></table></div></section>`;
}
function projectPage(){const list=filtered();return head('Portfólio','Projetos','Base sintética · acompanhamento operacional')+filters(true)+`<div class="project-grid">${list.map(p=>`<article class="card glass-card project-card"><div class="card-head"><span class="eyebrow">${p.id}</span>${badge(p)}</div><h2>${p.name}</h2><p class="subtitle">${p.sector} · ${p.owner}</p><div class="project-metrics"><div><p class="subtitle">Orçamento</p><b>${money(p.budget)}</b></div><div><p class="subtitle">Prazo planejado</p><b>${durationText(indicators(p).days)}</b></div></div><div class="bar-label"><span>Planejado / realizado</span><b>${percentText(indicators(p).planned)} / ${percentText(indicators(p).progress)}</b></div><div class="project-progress"><div class="bar" role="img" aria-label="Execução planejada"><i class="planned" style="width:${indicators(p).planned??0}%"></i></div><div class="bar" role="img" aria-label="Execução realizada"><i class="actual" style="width:${indicators(p).progress??0}%"></i></div></div><div class="project-actions"><button class="button" data-detail="${p.id}">Explorar projeto ↗</button><button class="button" data-history="${p.id}">Histórico de alterações</button></div></article>`).join('')||'<p>Nenhum projeto encontrado. Ajuste os filtros.</p>'}</div>`}
function simulator(){return Simulation.view()}
function methodology(){const content=head('Regras demonstrativas','Metodologia','Valor agregado com cálculos rastreáveis e revisão pelo PMO.')+`<section class="card governance-method"><h2>Os cinco indicadores do Conselho</h2><p>Esta base é um retrato sintético de projetos em execução. Não registra entregas concluídas, custos finais, aprovações formais, benefícios medidos ou revisão de planos aprovados. Por isso, os cinco KPIs mostram “Sem dados”.</p><ul><li>Entregues no prazo: entregas concluídas até o prazo aprovado ÷ entregas concluídas.</li><li>Dentro do orçamento: projetos encerrados com custo final até o orçamento aprovado ÷ projetos encerrados.</li><li>Viabilidade e aprovações completas: projetos com todos os estudos e aprovações exigidos ÷ projetos elegíveis.</li><li>Benefícios: benefícios medidos ÷ benefícios planejados, com unidade e janela de avaliação compatíveis.</li><li>Críticos com planos atualizados: projetos críticos com plano aprovado e revisado dentro da política vigente ÷ projetos críticos.</li></ul><p>Despesas acumuladas não equivalem a custo final; SPI não comprova entrega no prazo. Verificações e ações do simulador são registros do exercício, sem aprovação formal. Ausência de base não é zero.</p></section><div class="notice">Dados sintéticos e regras demonstrativas. A Atividade 3 propõe IA preditiva, mas este protótipo não implementa IA treinada, probabilidades ou métricas de precisão. Fonte: vanguarda_pdf.pdf, páginas 4–5.</div><div class="method-grid"><section class="card"><div class="eyebrow">01 · PROBLEMA E FLUXO</div><h3>Antecipar a revisão dos desvios</h3><p>O caso relata identificação tardia de atrasos, custos excessivos e inconsistências no WMS, nas obras residenciais e na expansão solar. O protótipo compara planejado e realizado, calcula indicadores, explica alertas e encaminha a revisão ao PMO.</p><p>Padronizar e validar dados → calcular regras → emitir alertas → PMO verificar evidências → recomendar ações aos gestores. A decisão formal permanece humana.</p></section><section class="card"><div class="eyebrow">02 · DADOS</div><h3>Entradas e qualidade</h3><p>Orçamento e despesas na mesma unidade monetária; execução planejada e realizada em porcentagem de 0 a 100; prazo original em dias. Cronogramas, riscos, alterações de escopo e histórico contextualizam a análise.</p><p>Campos numéricos devem ser números finitos, sem conversão automática de textos. Ausência, negativos, porcentagens fora da faixa e orçamento ou prazo original iguais a zero invalidam os indicadores que dependem deles. Um zero de execução ou despesa é um dado, não uma ausência.</p></section><section class="card"><div class="eyebrow">03 · MOTOR DE VALOR AGREGADO</div><h3>Fórmulas demonstrativas</h3><div class="formula">Realizada relativa = realizada (%) / 100<br>Despesa relativa = despesas / orçamento<br>CPI = realizada relativa / despesa relativa<br>SPI = realizada (%) / planejada (%)<br>Custo final estimado = orçamento / CPI<br>Prazo total estimado = prazo original / SPI</div><p>EV = orçamento × realizada relativa; PV = orçamento × planejada relativa. São equivalentes financeiros ao avanço físico; PV não é um cronograma de pagamentos. Dias decorridos são informativos e não entram na fórmula do prazo estimado.</p></section><section class="card"><div class="eyebrow">04 · ALERTAS EXPLICÁVEIS</div><h3>Valores, limites e motivos</h3><p>Menor CPI/SPI ≥ 0,95: saudável; de 0,85 a menos de 0,95: atenção; abaixo de 0,85: crítico. Se faltar CPI ou SPI, a situação é “Sem base”. Projeção de custo ou prazo mais de 20% acima da base aciona uma regra crítica.</p><p>Base insuficiente e validação pendente geram alertas de qualidade. Cada alerta identifica entradas, cálculo e limite. As faixas são escolhas demonstrativas, não parâmetros aprendidos. A contagem de sinais críticos soma regras acionadas; um projeto pode ter mais de um sinal.</p></section><section class="card"><div class="eyebrow">05 · ZERO E DADOS AUSENTES</div><h3>Não produzir estimativas impossíveis</h3><p>Despesa relativa zero impede CPI; execução planejada zero impede SPI. CPI ou SPI zero impedem suas respectivas projeções. Nenhuma divisão por zero resulta em infinito, e nenhum campo ausente é substituído por zero.</p><p>Um indicador disponível é preservado mesmo que o outro esteja indisponível. O motor retorna “Sem base” e motivos para os resultados que não podem ser calculados. Totais e médias incompletos não são apresentados como resultados completos; a cobertura é informada.</p></section><section class="card"><div class="eyebrow">06 · LIMITAÇÕES E CENÁRIOS</div><h3>Extrapolar não é prever com IA</h3><p>As projeções assumem CPI e SPI constantes até o fim. SPI é uma razão de avanço físico; prazo original ÷ SPI é uma aproximação que ignora caminho crítico, dependências, sazonalidade, produtividade e mudanças de escopo. Dados desatualizados ou não validados reduzem a utilidade da análise.</p><p>O simulador varia execução realizada e despesas acumuladas, mantendo orçamento, execução planejada e prazo original. Compara a base com a simulação, registra ações no servidor e exporta a análise. Requisitos legais, ambientais e contratuais são verificações independentes, nunca compensados por bons indicadores. Não modifica os projetos. Os custos estimados do portfólio são somados; os prazos são uma média, não uma data final corporativa. Arredondamento só na exibição, com dias arredondados para cima.</p><p>Benefícios esperados: agilizar correções e melhorar transparência. Não há eficácia medida, precisão, confiança estatística ou probabilidade estimada. Uma IA real exigiria histórico validado e avaliação própria.</p></section></div>`;
 const summaries={
 'Os cinco indicadores do Conselho':'Bases necessárias para calcular os indicadores indisponíveis.',
 'Antecipar a revisão dos desvios':'Dos dados ao encaminhamento de ações para o PMO.',
 'Entradas e qualidade':'Unidades, faixas válidas e qualidade da base.',
 'Fórmulas demonstrativas':'CPI, SPI e projeções de custo e prazo.',
 'Valores, limites e motivos':'Critérios de atenção e explicações dos alertas.',
 'Não produzir estimativas impossíveis':'Tratamento de zeros, ausências e cobertura incompleta.',
 'Extrapolar não é prever com IA':'Premissas, verificações independentes e limites das estimativas.'
 };
 return content.replace(/<section class="card(?: governance-method)?">([\s\S]*?)<\/section>/g,(_,body)=>{
 const title=body.match(/<h[23]>(.*?)<\/h[23]>/)[1];
 const details=body.replace(/<div class="eyebrow">.*?<\/div>/,'').replace(/<h[23]>.*?<\/h[23]>/,'');
 return `<details class="card method-topic"><summary><h2>${title}</h2><p>${summaries[title]}</p></summary><div class="accordion-content">${details}</div></details>`;
 });
}
function detail(id){
 const p=projects.find(p=>p.id===id);if(!p)return;const m=indicators(p);
 document.querySelector('#detail-content').innerHTML=`<div class="eyebrow">${p.id} · DADOS DEMONSTRATIVOS</div><h1 id="detail-title">${p.name}</h1>${badge(p)}<p>${p.sector} · Responsável fictício: ${p.owner}</p>
 <div class="detail-metrics"><div><span>Orçamento aprovado</span><b>${money(m.budget)}</b></div><div><span>Despesas realizadas</span><b>${money(m.spent)}</b></div><div><span>Prazo planejado</span><b>${durationText(indicators(p).days)}</b></div><div><span>Dias decorridos</span><b>${durationText(p.elapsedDays)}</b></div><div><span>Execução planejada</span><b>${percentText(m.planned)}</b></div><div><span>Execução realizada</span><b>${percentText(indicators(p).progress)}</b></div><div><span>SPI · desempenho de prazo</span><b>${number(m.spi,2)}</b></div><div><span>CPI · desempenho de custo</span><b>${number(m.cpi,2)}</b></div></div>
 <h2>Planejado e realizado na data de referência</h2><p class="subtitle">Um retrato da base demonstrativa; não representa uma série histórica.</p><div class="detail-charts">
 ${comparison('Execução física (%)',[{label:'Planejada',value:m.planned,kind:'planned'},{label:'Realizada',value:m.progress,kind:'actual'}],percentText)}
 ${comparison('Valores na data de referência (R$ mi)',[{label:'Valor planejado (PV)',value:m.pv,kind:'planned'},{label:'Valor entregue (EV)',value:m.ev,kind:'actual'},{label:'Despesas realizadas (AC)',value:m.spent,kind:'expense'}],money)}
 ${comparison('Custo total: base e projeção',[{label:'Orçamento aprovado',value:m.budget,kind:'planned'},{label:'Custo final projetado',value:m.eac,kind:'forecast'}],money)}
 ${comparison('Prazo total: base e projeção',[{label:'Prazo planejado',value:m.days,kind:'planned'},{label:'Prazo total projetado',value:m.duration,kind:'forecast'}],durationText)}
 </div><p class="subtitle">PV e EV são valores equivalentes ao avanço físico; PV não representa um cronograma de pagamentos. Cada gráfico usa sua própria escala e exibe os valores numéricos.</p>
 <div class="projection-note"><b>Regras demonstrativas por valor agregado.</b> CPI = execução relativa ÷ despesa relativa; SPI = realizada ÷ planejada; custo final = orçamento ÷ CPI; prazo total = prazo original ÷ SPI. Custo projetado: ${money(m.eac)} (${changeText(m.eac,p.budget,'mi')}). Prazo projetado: ${durationText(m.duration)} (${m.duration===null?'sem base':changeText(Math.ceil(m.duration),p.days,'dias')}). As fórmulas mantêm CPI e SPI constantes até a conclusão. SPI mede avanço físico, não a rede de atividades; esta aproximação ignora caminho crítico, dependências, sazonalidade e alterações de escopo. Não há IA treinada, probabilidades ou precisão medida. Dados pendentes de validação tornam as estimativas provisórias.</div>
 <h3>Riscos e sinais monitorados</h3><p>${p.risk}</p><p>${p.openRisks} riscos abertos · ${p.scope} alterações de escopo.</p><ul class="detail-signals">${alertMarkup(m)}</ul>
 <h3>Qualidade dos dados</h3><p>${p.validated?'Registros sintéticos validados.':'Registros pendentes de validação: revisar despesas e andamento antes de utilizar as projeções.'} Histórico ilustrativo de ${p.history} projetos; não há treinamento de modelo.</p>
 <h3>Próxima ação sugerida ao PMO</h3><p>${p.action}</p><details class="project-history" id="project-history"><summary>Histórico de alterações</summary><div id="project-history-content"></div></details>`;
 document.querySelector('#project-history').addEventListener('toggle',e=>{if(e.target.open)VanguardaAudit.projectHistory(document.querySelector('#project-history-content'),p.id);},{once:true});
 dialogOpener=document.activeElement;document.querySelector('dialog').showModal();const title=document.querySelector('#detail-title');title.setAttribute('tabindex','-1');title.focus({preventScroll:true});document.querySelector('dialog').scrollTop=0;
}
function exportData(){
 const fmt=n=>Number.isFinite(n)?String(n).replace('.',','):'';
 const csv='\uFEFF'+['ID;Projeto;Divisão;Situação;Orçamento (R$ mi);Despesas (R$ mi);Prazo planejado (dias);Dias decorridos;Execução planejada (%);Execução realizada (%);Custo projetado (R$ mi);Prazo projetado (dias);SPI;CPI;Dados',...selectedProjects().map(p=>{const m=indicators(p);return [p.id,p.name,p.sector,p.status,fmt(m.budget),fmt(m.spent),fmt(m.days),fmt(p.elapsedDays),fmt(m.planned),fmt(m.progress),fmt(m.eac),m.duration===null?'':Math.ceil(m.duration),fmt(m.spi),fmt(m.cpi),'Demonstrativos'].join(';')})].join('\n');
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='vanguarda-portfolio-demonstrativo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function bindDetails(root=document){root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail));root.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{detail(b.dataset.history);const history=document.querySelector('#project-history');history.open=true;history.querySelector('summary').focus();history.scrollIntoView({block:'start'});});}
function refreshProjectCards(){
 const template=document.createElement('template');template.innerHTML=projectPage();
 const grid=document.querySelector('.project-grid');grid.innerHTML=template.content.querySelector('.project-grid').innerHTML;document.querySelector('.stamp').textContent=template.content.querySelector('.stamp').textContent;bindDetails(grid);
}
async function render(){
 try{const response=await fetch("/api/session",{cache:"no-store"});if(!response.ok){location.replace("/login");return;}}catch{document.querySelector("#main").innerHTML="<p role=\"alert\">Não foi possível validar o acesso. Recarregue a página.</p>";return;}
 if(['#log','#administracao/auditoria'].includes(location.hash)){document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.dataset.page==='log');if(a.dataset.page==='log')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title='Administração · Auditoria · Vanguarda';VanguardaAudit.render();return;}
 if(location.hash.startsWith('#incorporacoes')){document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.dataset.page==='incorporacoes');if(a.dataset.page==='incorporacoes')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title='Incorporações · Vanguarda';Incorporacoes.render();return;}
 const page=location.hash.slice(1)||'dashboard',valid=['dashboard','projetos','simulador','metodologia'].includes(page)?page:'dashboard';
 document.querySelectorAll('nav a').forEach(a=>{a.classList.toggle('active',a.dataset.page===valid);if(a.dataset.page===valid)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 document.title=({dashboard:'Dashboard',projetos:'Projetos',simulador:'Simulador',metodologia:'Metodologia'}[valid])+' · Vanguarda — Radar PMO';
 document.querySelector('#main').innerHTML=({dashboard,projetos:projectPage,simulador:simulator,metodologia:methodology}[valid])();
 document.querySelector('#sector')?.addEventListener('change',e=>{sector=e.target.value;if(valid==='projetos')refreshProjectCards();else{render().then(()=>document.querySelector('#sector')?.focus());}});
 document.querySelector('#status')?.addEventListener('change',e=>{statusFilter=e.target.value;if(valid==='projetos')refreshProjectCards();else{render().then(()=>document.querySelector('#status')?.focus());}});
 document.querySelector('#search')?.addEventListener('input',e=>{query=e.target.value;refreshProjectCards();});
 VanguardaUI.mount(document.querySelector('#main'));bindDetails();document.querySelector('#export')?.addEventListener('click',exportData);
 if(valid==='simulador')Simulation.bind();
 if(valid==='dashboard')document.querySelector('.exploration').addEventListener('toggle',e=>{if(e.target.open&&!document.querySelector('#sunburst-chart').hasChildNodes())VanguardaSunburst.mount(document.querySelector('#sunburst-chart'),selectedProjects());});
}
let dialogOpener=null;
const dialog=document.querySelector('#detail');
document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(dialogOpener?.isConnected)dialogOpener.focus();});
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();document.querySelector('#main').focus();});
const reducedTransparency=window.matchMedia('(prefers-reduced-transparency: reduce)');
let appearancePreference=null;
try{appearancePreference=localStorage.getItem('vanguarda-appearance');}catch{}
function applyAppearance(){
 const solid=appearancePreference==='solid'||(appearancePreference!=='glass'&&reducedTransparency.matches);
 document.documentElement.dataset.appearance=solid?'solid':'glass';
 const button=document.querySelector('#appearance-toggle');button.setAttribute('aria-pressed',String(solid));
 button.title=solid?'Ativar transparência nas superfícies selecionadas':'Ativar aparência sólida, sem transparência ou desfoque';
}
document.querySelector('#appearance-toggle').addEventListener('click',()=>{
 appearancePreference=document.documentElement.dataset.appearance==='solid'?'glass':'solid';
 try{localStorage.setItem('vanguarda-appearance',appearancePreference);}catch{}
 applyAppearance();
});
reducedTransparency.addEventListener?.('change',applyAppearance);
window.addEventListener('hashchange',()=>{render();document.querySelector('#main').focus();window.scrollTo({top:0,behavior:'instant'});});
VanguardaUI.mount();applyAppearance();sessionReady.then(async()=>{try{await Simulation.load();}catch{document.querySelector("#user-feedback").textContent="Não foi possível carregar ações salvas. Recarregue antes de registrar novas ações.";}render();}).catch(()=>{});
