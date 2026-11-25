import type { Category, Transaction } from '../types/finance';
import { defaultCategories } from '../data/defaultCategories';
import { cents } from './demoAnalytics';
import { isRealExpense, isRealIncome, isInvestmentApplication } from './finance';

export const budgetCategories=defaultCategories.filter(c=>c.type!=='income'&&!c.isNeutral&&!c.excludeFromTotals);
export type BudgetPlan={limits:Record<string,number>;investmentGoal:number};
export const initialBudgetPlan=():BudgetPlan=>({limits:{alimentacao:65000,moradia:140000,transporte:18000,lazer:5000,saude:10000,outros:8000,uncategorized:5000},investmentGoal:60000});
export const budgetMonths=['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'] as const;
export type BudgetMonth=typeof budgetMonths[number];
export function parseBudgetAmount(raw:string):number|null{
 const value=raw.trim().replace(',','.');
 if(!/^\d{1,7}(?:\.\d{1,2})?$/.test(value))return null;
 const [whole,fraction='']=value.split('.');
 return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function budgetAnalytics(rows:Transaction[],categories:Category[],month:BudgetMonth,plan:BudgetPlan){
 const selected=rows.filter(tx=>tx.date.slice(0,7)===month);
 const expenses=selected.filter(tx=>isRealExpense(tx,categories));
 const grouped=new Map<string,number>();
 for(const tx of expenses){
  const id=budgetCategories.some(c=>c.id===tx.categoryId)?tx.categoryId:'uncategorized';
  grouped.set(id,(grouped.get(id)??0)+cents(tx));
 }
 const items=budgetCategories.map(c=>{
  const limit=plan.limits[c.id]??0, spent=grouped.get(c.id)??0;
  return {id:c.id,name:c.name,color:c.color,limit,spent,remaining:limit-spent,usage:limit>0?spent/limit*100:null,status:spent>limit?'over' as const:limit>0&&spent>=limit*.8?'near' as const:'ok' as const};
 });
 const planned=items.reduce((n,c)=>n+c.limit,0),spent=items.reduce((n,c)=>n+c.spent,0);
 const income=selected.filter(tx=>isRealIncome(tx,categories)).reduce((n,tx)=>n+cents(tx),0);
 const invested=selected.filter(tx=>isInvestmentApplication(tx,categories)).reduce((n,tx)=>n+cents(tx),0);
 return {month,items,planned,spent,remaining:planned-spent,income,result:income-spent,invested,investmentGoal:plan.investmentGoal,investmentRemaining:Math.max(0,plan.investmentGoal-invested),overCount:items.filter(c=>c.status==='over').length};
}
