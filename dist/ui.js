/* Componentes HTML para a stack estática. SVGs Lucide, licenças ISC/MIT. */
(function(root){
 'use strict';
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icons={
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  projects:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  sliders:'<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
  book:'<path d="M12 7v14M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v17h-5a4 4 0 0 0-4 1 4 4 0 0 0-4-1H3z"/>',
  warning:'<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  wallet:'<path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M20 12h-4v5h4M17 14.5h.01"/>',
  activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  reset:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"/>',
  layers:'<path d="m12 3 10 6-10 6L2 9zm-10 12 10 6 10-6M2 15l10 6 10-6"/>'
 };
 const Icon=name=>`<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]||icons.activity}</svg>`;
 const GlassCard=({content,className='',tag='section'})=>`<${tag} class="card glass-card ${className}">${content}</${tag}>`;
 const GovernanceCard=({label,note})=>`<article class="governance-kpi"><h3>${escape(label)}</h3><b class="governance-value">Sem dados</b><p>${escape(note)}</p></article>`;
 const StatCard=({label,value,note,icon,tooltip='',tone=''})=>GlassCard({className:`stat-card ${tone}`,content:`<div class="kpi-title" ${tooltip?`tabindex="0" title="${escape(tooltip)}" aria-label="${escape(label+'. '+tooltip)}"`:''}>${escape(label)}<span class="kpi-icon">${Icon(icon)}</span></div><div class="value projected-value">${value}</div><div class="kpi-note">${note}</div>`});
 const StatusBadge=status=>`<span class="status status-badge ${status==='Crítico'?'Critico':status==='Atenção'?'Atencao':status==='Sem base'?'neutral':''}"><i class="status-dot" aria-hidden="true"></i>${escape(status)}</span>`;
 const Button=({label,id='',className='',icon='',type='button',attributes='',disabled=false,loading=false})=>`<button type="${type}" ${id?`id="${escape(id)}"`:''} class="button ${className}" ${disabled||loading?'disabled':''} ${loading?'aria-busy="true"':''} ${attributes}>${icon?Icon(icon):''}<span>${escape(label)}</span></button>`;
 const FilterBar=content=>`<div class="filters filter-bar">${content}</div>`;
 const Field=content=>`<div class="field form-field">${content}</div>`;
 const ChartContainer=(title,content)=>`<figure class="comparison chart-container"><figcaption>${escape(title)}</figcaption>${content}</figure>`;
 function compactCards(rootElement=document){
  rootElement.querySelectorAll('.dashboard-charts > .card,.attention-panel,.portfolio-register,.project-card,.property-card').forEach(card=>{
   if(card.querySelector(':scope > .compact-disclosure'))return;
   const heading=card.querySelector('h2');if(!heading)return;
   const disclosure=document.createElement('details');disclosure.className='compact-disclosure';
   const summary=document.createElement('summary');summary.append(heading);
   const hint=document.createElement('span');hint.className='compact-hint';hint.textContent='Clique para expandir';summary.append(hint);
   const content=document.createElement('div');content.className='compact-content';
   while(card.firstChild)content.append(card.firstChild);
   disclosure.append(summary,content);card.append(disclosure);card.classList.add('compact-card');
  });
 }
 function titlePunctuation(rootElement=document){
  rootElement.querySelectorAll('h1,h2,h3,figcaption,.kpi-title,.eyebrow,.aside-label,.nav-section-label').forEach(el=>{
   if(el.querySelector('.title-colon')||el.textContent.trim().endsWith(':'))return;
   const colon=document.createElement('span');colon.className='title-colon';colon.setAttribute('aria-hidden','true');colon.textContent=':';if(el.classList.contains('kpi-title')&&el.firstChild?.nodeType===3){const label=document.createElement('span');label.textContent=el.firstChild.textContent;el.firstChild.replaceWith(label);label.append(colon);}else el.append(colon);
  });
 }
 function mount(rootElement=document){rootElement.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=Icon(el.dataset.icon);});compactCards(rootElement);titlePunctuation(rootElement);}
 // As páginas e os resultados do simulador são atualizados sem recarregar o documento.
 const observer=new MutationObserver(records=>{
  if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&!node.classList.contains('title-colon')))){
   compactCards(document);titlePunctuation(document);
  }
 });
 observer.observe(document.body,{childList:true,subtree:true});
 root.VanguardaUI=Object.freeze({GlassCard,GovernanceCard,StatCard,StatusBadge,Button,FilterBar,Field,ChartContainer,Icon,mount});
})(globalThis);
