import type { Transaction } from '../types/finance';

// Fictional, deterministic fixtures. No financial service, network or browser storage.
export const demoReference = new Date(2026, 10, 25);
type Seed = [number, string, number, 'income' | 'expense', Partial<Transaction>?];
const monthly: Seed[] = [
  [5,'Salário fictício',420000,'income'],
  [6,'Aluguel residencial',125000,'expense'],
  [8,'Mercado Aurora',34000,'expense'],
  [9,'Internet residencial',10990,'expense'],
  [11,'Restaurante Central',8900,'expense'],
  [12,'PIX enviado — padaria',3200,'expense'],
  [14,'Transporte ônibus',9500,'expense'],
  [16,'Farmácia Horizonte',7600,'expense'],
  [18,'Cinema Estelar',5600,'expense'],
  [20,'Aplicação CDB fictícia',45000,'expense'],
  [21,'Transferência entre contas próprias',20000,'expense',{isSelfTransfer:true,manualSelfTransfer:true}],
  [22,'Pagamento de fatura',32000,'expense'],
  [23,'Compra sem identificação',4950,'expense'],
  [24,'Dividendo fictício',6500,'income'],
];
function make(month:number, index:number, seed:Seed):Transaction {
  const [day,description,amountCents,type,extra]=seed;
  const date=`2026-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return {id:`demo-${month}-${index}`,date,createdAt:date+'T12:00:00Z',description,amountCents,amount:amountCents/100,type,categoryId:'uncategorized',source:'manual',currencyCode:'BRL',providerStatus:'POSTED',bankName:index%3===0?'Banco Horizonte (demo)':'Banco Aurora (demo)',...extra};
}
export function initialTransactions():Transaction[] {
  return Array.from({length:6},(_,offset)=>monthly.map((seed,index)=>{
    const copy=[...seed] as Seed;
    if(index===2 || index===4) copy[2]+=offset*1100;
    return make(6+offset,index,copy);
  })).flat().concat([
    make(11,90,[24,'Mercado — aguardando confirmação',18000,'expense',{providerStatus:'PENDING'}]),
    make(11,91,[24,'Compra internacional fictícia',3000,'expense',{currencyCode:'USD'}]),
  ]);
}
export const incomingBatch = ():Transaction[] => [
  make(11,92,[25,'PIX recebido — trabalho fictício',18000,'income']),
  make(11,93,[25,'Mercado Vila Nova',9200,'expense']),
  make(11,94,[25,'Restaurante Lago',4500,'expense']),
];
