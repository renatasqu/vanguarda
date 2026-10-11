/* Cenários e registros locais; nenhuma alteração na base de projetos. */
const Simulation = (() => {
  const storageKey = 'vanguarda-corrective-actions-v1';
  const checkLabels = { legal: 'Legal', environmental: 'Ambiental', contractual: 'Contratual' };
  const statuses = ['Não verificado', 'Em revisão', 'Verificado no exercício', 'Pendência identificada'];
  const states = new Map();
  let selectedId = 'INC-001', records = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) records = saved.filter(r => r && typeof r.projectId === 'string' && typeof r.action === 'string' && typeof r.createdAt === 'string');
  } catch {}
  const currentProject = () => projects.find(p => p.id === selectedId) || projects[0];
  function stateFor(p) {
    if (!states.has(p.id)) states.set(p.id, {
      progress: p.progress, spent: p.spent,
      checks: Object.fromEntries(Object.keys(checkLabels).map(k => [k, { status: statuses[0], evidence: '' }])),
      action: '', owner: '', due: ''
    });
    return states.get(p.id);
  }
  const scenarioFor = (p, state) => ({ ...p, progress: state.progress, spent: state.spent });
  const dateLabel = date => {
    const value = new Date(date);
    return Number.isFinite(value.getTime()) ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(value) : 'Data indisponível';
  };
  function recommendations(p, m, checks) {
    const suggestions = [];
    if (m.issues.length || p.validated !== true) suggestions.push('Validar execução, orçamento e despesas com os gestores antes de utilizar as estimativas.');
    if (m.cpi !== null && m.cpi < .95) suggestions.push('Revisar despesas e custos para concluir; investigar retrabalho e mudanças de escopo.');
    if (m.spi !== null && m.spi < .95) suggestions.push('Revisar o caminho crítico, dependências e capacidade da equipe; pactuar um plano de recuperação.');
    if (p.openRisks >= 3) suggestions.push(`Revisar os ${p.openRisks} riscos abertos, priorizando: ${p.risk}.`);
    if (p.scope >= 3) suggestions.push(`Revalidar impactos das ${p.scope} alterações de escopo com os responsáveis.`);
    if (!suggestions.length) suggestions.push('Manter o acompanhamento e confirmar se os dados e a linha de base continuam atuais.');
    for (const [key, label] of Object.entries(checkLabels)) {
      const check = checks[key];
      suggestions.push(check.status === 'Verificado no exercício'
        ? `${label}: submeter a evidência à revisão do responsável competente. O registro demonstrativo não constitui aprovação formal.`
        : `${label}: ${check.status.toLowerCase()}; encaminhar a verificação independente ao responsável competente antes de decisões sujeitas a esse requisito.`);
    }
    return suggestions;
  }
  const parsedNumber = value => value.trim() === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  function view() {
    const p = currentProject(), s = stateFor(p);
    return head('CENÁRIOS · REGRAS DEMONSTRATIVAS', 'Teste a hipótese. Revise a decisão.', 'Ajuste execução e despesas; compare as estimativas com o retrato original.', '<button class="button" id="export-analysis">↓ Exportar análise</button>') + `
    <div class="sim-grid simulator-layout"><section class="card sim-controls"><h2>Entradas do cenário</h2><p class="subtitle">Dados demonstrativos. Os projetos originais são preservados.</p>
    <div class="field"><label for="sim-project">Projeto de referência</label><select id="sim-project">${projects.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div>
    <div class="field"><label for="sim-progress">Execução realizada (%)</label><input id="sim-progress" type="number" min="0" max="100" step="any" inputmode="decimal" value="${s.progress ?? ''}" aria-describedby="progress-help"><input id="sim-progress-range" aria-label="Ajustar execução realizada em porcentagem" type="range" min="0" max="100" step="any" value="${s.progress ?? 0}"><p id="progress-help" class="subtitle">De 0 a 100%. Original: ${percentText(p.progress)}.</p></div>
    <div class="field"><label for="sim-spent">Despesas acumuladas (R$ milhões)</label><input id="sim-spent" type="number" min="0" step="any" inputmode="decimal" value="${s.spent ?? ''}" aria-describedby="spent-help"><input id="sim-spent-range" aria-label="Ajustar despesas acumuladas em milhões de reais" type="range" min="0" max="${Math.max(1, p.budget * 2, p.spent * 2, s.spent || 0)}" step="any" value="${s.spent ?? 0}"><p id="spent-help" class="subtitle">Original: ${money(p.spent)}. O campo numérico permite ultrapassar a faixa inicial.</p></div>
    <p class="subtitle">Mantidos: orçamento ${money(p.budget)}, execução planejada ${percentText(p.planned)} e prazo original ${durationText(p.days)}.</p><button class="button" id="reset">↺ Restaurar valores originais</button><p id="sim-feedback" class="subtitle" role="status"></p></section>
    <section class="card" id="sim-result" aria-live="polite" aria-atomic="true"></section></div>
    <section class="card independent-checks"><div class="card-head"><h2>Verificações independentes</h2><span class="tag">Não alteram CPI ou SPI</span></div><p>Requisitos legais, ambientais e contratuais precisam de verificação própria. Desempenho favorável não compensa uma pendência. Todos os estados abaixo são registros do exercício, sem aprovação automática.</p>
    <div class="check-grid">${Object.entries(checkLabels).map(([key, label]) => `<fieldset><legend>${label}</legend><label for="check-${key}">Situação da verificação</label><select id="check-${key}">${statuses.map(v => `<option ${s.checks[key].status === v ? 'selected' : ''}>${v}</option>`).join('')}</select><label for="evidence-${key}">Referência ou evidência para revisão</label><input id="evidence-${key}" type="text" maxlength="300" value="${escapeHTML(s.checks[key].evidence)}" placeholder="Documento, responsável ou pendência"></fieldset>`).join('')}</div>
    <p class="subtitle">Selecionar “Verificado no exercício” exige uma referência ao registrar a ação; o PMO deve submetê-la ao responsável competente.</p></section>
    <section class="card recommendation-panel"><h2>Recomendações para revisão do PMO</h2><ul id="pmo-recommendations"></ul><p class="subtitle">Sugestões pelas regras demonstrativas, não decisões de aprovação nem aconselhamento jurídico.</p></section>
    <section class="card action-panel"><div class="card-head"><h2>Registrar uma ação corretiva</h2><span class="tag">Registro local</span></div><p class="subtitle">O registro inclui uma cópia do cenário, alertas e verificações. Fica neste navegador; não é enviado a gestores ou sistemas externos.</p>
    <form id="corrective-form"><label for="action-text">Ação proposta</label><textarea id="action-text" required minlength="10" maxlength="2000" rows="3" placeholder="Descreva a ação e o resultado esperado">${escapeHTML(s.action)}</textarea><div class="action-fields"><div><label for="action-owner">Responsável pela revisão</label><input id="action-owner" type="text" required maxlength="100" value="${escapeHTML(s.owner)}" placeholder="Nome ou função"></div><div><label for="action-due">Prazo para revisão (opcional)</label><input id="action-due" type="date" value="${escapeHTML(s.due)}"></div></div><button class="button primary" type="submit">Registrar ação e cenário</button><p id="action-feedback" role="status"></p></form><div id="action-history"></div></section>
    <div class="projection-note sim-limitations"><b>Limites:</b> custo final = orçamento ÷ CPI; prazo total = prazo original ÷ SPI. As estimativas mantêm os índices constantes e ignoram caminho crítico, dependências e mudanças de escopo. Dados ausentes ou denominadores zero mostram “Sem base”. Regras demonstrativas, sem IA treinada, probabilidades ou precisão medida.</div>`;
  }
  function update() {
    const p = currentProject(), s = stateFor(p), base = indicators(p), m = indicators(scenarioFor(p, s));
    const metrics = [
      ['Execução realizada', base.progress, m.progress, percentText],
      ['Despesas acumuladas', base.spent, m.spent, money],
      ['CPI', base.cpi, m.cpi, v => number(v, 3)],
      ['SPI', base.spi, m.spi, v => number(v, 3)],
      ['Custo final estimado', base.eac, m.eac, money],
      ['Prazo total estimado', base.duration, m.duration, durationText]
    ];
    document.querySelector('#sim-result').innerHTML = `<div class="card-head"><h2>Original × simulado</h2><span class="tag">Regras demonstrativas</span></div><p class="subtitle">${p.name} · execução e despesas são as únicas entradas alteradas.</p><div class="table-scroll" role="region" tabindex="0" aria-label="Comparação do cenário original com o simulado"><table class="scenario-table"><caption class="sr-only">Indicadores originais, simulados e suas variações</caption><thead><tr><th>INDICADOR</th><th>ORIGINAL</th><th>SIMULADO</th><th>VARIAÇÃO</th></tr></thead><tbody>${metrics.map(([label, a, b, format]) => `<tr><th scope="row">${label}</th><td>${format(a)}</td><td>${format(b)}</td><td>${changeText(b, a, label === 'Execução realizada' ? 'p.p.' : label.includes('Custo') || label.includes('Despesas') ? 'mi' : label.includes('Prazo') ? 'dias' : '')}</td></tr>`).join('')}<tr><th scope="row">Situação</th><td>${base.status}</td><td>${m.status}</td><td>—</td></tr><tr><th scope="row">Alertas acionados</th><td>${base.alerts.length}</td><td>${m.alerts.length}</td><td>${changeText(m.alerts.length, base.alerts.length)}</td></tr></tbody></table></div><div class="scenario-charts">${comparison('Custo final estimado', [{label:'Original',value:base.eac,kind:'planned'},{label:'Simulado',value:m.eac,kind:'actual'}],money)}${comparison('Prazo total estimado', [{label:'Original',value:base.duration,kind:'planned'},{label:'Simulado',value:m.duration,kind:'actual'}],durationText)}</div><details class="original-alerts"><summary>Alertas do cenário original (${base.alerts.length})</summary><ul class="detail-signals">${alertMarkup(base)}</ul></details><h3>Alertas do cenário simulado (${m.alerts.length})</h3><ul class="detail-signals">${alertMarkup(m)}</ul>`;
    document.querySelector('#pmo-recommendations').innerHTML = recommendations(p, m, s.checks).map(v => `<li>${escapeHTML(v)}</li>`).join('');
    for (const [key, value] of [['progress', s.progress], ['spent', s.spent]]) {
      const range = document.querySelector(`#sim-${key}-range`);
      range.disabled=!Number.isFinite(value)||value<0||(key==='progress'&&value>100);
      range.setAttribute('aria-valuetext', range.disabled ? 'Sem valor informado; use o campo numérico' : key === 'progress' ? percentText(value) : money(value));
    }
  }
  function history() {
    const entries = records.filter(r => r.projectId === currentProject().id).slice().reverse();
    document.querySelector('#action-history').innerHTML = `<h3>Ações registradas neste projeto (${entries.length})</h3>${entries.map(r => `<article class="action-record"><div class="card-head"><b>${escapeHTML(r.owner || 'Responsável não informado')}</b><span class="subtitle">${escapeHTML(dateLabel(r.createdAt))}</span></div><p>${escapeHTML(r.action)}</p><p class="subtitle">Prazo: ${escapeHTML(r.due || 'Não informado')} · cópia do cenário: execução ${percentText(r.scenario?.progress)}, despesas ${money(r.scenario?.spent)}.</p></article>`).join('') || '<p class="subtitle">Nenhuma ação registrada.</p>'}`;
  }
  function saveAction(event) {
    event.preventDefault();
    const p = currentProject(), s = stateFor(p), form = document.querySelector('#corrective-form'), feedback = document.querySelector('#action-feedback');
    if (!form.reportValidity()) return;
    if (s.action.trim().length < 10 || !s.owner.trim()) { feedback.textContent = 'Preencha uma ação com pelo menos 10 caracteres e o responsável.'; return; }
    for (const [key, label] of Object.entries(checkLabels)) if (s.checks[key].status === 'Verificado no exercício' && !s.checks[key].evidence.trim()) {
      feedback.textContent = `${label}: informe a referência ou evidência para a verificação registrada.`;
      document.querySelector(`#evidence-${key}`).focus(); return;
    }
    const scenario = scenarioFor(p, s);
    const record = {projectId:p.id, projectName:p.name, createdAt:new Date().toISOString(), action:s.action.trim(), owner:s.owner.trim(), due:s.due, original:{...p}, scenario, checks:JSON.parse(JSON.stringify(s.checks)), analysis:JSON.parse(JSON.stringify(indicators(scenario))), originalAnalysis:JSON.parse(JSON.stringify(indicators(p))), recommendations:recommendations(p, indicators(scenario), s.checks)};
    records = [...records, record];
    let persisted = true;
    try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { persisted = false; }
    s.action = ''; document.querySelector('#action-text').value = '';
    feedback.textContent = persisted ? 'Ação e cenário registrados neste navegador. Exporte a análise para guardar uma cópia.' : 'Ação registrada apenas nesta sessão: o armazenamento local está indisponível. Exporte antes de sair.';
    history();
  }
  function exportAnalysis() {
    const p = currentProject(), s = stateFor(p), scenario = scenarioFor(p, s), base = indicators(p), m = indicators(scenario);
    const metricLines = [['Execução realizada',percentText(base.progress),percentText(m.progress)],['Despesas acumuladas',money(base.spent),money(m.spent)],['CPI',number(base.cpi,3),number(m.cpi,3)],['SPI',number(base.spi,3),number(m.spi,3)],['Custo final estimado',money(base.eac),money(m.eac)],['Prazo total estimado',durationText(base.duration),durationText(m.duration)],['Situação',base.status,m.status]];
    const renderAlerts = x => x.alerts.map(a => `- ${a.title}: ${a.factors}`).join('\n') || '- Nenhum alerta pelas regras atuais.';
    const checksText = Object.entries(checkLabels).map(([key,label]) => `- ${label}: ${s.checks[key].status}. Referência: ${s.checks[key].evidence || 'Não informada'}.`).join('\n');
    const recorded = records.filter(r => r.projectId === p.id).map(r => `### ${dateLabel(r.createdAt)}\n\nAção: ${r.action}\n\nResponsável: ${r.owner}\n\nPrazo: ${r.due || 'Não informado'}\n\nCenário registrado: execução ${percentText(r.scenario?.progress)}, despesas ${money(r.scenario?.spent)}.\n\nResultados registrados: CPI ${number((r.analysis || indicators(r.scenario || {})).cpi,3)}, SPI ${number((r.analysis || indicators(r.scenario || {})).spi,3)}, custo final ${money((r.analysis || indicators(r.scenario || {})).eac)}, prazo total ${durationText((r.analysis || indicators(r.scenario || {})).duration)}.\n\nVerificações registradas: ${Object.entries(checkLabels).map(([key,label]) => `${label}: ${r.checks?.[key]?.status || 'Não informado'} (${r.checks?.[key]?.evidence || 'Sem referência'})`).join('; ')}.\n\nAlertas na cópia registrada (${r.analysis?.metadata?.id || 'registro legado recalculado'} / ${r.analysis?.metadata?.version || 'versão atual'}):\n${renderAlerts(r.analysis || indicators(r.scenario || {}))}`).join('\n\n') || 'Nenhuma ação registrada.';
    const content = `# Vanguarda — Análise demonstrativa\n\nProjeto: ${p.name} (${p.id}) — ${p.sector}\n\nExportada em ${dateLabel(new Date())} (America/Sao_Paulo). Dados sintéticos.\n\nBase mantida: orçamento ${money(p.budget)}, execução planejada ${percentText(p.planned)}, prazo original ${durationText(p.days)}.\n\n## Original × simulado\n\n| Indicador | Original | Simulado |\n| --- | --- | --- |\n${metricLines.map(row => '| '+row.join(' | ')+' |').join('\n')}\n\n## Alertas originais\n\n${renderAlerts(base)}\n\n## Alertas simulados e fatores\n\n${renderAlerts(m)}\n\n## Recomendações ao PMO\n\n${recommendations(p,m,s.checks).map(v=>'- '+v).join('\n')}\n\n## Verificações independentes\n\n${checksText}\n\nOs registros demonstrativos não constituem aprovação formal. Indicadores favoráveis não compensam requisitos legais, ambientais ou contratuais.\n\n## Ações corretivas registradas\n\n${recorded}\n\n## Rascunho ainda não registrado\n\n${s.action || 'Nenhum rascunho.'}\n\n## Fórmulas e limitações\n\nCPI = (realizada / 100) / (despesas / orçamento); SPI = realizada / planejada; custo final = orçamento / CPI; prazo total = prazo original / SPI.\n\nÍndices constantes até a conclusão. Sem caminho crítico, dependências ou mudanças de escopo. Ausências ou denominadores zero impedem estimativas. Dias arredondados para cima na apresentação. Regras demonstrativas, sem IA treinada, probabilidades ou métricas de precisão. Registro local, sem envio a gestores.\n`;
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([content], {type:'text/markdown;charset=utf-8'}));
    a.href = url; a.download = `vanguarda-analise-${p.id.toLowerCase()}.md`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector('#sim-feedback').textContent = 'Análise preparada para download em Markdown, com cenários, alertas, verificações e ações registradas.';
  }
  function bind() {
    const p = currentProject(), s = stateFor(p);
    document.querySelector('#sim-project').addEventListener('change', e => {selectedId=e.target.value;render();document.querySelector('#sim-project').focus();});
    for (const key of ['progress','spent']) {
      const numberInput = document.querySelector(`#sim-${key}`), range = document.querySelector(`#sim-${key}-range`);
      numberInput.addEventListener('input', () => {
        s[key] = parsedNumber(numberInput.value);
        if (Number.isFinite(s[key]) && s[key]>=0 && (key==='spent'||s[key]<=100)) {if(key==='spent')range.max=Math.max(Number(range.max),s[key]);range.value=s[key];if(key==='progress'&&Number(range.value)!==s[key]){range.step='any';range.value=s[key];}}
        update();
      });
      range.addEventListener('input', () => {s[key]=parsedNumber(range.value);numberInput.value=s[key];update();});
    }
    for (const key of Object.keys(checkLabels)) {
      document.querySelector(`#check-${key}`).addEventListener('change', e => {s.checks[key].status=e.target.value;update();});
      document.querySelector(`#evidence-${key}`).addEventListener('input', e => {s.checks[key].evidence=e.target.value;});
    }
    for (const [id,key] of [['action-text','action'],['action-owner','owner'],['action-due','due']]) document.querySelector('#'+id).addEventListener('input',e=>{s[key]=e.target.value;});
    document.querySelector('#corrective-form').addEventListener('submit',saveAction);
    document.querySelector('#reset').addEventListener('click',()=>{s.progress=p.progress;s.spent=p.spent;document.querySelector('#sim-progress').value=s.progress??'';document.querySelector('#sim-spent').value=s.spent??'';document.querySelector('#sim-progress-range').value=s.progress??0;document.querySelector('#sim-spent-range').value=s.spent??0;update();document.querySelector('#sim-feedback').textContent='Execução e despesas restauradas ao original deste projeto. Ações e verificações foram preservadas.';});
    document.querySelector('#export-analysis').addEventListener('click',exportAnalysis);
    update(); history();
  }
  return {view,bind};
})();
