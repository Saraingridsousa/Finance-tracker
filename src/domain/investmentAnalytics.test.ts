import {describe,it,expect} from 'vitest';
import {demoAssets} from '../data/demoInvestments';
import {investmentAnalytics} from './investmentAnalytics';
describe('portfolio analytics',()=>{
  it('reconciles positions, allocations and final historical snapshot',()=>{
    const s=investmentAnalytics(demoAssets);
    expect(s.cost).toBe(1145000);expect(s.value).toBe(1197000);expect(s.gain).toBe(52000);
    expect(s.allocation.reduce((a,p)=>a+p.value,0)).toBe(s.value);
    expect(s.positions.reduce((a,p)=>a+p.weight,0)).toBeCloseTo(100);
    expect(s.history[5]).toEqual({month:'2026-11',cost:s.cost,value:s.value,gain:s.gain});
  });
  it('filters by asset class with consistent historical and current totals',()=>{
    const s=investmentAnalytics(demoAssets.filter(a=>a.type==='Renda fixa'));
    expect(s.positions).toHaveLength(2);expect(s.value).toBe(579000);expect(s.allocation[0].weight).toBe(100);
    expect(s.history[5].value).toBe(s.value);
  });
  it('preserves negative variation and handles empty portfolios',()=>{
    const s=investmentAnalytics(demoAssets);
    expect(s.positions.find(p=>p.id==='stocks')?.gain).toBe(-3000);
    expect(investmentAnalytics([])).toMatchObject({value:0,cost:0,gain:0,variation:null,positions:[],history:[]});
  });
});
