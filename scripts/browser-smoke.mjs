import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin='http://127.0.0.1:4173';
const screenshotDir=process.argv[2] || 'browser-evidence';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;
const tabs=[['Visão Geral','Visão geral','overview'],['Investimentos','Minha carteira','investments'],['Cartões','Meus cartões','cards'],['Planejamento','Planejamento financeiro','planning'],['Conexões','Conexões e automação','connections']];
try {
  let ready=false;
  for(let i=0;i<60;i++){try{ready=(await fetch(origin)).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  assert.ok(ready,'Preview server did not start');
  await mkdir(screenshotDir,{recursive:true});
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,locale:'pt-BR',reducedMotion:'reduce'});
  const errors=[],external=[];
  await context.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/')&&!url.startsWith('blob:')&&!url.startsWith('data:')){external.push(url);return route.abort();}return route.continue();});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  const visit=async(label,heading)=>{await page.getByRole('tab',{name:label,exact:true}).click();await page.getByRole('heading',{name:heading,exact:true}).waitFor();await page.locator('[role=tabpanel]').waitFor();};
  const screenshot=async(name)=>{await page.waitForTimeout(1100);await page.screenshot({path:screenshotDir+'/'+name+'.png',fullPage:true,animations:'disabled'});};
  for(const [label,heading,name] of tabs){await visit(label,heading);await screenshot(name);}
  await page.getByRole('tab',{name:'Conexões',exact:true}).press('Home');
  assert.equal(await page.getByRole('tab',{name:'Visão Geral',exact:true}).getAttribute('aria-selected'),'true');
  await page.getByLabel('Buscar por descrição',{exact:true}).fill('zz-no-records');
  await page.getByText('Nenhuma transação encontrada.',{exact:true}).waitFor();
  await page.getByLabel('Buscar por descrição',{exact:true}).fill('Aluguel residencial');
  const edit=page.getByRole('button',{name:'Editar descrição: Aluguel residencial',exact:true}).first();
  await edit.click();await page.getByLabel('Editar descrição',{exact:true}).fill('Aluguel demo revisado');await page.getByLabel('Editar descrição',{exact:true}).press('Enter');
  await page.getByLabel('Buscar por descrição',{exact:true}).fill('Aluguel demo revisado');
  await page.getByRole('button',{name:'Editar descrição: Aluguel demo revisado',exact:true}).waitFor();
  await page.getByRole('button',{name:'Excluir transação Aluguel demo revisado',exact:true}).click();
  await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Excluir transação Aluguel demo revisado',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Excluir',exact:true}).click();
  await page.getByText('Nenhuma transação encontrada.',{exact:true}).waitFor();
  await visit('Conexões','Conexões e automação');
  await page.getByRole('button',{name:'Sincronizar todas',exact:true}).click();
  await page.getByText('3 transações fictícias adicionadas.',{exact:true}).first().waitFor();
  await page.getByRole('button',{name:'Sincronizar todas',exact:true}).click();
  await page.getByText('Nenhum registro novo; histórico e edições preservados.',{exact:true}).first().waitFor();
  await page.getByRole('button',{name:'Simular falha de conexão',exact:true}).click();
  await page.getByText('Falha simulada de comunicação. Os registros anteriores foram preservados.',{exact:true}).first().waitFor();
  await visit('Planejamento','Planejamento financeiro');
  await page.getByLabel('Limite de Alimentação',{exact:true}).fill('-1');
  await page.getByRole('button',{name:'Salvar metas',exact:true}).click();await page.getByRole('alert').waitFor();
  await page.getByLabel('Limite de Alimentação',{exact:true}).fill('100,00');
  await page.getByRole('button',{name:'Salvar metas',exact:true}).click();
  await page.getByText('Metas atualizadas para toda a simulação.',{exact:true}).waitFor();
  for(const [button,marker] of [['Orçamento mensal','Relatório de orçamento fictício'],['Transações do mês','Descrição']]){
    const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:button,exact:true}).click()]);
    assert.ok(download.suggestedFilename().endsWith('.csv'));
    const content=await readFile(await download.path(),'utf8');assert.ok(content.includes(marker));assert.ok(content.includes('2026-11'));
  }
  await page.getByRole('button',{name:'Restaurar demo',exact:true}).click();
  await page.getByLabel('Limite de Alimentação',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Limite de Alimentação',{exact:true}).inputValue(),'650,00');
  await page.getByRole('button',{name:'Ativar tema escuro',exact:true}).click();
  assert.ok(await page.locator('html').evaluate(el=>el.classList.contains('dark')));
  await visit('Investimentos','Minha carteira');await screenshot('investments-dark');
  await page.getByRole('button',{name:'Ativar tema claro',exact:true}).click();
  for(const width of [390,768]){
    await page.setViewportSize({width,height:844});
    for(const [label,heading,name] of tabs){
      await visit(label,heading);await page.waitForTimeout(500);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),name+' overflows at '+width+'px');
      if(width===390&&name==='overview')await screenshot('overview-mobile');
    }
  }
  assert.deepEqual(errors,[],'Unexpected browser errors');
  assert.deepEqual(external,[],'Unexpected external requests');
  assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0],'Unexpected browser storage');
  await context.close();
  console.log('Browser smoke passed: tabs, keyboard, editing, delete dialog, sync, budget validation, CSV downloads, reset, theme, responsive widths, network and storage.');
} finally {await browser?.close();server.kill();}
