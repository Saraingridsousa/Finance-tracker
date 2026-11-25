// Fictional card ledger, independent from the main transaction and investment ledgers.
// All amounts are integer BRL cents. Bills contain posted purchases only.
export const cardMonths=['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'] as const;
export type CardId='aurora'|'horizonte';
export type CardMonth=typeof cardMonths[number];
export type CardPurchase={id:string;cardId:CardId;month:CardMonth;date:string;description:string;category:string;cents:number;installment?:string};
export type DemoCard={id:CardId;name:string;institution:string;limit:number;futureCommitments:number;due:string;gradient:string};
export const cards:DemoCard[]=[
 {id:'aurora',name:'Aurora Platinum',institution:'Banco Aurora',limit:450000,futureCommitments:44000,due:'10/12/2026',gradient:'from-cyan-700 to-indigo-900'},
 {id:'horizonte',name:'Horizonte Gold',institution:'Banco Horizonte',limit:300000,futureCommitments:33500,due:'15/12/2026',gradient:'from-violet-700 to-slate-900'},
];
const seeds:Record<CardId,{day:number;description:string;category:string;cents:number;installment?:string}[]>={
 aurora:[
  {day:5,description:'Mercado Aurora',category:'Alimentação',cents:26000},
  {day:9,description:'Internet residencial',category:'Moradia',cents:10990},
  {day:14,description:'Loja de eletrônicos',category:'Compras',cents:22000,installment:'3/5'},
  {day:20,description:'Restaurante Central',category:'Alimentação',cents:11510},
 ],
 horizonte:[
  {day:6,description:'Transporte urbano',category:'Transporte',cents:9500},
  {day:10,description:'Farmácia Horizonte',category:'Saúde',cents:7500},
  {day:16,description:'Assinatura de curso',category:'Educação',cents:11000},
  {day:21,description:'Cinema Estelar',category:'Lazer',cents:5500},
 ],
};
export const purchases:CardPurchase[]=cards.flatMap(card=>cardMonths.flatMap((month,i)=>seeds[card.id].map((seed,j)=>({
 id:card.id+'-'+month+'-'+j,cardId:card.id,month,date:month+'-'+String(seed.day).padStart(2,'0'),description:seed.description,category:seed.category,
 cents:seed.cents+(j===0?i*(card.id==='aurora'?2400:1500):0),
 ...(seed.installment&&month==='2026-11'?{installment:seed.installment}:{}),
}))));
export const creditColors:Record<string,string>={'Alimentação':'#ef4444','Moradia':'#f59e0b','Compras':'#8b5cf6','Transporte':'#0891b2','Saúde':'#10b981','Educação':'#6366f1','Lazer':'#ec4899'};
