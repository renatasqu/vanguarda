import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const server=createServer({demo:true,dataDir:await (await import("node:fs/promises")).mkdtemp((await import("node:os")).tmpdir()+"/vanguarda-visual-")});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const executablePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({executablePath,headless:true});
const context=await browser.newContext({acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('output/qa',{recursive:true});
const findings=[],layouts=[];
for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['laptop',{width:1024,height:900}],['tablet',{width:768,height:1024}],['mobile',{width:390,height:844}]]){
 await page.setViewportSize(viewport);await page.goto(base+'/login');await page.evaluate(()=>document.fonts.ready);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow no login');
 await page.screenshot({path:`output/qa/${device}-login.png`,fullPage:true});await page.addScriptTag({content:axe});
 assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);
}
await page.locator('#confirm-access').click();await page.locator('main h1').waitFor();
try {
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}],['laptop',{width:1024,height:900}],['tablet',{width:768,height:1024}]]) {
  await page.setViewportSize(viewport);
  for(const route of ['dashboard','projetos','simulador','metodologia','incorporacoes','log']) {
   await page.goto(`${base}/#${route}`);await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);if(route==='log')await page.locator('.audit-table').waitFor();if(route==='incorporacoes')await page.locator('.property-card').first().waitFor();
   const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflows:[...document.querySelectorAll('main .card, header, aside')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))}));
   layouts.push({device,route,...overflow});
   if((device==='mobile'||device==='small-mobile')&&['dashboard','projetos'].includes(route))assert((await page.locator('#sector').boundingBox()).height<=60,'Filtro alto demais no celular');
   await page.screenshot({path:`output/qa/${device}-${route}.png`,fullPage:true});
   if(['dashboard','projetos','incorporacoes'].includes(route)){
    const disclosures=page.locator('.compact-disclosure');
    assert(await disclosures.count()>0);
    const first=disclosures.first();assert.equal(await first.getAttribute('open'),null);
    await first.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await first.getAttribute('open'),'');
    assert(await first.locator('.compact-content').isVisible());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`output/qa/${device}-${route}-expanded.png`,fullPage:true});
   }
   await page.addScriptTag({content:axe});const a11y=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
   if(a11y.length)findings.push({device,route,violations:a11y});
   if(route==='dashboard'){await page.locator('#account-menu > summary').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#account-menu').open);const popover=await page.locator('.account-popover').boundingBox();assert(popover.x>=0&&popover.x+popover.width<=viewport.width,'Menu de usuário fora da tela');assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);await page.keyboard.press('Escape');assert(!(await page.locator('#account-menu').getAttribute('open')));}
  }
 }
 await writeFile('output/qa/layout-checks.json',JSON.stringify({layouts,findings,errors},null,2));
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);

 const assertCounts=async(alerts,critical,total)=>{
  await page.waitForFunction(({alerts,total})=>document.querySelector('.stat-card:last-child .value')?.textContent===String(alerts)&&document.querySelectorAll('.portfolio-register tbody tr .project-link').length===total,{alerts,total});
  assert.equal(await page.locator('.stat-card').filter({hasText:'Projetos com alertas críticos'}).locator('.value').innerText(),String(alerts));
  const situation=page.locator('.dashboard-charts > section').filter({hasText:'Situação por CPI/SPI'});
  assert.equal(await situation.locator('.legend-row').filter({hasText:'Crítico'}).locator('b').textContent(),String(critical));
  assert.equal(await situation.locator('.donut-center b').textContent(),String(total));
  assert.equal(await page.locator('.portfolio-register tbody tr .project-link').count(),total);
 };
 await assertCounts(2,1,6);
 await page.locator('#sector').selectOption('Logística');await assertCounts(1,0,2);
 await page.locator('#status').selectOption('Atenção');await assertCounts(1,0,1);
 await page.locator('#sector').selectOption('Incorporações');await page.locator('#status').selectOption('Crítico');await assertCounts(1,1,1);
 await page.locator('#sector').selectOption('Energia');await assertCounts(0,0,0);
 await page.locator('#sector').selectOption('Todos os setores');await page.locator('#status').selectOption('Todos os status');
 await page.goto(base+'/#metodologia');
 for(const title of ['Proposta de IA aplicada','Contexto do Grupo Vanguarda','Governança e PMO','Os cinco indicadores do Conselho','Fontes acadêmicas']){
  const topic=page.locator('.method-topic').filter({has:page.getByRole('heading',{name:title,exact:true})});
  assert.equal(await topic.getAttribute('open'),null);await topic.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await topic.getAttribute('open'),'');
  assert(await topic.locator('.accordion-content').isVisible());
 }
 assert.equal(await page.locator('.method-topic h3').filter({hasText:'Sem dados'}).count(),5);
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`output/qa/academic-expanded-${viewport.width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/#dashboard');
 assert((await page.locator('.governance-notice').innerText()).includes('sem dados'));await page.locator('.exploration > summary').click();await page.locator('.sunburst').waitFor();await page.locator('.sunburst path').first().focus();assert((await page.locator('#sun-tooltip').innerText()).includes('35% do total filtrado'));
 assert.equal(await page.locator('.sun-table tfoot td').last().textContent(),'100%');assert.equal(await page.locator('.sun-table tbody tr').count(),6);
 const sunBox=await page.locator('.sunburst').boundingBox();await page.locator('.sunburst').click({position:{x:sunBox.width*(230+Math.sin(1)*108)/460,y:sunBox.height*(230-Math.cos(1)*108)/460}});assert((await page.locator('.sun-breadcrumb').innerText()).includes('Incorporações'));await page.getByRole('button',{name:'Voltar ao total',exact:true}).click();await page.locator('.sunburst path').first().focus();await page.keyboard.press('Enter');assert((await page.locator('.sun-breadcrumb').innerText()).includes('Incorporações'));await page.getByRole('button',{name:'Voltar ao total',exact:true}).click();await page.locator('#sector').selectOption('Energia');await page.waitForFunction(()=>document.querySelector('.stamp')?.textContent.includes('2 de 6'));assert.equal(await page.locator('.portfolio-register tbody tr').count(),2);
 await page.locator('#status').selectOption('Crítico');await page.waitForFunction(()=>document.querySelector('.stamp')?.textContent.includes('0 de 6'));assert((await page.locator('main').innerText()).includes('Nenhum projeto combina'));
 await page.locator('#sector').selectOption('Incorporações');await page.waitForFunction(()=>document.querySelector('.stamp')?.textContent.includes('1 de 6'));assert.equal(await page.locator('.portfolio-register tbody tr').count(),1);
 let downloadPromise=page.waitForEvent('download');await page.locator('#export').click();let download=await downloadPromise;const csv=await readFile(await download.path(),'utf8');assert(csv.includes('INC-002')&&!csv.includes('INC-001'));
 await page.locator('.portfolio-register > .compact-disclosure > summary').click();const opener=page.locator('.portfolio-register tbody .project-link');await opener.focus();await page.keyboard.press('Enter');assert(await page.locator('dialog').isVisible());assert.equal(await page.locator('dialog').evaluate(e=>e.scrollTop),0);await page.addScriptTag({content:axe});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);await page.screenshot({path:'output/qa/desktop-detail.png'});await page.keyboard.press('Escape');assert(!(await page.locator('dialog').isVisible()));assert(await opener.evaluate(e=>e===document.activeElement));
 await page.locator('#status').selectOption('Todos os status');await page.locator('#sector').selectOption('Todos os setores');await page.locator('nav a[data-page=projetos]').click();await page.locator('#search').fill('Solar');assert.equal(await page.locator('.project-grid article').count(),2);assert(await page.locator('#search').evaluate(e=>e===document.activeElement));await page.locator('#search').fill('"<script>');assert.equal(await page.locator('.project-grid article').count(),0);
 await page.locator('nav a[data-page=simulador]').click();await page.locator('#sim-progress').fill('25');await page.locator('#sim-spent').fill('90');assert((await page.locator('#sim-result').innerText()).includes('720 dias'));assert.equal(await page.locator('#sim-progress-range').inputValue(),'25');
 await page.locator('.scenario-details > summary').click();const numeric=await page.locator('.scenario-table').innerText();await page.locator('.independent-checks > summary').click();await page.locator('#check-legal').selectOption('Verificado no exercício');assert.equal(await page.locator('.scenario-table').innerText(),numeric);
 await page.locator('.action-panel > summary').click();await page.locator('#action-text').fill('Revisar custos e recuperar o cronograma.');await page.locator('#action-owner').fill('PMO demonstrativo');await page.locator('#corrective-form button').click();assert((await page.locator('#action-feedback').innerText()).includes('referência'));
 await page.locator('#evidence-legal').fill('Parecer demonstrativo L-01');await page.locator('#corrective-form button').click();await page.waitForFunction(()=>document.querySelector('#action-history')?.textContent.includes('Revisar custos'));assert((await page.locator('#action-history').innerText()).includes('Revisar custos'));
 downloadPromise=page.waitForEvent('download');await page.locator('#export-analysis').click();download=await downloadPromise;const md=await readFile(await download.path(),'utf8');assert(md.includes('720 dias')&&md.includes('Parecer demonstrativo L-01')&&md.includes('Revisar custos'));
 await page.reload();await page.locator('.action-panel > summary').click();assert((await page.locator('#action-history').innerText()).includes('Revisar custos'));
 await page.locator('#action-history details summary').first().click();await page.locator('#action-history [name=due]').first().fill('2026-11-20');await page.locator('[data-edit-action] button').first().click();await page.waitForFunction(()=>document.querySelector('#action-history')?.textContent.includes('2026-11-20'));
 await page.goto(base+'/#dashboard');await page.locator('.portfolio-register > .compact-disclosure > summary').click();await page.locator('[data-detail="INC-001"]').first().click();await page.locator('#project-history > summary').click();await page.locator('.history-event').first().waitFor();assert((await page.locator('#project-history-content').innerText()).includes('2026-11-20'));assert((await page.locator('#project-history-content').innerText()).includes('Justificativa: Não registrada.'));await page.addScriptTag({content:axe});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))),[]);await page.locator('.history-event').first().scrollIntoViewIfNeeded();await page.screenshot({path:'output/qa/desktop-project-history.png'});await page.keyboard.press('Escape');
 await page.locator('nav a[data-page=projetos]').click();await page.locator('#search').fill('');await page.locator('.project-card').filter({has:page.locator('[data-history="INC-001"]')}).locator('.compact-disclosure > summary').click();await page.locator('[data-history="INC-001"]').click();await page.locator('.history-event').first().waitFor();await page.keyboard.press('Escape');
 await page.locator('nav a[data-page=log]').click();await page.locator('.audit-table').waitFor();assert.equal(new URL(page.url()).hash,'#administracao/auditoria');await page.goto(base+'/#simulador');await page.locator('#sim-project').waitFor();

 await page.locator('#sim-project').selectOption('LOG-001');await page.locator('#sim-progress').fill('0');await page.locator('#sim-spent').fill('0');assert((await page.locator('#sim-result').innerText()).includes('Sem base'));await page.locator('#reset').click();assert.equal(await page.locator('#sim-progress').inputValue(),'58');assert.equal(await page.locator('#sim-project').inputValue(),'LOG-001');
 await page.locator('#sim-progress').fill('12.345');assert.equal(await page.locator('#sim-progress-range').inputValue(),'12.345');await page.locator('#sim-progress').fill('');assert(await page.locator('#sim-progress-range').isDisabled());assert((await page.locator('#sim-result').innerText()).includes('Sem base'));
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.button').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#appearance-toggle').click();assert.equal(await page.locator('html').getAttribute('data-appearance'),'solid');assert.equal(await page.locator('.card').first().evaluate(e=>getComputedStyle(e).backdropFilter),'none');await page.reload();assert.equal(await page.locator('html').getAttribute('data-appearance'),'solid');
 await page.setViewportSize({width:390,height:844});assert(await page.locator('aside .brand').isVisible());await page.locator('#menu-toggle').click();await page.locator('nav a[data-page=dashboard]').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false');assert(await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement));await page.locator('#sim-progress').focus();await page.locator('#menu-toggle').click();await page.locator('nav a[data-page=dashboard]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement===document.querySelector('main'));assert(await page.locator('main').evaluate(e=>e===document.activeElement));await page.keyboard.press('Tab');
 await page.goto(base);await page.locator('.portfolio-register > .compact-disclosure > summary').click();await page.locator('.portfolio-register tbody .project-link').first().click();assert.equal(await page.locator('dialog').evaluate(e=>e.scrollTop),0);await page.screenshot({path:'output/qa/mobile-detail.png'});await page.keyboard.press('Escape');await page.goto(base);await page.keyboard.press('Tab');assert(await page.locator('.skip-link').evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement===document.querySelector('main'));assert(await page.locator('main').evaluate(e=>e===document.activeElement));
 const report={layouts,findings,errors,flows:'passed',browser:browser.version()};await writeFile('output/qa/results.json',JSON.stringify(report,null,2));
 await page.goto(base);await page.locator('#account-menu > summary').click();await page.locator('#logout').click();await page.waitForURL('**/login');assert(await page.locator('#confirm-access').isVisible());
 console.log(JSON.stringify(report,null,2));
 assert.deepEqual(errors,[]);assert(layouts.every(x=>x.scroll<=x.width+1&&x.overflows.length===0),'Overflow da página detectado');assert.deepEqual(findings,[],'Acessibilidade automática encontrou violações');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
