// Entirely fictional portfolio snapshots, independent of the transaction ledger.
// Amounts are integer BRL cents. Final observation: 25 Nov 2026.
export type AssetClass = 'Renda fixa' | 'Tesouro Direto' | 'ETFs' | 'FIIs' | 'Ações';
export type Observation = { month:string; cost:number; value:number };
export type DemoAsset = { id:string; name:string; type:AssetClass; institution:string; history:Observation[] };
export const months=['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11'];
const history=(costs:number[], values:number[]):Observation[]=>months.map((month,i)=>({month,cost:costs[i],value:values[i]}));
export const demoAssets:DemoAsset[]=[
  {id:'cdb',name:'CDB Horizonte',type:'Renda fixa',institution:'Banco Horizonte',history:history([260000,285000,310000,340000,370000,400000],[267000,294000,323000,356000,388000,421000])},
  {id:'treasury',name:'Tesouro Selic (demo)',type:'Tesouro Direto',institution:'Corretora Aurora',history:history([190000,200000,210000,225000,240000,250000],[193000,204000,216000,232000,248000,259000])},
  {id:'etf',name:'ETF Índice Global (demo)',type:'ETFs',institution:'Corretora Aurora',history:history([100000,110000,120000,130000,140000,150000],[102000,108000,125000,128000,149000,162500])},
  {id:'fii',name:'Fundo Imobiliário Aurora',type:'FIIs',institution:'Corretora Aurora',history:history([80000,85000,90000,95000,100000,105000],[82000,83000,89000,97000,101000,109500])},
  {id:'stocks',name:'Carteira de ações (demo)',type:'Ações',institution:'Corretora Aurora',history:history([50000,60000,70000,80000,85000,90000],[51000,57000,69000,84000,83000,87000])},
  {id:'lci',name:'LCI Aurora',type:'Renda fixa',institution:'Banco Aurora',history:history([100000,100000,120000,120000,140000,150000],[102000,103000,124000,126000,147000,158000])},
];
export const classColors:Record<AssetClass,string>={'Renda fixa':'#0891b2','Tesouro Direto':'#6366f1','ETFs':'#8b5cf6','FIIs':'#f59e0b','Ações':'#10b981'};
