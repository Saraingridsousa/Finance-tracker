import type { Category,Transaction } from '../types/finance';
import { cents } from './demoAnalytics';
import { classifyTransaction,participatesInResult,isInvestmentApplication } from './finance';
import type { budgetAnalytics } from './budgetAnalytics';
type NumericCell={decimal:string};
const decimal=(c:number):NumericCell=>({decimal:(c/100).toFixed(2).replace('.',',')});
// Protect user-editable cells from spreadsheet formula injection, even after leading whitespace.
export function csvCell(value:string|number){
 let text=String(value);
 if(typeof value==='string'&&(/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/u.test(text)))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
function csv(rows:(string|number|NumericCell)[][]){return '\uFEFF'+rows.map(row=>row.map(cell=>typeof cell==='object'?cell.decimal:csvCell(cell)).join(';')).join('\r\n')+'\r\n';}
export function budgetReport(s:ReturnType<typeof budgetAnalytics>){
 return csv([
 ['Relatório de orçamento fictício',s.month,'BRL'],
 ['Categoria','Planejado','Realizado','Disponível','Utilização (%)','Situação'],
 ...s.items.map(c=>[c.name,decimal(c.limit),decimal(c.spent),decimal(c.remaining),c.usage===null?'Não aplicável':c.usage.toFixed(2).replace('.',','),c.status==='over'?'Acima do limite':c.status==='near'?'Atenção':'Dentro do limite']),
 ['TOTAL',decimal(s.planned),decimal(s.spent),decimal(s.remaining),'',''],
 [],
 ['Receitas liquidadas',decimal(s.income)],['Resultado do período',decimal(s.result)],['Meta de aportes',decimal(s.investmentGoal)],['Aportes realizados',decimal(s.invested)],['Falta para meta',decimal(s.investmentRemaining)],
 ['Dados fictícios. Metas mensais de simulação; valores em BRL.'],
 ]);
}
export function transactionReport(rows:Transaction[],categories:Category[]){
 return csv([
 ['ID','Data','Descrição','Categoria','Tipo','Valor','Moeda','Situação','Entra no resultado','Aporte','Instituição'],
 ...rows.map(raw=>{
  const tx=classifyTransaction(raw,categories);
  return [tx.id,tx.date,tx.description,categories.find(c=>c.id===tx.categoryId)?.name??'Sem categoria',tx.type==='income'?'Entrada':'Saída',decimal(cents(tx)),tx.currencyCode??'BRL',tx.providerStatus==='PENDING'?'Pendente':'Liquidada',participatesInResult(tx,categories)?'Sim':'Não',isInvestmentApplication(tx,categories)?'Sim':'Não',tx.bankName??''];
 }),
 ]);
}
