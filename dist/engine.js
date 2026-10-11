/* Motor determinístico. Entradas monetárias na mesma unidade; execução em %. */
(function (root) {
  'use strict';
  const valid = (v, min = 0, max = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  const divide = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 && Number.isFinite(a / b) ? a / b : null;
  const product = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(a * b) ? a * b : null;
  const fmt = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  function calculate(project = {}) {
    project = project && typeof project === 'object' ? project : {};
    const issues = [];
    function read(key, label, positive = false, max = Infinity) {
      const value = project[key];
      if (value === null || value === undefined || value === '') {
        issues.push(label + ': dado ausente.'); return null;
      }
      if (!valid(value, 0, max) || (positive && value === 0)) {
        issues.push(label + ': requer número finito ' + (positive ? 'maior que zero' : 'não negativo') + (max === 100 ? ', entre 0 e 100%' : '') + '.'); return null;
      }
      return value;
    }
    const budget = read('budget', 'Orçamento', true);
    const spent = read('spent', 'Despesas');
    const days = read('days', 'Prazo original', true);
    const progress = read('progress', 'Execução realizada', false, 100);
    const planned = read('planned', 'Execução planejada', false, 100);
    const actualRelative = progress === null ? null : progress / 100;
    const plannedRelative = planned === null ? null : planned / 100;
    const expenseRelative = divide(spent, budget);
    const cpi = divide(actualRelative, expenseRelative);
    const spi = divide(actualRelative, plannedRelative);
    const eac = divide(budget, cpi);
    const duration = divide(days, spi);
    const ev = product(budget, actualRelative), pv = product(budget, plannedRelative);
    if (spent === 0 && budget !== null) issues.push('CPI indisponível: despesa relativa igual a zero; não se divide por zero.');
    if (planned === 0) issues.push('SPI indisponível: execução planejada igual a zero; não se divide por zero.');
    if (cpi === 0) issues.push('Custo final indisponível: CPI igual a zero.');
    if (spi === 0) issues.push('Prazo total indisponível: SPI igual a zero.');
    if (eac === null) issues.push('Sem base para estimar o custo final: orçamento e CPI precisam ser válidos, com CPI maior que zero.');
    if (duration === null) issues.push('Sem base para estimar o prazo total: prazo original e SPI precisam ser válidos, com SPI maior que zero.');
    const health = cpi !== null && spi !== null ? Math.min(cpi, spi) : null;
    const status = health === null ? 'Sem base' : health >= .95 ? 'Saudável' : health >= .85 ? 'Atenção' : 'Crítico';
    const alerts = [];
    if (health !== null && health < .95) alerts.push({ code: 'performance', critical: health < .85,
      title: health < .85 ? 'Desempenho crítico' : 'Desempenho em atenção',
      factors: `CPI = ${fmt(actualRelative)} ÷ ${fmt(expenseRelative)} = ${fmt(cpi)}; SPI = ${fmt(progress)}% ÷ ${fmt(planned)}% = ${fmt(spi)}. Menor índice ${fmt(health)} abaixo do limite ${health < .85 ? '0,85' : '0,95'}.` });
    if (eac !== null && eac / budget > 1.2) alerts.push({code: 'cost', critical: true, title: 'Custo estimado mais de 20% acima da base',
      factors: `Orçamento ${fmt(budget)} mi ÷ CPI ${fmt(cpi)} = ${fmt(eac)} mi; desvio de ${fmt((eac / budget - 1) * 100)}%, superior ao limite de 20%.`});
    if (duration !== null && duration / days > 1.2) alerts.push({code: 'schedule', critical: true, title: 'Prazo estimado mais de 20% acima da base',
      factors: `Prazo original ${fmt(days)} dias ÷ SPI ${fmt(spi)} = ${fmt(duration)} dias; desvio de ${fmt((duration / days - 1) * 100)}%, superior ao limite de 20%.`});
    if (issues.length) alerts.push({code: 'data', critical: true, title: 'Base insuficiente para indicadores ou projeções', factors: [...new Set(issues)].join(' ')});
    if (project.validated !== true) alerts.push({code: 'validation', critical: true, title: 'Validação de dados pendente',
      factors: 'O campo de validação não está confirmado. Conferir cronograma, execução e despesas com o PMO antes de usar as estimativas.'});
    return { budget, spent, days, progress, planned, actualRelative, plannedRelative, expenseRelative, ev, pv, cpi, spi, eac, duration, status, issues: [...new Set(issues)], alerts };
  }
  const engine = Object.freeze({ calculate, divide });
  root.VanguardaEngine = engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
})(globalThis);
