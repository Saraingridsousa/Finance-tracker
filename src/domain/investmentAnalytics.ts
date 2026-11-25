import { classColors, type DemoAsset, type AssetClass } from '../data/demoInvestments';
export function investmentAnalytics(assets:DemoAsset[]){
  const positions=assets.flatMap(asset=>{
    const current=asset.history[asset.history.length-1];
    if(!current)return [];
    return [{...asset,cost:current.cost,value:current.value,gain:current.value-current.cost,variation:current.cost>0?(current.value-current.cost)/current.cost*100:null}];
  });
  const cost=positions.reduce((sum,p)=>sum+p.cost,0), value=positions.reduce((sum,p)=>sum+p.value,0);
  const groups=new Map<AssetClass,number>();
  for(const p of positions)groups.set(p.type,(groups.get(p.type)??0)+p.value);
  const series=new Map<string,{month:string;cost:number;value:number}>();
  for(const asset of assets)for(const observation of asset.history){
    const s=series.get(observation.month)??{month:observation.month,cost:0,value:0};
    s.cost+=observation.cost;s.value+=observation.value;series.set(s.month,s);
  }
  return {cost,value,gain:value-cost,variation:cost>0?(value-cost)/cost*100:null,
    positions:positions.map(p=>({...p,weight:value>0?p.value/value*100:0})).sort((a,b)=>b.value-a.value),
    allocation:[...groups].map(([name,amount])=>({name,value:amount,color:classColors[name],weight:value>0?amount/value*100:0})).sort((a,b)=>b.value-a.value),
    history:[...series.values()].sort((a,b)=>a.month.localeCompare(b.month)).map(s=>({...s,gain:s.value-s.cost})),
  };
}
