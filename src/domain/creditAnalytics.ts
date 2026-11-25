import { cards, cardMonths, purchases, creditColors, type CardId, type CardMonth } from '../data/demoCredit';
const sum=(items:typeof purchases)=>items.reduce((n,p)=>n+p.cents,0);
export function creditAnalytics(selected:CardId|'all',month:CardMonth){
 const selectedCards=cards.filter(c=>selected==='all'||c.id===selected);
 const selectedPurchases=purchases.filter(p=>selected==='all'||p.cardId===selected);
 const current=selectedPurchases.filter(p=>p.month==='2026-11');
 const details=selectedPurchases.filter(p=>p.month===month).sort((a,b)=>b.date.localeCompare(a.date));
 const limits=selectedCards.map(c=>{
   const bill=sum(current.filter(p=>p.cardId===c.id));
   const used=bill+c.futureCommitments;
   return {...c,bill,used,available:c.limit-used,utilization:used/c.limit*100};
 });
 const totalLimit=limits.reduce((n,c)=>n+c.limit,0),used=limits.reduce((n,c)=>n+c.used,0);
 const group=new Map<string,number>();
 for(const p of details)group.set(p.category,(group.get(p.category)??0)+p.cents);
 return {limits,totalLimit,used,available:totalLimit-used,bill:sum(current),selectedBill:sum(details),details,
   allocation:[...group].map(([name,value])=>({name,value,color:creditColors[name]??'#94a3b8'})).sort((a,b)=>b.value-a.value),
   history:cardMonths.map(m=>({month:m,aurora:sum(selectedPurchases.filter(p=>p.month===m&&p.cardId==='aurora')),horizonte:sum(selectedPurchases.filter(p=>p.month===m&&p.cardId==='horizonte'))})),
 };
}
