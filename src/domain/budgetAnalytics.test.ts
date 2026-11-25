import { describe,it,expect } from 'vitest';
import { initialTransactions,incomingBatch } from '../data/demo';
import { defaultCategories } from '../data/defaultCategories';
import { classifyRows,analytics,mergeDemoBatch } from './demoAnalytics';
import { budgetAnalytics,initialBudgetPlan,parseBudgetAmount } from './budgetAnalytics';
import { budgetReport,transactionReport,csvCell } from './demoReports';
const rows=classifyRows(initialTransactions(),defaultCategories);
describe('monthly planning',()=>{
 it('reconciles spend and contributions with the financial dashboard',()=>{
  const s=budgetAnalytics(rows,defaultCategories,'2026-11',initialBudgetPlan());
  const a=analytics(rows.filter(r=>r.date.startsWith('2026-11')),defaultCategories);
  expect(s.spent).toBe(Math.round(a.expenses*100));expect(s.income).toBe(Math.round(a.income*100));expect(s.invested).toBe(Math.round(a.invested*100));
  expect(s.items.reduce((n,c)=>n+c.spent,0)).toBe(s.spent);
  expect(s.invested).toBe(45000);expect(s.investmentRemaining).toBe(15000);
 });
 it('updates after sync and reflects manual changes in budget limits',()=>{
  const next=classifyRows(mergeDemoBatch(initialTransactions(),incomingBatch(),new Set()),defaultCategories);
  const s=budgetAnalytics(next,defaultCategories,'2026-11',initialBudgetPlan());
  const before=budgetAnalytics(rows,defaultCategories,'2026-11',initialBudgetPlan());
  expect(s.spent-before.spent).toBe(13700);
  const p=initialBudgetPlan();p.limits.alimentacao=0;p.investmentGoal=0;
  const changed=budgetAnalytics(next,defaultCategories,'2026-11',p);
  expect(changed.items.find(c=>c.id==='alimentacao')).toMatchObject({status:'over',usage:null,limit:0});
  expect(changed.investmentRemaining).toBe(0);
 });
 it('validates monetary input in cents',()=>{
  expect(parseBudgetAmount('120,05')).toBe(12005);expect(parseBudgetAmount('0')).toBe(0);
  for(const value of ['','-1','1,234','1e3','NaN','Infinity','1.200,00'])expect(parseBudgetAmount(value)).toBeNull();
 });
});
describe('CSV exports',()=>{
 it('escapes spreadsheet formula injection and special characters',()=>{
  expect(csvCell('=2+2')).toBe('"\'=2+2"');expect(csvCell('  @SUM(A1)')).toBe('"\'  @SUM(A1)"');
  expect(csvCell('text;"quoted"')).toBe('"text;""quoted"""');
 });
 it('exports the requested month and localized amounts without losing sign',()=>{
  const s=budgetAnalytics(rows,defaultCategories,'2026-11',initialBudgetPlan());
  const report=budgetReport(s);expect(report.startsWith('\uFEFF')).toBe(true);expect(report).toContain('2026-11');expect(report).toContain('-6,00');
  const selected=rows.filter(r=>r.date.startsWith('2026-11'));
  const transactions=transactionReport(selected,defaultCategories);expect(transactions).toContain('Pendente');expect(transactions).toContain('USD');expect(transactions).not.toContain('2026-06');
 });
});
