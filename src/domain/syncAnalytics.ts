import type { Transaction } from '../types/finance';
import { mergeDemoBatch } from './demoAnalytics';
export type SyncReport={attempt:number;source:string;status:'success'|'error';received:number;added:number;duplicates:number;hidden:number;message:string};
export function simulateBatch(rows:Transaction[],batch:Transaction[],hidden:ReadonlySet<string>,attempt:number,source:string,fail=false):{rows:Transaction[];report:SyncReport}{
 if(fail)return {rows,report:{attempt,source,status:'error',received:0,added:0,duplicates:0,hidden:0,message:'Falha simulada de comunicação. Os registros anteriores foram preservados.'}};
 const known=new Set(rows.map(r=>r.id));
 let duplicates=0,ignored=0;
 for(const tx of batch){
   if(hidden.has(tx.id))ignored++;
   else if(known.has(tx.id))duplicates++;
   else known.add(tx.id);
 }
 const next=mergeDemoBatch(rows,batch,hidden);
 const added=next.length-rows.length;
 return {rows:next,report:{attempt,source,status:'success',received:batch.length,added,duplicates,hidden:ignored,message:added?added+' transações fictícias adicionadas.':'Nenhum registro novo; histórico e edições preservados.'}};
}
