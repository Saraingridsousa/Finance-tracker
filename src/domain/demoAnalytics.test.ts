import { describe,it,expect } from 'vitest';
import { initialTransactions,incomingBatch } from '../data/demo';
import { defaultCategories } from '../data/defaultCategories';
import { analytics,classifyRows,mergeDemoBatch } from './demoAnalytics';
describe('synthetic finance dashboard',()=>{
  it('reconciles every chart with totals and excludes pending and non-BRL',()=>{
    const rows=classifyRows(initialTransactions(),defaultCategories);
    const result=analytics(rows,defaultCategories);
    expect(result.monthly.reduce((s,r)=>s+Math.round(r.expenses*100),0)).toBe(Math.round(result.expenses*100));
    expect(result.categories.reduce((s,r)=>s+Math.round(r.value*100),0)).toBe(Math.round(result.expenses*100));
    const settled=rows.filter(r=>r.providerStatus!=='PENDING'&&r.currencyCode==='BRL');
    expect(analytics(settled,defaultCategories)).toEqual(result);
  });
  it('does not equate Pix with own-account transfer',()=>{
    const rows=classifyRows(initialTransactions(),defaultCategories);
    expect(rows.find(r=>r.description.includes('PIX enviado'))?.isNeutral).toBe(false);
    expect(rows.find(r=>r.description.includes('Transferência entre contas'))?.isNeutral).toBe(true);
  });
  it('is idempotent and preserves edits and hidden records',()=>{
    const batch=incomingBatch();const first=mergeDemoBatch(initialTransactions(),batch,new Set());
    expect(mergeDemoBatch(first,batch,new Set())).toEqual(first);
    const hidden=new Set([batch[0].id]);
    expect(mergeDemoBatch(first.filter(r=>!hidden.has(r.id)),batch,hidden).some(r=>hidden.has(r.id))).toBe(false);
  });
  it('manual category overrides inferred category',()=>{
    const tx=initialTransactions().find(r=>r.description.includes('Mercado'))!;
    expect(classifyRows([{...tx,categoryId:'lazer',manualCategory:true}],defaultCategories)[0].categoryId).toBe('lazer');
  });
});
