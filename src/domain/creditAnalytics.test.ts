import {describe,it,expect} from 'vitest';
import {creditAnalytics} from './creditAnalytics';
describe('fictional card ledger',()=>{
 it('reconciles all open bills, commitments and limits',()=>{
  const s=creditAnalytics('all','2026-11');
  expect(s.bill).toBe(123500);expect(s.used).toBe(201000);expect(s.available).toBe(549000);
  expect(s.used+s.available).toBe(s.totalLimit);
  expect(s.details.reduce((a,p)=>a+p.cents,0)).toBe(s.selectedBill);
  expect(s.allocation.reduce((a,p)=>a+p.value,0)).toBe(s.selectedBill);
  expect(s.history[5].aurora+s.history[5].horizonte).toBe(s.bill);
 });
 it('isolates the selected card and historical reference',()=>{
  const s=creditAnalytics('aurora','2026-06');
  expect(s.selectedBill).toBe(70500);expect(s.bill).toBe(82500);
  expect(s.details.every(p=>p.cardId==='aurora'&&p.month==='2026-06')).toBe(true);
  expect(s.history.every(h=>h.horizonte===0)).toBe(true);
 });
});
