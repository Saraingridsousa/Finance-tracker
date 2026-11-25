import { classifyTransaction, inferCategory, isRealExpense, isRealIncome, isInvestmentApplication } from './finance';
import type { Category, Transaction } from '../types/finance';

export const cents = (tx:Transaction) => tx.amountCents ?? Math.round(tx.amount*100);
export function classifyRows(rows:Transaction[], categories:Category[]):Transaction[] {
  return rows.map(tx=>{
    const categoryId=tx.manualCategory ? tx.categoryId : inferCategory(tx.description,categories,[],tx.type);
    const category=categories.find(c=>c.id===categoryId);
    return classifyTransaction({...tx,categoryId,categoryName:category?.name,category:category?.name},categories);
  });
}
export function analytics(rows:Transaction[],categories:Category[]){
  const months=new Map<string,{month:string,income:number,expenses:number,invested:number}>();
  const buckets=new Map<string,number>();
  let income=0,expenses=0,invested=0;
  for(const tx of rows){
    const key=tx.date.slice(0,7);
    const m=months.get(key)??{month:key.slice(5)+'/'+key.slice(2,4),income:0,expenses:0,invested:0};
    const n=cents(tx);
    if(isRealIncome(tx,categories)){income+=n;m.income+=n;}
    else if(isRealExpense(tx,categories)){
      expenses+=n;m.expenses+=n;
      buckets.set(tx.categoryId,(buckets.get(tx.categoryId)??0)+n);
    }else if(isInvestmentApplication(tx,categories)){invested+=n;m.invested+=n;}
    months.set(key,m);
  }
  return {income:income/100,expenses:expenses/100,balance:(income-expenses)/100,invested:invested/100,
    monthly:[...months].sort(([a],[b])=>a.localeCompare(b)).map(([,m])=>({...m,income:m.income/100,expenses:m.expenses/100,invested:m.invested/100})),
    categories:[...buckets].map(([id,n])=>({name:categories.find(c=>c.id===id)?.name??'Sem categoria',color:categories.find(c=>c.id===id)?.color??'#94a3b8',value:n/100})).sort((a,b)=>b.value-a.value)
  };
}
export function mergeDemoBatch(rows:Transaction[],batch:Transaction[],hidden:ReadonlySet<string>):Transaction[]{
  const known=new Set(rows.map(r=>r.id));return [...rows,...batch.filter(r=>!hidden.has(r.id)&&!known.has(r.id)&&!!known.add(r.id))];
}
