import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const executablePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({executablePath,headless:true});
const context=await browser.newContext({acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('output/qa',{recursive:true});
const findings=[],layouts=[];
try {
 for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}],['small-mobile',{width:320,height:740}],['tablet',{width:768,height:1024}]]) {
  await page.setViewportSize(viewport);
  for(const route of ['dashboard','projetos','simulador','metodologia']) {
   await page.goto(`${base}/#${route}`);await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflows:[...document.querySelectorAll('main .card, header, aside')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))}));
   layouts.push({device,route,...overflow});
   if((device==='mobile'||device==='small-mobile')&&route!=='simulador'&&route!=='metodologia')assert((await page.locator('#sector').boundingBox()).height<=60,'Filtro alto demais no celular');
   await page.screenshot({path:`output/qa/${device}-${route}.png`,fullPage:true});
   await page.addScriptTag({content:axe});const a11y=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
   if(a11y.length)findings.push({device,route,violations:a11y});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);
 await page.locator('#sector').selectOption('Energia');assert.equal(await page.locator('tbody tr').count(),2);
 await page.locator('#status').selectOption('Crítico');assert((await page.locator('main').innerText()).includes('Nenhum projeto combina'));
 await page.locator('#sector').selectOption('Incorporações');assert.equal(await page.locator('tbody tr').count(),1);
 let downloadPromise=page.waitForEvent('download');await page.locator('#export').click();let download=await downloadPromise;const csv=await readFile(await download.path(),'utf8');assert(csv.includes('INC-002')&&!csv.includes('INC-001'));
 const opener=page.locator('tbody .project-link');await opener.focus();await page.keyboard.press('Enter');assert(await page.locator('dialog').isVisible());assert.equal(await page.locator('dialog').evaluate(e=>e.scrollTop),0);await page.addScriptTag({content:axe});assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>v.id)),[]);await page.screenshot({path:'output/qa/desktop-detail.png'});await page.keyboard.press('Escape');assert(!(await page.locator('dialog').isVisible()));assert(await opener.evaluate(e=>e===document.activeElement));
 await page.locator('#status').selectOption('Todos os status');await page.locator('#sector').selectOption('Todos os setores');await page.locator('nav a[data-page=projetos]').click();await page.locator('#search').fill('Solar');assert.equal(await page.locator('.project-grid article').count(),2);assert(await page.locator('#search').evaluate(e=>e===document.activeElement));await page.locator('#search').fill('"<script>');assert.equal(await page.locator('.project-grid article').count(),0);
 await page.locator('nav a[data-page=simulador]').click();await page.locator('#sim-progress').fill('25');await page.locator('#sim-spent').fill('90');assert((await page.locator('#sim-result').innerText()).includes('720 dias'));assert.equal(await page.locator('#sim-progress-range').inputValue(),'25');
 const numeric=await page.locator('.scenario-table').innerText();await page.locator('#check-legal').selectOption('Verificado no exercício');assert.equal(await page.locator('.scenario-table').innerText(),numeric);
 await page.locator('#action-text').fill('Revisar custos e recuperar o cronograma.');await page.locator('#action-owner').fill('PMO demonstrativo');await page.locator('#corrective-form button').click();assert((await page.locator('#action-feedback').innerText()).includes('referência'));
 await page.locator('#evidence-legal').fill('Parecer demonstrativo L-01');await page.locator('#corrective-form button').click();assert((await page.locator('#action-history').innerText()).includes('Revisar custos'));
 downloadPromise=page.waitForEvent('download');await page.locator('#export-analysis').click();download=await downloadPromise;const md=await readFile(await download.path(),'utf8');assert(md.includes('720 dias')&&md.includes('Parecer demonstrativo L-01')&&md.includes('Revisar custos'));
 await page.reload();assert((await page.locator('#action-history').innerText()).includes('Revisar custos'));
 await page.locator('#sim-project').selectOption('LOG-001');await page.locator('#sim-progress').fill('0');await page.locator('#sim-spent').fill('0');assert((await page.locator('#sim-result').innerText()).includes('Sem base'));await page.locator('#reset').click();assert.equal(await page.locator('#sim-progress').inputValue(),'58');assert.equal(await page.locator('#sim-project').inputValue(),'LOG-001');
 await page.locator('#sim-progress').fill('12.345');assert.equal(await page.locator('#sim-progress-range').inputValue(),'12.345');await page.locator('#sim-progress').fill('');assert(await page.locator('#sim-progress-range').isDisabled());assert((await page.locator('#sim-result').innerText()).includes('Sem base'));
 await page.locator('#appearance-toggle').click();assert.equal(await page.locator('html').getAttribute('data-appearance'),'solid');assert.equal(await page.locator('.card').first().evaluate(e=>getComputedStyle(e).backdropFilter),'none');await page.reload();assert.equal(await page.locator('html').getAttribute('data-appearance'),'solid');
 await page.setViewportSize({width:390,height:844});await page.locator('#action-owner').focus();const focusedBox=await page.locator('#action-owner').boundingBox(),dockBox=await page.locator('aside').boundingBox();assert(focusedBox.y+focusedBox.height<=dockBox.y,'Foco encoberto pelo dock');await page.locator('nav a[data-page=dashboard]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement===document.querySelector('main'));assert(await page.locator('main').evaluate(e=>e===document.activeElement));await page.keyboard.press('Tab');
 await page.goto(base);await page.locator('tbody .project-link').first().click();assert.equal(await page.locator('dialog').evaluate(e=>e.scrollTop),0);await page.screenshot({path:'output/qa/mobile-detail.png'});await page.keyboard.press('Escape');await page.goto(base);await page.keyboard.press('Tab');assert(await page.locator('.skip-link').evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement===document.querySelector('main'));assert(await page.locator('main').evaluate(e=>e===document.activeElement));
 const report={layouts,findings,errors,flows:'passed',browser:browser.version()};await writeFile('output/qa/results.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
 assert.deepEqual(errors,[]);assert(layouts.every(x=>x.scroll<=x.width+1&&x.overflows.length===0),'Overflow da página detectado');assert.deepEqual(findings,[],'Acessibilidade automática encontrou violações');
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
